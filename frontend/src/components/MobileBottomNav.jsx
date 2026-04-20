import { Link, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { FiHome, FiSearch, FiHeart, FiShoppingCart, FiUser } from 'react-icons/fi'

export default function MobileBottomNav() {
  const { pathname } = useLocation()
  const { count } = useSelector((state) => state.cart)
  const isActive = (path) => pathname === path
  const isProducts = pathname.startsWith('/products')
  const isWishlist = pathname.startsWith('/wishlist')
  const isCart = pathname.startsWith('/cart')
  const isProfile = pathname.startsWith('/profile')

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#fafaf5]/90 backdrop-blur-lg rounded-t-2xl shadow-[0_-6px_20px_rgba(26,28,25,0.06)] px-4 pt-2 pb-5 md:hidden">
      <div className="flex justify-around items-center text-xs">
        <Link to="/" className={`relative flex flex-col items-center ${isActive('/') ? 'text-[#33628b]' : 'text-stone-500'}`}>
          <FiHome size={18} />
          {isActive('/') && <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-[#33628b]" />}
          <span className="mt-1 font-bold tracking-widest uppercase">Home</span>
        </Link>
        <Link to="/products" className={`relative flex flex-col items-center ${isProducts ? 'text-[#33628b]' : 'text-stone-500'}`}>
          <FiSearch size={18} />
          {isProducts && <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-[#33628b]" />}
          <span className="mt-1 font-bold tracking-widest uppercase">Search</span>
        </Link>
        <Link to="/wishlist" className={`relative flex flex-col items-center ${isWishlist ? 'text-[#33628b]' : 'text-stone-500'}`}>
          <FiHeart size={18} />
          {isWishlist && <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-[#33628b]" />}
          <span className="mt-1 font-bold tracking-widest uppercase">Wishlist</span>
        </Link>
        <Link to="/cart" className={`relative flex flex-col items-center ${isCart ? 'text-[#33628b]' : 'text-stone-500'}`}>
          <FiShoppingCart size={18} />
          {count > 0 && (
            <span className="absolute -top-1 right-1 bg-[#33628b] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {count > 9 ? '9+' : count}
            </span>
          )}
          {isCart && <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-[#33628b]" />}
          <span className="mt-1 font-bold tracking-widest uppercase">Cart</span>
        </Link>
        <Link to="/profile" className={`relative flex flex-col items-center ${isProfile ? 'text-[#33628b]' : 'text-stone-500'}`}>
          <FiUser size={18} />
          {isProfile && <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-[#33628b]" />}
          <span className="mt-1 font-bold tracking-widest uppercase">Profile</span>
        </Link>
      </div>
    </nav>
  )
}
