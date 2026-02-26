import { useState, useEffect } from 'react'
import { getOrders, updateOrder } from '../../api/services'
import toast from 'react-hot-toast'

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [savingStatus, setSavingStatus] = useState(false)

  const STATUS_OPTIONS = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled']

  useEffect(() => {
    getOrders()
      .then((r) => setOrders(r.data.results || r.data || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="animate-pulse h-64 bg-gray-200 rounded-xl" />

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Orders</h1>
      <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Order ID</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Customer</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Total</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Payment</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">#{o.id}</td>
                  <td className="px-4 py-3 text-gray-600">
                    <div className="min-w-0">
                      <div className="font-medium text-gray-800 truncate">
                        {o.user?.full_name || o.user_email || '-'}
                      </div>
                      <div className="text-xs text-gray-500 truncate">{o.user?.email || o.user_email || ''}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-lg text-sm ${
                      o.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                      o.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-primary-100 text-primary-700'
                    }`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">₹{parseFloat(o.total_amount || 0).toFixed(2)}</td>
                  <td className="px-4 py-3">{o.payment_status}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSelectedOrder(o)}
                      className="px-3 py-1.5 rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100 text-xs font-medium"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {orders.length === 0 && (
          <p className="text-center py-12 text-gray-500">No orders yet.</p>
        )}
      </div>

      {/* Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-start sm:items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-full sm:max-w-4xl bg-white rounded-2xl shadow-soft-lg overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 flex-shrink-0">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Order #{selectedOrder.id}</h2>
                <p className="text-sm text-gray-500">
                  {selectedOrder.user?.full_name || selectedOrder.user_email || 'Customer'} •{' '}
                  {selectedOrder.user?.email || selectedOrder.user_email || ''}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-100"
              >
                Close
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
              <div className="grid md:grid-cols-3 gap-3 sm:gap-4">
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <p className="text-xs text-gray-500">Status</p>
                  <p className="font-semibold text-gray-800">{selectedOrder.status}</p>
                  <div className="mt-1">
                    <label className="block text-xs text-gray-500 mb-1">Update status (Admin)</label>
                    <div className="flex gap-2">
                      <select
                        className="flex-1 px-2 py-1.5 text-sm rounded-lg border border-gray-200"
                        value={selectedOrder.status}
                        onChange={(e) =>
                          setSelectedOrder((prev) => ({ ...prev, status: e.target.value }))
                        }
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            setSavingStatus(true)
                            await updateOrder(selectedOrder.id, { status: selectedOrder.status })
                            setOrders((prev) =>
                              prev.map((o) =>
                                o.id === selectedOrder.id ? { ...o, status: selectedOrder.status } : o
                              )
                            )
                            toast.success('Order status updated')
                          } catch (err) {
                            toast.error('Failed to update status')
                          } finally {
                            setSavingStatus(false)
                          }
                        }}
                        disabled={savingStatus}
                        className="px-3 py-1.5 text-xs rounded-lg bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-60"
                      >
                        {savingStatus ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500">Payment</p>
                  <p className="font-semibold text-gray-800">{selectedOrder.payment_status}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500">Total (includes tax)</p>
                  <p className="font-semibold text-primary-700">
                    ₹{parseFloat(selectedOrder.total_amount || 0).toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500">Shipping Address</p>
                <p className="text-sm text-gray-800 mt-1">{selectedOrder.shipping_address}</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Items</h3>
                <div className="divide-y divide-gray-100 bg-white rounded-xl border border-gray-100">
                  {(selectedOrder.items || []).map((it) => {
                    const p = it.product || {}
                    const img = p.primary_image || p.images?.[0]?.image
                    return (
                      <div key={it.id} className="p-3 sm:p-4 flex flex-col sm:flex-row gap-3 sm:gap-4">
                        <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                          {img ? (
                            <img
                              src={img}
                              alt=""
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none'
                              }}
                            />
                          ) : null}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <p className="font-semibold text-gray-800 truncate">{p.name}</p>
                            <span className="text-xs text-gray-500">Product ID: {p.id}</span>
                            <span className="text-xs text-gray-500">Slug: {p.slug}</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Qty: <span className="font-medium">{it.quantity}</span> • Unit: ₹
                            {parseFloat(it.price || 0).toFixed(2)} • Line: ₹
                            {parseFloat(it.line_total || 0).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                  {(selectedOrder.items || []).length === 0 && (
                    <div className="p-6 text-sm text-gray-500">No items.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <a
        href="/admin/orders/order/"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block mt-4 px-6 py-2.5 bg-primary-500 text-white rounded-xl hover:bg-pink-500 transition-soft"
      >
        Manage Orders (Admin)
      </a>
    </div>
  )
}
