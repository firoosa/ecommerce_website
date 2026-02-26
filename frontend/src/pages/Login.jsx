import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { login } from '../api/services'
import { setCredentials } from '../store/slices/authSlice'
import { getCart } from '../api/services'
import { setCart } from '../store/slices/cartSlice'
import toast from 'react-hot-toast'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Please fill all fields')
      return
    }
    setLoading(true)
    try {
      const { data } = await login({ email, password })
      dispatch(setCredentials(data))
      try {
        const cartRes = await getCart()
        dispatch(setCart(cartRes.data))
      } catch {
        dispatch(setCart({ items: [], subtotal: 0, tax: 0, total: 0 }))
      }
      toast.success('Welcome back!')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-gradient-to-br from-primary-50 via-white to-pink-50">
      <div className="w-full max-w-md">
        {/* Shop name */}
        <div className="mb-4 text-center">
          <a href="/" className="inline-flex items-center gap-2">
            <span className="text-3xl font-extrabold bg-gradient-to-r from-primary-500 to-pink-500 bg-clip-text text-transparent tracking-wide">
              Baby Store
            </span>
          </a>
        </div>
        <div className="bg-white rounded-2xl shadow-soft-lg p-8 border border-gray-100">
          <h1 className="text-2xl font-bold text-gray-800 text-center mb-6">Welcome Back</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-soft"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-soft"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-primary-500 text-white rounded-xl hover:bg-pink-500 transition-soft font-semibold disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <p className="mt-6 text-center text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-600 font-medium hover:text-pink-600">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
