import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getWishlist, removeFromWishlist } from '../api/services'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'

const getImage = (product) =>
  product?.primary_image ||
  product?.images?.[0]?.image ||
  'https://via.placeholder.com/600x750/f4f4ef/42474e?text=Baby+Product'

const getPrice = (product) =>
  Number(product?.effective_price || product?.discount_price || product?.price || 0)

const getDetailPath = (product) => (product?.slug ? `/products/${product.slug}` : '')

export default function Wishlist() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [removingId, setRemovingId] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      navigate('/login', { replace: true })
      return
    }

    getWishlist()
      .then((res) => {
        setItems(Array.isArray(res.data?.items) ? res.data.items : [])
      })
      .catch((err) => {
        if (err?.response?.status === 401) {
          navigate('/login', { replace: true })
          return
        }
        toast.error('Failed to load wishlist')
      })
      .finally(() => setLoading(false))
  }, [navigate])

  const handleRemove = async (productId) => {
    const numericProductId = Number(productId)
    setRemovingId(numericProductId)
    try {
      await removeFromWishlist(numericProductId)
      setItems((prev) => prev.filter((item) => Number(item?.product?.id) !== numericProductId))
      toast.success('Removed from wishlist')
    } catch (err) {
      if (err?.response?.status === 401) {
        navigate('/login')
      } else {
        toast.error('Failed to remove item')
      }
    } finally {
      setRemovingId(null)
    }
  }

  if (loading) return <LoadingSpinner size="lg" />

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Wishlist</h1>
        <Link to="/products" className="text-sm font-medium text-[#624000] hover:underline">
          Continue shopping
        </Link>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="Your wishlist is empty"
          message="Save your favorite products and come back anytime."
          actionLabel="Browse products"
          actionLink="/products"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => {
            const product = item?.product
            if (!product) return null
            const isRemoving = removingId === Number(product.id)
            const detailPath = getDetailPath(product)
            return (
              <div key={item.id} className="bg-white rounded-2xl shadow-soft overflow-hidden">
                {detailPath ? (
                  <Link to={detailPath} className="block aspect-[4/5] bg-[#f4f4ef] overflow-hidden">
                    <img
                      src={getImage(product)}
                      alt={product.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/600x750/f4f4ef/42474e?text=Baby+Product'
                      }}
                    />
                  </Link>
                ) : (
                  <div className="block aspect-[4/5] bg-[#f4f4ef] overflow-hidden">
                    <img
                      src={getImage(product)}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/600x750/f4f4ef/42474e?text=Baby+Product'
                      }}
                    />
                  </div>
                )}
                <div className="p-4">
                  {detailPath ? (
                    <Link to={detailPath} className="text-lg font-semibold text-gray-800 hover:text-[#624000]">
                      {product.name}
                    </Link>
                  ) : (
                    <p className="text-lg font-semibold text-gray-800">{product.name}</p>
                  )}
                  <p className="mt-2 text-lg font-semibold text-[#624000]">${getPrice(product).toFixed(2)}</p>

                  <button
                    type="button"
                    onClick={() => handleRemove(product.id)}
                    disabled={isRemoving}
                    className="mt-4 w-full py-2.5 border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isRemoving ? 'Removing...' : 'Remove'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
