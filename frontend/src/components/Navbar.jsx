import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { FiSearch, FiShoppingCart, FiUser, FiChevronDown, FiMenu, FiHeart } from 'react-icons/fi'
import { logout } from '../store/slices/authSlice'

export default function Navbar() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useSelector((state) => state.auth)
  const { count } = useSelector((state) => state.cart)

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
    <nav className="sticky top-0 z-50 bg-[#fafaf5]/90 backdrop-blur-md border-b border-[#c2c7cf]/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl tracking-tight text-[#1a1c19] font-serif">
              Lumiere Enfance
            </span>
          </Link>

          {/* Search Bar - Center */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for baby products..."
                className="w-full pl-4 pr-12 py-2.5 rounded-full bg-[#f4f4ef] border border-[#c2c7cf]/30 focus:border-[#624000] focus:ring-1 focus:ring-[#624000]/20 outline-none transition-soft text-sm"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-[#42474e] hover:text-[#624000] rounded-lg transition-soft"
              >
                <FiSearch size={20} />
              </button>
            </div>
          </form>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <Link
                to="/wishlist"
                className="relative p-2.5 rounded-xl text-[#42474e] hover:text-[#624000] transition-soft"
                title="Wishlist"
              >
                <FiHeart size={22} />
              </Link>
            )}
            <Link
              to="/cart"
              className="relative p-2.5 rounded-xl text-[#42474e] hover:text-[#624000] transition-soft"
            >
              <FiShoppingCart size={24} />
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#624000] text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
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
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-[#42474e] hover:bg-[#f4f4ef] hover:text-[#624000] transition-soft"
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
                        className="block px-4 py-2 text-[#42474e] hover:bg-[#f4f4ef] hover:text-[#624000]"
                      >
                        Profile
                      </Link>
                      {user?.role === 'Admin' && (
                        <Link
                          to="/admin"
                          onClick={() => setShowUserMenu(false)}
                          className="block px-4 py-2 text-[#42474e] hover:bg-[#f4f4ef] hover:text-[#624000]"
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
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#624000] text-white rounded-xl hover:bg-[#4e3200] transition-soft font-medium"
                >
                  <FiUser size={18} />
                  Login
                </Link>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl hover:bg-gray-100"
            >
              <FiMenu size={24} />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-gray-100 animate-fade-in">
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
              {isAuthenticated && (
                <Link
                  to="/wishlist"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-gray-600"
                >
                  Wishlist
                </Link>
              )}

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
