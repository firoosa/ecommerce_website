import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getProducts, getCategories, getWishlist, addToWishlist, removeFromWishlist } from '../api/services'
import ProductCard from '../components/ProductCard'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'

export default function Products() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [wishlistProductIds, setWishlistProductIds] = useState([])
  const [wishlistLoadingId, setWishlistLoadingId] = useState(null)
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    min_price: searchParams.get('min_price') || '',
    max_price: searchParams.get('max_price') || '',
    ordering: searchParams.get('ordering') || '-created_at',
  })

  useEffect(() => {
    getCategories({ parent_only: true })
      .then((res) => {
        const cats = res.data?.results || res.data || []
        setCategories(Array.isArray(cats) ? cats : [])
      })
      .catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = { ...filters }
    Object.keys(params).forEach((k) => !params[k] && delete params[k])
    getProducts(params)
      .then((res) => setProducts(res.data.results || res.data || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [filters])

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) return

    getWishlist()
      .then((res) => {
        const items = Array.isArray(res.data?.items) ? res.data.items : []
        const ids = items
          .map((item) => item?.product?.id)
          .filter((id) => Number.isFinite(Number(id)))
          .map(Number)
        setWishlistProductIds(ids)
      })
      .catch(() => setWishlistProductIds([]))
  }, [])

  const handleFilterChange = (key, value) => {
    setFilters((f) => ({ ...f, [key]: value }))
  }

  const handleWishlistToggle = async (product) => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      toast.error('Please log in to use wishlist')
      navigate('/login')
      return
    }
    const productId = Number(product?.id)
    if (!productId) return

    const isWishlisted = wishlistProductIds.includes(productId)
    setWishlistLoadingId(productId)
    try {
      if (isWishlisted) {
        await removeFromWishlist(productId)
        setWishlistProductIds((prev) => prev.filter((id) => id !== productId))
        toast.success('Removed from wishlist')
      } else {
        await addToWishlist(productId)
        setWishlistProductIds((prev) => (prev.includes(productId) ? prev : [...prev, productId]))
        toast.success('Added to wishlist')
      }
    } catch (err) {
      if (err?.response?.status === 401) {
        navigate('/login')
      } else {
        toast.error('Failed to update wishlist')
      }
    } finally {
      setWishlistLoadingId(null)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">All Products</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <aside className="lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-soft p-4 sticky top-24">
            <h3 className="font-semibold text-gray-800 mb-4">Filters</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Search</label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Search products..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-primary-500"
                >
                  <option value="">All</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Sort By</label>
                <select
                  value={filters.ordering}
                  onChange={(e) => handleFilterChange('ordering', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-primary-500"
                >
                  <option value="-created_at">Newest</option>
                  <option value="price">Price: Low to High</option>
                  <option value="-price">Price: High to Low</option>
                </select>
              </div>
            </div>
          </div>
        </aside>

        {/* Products Grid */}
        <div className="flex-1">
          {loading ? (
            <LoadingSpinner size="lg" />
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  showSaleBadge={false}
                  showWishlistIcon
                  isWishlisted={wishlistProductIds.includes(Number(product.id))}
                  wishlistLoading={wishlistLoadingId === Number(product.id)}
                  onToggleWishlist={handleWishlistToggle}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No products found"
              message="Try adjusting your filters or search term."
            />
          )}
        </div>
      </div>
    </div>
  )
}
