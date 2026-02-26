import { useState, useEffect } from 'react'
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../api/services'
import toast from 'react-hot-toast'

export default function AdminCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingSlug, setEditingSlug] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    parent: '',
    is_active: true,
  })

  const loadCategories = () => {
    setLoading(true)
    getCategories()
      .then((r) => {
        const cats = r.data?.results || r.data || []
        setCategories(Array.isArray(cats) ? cats : [])
      })
      .catch(() => setCategories([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadCategories()
  }, [])

  const resetForm = () => {
    setEditingSlug(null)
    setFormData({ name: '', parent: '', is_active: true })
  }

  const handleEdit = (cat) => {
    setEditingSlug(cat.slug)
    setFormData({
      name: cat.name,
      parent: cat.parent || '',
      is_active: cat.is_active,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        name: formData.name,
        parent: formData.parent || null,
        is_active: formData.is_active,
      }
      if (editingSlug) {
        await updateCategory(editingSlug, payload)
        toast.success('Category updated')
      } else {
        await createCategory(payload)
        toast.success('Category created')
      }
      resetForm()
      loadCategories()
    } catch (err) {
      const msg =
        err.response?.data?.name?.[0] ||
        err.response?.data?.slug?.[0] ||
        err.response?.data?.detail ||
        'Failed to save category'
      toast.error(msg)
    }
  }

  const handleDelete = async (cat) => {
    if (!window.confirm(`Delete category "${cat.name}"?`)) return
    try {
      await deleteCategory(cat.slug)
      toast.success('Category deleted')
      if (editingSlug === cat.slug) resetForm()
      loadCategories()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete category')
    }
  }

  if (loading) return <div className="animate-pulse h-64 bg-gray-200 rounded-xl" />

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Categories</h1>

      {/* List */}
      <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Slug</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Parent</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categories.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-gray-600">{c.slug}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {c.parent ? categories.find((x) => x.id === c.parent)?.name || c.parent : '-'}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => handleEdit(c)}
                      className="px-3 py-1.5 rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100 text-xs font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(c)}
                      className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-xs font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {categories.length === 0 && (
          <p className="text-center py-8 text-gray-500">No categories yet.</p>
        )}
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl shadow-soft p-6 max-w-xl">
        <h2 className="font-semibold text-gray-800 mb-4">
          {editingSlug ? 'Edit Category' : 'Add Category'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Parent</label>
            <select
              value={formData.parent || ''}
              onChange={(e) =>
                setFormData({ ...formData, parent: e.target.value ? Number(e.target.value) : '' })
              }
              className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-primary-500"
            >
              <option value="">None (top-level)</option>
              {categories
                .filter((c) => !editingSlug || c.slug !== editingSlug)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="cat-active"
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="rounded border-gray-300 text-primary-500 focus:ring-primary-500"
            />
            <label htmlFor="cat-active" className="text-sm text-gray-700">
              Active
            </label>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 text-sm font-semibold"
            >
              {editingSlug ? 'Save Changes' : 'Create Category'}
            </button>
            {editingSlug && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
