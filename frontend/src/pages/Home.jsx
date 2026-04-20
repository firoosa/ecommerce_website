import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { addToWishlist, getCategories, getProducts, getWishlist, removeFromWishlist } from '../api/services'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'

const normalize = (s) => (typeof s === 'string' ? s.toLowerCase() : '')
const accent = '#33628b'
const accentDark = '#154a72'

export default function Home() {
  const navigate = useNavigate()
  const [isFilterOpen, setIsFilterOpen] = useState(false)
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
      <main className="max-w-7xl mx-auto px-0 md:px-8 pb-24 md:pb-16">
        {/* Mobile Hero */}
        <section className="md:hidden relative w-full h-[520px] overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?q=80&w=1200&auto=format&fit=crop"
            alt="The Heirloom Collection"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#fafaf5] via-transparent to-transparent" />
          <div className="absolute bottom-10 left-0 right-0 px-6 text-center">
            <span className="text-[#33628b] text-[10px] tracking-[0.2em] font-bold uppercase mb-2 block">Summer ’24 Collection</span>
            <h2 className="font-serif italic text-4xl text-[#1a1c19] leading-tight mb-5">
              Timeless Pieces for<br />Your Little Loves
            </h2>
            <button
              onClick={() => navigate('/products')}
              className="bg-gradient-to-r from-[#33628b] to-[#a2cffe] text-white px-6 py-3 rounded-full text-sm font-bold tracking-widest uppercase shadow-lg active:scale-95 transition-transform"
            >
              Explore the Lookbook
            </button>
          </div>
        </section>

        {/* Shop by Age - Mobile */}
        <section className="md:hidden py-8 px-6">
          <div className="flex items-center overflow-x-auto gap-6 no-scrollbar">
            {[
              { key: 'newborn', label: 'Newborn' },
              { key: 'infant', label: 'Toddler' },
              { key: 'kids', label: 'Kids' },
              { key: 'all', label: 'View All' },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => {
                  if (item.key === 'newborn') handleAgeClick('newborn')
                  else if (item.key === 'infant') handleAgeClick('infant')
                  else if (item.key === 'kids') setFilters((f) => ({ ...f, search: 'kids' }))
                  else navigate('/products')
                }}
                className="flex-shrink-0 flex flex-col items-center gap-3"
              >
                <div className={`w-20 h-20 rounded-full ${item.key === 'infant' ? 'border-2 border-[#33628b]' : 'border border-[#c2c7cf]/40'} p-1 bg-white`}>
                  <div className="w-full h-full rounded-full bg-[#f4f4ef]" />
                </div>
                <span className={`text-[10px] font-bold tracking-widest uppercase ${item.key === 'infant' ? 'text-[#33628b]' : 'text-[#42474e]'}`}>
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Breadcrumbs */}
        <nav className="hidden md:flex items-center space-x-2 text-[10px] tracking-[0.1em] uppercase font-bold mb-10 text-[#42474e]/50 px-8">
          <Link to="/" className="hover:text-[#7e5712] transition-colors">
            Home
          </Link>
          <span className="text-[#72777f]">›</span>
          <span className="text-[#1a1c19]">Shop All</span>
        </nav>

        {/* Category Header */}
        <header className="hidden md:block mb-14 max-w-4xl px-8">
          <span className="text-[#33628b] text-xs font-bold tracking-[0.3em] uppercase mb-5 block">
            Essential Collections
          </span>
          <h1 className="text-5xl md:text-7xl font-serif italic tracking-tighter text-[#1a1c19] mb-8">
            Lumiere Enfance
          </h1>
          <p className="text-xl text-[#42474e] leading-relaxed font-light max-w-2xl">
            From organic pima cotton rompers to heirloom-quality nursery pieces, find everything you need
            for your little one&apos;s first years.
          </p>
        </header>

        <div className="px-6 md:px-0 flex flex-col lg:flex-row gap-10">
          {/* Sidebar Filters */}
          <aside className="hidden w-full lg:w-72 flex-shrink-0">
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
              <button
                onClick={() => setIsFilterOpen(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#c2c7cf]/50 text-xs font-bold tracking-widest uppercase text-[#1a1c19] hover:bg-[#f4f4ef]"
              >
                Filter & Sort
              </button>
            </div>

            {/* Mobile: Featured + Quick Add grid (New Arrivals style) */}
            {filteredProducts.length > 0 && (
              <section className="md:hidden mb-8">
                <div className="grid grid-cols-2 gap-6">
                  {/* Featured large card spans 2 cols */}
                  <div className="col-span-2 group">
                    <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-[#f4f4ef] shadow-sm mb-4">
                      <img
                        src={getImage(filteredProducts[0])}
                        alt={filteredProducts[0].name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/600x750/f4f4ef/42474e?text=Baby+Product'
                        }}
                      />
                      <button
                        type="button"
                        onClick={(e) => handleWishlistToggle(e, filteredProducts[0].id)}
                        className={`absolute top-4 right-4 w-10 h-10 backdrop-blur-md rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-transform ${
                          wishlistProductIds.includes(Number(filteredProducts[0].id))
                            ? 'bg-[#33628b] text-white'
                            : 'bg-white/85 text-[#33628b]'
                        } ${wishlistLoadingId === Number(filteredProducts[0].id) ? 'opacity-60 cursor-not-allowed' : ''}`}
                        aria-label="Toggle wishlist"
                        disabled={wishlistLoadingId === Number(filteredProducts[0].id)}
                        title="Wishlist"
                      >
                        ♥
                      </button>
                      <div className="absolute bottom-3 left-3">
                        <span className="bg-[#33628b]/90 text-white px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase backdrop-blur-sm">
                          Organic Cotton
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-serif text-xl mb-1 leading-snug">{filteredProducts[0].name}</h4>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[#33628b] text-xs">4.8 ★</span>
                          <span className="text-[#42474e] text-[10px]">(100+ reviews)</span>
                        </div>
                        <span className="font-bold text-lg text-[#33628b]">${getPrice(filteredProducts[0]).toFixed(2)}</span>
                      </div>
                      <button
                        onClick={() => navigate(`/products/${filteredProducts[0].slug}`)}
                        className="bg-[#33628b] text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                        aria-label="Add to cart"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  {/* Quick Add cards */}
                  {filteredProducts.slice(1, 9).map((p) => (
                    <div key={p.id} className="group">
                      <div className="relative aspect-square rounded-xl overflow-hidden bg-[#f4f4ef] shadow-sm mb-3">
                        <img
                          src={getImage(p)}
                          alt={p.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/600x600/f4f4ef/42474e?text=Baby+Product'
                          }}
                        />
                        <button
                          type="button"
                          onClick={(e) => handleWishlistToggle(e, p.id)}
                          className={`absolute top-3 right-3 w-8 h-8 backdrop-blur-md rounded-full flex items-center justify-center shadow-sm transition-colors ${
                            wishlistProductIds.includes(Number(p.id))
                              ? 'bg-[#33628b] text-white'
                              : 'bg-white/85 text-[#33628b]'
                          } ${wishlistLoadingId === Number(p.id) ? 'opacity-60 cursor-not-allowed' : ''}`}
                          aria-label="Toggle wishlist"
                          disabled={wishlistLoadingId === Number(p.id)}
                          title="Wishlist"
                        >
                          ♥
                        </button>
                      </div>
                      <h4 className="font-serif text-sm mb-1 leading-tight line-clamp-2">{p.name}</h4>
                      <span className="font-bold text-sm text-[#33628b]">${getPrice(p).toFixed(2)}</span>
                      <div className="mt-2">
                        <button
                          onClick={() => navigate(`/products/${p.slug}`)}
                          className="w-full py-2 bg-[#eeeee9] rounded-lg text-[10px] font-bold tracking-widest uppercase hover:bg-[#33628b] hover:text-white transition-colors"
                        >
                          Quick Add
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredProducts.length > 9 && (
                  <div className="mt-6">
                    <button
                      onClick={() => navigate('/products')}
                      className="w-full py-3 border border-[#c2c7cf]/50 rounded-xl text-xs font-bold tracking-widest uppercase text-[#33628b] hover:bg-white"
                    >
                      View more
                    </button>
                  </div>
                )}
              </section>
            )}

            {/* Desktop product grid only (mobile uses the "New Arrivals" card style above) */}
            {filteredProducts.length > 0 ? (
              <div className="hidden md:block">
                <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-x-4 md:gap-x-8 gap-y-6 md:gap-y-12">
                  {filteredProducts.map((product) => {
                    const isWishlisted = wishlistProductIds.includes(Number(product.id))
                    const isLoading = wishlistLoadingId === Number(product.id)
                    return (
                    <div key={product.id} className="group flex flex-col h-full bg-white rounded-xl shadow-soft md:shadow-none md:bg-transparent p-2 md:p-0">
                      <Link to={`/products/${product.slug}`} className="relative overflow-hidden rounded-xl aspect-[4/5] mb-3 md:mb-5 bg-[#f4f4ef] block">
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
                          className={`absolute top-2 right-2 w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center shadow-sm transition-colors ${
                            isWishlisted ? 'bg-[#33628b] text-white' : 'bg-white/95 text-[#33628b]'
                          } ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
                          aria-label="wishlist"
                          onClick={(e) => handleWishlistToggle(e, product.id)}
                          disabled={isLoading}
                        >
                          ♥
                        </button>
                      </Link>
                      <div className="flex justify-between items-start mb-1 md:mb-2">
                        <p className="text-[8px] md:text-[9px] font-bold tracking-[0.2em] text-[#33628b] uppercase">
                          {categories.find((c) => String(c.id) === String(product.category))?.name || 'Essential Collection'}
                        </p>
                        <span className="text-[9px] md:text-[10px] font-bold text-[#33628b]">★ 4.8</span>
                      </div>
                      <Link to={`/products/${product.slug}`} className="text-lg md:text-2xl leading-snug text-[#1a1c19] font-serif mb-2 md:mb-3 hover:opacity-80 transition-opacity line-clamp-2">
                        <span className="text-lg md:text-2xl leading-snug">{product.name}</span>
                      </Link>
                      <div className="mt-auto flex justify-between items-center gap-2">
                        <p className="text-lg md:text-2xl font-medium text-[#42474e]">${getPrice(product).toFixed(2)}</p>
                        <Link
                          to={`/products/${product.slug}`}
                          className="px-3 py-1.5 bg-[#33628b] text-white rounded-lg text-[10px] font-bold tracking-[0.2em] md:px-0 md:py-0 md:bg-transparent md:text-[#33628b] md:hover:underline md:rounded-none"
                        >
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
              </div>
            ) : (
              <EmptyState
                title="No products found"
                message="Try adjusting your filters."
                actionLabel="View all products"
                actionLink="/products"
              />
            )}

            {/* Brand story - Heirloom Promise */}
            <section className="py-16 md:py-20 px-6 md:px-8 text-center bg-[#fafaf5]">
              <div className="text-[#7e5712] mb-3">✿</div>
              <h3 className="font-serif text-2xl italic mb-4">The Heirloom Promise</h3>
              <p className="text-[#42474e] leading-relaxed max-w-xs md:max-w-lg mx-auto text-sm italic">
                "We believe childhood should be slow, intentional, and beautiful. Every piece in our collection is
                chosen to be loved now, and passed down later."
              </p>
              <div className="w-12 h-px bg-[#c2c7cf] mx-auto mt-8" />
            </section>

            {/* Shop Categories bento grid */}
            <section className="pb-16 px-6 md:px-8">
              <div className="flex justify-between items-end mb-6">
                <div>
            <span className="text-[#33628b] text-[10px] tracking-widest uppercase">Community Favorites</span>
                  <h3 className="font-serif text-2xl italic">Shop Categories</h3>
                </div>
              </div>
              <div className="grid grid-cols-2 grid-rows-3 gap-4 h-[500px] md:h-[420px]">
                <Link to="/products?search=linen" className="col-span-1 row-span-2 relative rounded-xl overflow-hidden shadow-lg group">
                  <img
                    src={getImage(filteredProducts[3] || filteredProducts[0] || {})}
                    alt="Apparel"
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                  <div className="absolute bottom-4 left-4 text-white">
                    <span className="text-[10px] tracking-widest uppercase font-bold">Linen & Cotton</span>
                    <h4 className="font-serif text-lg">Apparel</h4>
                  </div>
                </Link>
                <Link to="/products?search=toys" className="col-span-1 row-span-1 relative rounded-xl overflow-hidden shadow-lg group">
                  <img
                    src={getImage(filteredProducts[4] || filteredProducts[1] || {})}
                    alt="Toys"
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/20" />
                  <div className="absolute bottom-3 left-3 text-white">
                    <h4 className="font-serif text-md">Toys</h4>
                  </div>
                </Link>
                <Link to="/products?search=bedding" className="col-span-1 row-span-2 relative rounded-xl overflow-hidden shadow-lg group">
                  <img
                    src={getImage(filteredProducts[5] || filteredProducts[2] || {})}
                    alt="Bedding"
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/20" />
                  <div className="absolute bottom-4 left-4 text-white">
                    <h4 className="font-serif text-lg">Bedding</h4>
                  </div>
                </Link>
                <Link to="/products?search=furniture" className="col-span-1 row-span-1 relative rounded-xl overflow-hidden shadow-lg group">
                  <img
                    src={getImage(filteredProducts[6] || filteredProducts[0] || {})}
                    alt="Furniture"
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/20" />
                  <div className="absolute bottom-3 left-3 text-white">
                    <h4 className="font-serif text-md">Furniture</h4>
                  </div>
                </Link>
              </div>
            </section>
          </div>
        </div>
      </main>
      {/* Mobile Filter Drawer */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsFilterOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-[85%] max-w-sm bg-[#fafaf5] shadow-2xl flex flex-col animate-slide-in">
            <div className="flex items-center justify-between p-5 border-b border-[#c2c7cf]/30">
              <h2 className="font-serif text-2xl italic">Refine Selection</h2>
              <button onClick={() => setIsFilterOpen(false)} className="text-[#42474e]">
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-8">
              <div>
                <h3 className="text-[10px] tracking-[0.2em] uppercase font-bold text-[#7e5712] mb-3">By Age</h3>
                <div className="space-y-2">
                  {[
                    { key: 'newborn', label: 'Newborn (0-3M)' },
                    { key: 'infant', label: 'Infant (3-12M)' },
                    { key: 'toddler', label: 'Toddler (1-3Y)' },
                  ].map((a) => (
                    <label key={a.key} className="flex items-center justify-between">
                      <span className="text-sm text-[#42474e]">{a.label}</span>
                      <input
                        type="radio"
                        name="age"
                        checked={uiFilters.selectedAge === a.key}
                        onChange={() => handleAgeClick(a.key)}
                      />
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-[10px] tracking-[0.2em] uppercase font-bold text-[#7e5712] mb-3">Product Type</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'clothing', label: 'Clothing' },
                    { key: 'furniture', label: 'Furniture' },
                    { key: 'gear', label: 'Gear' },
                    { key: 'toys', label: 'Toys' },
                  ].map((t) => (
                    <button
                      key={t.key}
                      onClick={() => handleProductTypeClick(t.key)}
                      className="px-3 py-2 rounded-lg border border-[#c2c7cf]/60 text-sm text-[#42474e] hover:bg-[#f4f4ef]"
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-[10px] tracking-[0.2em] uppercase font-bold text-[#7e5712] mb-3">Price Range</h3>
                <input
                  className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  min="0"
                  max="2000"
                  step="10"
                  type="range"
                  value={filters.max_price}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                />
                <div className="flex justify-between text-xs mt-3">
                  <span>$0</span>
                  <span>${filters.max_price}</span>
                </div>
              </div>
              <div>
                <h3 className="text-[10px] tracking-[0.2em] uppercase font-bold text-[#7e5712] mb-3">Palette</h3>
                <div className="flex gap-3">
                  {['ivory', 'sand', 'ciel', 'rose', 'mist'].map((p) => (
                    <button
                      key={p}
                      onClick={() => setUiFilters((f) => ({ ...f, selectedPalette: f.selectedPalette === p ? '' : p }))}
                      className={`w-8 h-8 rounded-full border ${
                        uiFilters.selectedPalette === p ? 'ring-2 ring-[#33628b]' : 'border-[#c2c7cf]'
                      }`}
                      style={{
                        backgroundColor:
                          p === 'ivory' ? '#FAF9F6' :
                          p === 'sand' ? '#E5D3B3' :
                          p === 'ciel' ? '#A2CFFE' :
                          p === 'rose' ? '#7B5455' :
                          '#D8D5D1',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-[#c2c7cf]/30 grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setUiFilters((f) => ({ ...f, selectedPalette: '', categoryId: '', maxPrice: 500 }))
                  setFilters((cur) => ({ ...cur, category: '', search: '', max_price: 500 }))
                }}
                className="py-3 border border-[#72777f] text-[#1a1c19] rounded-full text-xs font-bold tracking-widest uppercase"
              >
                Clear
              </button>
              <button
                onClick={() => setIsFilterOpen(false)}
                className="py-3 bg-[#33628b] text-white rounded-full text-xs font-bold tracking-widest uppercase shadow"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
