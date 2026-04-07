import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { addToWishlist, getCategories, getProducts, getWishlist, removeFromWishlist } from '../api/services'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'

const normalize = (s) => (typeof s === 'string' ? s.toLowerCase() : '')
const accent = '#7e5712'
const accentDark = '#624000'

export default function Home() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [wishlistProductIds, setWishlistProductIds] = useState([])
  const [wishlistLoadingId, setWishlistLoadingId] = useState(null)
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const [loading, setLoading] = useState(true)

  const [uiFilters, setUiFilters] = useState({
    selectedAge: 'infant', // UI-only unless we find matching category keywords
    selectedPalette: '',
    // Category filter is shared for both "Age" + "Product Type" buttons.
    categoryId: '',
    maxPrice: 500,
  })

  const [filters, setFilters] = useState({
    category: '',
    search: '',
    min_price: '',
    max_price: 500,
    ordering: '-created_at',
  })

  useEffect(() => {
    getCategories()
      .then((res) => {
        const cats = res.data?.results || res.data || []
        setCategories(Array.isArray(cats) ? cats : [])
      })
      .catch(() => setCategories([]))
  }, [])

  // Fetch products whenever filters/page changes.
  useEffect(() => {
    setLoading(true)

    const params = {
      ...filters,
      page,
    }

    // Remove empty query params so DRF filters don't get invalid values.
    Object.keys(params).forEach((k) => {
      const v = params[k]
      if (v === '' || v === null || typeof v === 'undefined') delete params[k]
    })

    getProducts(params)
      .then((res) => {
        const results = res.data?.results || res.data || []
        setProducts(Array.isArray(results) ? results : [])
        setCount(Number(res.data?.count ?? 0))
        const inferredPageSize = Array.isArray(results) ? results.length : 12
        if (inferredPageSize > 0) setPageSize(inferredPageSize)
      })
      .catch(() => {
        setProducts([])
        setCount(0)
      })
      .finally(() => setLoading(false))
  }, [filters, page])

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) return

    getWishlist()
      .then((res) => {
        const items = res.data?.items || []
        const ids = items
          .map((item) => item?.product?.id)
          .filter((id) => Number.isFinite(Number(id)))
          .map(Number)
        setWishlistProductIds(ids)
      })
      .catch(() => {
        setWishlistProductIds([])
      })
  }, [])

  const totalPages = useMemo(() => {
    if (!count || !pageSize) return 1
    return Math.max(1, Math.ceil(count / pageSize))
  }, [count, pageSize])

  const visiblePages = useMemo(() => {
    // Keep UI close to the template: show at most 4 page buttons.
    const maxButtons = 4
    const pages = []
    const start = Math.max(1, page - 1)
    const end = Math.min(totalPages, start + maxButtons - 1)
    for (let p = start; p <= end; p += 1) pages.push(p)
    return pages
  }, [page, totalPages])

  const findCategoryIdByKeywords = (keywords) => {
    const match = categories.find((c) => {
      const name = normalize(c?.name)
      return keywords.some((kw) => name.includes(kw))
    })
    return match?.id ? String(match.id) : ''
  }

  // Apply the initial "Age" selection once categories are loaded,
  // so the UI and results match.
  useEffect(() => {
    if (!categories.length) return
    let keywords = []
    if (uiFilters.selectedAge === 'newborn') keywords = ['newborn', '0-3', '0–3']
    if (uiFilters.selectedAge === 'infant') keywords = ['infant', '3-12', '3–12']
    if (uiFilters.selectedAge === 'toddler') keywords = ['toddler', '1-3', '1–3']

    if (!keywords.length) return
    const id = findCategoryIdByKeywords(keywords)
    setUiFilters((f) => ({ ...f, categoryId: id }))
    setFilters((cur) => ({ ...cur, category: id }))
    setPage(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories])

  const applyCategoryByKeywords = (keywords) => {
    const id = findCategoryIdByKeywords(keywords)
    const fallbackSearch = keywords?.[0] || ''
    setUiFilters((f) => ({ ...f, categoryId: id }))
    setFilters((cur) => ({
      ...cur,
      category: id,
      // Fallback: if category name matching fails, use keyword search so filter still works.
      search: id ? '' : fallbackSearch,
    }))
    setPage(1)
  }

  const handleAgeClick = (ageKey) => {
    setUiFilters((f) => ({ ...f, selectedAge: ageKey }))
    // Try to map Age -> category based on keyword matching.
    if (ageKey === 'newborn') applyCategoryByKeywords(['newborn', '0-3', '0–3'])
    if (ageKey === 'infant') applyCategoryByKeywords(['infant', '3-12', '3–12'])
    if (ageKey === 'toddler') applyCategoryByKeywords(['toddler', '1-3', '1–3'])
  }

  const handleProductTypeClick = (typeKey) => {
    // Map "Product Type" buttons to categories using keyword matching.
    if (typeKey === 'clothing') applyCategoryByKeywords(['clothing', 'romper', 'dress', 'shirt', 't-shirt', 'suit', 'socks'])
    if (typeKey === 'furniture') applyCategoryByKeywords(['furniture', 'crib', 'bed', 'chair', 'table', 'dresser'])
    if (typeKey === 'gear') applyCategoryByKeywords(['gear', 'carrier', 'stroller', 'diaper', 'bottle'])
    if (typeKey === 'toys') applyCategoryByKeywords(['toy', 'stacker', 'puzzle', 'jenga', 'game'])
  }

  const setMaxPrice = (value) => {
    setUiFilters((f) => ({ ...f, maxPrice: value }))
    setFilters((cur) => ({
      ...cur,
      max_price: value,
    }))
    setPage(1)
  }

  const paletteKeywords = {
    ivory: ['ivory', 'white', 'cream', 'off white', 'beige'],
    sand: ['sand', 'tan', 'beige', 'khaki', 'brown'],
    ciel: ['blue', 'sky', 'ciel', 'navy'],
    rose: ['rose', 'pink', 'blush', 'maroon', 'red'],
    mist: ['mist', 'gray', 'grey', 'silver', 'ash'],
  }

  const productMatchesPalette = (product, paletteKey) => {
    if (!paletteKey) return true
    const keywords = paletteKeywords[paletteKey] || []
    if (!keywords.length) return true
    const haystack = [
      product?.color,
      ...(Array.isArray(product?.available_colors) ? product.available_colors : []),
      product?.name,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return keywords.some((kw) => haystack.includes(kw))
  }

  const getPrice = (product) => Number(product.effective_price || product.discount_price || product.price || 0)

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const priceOk = getPrice(product) <= Number(uiFilters.maxPrice || 0)
      const paletteOk = productMatchesPalette(product, uiFilters.selectedPalette)
      return priceOk && paletteOk
    })
  }, [products, uiFilters.maxPrice, uiFilters.selectedPalette])

  const handleWishlistToggle = async (e, productId) => {
    e.preventDefault()
    e.stopPropagation()

    const token = localStorage.getItem('access_token')
    if (!token) {
      toast.error('Please log in to use wishlist')
      navigate('/login')
      return
    }

    const numericProductId = Number(productId)
    const isWishlisted = wishlistProductIds.includes(numericProductId)
    setWishlistLoadingId(numericProductId)

    try {
      if (isWishlisted) {
        await removeFromWishlist(numericProductId)
        setWishlistProductIds((prev) => prev.filter((id) => id !== numericProductId))
        toast.success('Removed from wishlist')
      } else {
        await addToWishlist(numericProductId)
        setWishlistProductIds((prev) => (prev.includes(numericProductId) ? prev : [...prev, numericProductId]))
        toast.success('Added to wishlist')
      }
    } catch (err) {
      if (err?.response?.status === 401) {
        toast.error('Please log in to use wishlist')
        navigate('/login')
      } else {
        toast.error('Failed to update wishlist')
      }
    } finally {
      setWishlistLoadingId(null)
    }
  }

  if (loading) return <LoadingSpinner size="lg" />

  const getImage = (product) => product.primary_image || product.images?.[0]?.image || 'https://via.placeholder.com/600x750/f4f4ef/42474e?text=Baby+Product'

  return (
    <div className="bg-[#fafaf5] text-[#1a1c19]">
      <main className="max-w-7xl mx-auto px-8 py-16">
        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-2 text-[10px] tracking-[0.1em] uppercase font-bold mb-10 text-[#42474e]/50">
          <Link to="/" className="hover:text-[#7e5712] transition-colors">
            Home
          </Link>
          <span className="text-[#72777f]">›</span>
          <span className="text-[#1a1c19]">Shop All</span>
        </nav>

        {/* Category Header */}
        <header className="mb-14 max-w-4xl">
          <span className="text-[#7e5712] text-xs font-bold tracking-[0.3em] uppercase mb-5 block">
            Essential Collections
          </span>
          <h1 className="text-5xl md:text-7xl font-serif italic tracking-tighter text-[#1a1c19] mb-8">
            Curated Essentials
          </h1>
          <p className="text-xl text-[#42474e] leading-relaxed font-light max-w-2xl">
            From organic pima cotton rompers to heirloom-quality nursery pieces, find everything you need
            for your little one&apos;s first years.
          </p>
        </header>

        <div className="flex flex-col lg:flex-row gap-10">
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-72 flex-shrink-0">
            <div className="sticky top-10 space-y-10">
              <div className="space-y-8">
                {/* Age Filter */}
                <div>
                  <h4 className="font-bold text-[10px] tracking-[0.2em] uppercase mb-6 text-[#1a1c19] border-l-2 pl-3" style={{ borderColor: accent }}>
                    Age
                  </h4>
                  <ul className="space-y-4 text-sm text-[#42474e]">
                    <li
                      className="flex items-center gap-3 cursor-pointer hover:text-[#7e5712] transition-colors"
                      onClick={() => handleAgeClick('newborn')}
                    >
                      <div className="w-4 h-4 border border-gray-300 rounded flex items-center justify-center">
                        {uiFilters.selectedAge === 'newborn' && (
                          <span className="text-[10px] text-white w-full h-full rounded flex items-center justify-center" style={{ backgroundColor: accentDark }}>
                            ✓
                          </span>
                        )}
                      </div>
                      <span>Newborn (0-3M)</span>
                    </li>
                    <li
                      className="flex items-center gap-3 cursor-pointer transition-colors"
                      onClick={() => handleAgeClick('infant')}
                    >
                      <div
                        className={`w-4 h-4 border rounded flex items-center justify-center ${
                          uiFilters.selectedAge === 'infant' ? '' : 'border-gray-300'
                        }`}
                        style={uiFilters.selectedAge === 'infant' ? { borderColor: accentDark, backgroundColor: accentDark } : undefined}
                      >
                        {uiFilters.selectedAge === 'infant' && <span className="text-[10px] text-white font-bold">✓</span>}
                      </div>
                      <span className={uiFilters.selectedAge === 'infant' ? 'text-[#7e5712]' : ''}>
                        Infant (3-12M)
                      </span>
                    </li>
                    <li
                      className="flex items-center gap-3 cursor-pointer hover:text-[#7e5712] transition-colors"
                      onClick={() => handleAgeClick('toddler')}
                    >
                      <div className="w-4 h-4 border border-gray-300 rounded flex items-center justify-center">
                        {uiFilters.selectedAge === 'toddler' && (
                          <span className="text-[10px] text-white w-full h-full rounded flex items-center justify-center" style={{ backgroundColor: accentDark }}>
                            ✓
                          </span>
                        )}
                      </div>
                      <span>Toddler (1-3Y)</span>
                    </li>
                  </ul>
                </div>

                {/* Product Type Filter */}
                <div>
                  <h4 className="font-bold text-[10px] tracking-[0.2em] uppercase mb-6 text-[#1a1c19] border-l-2 pl-3" style={{ borderColor: accent }}>
                    Product Type
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleProductTypeClick('clothing')}
                      className="px-4 py-2 border text-white rounded-full text-[11px] font-bold tracking-wider shadow-sm transition-all"
                      style={{ borderColor: accentDark, backgroundColor: accentDark }}
                    >
                      Clothing
                    </button>
                    <button
                      onClick={() => handleProductTypeClick('furniture')}
                      className="px-4 py-2 border border-gray-200 rounded-full text-[11px] font-bold tracking-wider hover:text-[#7e5712] transition-all"
                    >
                      Furniture
                    </button>
                    <button
                      onClick={() => handleProductTypeClick('gear')}
                      className="px-4 py-2 border border-gray-200 rounded-full text-[11px] font-bold tracking-wider hover:text-[#7e5712] transition-all"
                    >
                      Gear
                    </button>
                    <button
                      onClick={() => handleProductTypeClick('toys')}
                      className="px-4 py-2 border border-gray-200 rounded-full text-[11px] font-bold tracking-wider hover:text-[#7e5712] transition-all"
                    >
                      Toys
                    </button>
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <h4 className="font-bold text-[10px] tracking-[0.2em] uppercase mb-6 text-[#1a1c19] border-l-2 pl-3" style={{ borderColor: accent }}>
                    Price Range
                  </h4>
                  <div className="px-1">
                    <input
                      className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      min="0"
                      max="2000"
                      step="10"
                      type="range"
                      value={filters.max_price}
                      onChange={(e) => setMaxPrice(Number(e.target.value))}
                    />
                    <div className="flex justify-between mt-4">
                      <div className="bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 text-center flex-1 mr-2">
                        <span className="text-[9px] text-gray-500 block uppercase font-bold">Min</span>
                        <span className="text-xs font-semibold text-gray-800">$0</span>
                      </div>
                      <div className="bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 text-center flex-1 ml-2">
                        <span className="text-[9px] text-gray-500 block uppercase font-bold">Max</span>
                        <span className="text-xs font-semibold text-gray-800">
                          ${filters.max_price >= 2000 ? '500+' : filters.max_price}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Palette Filter (UI only) */}
                <div>
                  <h4 className="font-bold text-[10px] tracking-[0.2em] uppercase mb-6 text-[#1a1c19] border-l-2 pl-3" style={{ borderColor: accent }}>
                    Palette
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { key: 'ivory', bg: '#FAF9F6' },
                      { key: 'sand', bg: '#E5D3B3' },
                      { key: 'ciel', bg: '#A2CFFE' },
                      { key: 'rose', bg: '#7B5455' },
                      { key: 'mist', bg: '#D8D5D1' },
                    ].map((p) => (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => setUiFilters((f) => ({ ...f, selectedPalette: f.selectedPalette === p.key ? '' : p.key }))}
                        className="w-7 h-7 rounded-full ring-offset-4 transition-all"
                        style={{
                          backgroundColor: p.bg,
                          boxShadow:
                            uiFilters.selectedPalette === p.key
                              ? '0 0 0 2px rgba(98,64,0,1) inset'
                              : undefined,
                          border: uiFilters.selectedPalette === p.key ? 'none' : '1px solid rgba(0,0,0,0.08)',
                        }}
                        aria-label={`Palette ${p.key}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-1">
            <div className="flex justify-between items-end mb-10 pb-6 border-b border-[#c2c7cf]/35">
              <div>
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#42474e]/45">
                  Filtered Results
                </span>
                <h2 className="text-2xl font-serif mt-1 text-[#1a1c19]">
                  {`Showing ${filteredProducts.length} items`}
                </h2>
              </div>
              <div className="flex items-center space-x-3 text-xs font-bold tracking-widest text-[#1a1c19] uppercase cursor-pointer group">
                <span>Sort by: Featured</span>
              </div>
            </div>

            {filteredProducts.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-12">
                  {filteredProducts.map((product) => {
                    const isWishlisted = wishlistProductIds.includes(Number(product.id))
                    const isLoading = wishlistLoadingId === Number(product.id)
                    return (
                    <div key={product.id} className="group flex flex-col h-full">
                      <Link to={`/products/${product.slug}`} className="relative overflow-hidden rounded-xl aspect-[4/5] mb-5 bg-[#f4f4ef] block">
                        <img
                          src={getImage(product)}
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/600x750/f4f4ef/42474e?text=Baby+Product'
                          }}
                        />
                        <button
                          type="button"
                          className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center shadow-sm transition-colors ${
                            isWishlisted ? 'bg-[#624000] text-white' : 'bg-white/95 text-[#624000]'
                          } ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
                          aria-label="wishlist"
                          onClick={(e) => handleWishlistToggle(e, product.id)}
                          disabled={isLoading}
                        >
                          ♥
                        </button>
                      </Link>
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-[9px] font-bold tracking-[0.2em] text-[#7e5712] uppercase">
                          {categories.find((c) => String(c.id) === String(product.category))?.name || 'Essential Collection'}
                        </p>
                        <span className="text-[10px] font-bold text-[#624000]">★ 4.8</span>
                      </div>
                      <Link to={`/products/${product.slug}`} className="text-2xl leading-snug text-[#1a1c19] font-serif mb-3 hover:opacity-80 transition-opacity">
                        <span className="text-2xl leading-snug">{product.name}</span>
                      </Link>
                      <div className="mt-auto flex justify-between items-center">
                        <p className="text-2xl font-medium text-[#42474e]">${getPrice(product).toFixed(2)}</p>
                        <Link to={`/products/${product.slug}`} className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#624000] hover:underline">
                          Add to Cart
                        </Link>
                      </div>
                    </div>
                    )
                  })}
                </div>

                {/* Pagination */}
                <div className="mt-12 flex justify-center items-center space-x-6">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="flex items-center space-x-3 text-[10px] font-bold tracking-[0.2em] uppercase text-[#42474e] hover:text-[#624000] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>Previous</span>
                  </button>

                  <div className="flex space-x-6 text-sm font-bold">
                    {visiblePages.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPage(p)}
                        className={`uppercase border-b-2 pb-1 transition-colors ${
                          p === page ? 'border-[#624000] text-[#624000]' : 'border-transparent text-[#72777f] hover:text-[#1a1c19]'
                        }`}
                      >
                        {String(p).padStart(2, '0')}
                      </button>
                    ))}
                  </div>

                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="flex items-center space-x-3 text-[10px] font-bold tracking-[0.2em] uppercase text-[#42474e] hover:text-[#624000] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>Next</span>
                  </button>
                </div>
              </>
            ) : (
              <EmptyState
                title="No products found"
                message="Try adjusting your filters."
                actionLabel="View all products"
                actionLink="/products"
              />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
