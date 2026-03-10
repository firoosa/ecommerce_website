import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FiShoppingCart, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { getProduct, addToCart, getCart, createReview, getReviews } from '../api/services'
import { useDispatch, useSelector } from 'react-redux'
import { setCart } from '../store/slices/cartSlice'
import LoadingSpinner from '../components/LoadingSpinner'
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

export default function ProductDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedColor, setSelectedColor] = useState('')
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const dispatch = useDispatch()
  const { isAuthenticated } = useSelector((state) => state.auth)

  useEffect(() => {
    getProduct(slug)
      .then((res) => {
        setProduct(res.data)
        const variants = Array.isArray(res.data?.variants) ? res.data.variants : []
        const sizes = variants.length
          ? Array.from(new Set(variants.map((v) => v?.size).filter(Boolean)))
          : (Array.isArray(res.data?.available_sizes) ? res.data.available_sizes : [])
        const colors = variants.length
          ? Array.from(new Set(variants.map((v) => v?.color).filter(Boolean)))
          : (Array.isArray(res.data?.available_colors) ? res.data.available_colors : [])
        // Auto-select if there's exactly one option (helps older data and makes UX smoother)
        if (sizes.length === 1) setSelectedSize(sizes[0])
        if (colors.length === 1) setSelectedColor(colors[0])
        if (res.data?.id) {
          getReviews(res.data.id).then((r) => setReviews(r.data?.results || r.data || [])).catch(() => setReviews([]))
        }
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false))
  }, [slug])

  const handleAddToCart = async () => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      toast.error('Please log in to add items to cart')
      navigate('/login')
      return
    }
    const variants = Array.isArray(product?.variants) ? product.variants : []
    const sizes = variants.length
      ? Array.from(new Set(variants.map((v) => v?.size).filter(Boolean)))
      : (Array.isArray(product?.available_sizes) ? product.available_sizes : [])
    const colors = variants.length
      ? Array.from(new Set(variants.map((v) => v?.color).filter(Boolean)))
      : (Array.isArray(product?.available_colors) ? product.available_colors : [])

    // If variants exist, require selecting both size and color (when present)
    if (variants.length > 0) {
      if (sizes.length > 0 && !selectedSize) {
        toast.error('Please select a size')
        return
      }
      if (colors.length > 0 && !selectedColor) {
        toast.error('Please select a color')
        return
      }
    } else {
      if (sizes.length > 1 && !selectedSize) {
        toast.error('Please select a size')
        return
      }
      if (colors.length > 1 && !selectedColor) {
        toast.error('Please select a color')
        return
      }
    }
    try {
      await addToCart(product.id, quantity, {
        selected_size: selectedSize,
        selected_color: selectedColor,
      })
      const { data } = await getCart()
      dispatch(setCart(data))
      toast.success('Added to cart!')
    } catch (err) {
      const msg = getApiErrorMessage(err)
      toast.error(msg || 'Failed to add to cart')
      if (err.response?.status === 401) navigate('/login')
    }
  }

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    if (!isAuthenticated) {
      toast.error('Please login to submit a review')
      return
    }
    if (!reviewRating) {
      toast.error('Please select a rating')
      return
    }
    setSubmittingReview(true)
    try {
      await createReview(product.id, { rating: reviewRating, comment: reviewComment })
      toast.success('Review submitted!')
      setReviewRating(0)
      setReviewComment('')
      getReviews(product.id).then((r) => setReviews(r.data?.results || r.data || [])).catch(() => {})
    } catch (err) {
      toast.error(err.response?.data?.detail || err.response?.data?.product?.[0] || 'Failed to submit review')
    } finally {
      setSubmittingReview(false)
    }
  }

  if (loading) return <LoadingSpinner size="lg" />
  if (!product) return <div className="max-w-7xl mx-auto px-4 py-16 text-center">Product not found</div>

  const hasDiscount = product.discount_price && parseFloat(product.discount_price) < parseFloat(product.price)
  const price = product.effective_price || product.discount_price || product.price
  const images = (product.images?.length ? product.images : [])
    .map((img) => img?.image)
    .filter(Boolean)
  if (!images.length && product.primary_image) {
    images.push(product.primary_image)
  }

  const currentImage = images[currentImageIndex] || images[0]
  const variants = Array.isArray(product?.variants) ? product.variants : []
  const sizes = variants.length
    ? Array.from(new Set(variants.map((v) => v?.size).filter(Boolean))).sort()
    : (Array.isArray(product?.available_sizes) ? product.available_sizes : [])
  const colors = variants.length
    ? Array.from(new Set(variants.map((v) => v?.color).filter(Boolean))).sort()
    : (Array.isArray(product?.available_colors) ? product.available_colors : [])

  const hasVariantCombos = variants.length > 0 && (sizes.length > 0 || colors.length > 0)
  const isValidCombo = (size, color) =>
    variants.some((v) => String(v?.size || '') === String(size || '') && String(v?.color || '') === String(color || ''))

  const selectedVariant = hasVariantCombos && selectedSize && selectedColor
    ? variants.find((v) => isValidCombo(selectedSize, selectedColor))
    : null
  const maxQty = selectedVariant?.stock ?? product.stock ?? 99

  const handlePrevImage = () => {
    if (!images.length) return
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const handleNextImage = () => {
    if (!images.length) return
    setCurrentImageIndex((prev) => (prev + 1) % images.length)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Image Gallery */}
        <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
          <div className="relative aspect-square">
            {/* Main image */}
            <img
              src={currentImage || 'https://via.placeholder.com/600'}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src =
                  'https://via.placeholder.com/600x600/f0f9ff/0ea5e9?text=Baby+Product'
              }}
            />

            {/* Left / Right arrows */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/90 text-gray-700 hover:bg-gray-100 border border-gray-200 shadow-soft flex items-center justify-center transition-soft"
                  aria-label="Previous image"
                >
                  <FiChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  onClick={handleNextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/90 text-gray-700 hover:bg-gray-100 border border-gray-200 shadow-soft flex items-center justify-center transition-soft"
                  aria-label="Next image"
                >
                  <FiChevronRight size={20} />
                </button>
              </>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 sm:gap-3 p-3 sm:p-4 overflow-x-auto border-t border-gray-100">
              {images.map((imgUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border ${
                    idx === currentImageIndex
                      ? 'border-primary-500'
                      : 'border-transparent'
                  }`}
                >
                  <img
                    src={imgUrl}
                    alt={`${product.name} ${idx + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none'
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{product.name}</h1>
          <div className="mt-4 flex items-center gap-3">
            <span className="text-2xl font-bold text-primary-600">₹{parseFloat(price).toFixed(2)}</span>
            {hasDiscount && (
              <span className="text-lg text-gray-400 line-through">₹{parseFloat(product.price).toFixed(2)}</span>
            )}
            {hasDiscount && (
              <span className="bg-pink-500 text-white text-sm font-bold px-2 py-0.5 rounded-lg">Sale</span>
            )}
          </div>
          <p className="mt-4 text-gray-600">{product.description}</p>
          {product.brand && <p className="mt-2 text-sm text-gray-500">Brand: {product.brand}</p>}
          {product.age_group && <p className="text-sm text-gray-500">Age: {product.age_group}</p>}

          {(sizes.length > 0 || colors.length > 0) && (
            <div className="mt-6 space-y-4">
              {sizes.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-gray-800 mb-2">Size</p>
                  <div className="flex flex-wrap gap-2">
                    {sizes.map((s) => {
                      const disabled = hasVariantCombos && selectedColor
                        ? !isValidCombo(s, selectedColor)
                        : false
                      const isSelected = selectedSize === s
                      return (
                        <button
                          key={s}
                          type="button"
                          disabled={disabled}
                          onClick={() => {
                            // Toggle selection on double click / second click
                            setSelectedSize((prev) => (prev === s ? '' : s))
                          }}
                          className={`px-3 py-1.5 rounded-xl border text-sm transition-soft ${
                            isSelected
                              ? 'border-primary-500 bg-primary-50 text-primary-700'
                              : disabled
                                ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          {s}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
              {colors.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-gray-800 mb-2">Color</p>
                  <div className="flex flex-wrap gap-2">
                    {colors.map((c) => {
                      const disabled = hasVariantCombos && selectedSize
                        ? !isValidCombo(selectedSize, c)
                        : false
                      const isSelected = selectedColor === c
                      return (
                        <button
                          key={c}
                          type="button"
                          disabled={disabled}
                          onClick={() => {
                            // Toggle selection on double click / second click
                            setSelectedColor((prev) => (prev === c ? '' : c))
                          }}
                          className={`px-3 py-1.5 rounded-xl border text-sm transition-soft ${
                            isSelected
                              ? 'border-primary-500 bg-primary-50 text-primary-700'
                              : disabled
                                ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          {c}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 flex items-center gap-4">
            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="px-4 py-2 bg-gray-50 hover:bg-gray-100"
              >
                -
              </button>
              <span className="px-4 py-2 w-12 text-center font-medium">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => Math.min(maxQty || 99, q + 1))}
                className="px-4 py-2 bg-gray-50 hover:bg-gray-100"
              >
                +
              </button>
            </div>
            <button
              onClick={handleAddToCart}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-primary-500 text-white rounded-xl hover:bg-pink-500 transition-soft font-semibold"
            >
              <FiShoppingCart size={20} /> Add to Cart
            </button>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div className="mt-12 bg-white rounded-2xl shadow-soft p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Reviews</h2>
        {isAuthenticated && (
          <form onSubmit={handleSubmitReview} className="mb-6 p-4 bg-gray-50 rounded-xl">
            <div className="flex gap-2 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setReviewRating(star)}
                  className={`text-2xl ${reviewRating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                >
                  ★
                </button>
              ))}
            </div>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Write your review..."
              className="w-full px-4 py-2 rounded-xl border border-gray-200 mb-2"
              rows={3}
            />
            <button type="submit" disabled={submittingReview} className="px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 disabled:opacity-50">
              {submittingReview ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        )}
        <div className="space-y-4">
          {reviews?.length > 0 ? (
            reviews.map((r) => (
              <div key={r.id} className="border-b border-gray-100 pb-4 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{r.user?.full_name}</span>
                  <span className="text-yellow-400">{'★'.repeat(r.rating)}</span>
                </div>
                <p className="text-gray-600 mt-1">{r.comment}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No reviews yet. Be the first to review!</p>
          )}
        </div>
      </div>
    </div>
  )
}
