import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProfile, updateProfile, getAddresses, createAddress, getOrders, editOrderToCart } from '../api/services'
import { useDispatch, useSelector } from 'react-redux'
import { updateUser } from '../store/slices/authSlice'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

export default function Profile() {
  const [profile, setProfile] = useState(null)
  const [addresses, setAddresses] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({ full_name: '' })
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)

  useEffect(() => {
    Promise.all([
      getProfile().then((r) => r.data),
      getAddresses().then((r) => {
        const a = r.data?.results ?? r.data ?? []
        return Array.isArray(a) ? a : []
      }),
      getOrders().then((r) => {
        const o = r.data?.results ?? r.data ?? []
        return Array.isArray(o) ? o : []
      }),
    ])
      .then(([p, a, o]) => {
        setProfile(p)
        setFormData({ full_name: p?.full_name || '' })
        setAddresses(a)
        setOrders(o)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    try {
      const { data } = await updateProfile(formData)
      dispatch(updateUser(data))
      setProfile(data)
      setEditing(false)
      toast.success('Profile updated!')
    } catch (err) {
      toast.error('Failed to update profile')
    }
  }

  if (loading) return <LoadingSpinner size="lg" />

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">My Profile</h1>

      <div className="bg-white rounded-2xl shadow-soft p-4 sm:p-6 mb-4 sm:mb-6">
        <h2 className="font-semibold text-gray-800 mb-3 sm:mb-4">Account Info</h2>
        {editing ? (
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Full Name</label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
              <input type="text" value={profile?.email} disabled className="w-full px-4 py-2 rounded-xl bg-gray-50 text-gray-500" />
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="submit" className="px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600">
                Save
              </button>
              <button type="button" onClick={() => setEditing(false)} className="px-4 py-2 text-gray-600">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            <p className="text-gray-600"><span className="font-medium">Name:</span> {profile?.full_name}</p>
            <p className="text-gray-600 mt-1"><span className="font-medium">Email:</span> {profile?.email}</p>
            <button onClick={() => setEditing(true)} className="mt-4 text-primary-600 font-medium hover:text-pink-600">
              Edit Profile
            </button>
          </>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-soft p-4 sm:p-6 mb-4 sm:mb-6">
        <h2 className="font-semibold text-gray-800 mb-3 sm:mb-4">Addresses</h2>
        {addresses.length > 0 ? (
          <div className="space-y-3">
            {addresses.map((addr) => (
              <div key={addr.id} className="p-4 bg-gray-50 rounded-xl">
                <p className="text-gray-800">{addr.full_address}</p>
                <p className="text-sm text-gray-500">{addr.city}, {addr.state} - {addr.pincode}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No addresses. Add one at checkout.</p>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-soft p-4 sm:p-6">
        <h2 className="font-semibold text-gray-800 mb-3 sm:mb-4">Order History</h2>
        {orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order) => {
              const steps = ['Pending', 'Confirmed', 'Shipped', 'Delivered']
              const currentIndex = steps.indexOf(order.status) === -1 ? 0 : steps.indexOf(order.status)

              return (
                <div key={order.id} className="p-3 sm:p-4 border border-gray-100 rounded-xl">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 gap-2 sm:gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-800">Order #{order.id}</p>
                      <p className="text-sm text-gray-500">
                        ₹{parseFloat(order.total_amount || 0).toFixed(2)} • {order.status}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary-50 text-primary-700">
                        {order.status}
                      </span>
                      {order.status === 'Pending' && (
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await editOrderToCart(order.id)
                              toast.success('Order moved back to cart. You can edit items there.')
                              navigate('/cart')
                            } catch (err) {
                              toast.error('Unable to edit this order.')
                            }
                          }}
                          className="px-3 py-1 rounded-full text-xs font-medium border border-primary-200 text-primary-700 hover:bg-primary-50"
                        >
                          Edit order
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Status timeline / runway */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between gap-1">
                      {steps.map((step, index) => {
                        const isActive = index <= currentIndex
                        return (
                          <div key={step} className="flex-1 flex flex-col items-center">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                                isActive ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
                              }`}
                            >
                              {index + 1}
                            </div>
                            <p className="mt-1 text-xs text-center text-gray-600">{step}</p>
                            {index < steps.length - 1 && (
                              <div
                                className={`h-1 w-full mt-2 ${
                                  index < currentIndex ? 'bg-primary-400' : 'bg-gray-200'
                                }`}
                              />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Items preview with images and details */}
                  <div className="mt-4 border-t border-gray-100 pt-3">
                    <p className="text-xs font-semibold text-gray-500 mb-2">Items</p>
                    <div className="space-y-2">
                      {(order.items || []).map((it) => {
                        const p = it.product || {}
                        const img = p.primary_image || p.images?.[0]?.image
                        return (
                          <div key={it.id} className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                              {img ? (
                                <img
                                  src={img}
                                  alt={p.name || ''}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = 'none'
                                  }}
                                />
                              ) : null}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">
                                {p.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                Qty: {it.quantity} • ₹{parseFloat(it.price || 0).toFixed(2)} each
                              </p>
                            </div>
                          </div>
                        )
                      })}
                      {(order.items || []).length === 0 && (
                        <p className="text-xs text-gray-400">No items.</p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-gray-500">No orders yet.</p>
        )}
      </div>
    </div>
  )
}
