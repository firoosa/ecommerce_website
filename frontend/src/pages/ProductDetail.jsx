import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FiShoppingCart, FiChevronLeft, FiChevronRight, FiChevronUp, FiChevronDown, FiTruck, FiCheck } from 'react-icons/fi'
import { getProduct, getProducts, addToCart, getCart, createReview, getReviews } from '../api/services'
import { useDispatch, useSelector } from 'react-redux'
import { setCart } from '../store/slices/cartSlice'
import LoadingSpinner from '../components/LoadingSpinner'
import ProductCard from '../components/ProductCard'
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
  const [relatedProducts, setRelatedProducts] = useState([])
  const [adding, setAdding] = useState(false)
  const [materialsExpanded, setMaterialsExpanded] = useState(false)
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
        // Load related products from same category
        const categoryId = res.data?.category?.id || res.data?.category
        if (categoryId) {
          getProducts({ category: categoryId, page_size: 8 })
            .then((r) => {
              const list = r.data?.results || r.data || []
              const filtered = Array.isArray(list)
                ? list.filter((p) => p.id !== res.data.id)
                : []
              setRelatedProducts(filtered.slice(0, 8))
            })
            .catch(() => setRelatedProducts([]))
        } else {
          setRelatedProducts([])
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
    setAdding(true)
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
    } finally {
      setAdding(false)
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

  // Calculate average rating
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : null
  const reviewCount = reviews.length

  // Color name mapping for display (you can customize this)
  const getColorDisplayName = (color) => {
    const colorMap = {
      'red': 'Red',
      'blue': 'Blue',
      'green': 'Green',
      'black': 'Black',
      'white': 'White',
      'yellow': 'Yellow',
      'pink': 'Pink',
      'purple': 'Purple',
      'orange': 'Orange',
      'gray': 'Gray',
      'grey': 'Grey',
    }
    return colorMap[color?.toLowerCase()] || color || 'Select Color'
  }

  const handlePrevImage = () => {
    if (!images.length) return
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const handleNextImage = () => {
    if (!images.length) return
    setCurrentImageIndex((prev) => (prev + 1) % images.length)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Hero: gallery + product info */}
        <div className="bg-white rounded-3xl shadow-soft-lg p-6 md:p-8 lg:p-10 grid md:grid-cols-2 gap-10 lg:gap-14">
          {/* Image Gallery */}
          <div className="rounded-2xl overflow-hidden bg-gray-50 border border-gray-100">
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
                    idx === currentImageIndex ? 'border-primary-500' : 'border-transparent'
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
        <div className="flex flex-col">
          {/* Title with Rating */}
          <div className="mb-4">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">{product.name}</h1>
            <div className="flex items-center gap-4 flex-wrap">
              {avgRating && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`text-lg ${
                          star <= Math.round(parseFloat(avgRating))
                            ? 'text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="text-sm text-gray-700 font-medium">
                    {avgRating} ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
                  </span>
                </div>
              )}
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                <FiCheck size={14} /> VERIFIED PARENT
              </span>
            </div>
          </div>

          {/* Price */}
          <div className="mb-6">
            <span className="text-3xl md:text-4xl font-bold text-gray-900">
              ₹{parseFloat(price).toFixed(2)}
            </span>
            {hasDiscount && (
              <span className="ml-3 text-lg text-gray-400 line-through">
                ₹{parseFloat(product.price).toFixed(2)}
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-base text-gray-700 leading-relaxed mb-6">
            {product.description}
          </p>

          {/* Color Selection */}
          {colors.length > 0 && (
            <div className="mb-6">
              <p className="text-sm font-semibold text-gray-800 mb-3">
                COLOR: <span className="font-normal text-gray-600">{selectedColor ? getColorDisplayName(selectedColor).toUpperCase() : 'SELECT COLOR'}</span>
              </p>
              <div className="flex flex-wrap gap-3">
                {colors.map((c) => {
                  const disabled = hasVariantCombos && selectedSize
                    ? !isValidCombo(selectedSize, c)
                    : false
                  const isSelected = selectedColor === c
                  // Simple color mapping for swatches (you can enhance this)
                  const colorMap = {
                    'red': '#ef4444',
                    'blue': '#3b82f6',
                    'green': '#10b981',
                    'black': '#000000',
                    'white': '#ffffff',
                    'yellow': '#fbbf24',
                    'pink': '#ec4899',
                    'purple': '#a855f7',
                    'orange': '#f97316',
                    'gray': '#6b7280',
                    'grey': '#6b7280',
                  }
                  const colorHex = colorMap[c?.toLowerCase()] || '#9ca3af'
                  return (
                    <button
                      key={c}
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        setSelectedColor((prev) => (prev === c ? '' : c))
                      }}
                      className={`relative w-12 h-12 rounded-full border-2 transition-all ${
                        isSelected
                          ? 'border-blue-600 ring-2 ring-blue-200'
                          : disabled
                            ? 'border-gray-300 opacity-40 cursor-not-allowed'
                            : 'border-gray-300 hover:border-gray-400'
                      }`}
                      style={{ backgroundColor: colorHex }}
                      title={c}
                    >
                      {isSelected && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <FiCheck className="text-white drop-shadow-md" size={18} />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Size Selection */}
          {sizes.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-gray-800">SELECT SIZE</p>
                <button
                  type="button"
                  className="text-sm text-blue-600 hover:text-blue-700 underline"
                  onClick={() => {
                    // You can add a size guide modal or navigate to a size guide page
                    toast.info('Size guide coming soon!')
                  }}
                >
                  Size Guide
                </button>
              </div>
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
                        setSelectedSize((prev) => (prev === s ? '' : s))
                      }}
                      className={`px-5 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : disabled
                            ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {s}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Quantity and Add to Basket */}
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center border-2 border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium"
                  disabled={adding}
                >
                  -
                </button>
                <span className="px-6 py-2.5 w-16 text-center font-semibold text-gray-900">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(maxQty || 99, q + 1))}
                  className="px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium"
                  disabled={adding}
                >
                  +
                </button>
              </div>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={adding}
              className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-semibold text-base shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiShoppingCart size={20} />
              {adding ? 'Adding...' : 'Add to Basket'}
            </button>
            <p className="mt-3 text-sm text-gray-600 flex items-center gap-1">
              <FiTruck size={16} />
              Free shipping on orders over ₹150
            </p>
          </div>

          {/* Materials & Care */}
          {(product.material || product.brand || product.age_group) && (
            <div className="mt-6 border-t border-gray-200 pt-6">
              <button
                type="button"
                onClick={() => setMaterialsExpanded(!materialsExpanded)}
                className="w-full flex items-center justify-between text-left"
              >
                <h3 className="text-base font-semibold text-gray-900">Materials & Care</h3>
                {materialsExpanded ? (
                  <FiChevronUp className="text-gray-600" size={20} />
                ) : (
                  <FiChevronDown className="text-gray-600" size={20} />
                )}
              </button>
              {materialsExpanded && (
                <div className="mt-4 space-y-2 text-sm text-gray-700">
                  {product.material && (
                    <p className="flex items-start gap-2">
                      <span className="text-gray-400">•</span>
                      <span><strong>Material:</strong> {product.material}</span>
                    </p>
                  )}
                  {product.brand && (
                    <p className="flex items-start gap-2">
                      <span className="text-gray-400">•</span>
                      <span><strong>Brand:</strong> {product.brand}</span>
                    </p>
                  )}
                  {product.age_group && (
                    <p className="flex items-start gap-2">
                      <span className="text-gray-400">•</span>
                      <span><strong>Age Group:</strong> {product.age_group}</span>
                    </p>
                  )}
                  <p className="flex items-start gap-2">
                    <span className="text-gray-400">•</span>
                    <span>Machine wash cold, gentle cycle</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-gray-400">•</span>
                    <span>Tumble dry low or lay flat to dry</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-gray-400">•</span>
                    <span>Avoid bleach to maintain natural fibers</span>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Reviews */}
      <div className="mt-10 bg-white rounded-2xl shadow-soft p-6">
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

      {/* Related products from same category */}
      {relatedProducts.length > 0 && (
        <section className="mt-10 bg-white rounded-2xl shadow-soft p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">You May Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
      </div>
    </div>
  )
}
