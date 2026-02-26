import { Link } from 'react-router-dom'
import { FiPackage } from 'react-icons/fi'

export default function EmptyState({ title = 'No items found', message, actionLabel = 'Browse Products', actionLink = '/products' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <FiPackage className="text-4xl text-gray-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-800 mb-2">{title}</h3>
      {message && <p className="text-gray-500 text-center mb-6 max-w-md">{message}</p>}
      <Link
        to={actionLink}
        className="px-6 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-soft font-medium"
      >
        {actionLabel}
      </Link>
    </div>
  )
}
