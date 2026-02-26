import { useState, useEffect } from 'react'
import { getProducts, getCategories, getOrders } from '../../api/services'
import { Link } from 'react-router-dom'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ products: 0, categories: 0, orders: 0 })

  useEffect(() => {
    Promise.all([
      getProducts().then((r) => r.data.count ?? (r.data.results || r.data)?.length ?? 0),
      getCategories().then((r) => r.data.length ?? (r.data.results || r.data)?.length ?? 0),
      getOrders().then((r) => r.data.count ?? (r.data.results || r.data)?.length ?? 0),
    ])
      .then(([p, c, o]) => setStats({ products: p, categories: c, orders: o }))
      .catch(() => {})
  }, [])

  const cards = [
    { label: 'Products', value: stats.products, link: 'products', color: 'primary' },
    { label: 'Categories', value: stats.categories, link: 'categories', color: 'pink' },
    { label: 'Orders', value: stats.orders, link: 'orders', color: 'primary' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>
      <div className="grid md:grid-cols-3 gap-6">
        {cards.map(({ label, value, link, color }) => (
          <Link
            key={label}
            to={link}
            className={`bg-white rounded-2xl shadow-soft p-6 hover:shadow-soft-lg transition-soft border-l-4 ${
              color === 'primary' ? 'border-primary-500' : 'border-pink-500'
            }`}
          >
            <p className="text-gray-500 text-sm font-medium">{label}</p>
            <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
          </Link>
        ))}
      </div>
      <p className="mt-8 text-gray-500 text-sm">
        Manage your store from the sidebar. Use Django Admin for full CRUD: <a href="/admin" target="_blank" rel="noopener noreferrer" className="text-primary-600">/admin</a>
      </p>
    </div>
  )
}
