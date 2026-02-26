import api from './axios'

// Auth
export const register = (data) => api.post('/accounts/register/', data)
export const login = (data) => api.post('/accounts/login/', data)
export const getProfile = () => api.get('/accounts/profile/')
export const updateProfile = (data) => api.patch('/accounts/profile/', data)
export const getAddresses = () => api.get('/accounts/addresses/')
export const createAddress = (data) => api.post('/accounts/addresses/', data)

// Categories
export const getCategories = (params) => api.get('/categories/', { params })
export const getCategory = (slug) => api.get(`/categories/${slug}/`)
export const createCategory = (data) => api.post('/categories/', data)
export const updateCategory = (slug, data) =>
  api.put(`/categories/${slug}/`, data)
export const deleteCategory = (slug) =>
  api.delete(`/categories/${slug}/`)

// Products
export const getProducts = (params) => api.get('/products/', { params })
export const getProduct = (slug) => api.get(`/products/${slug}/`)
export const createProduct = (data) =>
  api.post(
    '/products/',
    data,
    data instanceof FormData
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : undefined
  )
export const updateProduct = (slug, data) =>
  api.put(
    `/products/${slug}/`,
    data,
    data instanceof FormData
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : undefined
  )
export const deleteProduct = (slug) =>
  api.delete(`/products/${slug}/`)
export const uploadProductImage = (slug, imageFile) => {
  const formData = new FormData()
  formData.append('image', imageFile)
  return api.post(`/products/${slug}/images/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
export const deleteProductImage = (slug, imageId) =>
  api.delete(`/products/${slug}/images/${imageId}/`)

// Cart
export const getCart = () => api.get('/cart/')
export const addToCart = (productId, quantity = 1, options = {}) =>
  api.post('/cart/add/', {
    product_id: productId,
    quantity,
    selected_size: options.selected_size || '',
    selected_color: options.selected_color || '',
  })
export const updateCartItem = (itemId, quantity) =>
  api.patch(`/cart/items/${itemId}/update/`, { quantity })
export const removeCartItem = (itemId) =>
  api.delete(`/cart/items/${itemId}/remove/`)

// Orders
export const createOrder = (addressId) =>
  api.post('/orders/', { address_id: Number(addressId) })
export const getOrders = () => api.get('/orders/')
export const getOrder = (id) => api.get(`/orders/${id}/`)
export const updateOrder = (id, data) => api.patch(`/orders/${id}/`, data)
export const editOrderToCart = (id) => api.post(`/orders/${id}/edit/`)

// Reviews
export const getReviews = (productId) =>
  api.get(`/reviews/product/${productId}/`)
export const createReview = (productId, data) =>
  api.post(`/reviews/product/${productId}/`, data)

// Wishlist
export const getWishlist = () => api.get('/wishlist/')
export const addToWishlist = (productId) =>
  api.post('/wishlist/add/', { product_id: productId })
export const removeFromWishlist = (productId) =>
  api.delete(`/wishlist/remove/${productId}/`)

// Coupons
export const validateCoupon = (code) =>
  api.post('/coupons/validate/', { code })
