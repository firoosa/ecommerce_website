import { Link } from 'react-router-dom'
import { FiHeart } from 'react-icons/fi'

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Link to="/" className="text-xl font-bold bg-gradient-to-r from-primary-500 to-pink-500 bg-clip-text text-transparent">
              Baby Store
            </Link>
            <p className="mt-2 text-gray-500 text-sm">
              Your one-stop shop for newborn baby essentials. Quality products for your little one.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 mb-3">Shop</h4>
            <ul className="space-y-2 text-gray-500">
              <li><Link to="/products" className="hover:text-primary-500 transition-soft">All Products</Link></li>
              <li><Link to="/products?is_featured=true" className="hover:text-primary-500 transition-soft">Featured</Link></li>
              <li><Link to="/cart" className="hover:text-primary-500 transition-soft">Cart</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 mb-3">Support</h4>
            <ul className="space-y-2 text-gray-500">
              <li><Link to="/profile" className="hover:text-primary-500 transition-soft">My Account</Link></li>
              <li><Link to="/checkout" className="hover:text-primary-500 transition-soft">Checkout</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 mb-3">Contact</h4>
            <p className="text-gray-500 text-sm">support@babystore.com</p>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">© {new Date().getFullYear()} Baby Store. All rights reserved.</p>
          <p className="text-gray-400 text-sm flex items-center gap-1">
            Made with <FiHeart className="text-pink-500" /> for babies
          </p>
        </div>
      </div>
    </footer>
  )
}
