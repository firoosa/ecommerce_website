import { Link, useNavigate } from 'react-router-dom'
import { FiShoppingCart } from 'react-icons/fi'
import { useDispatch } from 'react-redux'
import { addToCart } from '../api/services'
import { getCart } from '../api/services'
import { setCart } from '../store/slices/cartSlice'
import toast from 'react-hot-toast'

export default function ProductCard({ product }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const hasDiscount = product.discount_price && parseFloat(product.discount_price) < parseFloat(product.price)
  const price = product.effective_price || product.discount_price || product.price
  const sizes = Array.isArray(product.available_sizes) ? product.available_sizes : []
  const colors = Array.isArray(product.available_colors) ? product.available_colors : []
  const needsOptionSelection = (sizes?.length > 1) || (colors?.length > 1)

  const handleAddToCart = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (needsOptionSelection) {
      navigate(`/products/${product.slug}`)
      return
    }
    const token = localStorage.getItem('access_token')
    if (!token) {
      toast.error('Please log in to add items to cart')
      navigate('/login')
      return
    }
    try {
      await addToCart(product.id, 1, {})
      const { data } = await getCart()
      dispatch(setCart(data))
      toast.success('Added to cart!')
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.error
      toast.error(msg || 'Please log in to add to cart')
      if (err.response?.status === 401) navigate('/login')
    }
  }

  return (
    <Link
      to={`/products/${product.slug}`}
      className="group block bg-white rounded-2xl shadow-soft overflow-hidden hover:shadow-soft-lg hover:-translate-y-1 transition-soft duration-300"
    >
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        <img
          src={product.primary_image || product.images?.[0]?.image || '/placeholder-baby.jpg'}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-soft duration-300"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/400x400/f0f9ff/0ea5e9?text=Baby+Product'
          }}
        />
        {hasDiscount && (
          <span className="absolute top-3 left-3 bg-pink-500 text-white text-xs font-bold px-2.5 py-1 rounded-lg">
            Sale
          </span>
        )}
        <button
          onClick={handleAddToCart}
          className="absolute bottom-3 right-3 p-2.5 bg-white rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-soft hover:bg-primary-500 hover:text-white"
        >
          <FiShoppingCart size={20} />
        </button>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-800 line-clamp-2 group-hover:text-primary-600 transition-soft">
          {product.name}
        </h3>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-lg font-bold text-primary-600">₹{parseFloat(price).toFixed(2)}</span>
          {hasDiscount && (
            <span className="text-sm text-gray-400 line-through">₹{parseFloat(product.price).toFixed(2)}</span>
          )}
        </div>
        {(sizes.length > 0 || colors.length > 0) && (
          <div className="mt-2 space-y-1">
            {sizes.length > 0 && (
              <div className="text-xs text-gray-500">
                <span className="font-medium text-gray-600">Sizes:</span>{' '}
                {sizes.slice(0, 4).join(', ')}{sizes.length > 4 ? '…' : ''}
              </div>
            )}
            {colors.length > 0 && (
              <div className="text-xs text-gray-500">
                <span className="font-medium text-gray-600">Colors:</span>{' '}
                {colors.slice(0, 4).join(', ')}{colors.length > 4 ? '…' : ''}
              </div>
            )}
          </div>
        )}
        <button
          onClick={handleAddToCart}
          className="mt-3 w-full py-2.5 bg-primary-500 text-white rounded-xl hover:bg-pink-500 transition-soft font-medium text-sm flex items-center justify-center gap-2"
        >
          <FiShoppingCart size={16} /> {needsOptionSelection ? 'Select Options' : 'Add to Cart'}
        </button>
      </div>
    </Link>
  )
}
