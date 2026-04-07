import { Link, useNavigate } from 'react-router-dom'
import { FiShoppingCart, FiHeart } from 'react-icons/fi'
import { useDispatch } from 'react-redux'
import { addToCart } from '../api/services'
import { getCart } from '../api/services'
import { setCart } from '../store/slices/cartSlice'
import toast from 'react-hot-toast'

const getApiErrorMessage = (err) => {
  const data = err?.response?.data || {}
  if (typeof data?.detail === 'string' && data.detail) return data.detail
  if (typeof data?.error === 'string' && data.error) return data.error
  if (Array.isArray(data?.non_field_errors) && data.non_field_errors[0]) return data.non_field_errors[0]
  if (Array.isArray(data?.selected_size) && data.selected_size[0]) return data.selected_size[0]
  if (Array.isArray(data?.selected_color) && data.selected_color[0]) return data.selected_color[0]
  return ''
}

export default function ProductCard({
  product,
  showSaleBadge = true,
  showWishlistIcon = false,
  isWishlisted = false,
  wishlistLoading = false,
  onToggleWishlist,
}) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const hasDiscount = product.discount_price && parseFloat(product.discount_price) < parseFloat(product.price)
  const price = product.effective_price || product.discount_price || product.price
  const sizes = Array.isArray(product.available_sizes) ? product.available_sizes : []
  const colors = Array.isArray(product.available_colors) ? product.available_colors : []
  const needsOptionSelection = (sizes?.length > 1) || (colors?.length > 1)
  const categoryName = product?.category_name || 'Essential Collection'

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
      const msg = getApiErrorMessage(err)
      toast.error(msg || 'Failed to add to cart')
      if (err.response?.status === 401) navigate('/login')
    }
  }

  const handleWishlistClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (typeof onToggleWishlist === 'function') onToggleWishlist(product)
  }

  return (
    <div className="group flex flex-col h-full">
      <Link to={`/products/${product.slug}`} className="relative overflow-hidden rounded-xl aspect-[4/5] mb-5 bg-[#f4f4ef] block">
        <img
          src={product.primary_image || product.images?.[0]?.image || '/placeholder-baby.jpg'}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/400x400/f4f4ef/42474e?text=Baby+Product'
          }}
        />
        {showSaleBadge && hasDiscount && (
          <span className="absolute top-3 left-3 bg-[#624000] text-white text-xs font-bold px-2.5 py-1 rounded-lg">
            Sale
          </span>
        )}
        {showWishlistIcon && (
          <button
            type="button"
            onClick={handleWishlistClick}
            disabled={wishlistLoading}
            className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center shadow-sm transition-colors ${
              isWishlisted ? 'bg-[#624000] text-white' : 'bg-white/95 text-[#624000]'
            } ${wishlistLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
            aria-label="wishlist"
          >
            <FiHeart size={16} />
          </button>
        )}
        <button
          onClick={handleAddToCart}
          className="absolute bottom-3 right-3 p-2.5 bg-white/95 rounded-xl shadow-sm opacity-0 group-hover:opacity-100 transition-all text-[#624000]"
        >
          <FiShoppingCart size={20} />
        </button>
      </Link>
      <div className="flex justify-between items-start mb-2">
        <p className="text-[9px] font-bold tracking-[0.2em] text-[#7e5712] uppercase">
          {categoryName}
        </p>
        <span className="text-[10px] font-bold text-[#624000]">★ 4.8</span>
      </div>
      <Link to={`/products/${product.slug}`} className="text-2xl leading-snug text-[#1a1c19] font-serif mb-3 hover:opacity-80 transition-opacity">
        <span className="text-2xl leading-snug">{product.name}</span>
      </Link>
      <div className="mt-auto flex justify-between items-center gap-4">
        <p className="text-2xl font-medium text-[#42474e]">₹{parseFloat(price).toFixed(2)}</p>
        <button
          onClick={handleAddToCart}
          className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#624000] hover:underline flex items-center gap-2"
        >
          <FiShoppingCart size={14} /> {needsOptionSelection ? 'Select Options' : 'Add to Cart'}
        </button>
      </div>
    </div>
  )
}
