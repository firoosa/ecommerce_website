import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FiTrash2 } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { getCart, updateCartItem, removeCartItem } from '../api/services'
import { setCart } from '../store/slices/cartSlice'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'

export default function Cart() {
  const [loading, setLoading] = useState(true)
  const dispatch = useDispatch()
  const { items, subtotal, tax, total } = useSelector((state) => state.cart)

  const fetchCart = async () => {
    try {
      const { data } = await getCart()
      dispatch(setCart(data))
    } catch {
      dispatch(setCart({ items: [], subtotal: 0, tax: 0, total: 0 }))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCart()
  }, [])

  const handleUpdateQty = async (itemId, newQty) => {
    try {
      await updateCartItem(itemId, newQty)
      fetchCart()
    } catch (err) {
      console.error(err)
    }
  }

  const handleRemove = async (itemId) => {
    try {
      await removeCartItem(itemId)
      fetchCart()
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) return <LoadingSpinner size="lg" />
  if (!items?.length) {
    return (
      <EmptyState
        title="Your cart is empty"
        message="Add some baby products to get started!"
        actionLabel="Continue Shopping"
        actionLink="/products"
      />
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Shopping Cart</h1>
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
            <div className="divide-y divide-gray-100">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 p-4">
                  <img
                    src={item.product?.primary_image || item.product?.images?.[0]?.image}
                    alt={item.product?.name}
                    className="w-24 h-24 rounded-xl object-cover bg-gray-50"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/96'
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <Link to={`/products/${item.product?.slug}`} className="font-medium text-gray-800 hover:text-primary-600">
                      {item.product?.name}
                    </Link>
                    {(item.selected_size || item.selected_color) && (
                      <p className="text-xs text-gray-500 mt-1">
                        {item.selected_size ? `Size: ${item.selected_size}` : ''}
                        {item.selected_size && item.selected_color ? ' • ' : ''}
                        {item.selected_color ? `Color: ${item.selected_color}` : ''}
                      </p>
                    )}
                    <p className="text-primary-600 font-semibold mt-1">₹{parseFloat(item.line_total || 0).toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUpdateQty(item.id, Math.max(1, item.quantity - 1))}
                      className="w-8 h-8 rounded-lg border border-gray-200 hover:bg-gray-50"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => handleUpdateQty(item.id, item.quantity + 1)}
                      className="w-8 h-8 rounded-lg border border-gray-200 hover:bg-gray-50"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <FiTrash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div>
          <div className="bg-white rounded-2xl shadow-soft p-6 sticky top-24">
            <h2 className="font-bold text-gray-800 mb-4">Order Summary</h2>
            <div className="space-y-2 text-gray-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{parseFloat(subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (18%)</span>
                <span>₹{parseFloat(tax).toFixed(2)}</span>
              </div>
            </div>
            <div className="flex justify-between font-bold text-lg mt-4 pt-4 border-t border-gray-100">
              <span>Total</span>
              <span className="text-primary-600">₹{parseFloat(total).toFixed(2)}</span>
            </div>
            <Link
              to="/checkout"
              className="mt-6 block w-full py-3.5 bg-pink-500 text-white text-center rounded-xl hover:bg-pink-600 transition-soft font-semibold"
            >
              Proceed to Checkout
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
