import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { FiSearch, FiShoppingCart, FiUser, FiChevronDown, FiMenu } from 'react-icons/fi'
import { logout } from '../store/slices/authSlice'
import { getCategories } from '../api/services'
import { useEffect } from 'react'

export default function Navbar() {
  const [searchQuery, setSearchQuery] = useState('')
  const [categories, setCategories] = useState([])
  const [showCategories, setShowCategories] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useSelector((state) => state.auth)
  const { count } = useSelector((state) => state.cart)

  useEffect(() => {
    getCategories({ parent_only: true })
      .then((res) => {
        const cats = res.data?.results || res.data || []
        setCategories(Array.isArray(cats) ? cats : [])
      })
      .catch(() => setCategories([]))
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  const handleLogout = () => {
    dispatch(logout())
    setShowUserMenu(false)
    navigate('/')
  }

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-soft border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-primary-500 to-pink-500 bg-clip-text text-transparent">
              Baby Store
            </span>
          </Link>

          {/* Categories Dropdown - Desktop */}
          <div className="hidden md:block relative">
            <button
              onMouseEnter={() => setShowCategories(true)}
              onMouseLeave={() => setShowCategories(false)}
              className="flex items-center gap-1 px-4 py-2 rounded-xl text-gray-600 hover:bg-primary-50 hover:text-primary-600 transition-soft"
            >
              Categories <FiChevronDown className="text-sm" />
            </button>
            {showCategories && categories.length > 0 && (
              <div
                onMouseEnter={() => setShowCategories(true)}
                onMouseLeave={() => setShowCategories(false)}
                className="absolute left-0 mt-1 w-56 bg-white rounded-2xl shadow-soft-lg py-2 border border-gray-100 animate-fade-in"
              >
                <Link
                  to="/products"
                  className="block px-4 py-2 text-gray-600 hover:bg-pink-50 hover:text-pink-600 transition-soft"
                >
                  All Products
                </Link>
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/products?category=${cat.id}`}
                    className="block px-4 py-2 text-gray-600 hover:bg-pink-50 hover:text-pink-600 transition-soft"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Search Bar - Center */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl mx-4">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for baby products..."
                className="w-full pl-4 pr-12 py-2.5 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-soft"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-primary-500 hover:bg-primary-50 rounded-lg transition-soft"
              >
                <FiSearch size={20} />
              </button>
            </div>
          </form>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <Link
              to="/cart"
              className="relative p-2.5 rounded-xl text-gray-600 hover:bg-pink-50 hover:text-pink-600 transition-soft"
            >
              <FiShoppingCart size={24} />
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-pink-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </Link>

            {/* User Menu */}
            <div className="relative hidden md:block">
              {isAuthenticated ? (
                <>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-gray-600 hover:bg-primary-50 hover:text-primary-600 transition-soft"
                  >
                    <FiUser size={20} />
                    <span className="max-w-[100px] truncate">{user?.full_name}</span>
                    <FiChevronDown size={16} />
                  </button>
                  {showUserMenu && (
                    <div className="absolute right-0 mt-1 w-48 bg-white rounded-2xl shadow-soft-lg py-2 border border-gray-100 animate-fade-in">
                      <Link
                        to="/profile"
                        onClick={() => setShowUserMenu(false)}
                        className="block px-4 py-2 text-gray-600 hover:bg-pink-50 hover:text-pink-600"
                      >
                        Profile
                      </Link>
                      {user?.role === 'Admin' && (
                        <Link
                          to="/admin"
                          onClick={() => setShowUserMenu(false)}
                          className="block px-4 py-2 text-gray-600 hover:bg-pink-50 hover:text-pink-600"
                        >
                          Admin Panel
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-soft font-medium"
                >
                  <FiUser size={18} />
                  Login
                </Link>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl hover:bg-gray-100"
            >
              <FiMenu size={24} />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100 animate-fade-in">
            <form onSubmit={handleSearch} className="mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full px-4 py-2 rounded-xl border border-gray-200"
              />
            </form>
            <div className="space-y-1">
              {/* Simple navigation without category filters on mobile */}
              <Link
                to="/products"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-gray-600"
              >
                Shop Products
              </Link>

              {!isAuthenticated ? (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-2 text-primary-600 font-medium"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-2 text-gray-600"
                  >
                    Register
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-2 text-gray-700 font-medium"
                  >
                    Profile
                  </Link>
                  {user?.role === 'Admin' && (
                    <Link
                      to="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-2 text-gray-700 font-medium"
                    >
                      Admin Panel
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      handleLogout()
                      setMobileMenuOpen(false)
                    }}
                    className="block w-full text-left py-2 text-red-600 font-medium"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
