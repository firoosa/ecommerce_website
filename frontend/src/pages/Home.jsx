import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getCategories, getProducts } from '../api/services'
import ProductCard from '../components/ProductCard'
import LoadingSpinner from '../components/LoadingSpinner'

export default function Home() {
  const [categories, setCategories] = useState([])
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getCategories({ parent_only: true }),
      // Load more products for home page (latest products)
      getProducts({ page_size: 12 }),
    ])
      .then(([catRes, prodRes]) => {
        const cats = catRes.data?.results || catRes.data || []
        setCategories(Array.isArray(cats) ? cats : [])
        setFeaturedProducts(prodRes.data?.results || prodRes.data || [])
      })
      .catch(() => {
        setCategories([])
        setFeaturedProducts([])
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner size="lg" />

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-100 via-white to-pink-50">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-800 leading-tight">
                Welcome to <span className="bg-gradient-to-r from-primary-500 to-pink-500 bg-clip-text text-transparent">Baby Store</span>
              </h1>
              <p className="mt-4 text-lg text-gray-600">
                Premium baby products for your little one. Soft, safe, and lovingly made.
              </p>
              <Link
                to="/products"
                className="inline-block mt-6 px-8 py-3.5 bg-primary-500 text-white rounded-xl hover:bg-pink-500 transition-soft font-semibold shadow-soft"
              >
                Shop Now
              </Link>
            </div>
            <div className="hidden md:block">
              <img
                src="https://images.unsplash.com/photo-1519689680058-324335c77eba?w=600&h=400&fit=crop"
                alt="Baby products"
                className="rounded-2xl shadow-soft-lg w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-8">Shop by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.slice(0, 8).map((cat) => (
              <Link
                key={cat.id}
                to={`/products?category=${cat.id}`}
                className="group block p-6 bg-gray-50 rounded-2xl hover:bg-primary-50 transition-soft border border-transparent hover:border-primary-200"
              >
                <div className="w-16 h-16 rounded-xl bg-white flex items-center justify-center mb-3 group-hover:scale-110 transition-soft">
                  {cat.image ? (
                    <img src={cat.image} alt={cat.name} className="w-12 h-12 object-contain" />
                  ) : (
                    <span className="text-2xl">👶</span>
                  )}
                </div>
                <h3 className="font-semibold text-gray-800 group-hover:text-primary-600">{cat.name}</h3>
              </Link>
            ))}
          </div>
          {categories.length === 0 && (
            <p className="text-gray-500 text-center py-8">No categories yet. Add some in the admin panel!</p>
          )}
        </div>
      </section>

      {/* Featured / Latest Products */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800">Featured Products</h2>
            <Link to="/products" className="text-primary-600 font-medium hover:text-pink-600">
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          {featuredProducts.length === 0 && (
            <p className="text-gray-500 text-center py-12">No featured products yet.</p>
          )}
        </div>
      </section>
    </div>
  )
}
