import { Routes, Route, NavLink } from 'react-router-dom'
import { FiPackage, FiGrid, FiShoppingBag, FiSettings } from 'react-icons/fi'
import AdminDashboard from '../components/admin/AdminDashboard'
import AdminProducts from '../components/admin/AdminProducts'
import AdminCategories from '../components/admin/AdminCategories'
import AdminOrders from '../components/admin/AdminOrders'

const navItems = [
  { to: '', icon: FiGrid, label: 'Dashboard' },
  { to: 'products', icon: FiPackage, label: 'Products' },
  { to: 'categories', icon: FiShoppingBag, label: 'Categories' },
  { to: 'orders', icon: FiSettings, label: 'Orders' },
]

export default function Admin() {
  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-80px)]">
      <aside className="md:w-64 w-full bg-white border-b md:border-b-0 md:border-r border-gray-100 shadow-sm flex-shrink-0">
        <div className="p-3 sm:p-4">
          <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-4 sm:mb-6">Admin Panel</h2>
          <nav className="flex md:flex-col gap-2 md:gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to || '.'}
                end={!to}
                className={({ isActive }) =>
                  `flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-xl whitespace-nowrap transition-soft ${
                    isActive
                      ? 'bg-primary-500 text-white'
                      : 'text-gray-600 hover:bg-primary-50 hover:text-primary-600'
                  }`
                }
              >
                <Icon size={20} />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>
      <main className="flex-1 p-6 bg-gray-50 overflow-auto">
        <Routes>
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="orders" element={<AdminOrders />} />
        </Routes>
      </main>
    </div>
  )
}
