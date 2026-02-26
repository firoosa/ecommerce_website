import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAddresses, createOrder, createAddress } from '../api/services'
import { useDispatch, useSelector } from 'react-redux'
import { setCart, clearCart } from '../store/slices/cartSlice'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

export default function Checkout() {
  const [addresses, setAddresses] = useState([])
  const [selectedAddress, setSelectedAddress] = useState(null)
  const [showNewAddress, setShowNewAddress] = useState(false)
  const [loading, setLoading] = useState(true)
  const [placing, setPlacing] = useState(false)
  const [formData, setFormData] = useState({
    city: '',
    state: '',
    pincode: '',
    full_address: '',
  })
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { items, total } = useSelector((state) => state.cart)

  useEffect(() => {
    getAddresses()
      .then((res) => {
        const addrList = res.data?.results ?? res.data ?? []
        const list = Array.isArray(addrList) ? addrList : []
        setAddresses(list)
        if (list.length) setSelectedAddress(list[0].id)
      })
      .catch(() => setAddresses([]))
      .finally(() => setLoading(false))
  }, [])

  const handleAddAddress = async (e) => {
    e.preventDefault()
    try {
      const { data } = await createAddress(formData)
      setAddresses((a) => [...a, data])
      setSelectedAddress(data.id)
      setShowNewAddress(false)
      setFormData({ city: '', state: '', pincode: '', full_address: '' })
      toast.success('Address added!')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add address')
    }
  }

  const handlePlaceOrder = async () => {
    const addrId = selectedAddress ?? addresses[0]?.id
    if (!addrId) {
      toast.error('Please add or select an address')
      return
    }
    setPlacing(true)
    try {
      await createOrder(Number(addrId))
      dispatch(clearCart())
      toast.success('Order placed successfully!')
      navigate('/profile')
    } catch (err) {
      const data = err.response?.data || {}
      toast.error(data.error || data.detail || data.address_id?.[0] || 'Failed to place order')
    } finally {
      setPlacing(false)
    }
  }

  if (loading) return <LoadingSpinner size="lg" />
  if (!items?.length) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-600">Your cart is empty.</p>
        <button onClick={() => navigate('/products')} className="mt-4 text-primary-600 font-medium">
          Continue Shopping
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Checkout</h1>
      <div className="grid lg:grid-cols-2 gap-8">
        <div>
          <h2 className="font-semibold text-gray-800 mb-4">Shipping Address</h2>
          <div className="space-y-3 mb-4">
            {addresses.map((addr) => (
              <label
                key={addr.id}
                className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-soft ${
                  selectedAddress === addr.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
                }`}
              >
                <input
                  type="radio"
                  name="address"
                  checked={selectedAddress === addr.id}
                  onChange={() => setSelectedAddress(addr.id)}
                  className="mt-1"
                />
                <div>
                  <p className="text-gray-800">{addr.full_address}</p>
                  <p className="text-sm text-gray-500">{addr.city}, {addr.state} - {addr.pincode}</p>
                </div>
              </label>
            ))}
          </div>
          {!showNewAddress ? (
            <button
              onClick={() => setShowNewAddress(true)}
              className="text-primary-600 font-medium hover:text-pink-600"
            >
              + Add new address
            </button>
          ) : (
            <form onSubmit={handleAddAddress} className="p-4 bg-gray-50 rounded-xl space-y-3">
              <input
                type="text"
                placeholder="Full Address"
                value={formData.full_address}
                onChange={(e) => setFormData({ ...formData, full_address: e.target.value })}
                required
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-primary-500"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="City"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required
                  className="px-4 py-2 rounded-xl border border-gray-200 focus:border-primary-500"
                />
                <input
                  type="text"
                  placeholder="State"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  required
                  className="px-4 py-2 rounded-xl border border-gray-200 focus:border-primary-500"
                />
              </div>
              <input
                type="text"
                placeholder="Pincode"
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                required
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-primary-500"
              />
              <div className="flex gap-2">
                <button type="submit" className="px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600">
                  Save Address
                </button>
                <button type="button" onClick={() => setShowNewAddress(false)} className="px-4 py-2 text-gray-600">
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
        <div>
          <div className="bg-white rounded-2xl shadow-soft p-6 sticky top-24">
            <h2 className="font-bold text-gray-800 mb-4">Order Summary</h2>
            <div className="space-y-2 text-gray-600">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between items-center">
                  <span className="font-medium">
                    {item.product?.name}
                    {(item.selected_size || item.selected_color) && (
                      <span className="text-gray-400 font-normal">
                        {' '}
                        (
                        {item.selected_size ? `Size: ${item.selected_size}` : ''}
                        {item.selected_size && item.selected_color ? ', ' : ''}
                        {item.selected_color ? `Color: ${item.selected_color}` : ''}
                        )
                      </span>
                    )}{' '}
                    x {item.quantity}
                  </span>
                  <span>₹{parseFloat(item.line_total || 0).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-primary-600">₹{parseFloat(total).toFixed(2)}</span>
              </div>
            </div>
            <button
              onClick={handlePlaceOrder}
              disabled={placing || !(selectedAddress || addresses[0]?.id)}
              className="mt-6 w-full py-3.5 bg-pink-500 text-white rounded-xl hover:bg-pink-600 transition-soft font-semibold disabled:opacity-50"
            >
              {placing ? 'Placing Order...' : 'Place Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
