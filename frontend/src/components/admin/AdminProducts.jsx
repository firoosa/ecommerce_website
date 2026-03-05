import { useState, useEffect } from 'react'
import {
  getProducts,
  getProduct,
  getCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
  deleteProductImage,
  createProductVariant,
  updateProductVariant,
  deleteProductVariant,
} from '../../api/services'
import toast from 'react-hot-toast'

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingSlug, setEditingSlug] = useState(null)
  const [productImages, setProductImages] = useState([])
  const [uploadingImage, setUploadingImage] = useState(false)
  const [createImages, setCreateImages] = useState([])
  const [isBulkMode, setIsBulkMode] = useState(false)
  const [bulkColors, setBulkColors] = useState('')
  const [bulkSizes, setBulkSizes] = useState('')
  const [creatingBulk, setCreatingBulk] = useState(false)
  const [variants, setVariants] = useState([])
  const [initialVariantIds, setInitialVariantIds] = useState([])
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    discount_price: '',
    stock: '',
    brand: '',
    age_group: '',
    size: '',
    color: '',
    material: '',
    is_featured: false,
    category: '',
    is_active: true,
  })

  const loadData = () => {
    setLoading(true)
    getProducts({ page_size: 100 })
      .then((r) => setProducts(r.data?.results || r.data || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
    getCategories()
      .then((r) => {
        const cats = r.data?.results || r.data || []
        setCategories(Array.isArray(cats) ? cats : [])
      })
      .catch(() => setCategories([]))
  }

  useEffect(() => {
    loadData()
  }, [])

  const resetForm = () => {
    setEditingSlug(null)
    setProductImages([])
    setCreateImages([])
    setBulkColors('')
    setBulkSizes('')
    setIsBulkMode(false)
    setVariants([])
    setInitialVariantIds([])
    setFormData({
      name: '',
      description: '',
      price: '',
      discount_price: '',
      stock: '',
      brand: '',
      age_group: '',
      size: '',
      color: '',
      material: '',
      is_featured: false,
      category: '',
      is_active: true,
    })
  }

  const handleEdit = async (p) => {
    setEditingSlug(p.slug)
    setFormData({
      name: p.name || '',
      description: p.description || '',
      price: p.price || '',
      discount_price: p.discount_price || '',
      stock: p.stock || '',
      brand: p.brand || '',
      age_group: p.age_group || '',
      size: p.size || '',
      color: p.color || '',
      material: p.material || '',
      is_featured: p.is_featured || false,
      category: p.category || '',
      is_active: p.is_active ?? true,
    })
    // Fetch full product details with images & variants
    try {
      const res = await getProduct(p.slug)
      setProductImages(res.data?.images || [])
      const v = res.data?.variants || []
      setVariants(
        v.map((item) => ({
          id: item.id,
          size: item.size || '',
          color: item.color || '',
          stock: item.stock ?? 0,
        })),
      )
      setInitialVariantIds(v.map((item) => item.id))
    } catch (err) {
      setProductImages([])
      setVariants([])
      setInitialVariantIds([])
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        price: formData.price,
        discount_price: formData.discount_price || null,
        stock: formData.stock || 0,
        brand: formData.brand || '',
        age_group: formData.age_group || '',
        size: formData.size || '',
        color: formData.color || '',
        material: formData.material || '',
        is_featured: formData.is_featured,
        category: formData.category || null,
        is_active: formData.is_active,
      }
      let newSlug = editingSlug
      if (editingSlug) {
        await updateProduct(editingSlug, payload)
        toast.success('Product updated')
      } else {
        // If images selected, create product + images in the same multipart request
        let dataToSend = payload
        if (createImages.length > 0) {
          const fd = new FormData()
          fd.append('name', payload.name)
          if (payload.description) fd.append('description', payload.description)
          fd.append('price', String(payload.price ?? ''))
          if (payload.discount_price !== null && payload.discount_price !== '') {
            fd.append('discount_price', String(payload.discount_price))
          }
          fd.append('stock', String(payload.stock ?? 0))
          if (payload.brand) fd.append('brand', payload.brand)
          if (payload.age_group) fd.append('age_group', payload.age_group)
          if (payload.size) fd.append('size', payload.size)
          if (payload.color) fd.append('color', payload.color)
          if (payload.material) fd.append('material', payload.material)
          fd.append('is_featured', String(Boolean(payload.is_featured)))
          fd.append('is_active', String(Boolean(payload.is_active)))
          fd.append('category', String(payload.category))
          createImages.forEach((file) => fd.append('images', file))
          dataToSend = fd
        }

        const res = await createProduct(dataToSend)
        toast.success('Product created')
        newSlug = res.data?.slug
        if (newSlug) {
          setEditingSlug(newSlug)
          setCreateImages([])
          // Fetch product details to get images (will be empty for new product)
          try {
            const productRes = await getProduct(newSlug)
            setProductImages(productRes.data?.images || [])
          } catch (err) {
            setProductImages([])
          }
        }
      }
      // Reload images (and variants) if editing existing product
      if (editingSlug && newSlug) {
        try {
          const res = await getProduct(newSlug)
          setProductImages(res.data?.images || [])
          const v = res.data?.variants || []
          setVariants(
            v.map((item) => ({
              id: item.id,
              size: item.size || '',
              color: item.color || '',
              stock: item.stock ?? 0,
            })),
          )
          setInitialVariantIds(v.map((item) => item.id))
        } catch (err) {
          // Ignore error
        }
      }
      loadData()
    } catch (err) {
      const data = err.response?.data || {}
      const msg =
        data.name?.[0] ||
        data.price?.[0] ||
        data.category?.[0] ||
        data.detail ||
        'Failed to save product'
      toast.error(msg)
    }
  }

  const handleDelete = async (p) => {
    if (!window.confirm(`Delete product "${p.name}"?`)) return
    try {
      await deleteProduct(p.slug)
      toast.success('Product deleted')
      if (editingSlug === p.slug) resetForm()
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete product')
    }
  }

  const handleImageUpload = async (e) => {
    if (!editingSlug) {
      toast.error('Please save the product first before uploading images')
      return
    }
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    setUploadingImage(true)
    try {
      await uploadProductImage(editingSlug, file)
      toast.success('Image uploaded')
      // Reload product to get updated images
      const res = await getProduct(editingSlug)
      setProductImages(res.data?.images || [])
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to upload image')
    } finally {
      setUploadingImage(false)
      e.target.value = '' // Reset file input
    }
  }

  const handleImageDelete = async (imageId) => {
    if (!editingSlug) return
    if (!window.confirm('Delete this image?')) return

    try {
      await deleteProductImage(editingSlug, imageId)
      toast.success('Image deleted')
      // Reload product to get updated images
      const res = await getProduct(editingSlug)
      setProductImages(res.data?.images || [])
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete image')
    }
  }

  // Parse comma or newline-separated values
  const parseVariants = (text) => {
    if (!text || !text.trim()) return []
    return text
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
  }

  const handleBulkSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.price || !formData.category) {
      toast.error('Please fill in required fields: Name, Price, Category')
      return
    }

    const colors = parseVariants(bulkColors)
    const sizes = parseVariants(bulkSizes)

    // If no colors or sizes specified, create single product
    if (colors.length === 0 && sizes.length === 0) {
      toast.error('Please enter at least one color or size for bulk creation')
      return
    }

    // Generate all combinations
    const variants = []
    if (colors.length > 0 && sizes.length > 0) {
      // All combinations of colors x sizes
      colors.forEach((color) => {
        sizes.forEach((size) => {
          variants.push({ color, size })
        })
      })
    } else if (colors.length > 0) {
      // Only colors
      colors.forEach((color) => {
        variants.push({ color, size: '' })
      })
    } else if (sizes.length > 0) {
      // Only sizes
      sizes.forEach((size) => {
        variants.push({ color: '', size })
      })
    }

    if (variants.length === 0) {
      toast.error('No variants to create')
      return
    }

    setCreatingBulk(true)
    let successCount = 0
    let failCount = 0

    try {
      // Create each variant
      for (const variant of variants) {
        try {
          const productName = `${formData.name}${variant.color ? ` - ${variant.color}` : ''}${variant.size ? ` - ${variant.size}` : ''}`
          
          const payload = {
            name: productName,
            description: formData.description || '',
            price: formData.price,
            discount_price: formData.discount_price || null,
            stock: formData.stock || 0,
            brand: formData.brand || '',
            age_group: formData.age_group || '',
            size: variant.size || '',
            color: variant.color || '',
            material: formData.material || '',
            is_featured: formData.is_featured,
            category: formData.category,
            is_active: formData.is_active,
          }

          let dataToSend = payload
          // If images selected, create product + images in the same multipart request
          if (createImages.length > 0) {
            const fd = new FormData()
            fd.append('name', payload.name)
            if (payload.description) fd.append('description', payload.description)
            fd.append('price', String(payload.price ?? ''))
            if (payload.discount_price !== null && payload.discount_price !== '') {
              fd.append('discount_price', String(payload.discount_price))
            }
            fd.append('stock', String(payload.stock ?? 0))
            if (payload.brand) fd.append('brand', payload.brand)
            if (payload.age_group) fd.append('age_group', payload.age_group)
            if (payload.size) fd.append('size', payload.size)
            if (payload.color) fd.append('color', payload.color)
            if (payload.material) fd.append('material', payload.material)
            fd.append('is_featured', String(Boolean(payload.is_featured)))
            fd.append('is_active', String(Boolean(payload.is_active)))
            fd.append('category', String(payload.category))
            createImages.forEach((file) => fd.append('images', file))
            dataToSend = fd
          }

          await createProduct(dataToSend)
          successCount++
        } catch (err) {
          failCount++
          console.error(`Failed to create variant ${variant.color || variant.size}:`, err)
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully created ${successCount} product(s)${failCount > 0 ? `, ${failCount} failed` : ''}`)
        resetForm()
        loadData()
      } else {
        toast.error(`Failed to create products. Please check the console for details.`)
      }
    } catch (err) {
      toast.error('Bulk creation failed')
    } finally {
      setCreatingBulk(false)
    }
  }

  const handleVariantChange = (index, field, value) => {
    setVariants((prev) =>
      prev.map((v, i) =>
        i === index ? { ...v, [field]: field === 'stock' ? Number(value || 0) : value } : v,
      ),
    )
  }

  const handleAddVariantRow = () => {
    setVariants((prev) => [...prev, { id: null, size: '', color: '', stock: 0 }])
  }

  const handleRemoveVariantRow = (index) => {
    setVariants((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSaveVariants = async () => {
    if (!editingSlug) {
      toast.error('Save the product before managing variants')
      return
    }
    try {
      // Delete variants that were removed
      const currentIds = variants.filter((v) => v.id).map((v) => v.id)
      const toDelete = initialVariantIds.filter((id) => !currentIds.includes(id))
      for (const id of toDelete) {
        await deleteProductVariant(editingSlug, id)
      }

      // Create or update current variants
      for (const variant of variants) {
        const payload = {
          size: (variant.size || '').trim(),
          color: (variant.color || '').trim(),
          stock: Number(variant.stock || 0),
        }
        // Skip completely empty rows
        if (!payload.size && !payload.color) continue

        if (variant.id) {
          await updateProductVariant(editingSlug, variant.id, payload)
        } else {
          const res = await createProductVariant(editingSlug, payload)
          variant.id = res.data?.id
        }
      }

      toast.success('Variants saved')

      // Refresh from backend to ensure consistency
      const res = await getProduct(editingSlug)
      const v = res.data?.variants || []
      setVariants(
        v.map((item) => ({
          id: item.id,
          size: item.size || '',
          color: item.color || '',
          stock: item.stock ?? 0,
        })),
      )
      setInitialVariantIds(v.map((item) => item.id))
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to save variants'
      toast.error(msg)
    }
  }

  if (loading) return <div className="animate-pulse h-64 bg-gray-200 rounded-xl" />

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Products</h1>

      {/* List */}
      <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Product</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Category</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Price</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Stock</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.primary_image && (
                        <img
                          src={p.primary_image}
                          alt=""
                          className="w-12 h-12 rounded-lg object-cover bg-gray-100"
                          onError={(e) => {
                            e.target.style.display = 'none'
                          }}
                        />
                      )}
                      <span className="font-medium">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {p.category_name ||
                      categories.find((c) => c.id === p.category)?.name ||
                      '-'}
                  </td>
                  <td className="px-4 py-3">
                    ₹{parseFloat(p.price || 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">{p.stock}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => handleEdit(p)}
                      className="px-3 py-1.5 rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100 text-xs font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(p)}
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
        {products.length === 0 && (
          <p className="text-center py-12 text-gray-500">No products yet.</p>
        )}
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl shadow-soft p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-gray-800">
            {editingSlug ? 'Edit Product' : isBulkMode ? 'Bulk Add Products' : 'Add Product'}
          </h2>
          {!editingSlug && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsBulkMode(false)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-soft ${
                  !isBulkMode
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Single
              </button>
              <button
                type="button"
                onClick={() => setIsBulkMode(true)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-soft ${
                  isBulkMode
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Bulk (Colors × Sizes)
              </button>
            </div>
          )}
        </div>
        <form onSubmit={isBulkMode && !editingSlug ? handleBulkSubmit : handleSubmit} className="grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Base Product Name {isBulkMode && !editingSlug && <span className="text-xs text-gray-500">(Color/Size will be appended)</span>}
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder={isBulkMode && !editingSlug ? "e.g., Baby Onesie" : "Product name"}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-200"
            />
          </div>
          
          {/* Bulk Mode: Colors and Sizes */}
          {isBulkMode && !editingSlug && (
            <>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Colors (comma or newline separated)
                </label>
                <textarea
                  rows={3}
                  value={bulkColors}
                  onChange={(e) => setBulkColors(e.target.value)}
                  placeholder="e.g., Red, Blue, Green&#10;or one per line"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-primary-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter colors separated by commas or new lines (e.g., "Red, Blue, Green" or one per line)
                </p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Sizes (comma or newline separated)
                </label>
                <textarea
                  rows={3}
                  value={bulkSizes}
                  onChange={(e) => setBulkSizes(e.target.value)}
                  placeholder="e.g., Small, Medium, Large&#10;or one per line"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-primary-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter sizes separated by commas or new lines (e.g., "S, M, L" or one per line)
                </p>
              </div>
              <div className="md:col-span-2 p-3 bg-primary-50 rounded-xl border border-primary-200">
                <p className="text-sm font-medium text-primary-800 mb-1">Preview:</p>
                <p className="text-xs text-primary-700">
                  {(() => {
                    const colors = parseVariants(bulkColors)
                    const sizes = parseVariants(bulkSizes)
                    if (colors.length === 0 && sizes.length === 0) {
                      return 'Enter colors and/or sizes to see preview'
                    }
                    const total = colors.length > 0 && sizes.length > 0 
                      ? colors.length * sizes.length 
                      : Math.max(colors.length, sizes.length)
                    return `Will create ${total} product(s): ${colors.length > 0 && sizes.length > 0 ? `${colors.length} colors × ${sizes.length} sizes` : colors.length > 0 ? `${colors.length} color variants` : `${sizes.length} size variants`}`
                  })()}
                </p>
              </div>
            </>
          )}
          
          {/* Single Mode: Individual Color and Size */}
          {!isBulkMode && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Size</label>
                <input
                  type="text"
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Color</label>
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-primary-500"
                />
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Price</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
              className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Discount Price</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.discount_price}
              onChange={(e) => setFormData({ ...formData, discount_price: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Stock</label>
            <input
              type="number"
              min="0"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Category</label>
            <select
              value={formData.category || ''}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value ? Number(e.target.value) : '' })
              }
              required
              className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-primary-500"
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Brand</label>
            <input
              type="text"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Age Group</label>
            <select
              value={formData.age_group || ''}
              onChange={(e) => setFormData({ ...formData, age_group: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-primary-500"
            >
              <option value="">Any</option>
              <option value="0-3m">0-3 months</option>
              <option value="3-6m">3-6 months</option>
              <option value="6-12m">6-12 months</option>
              <option value="1-2y">1-2 years</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Material</label>
            <input
              type="text"
              value={formData.material}
              onChange={(e) => setFormData({ ...formData, material: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-primary-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-600 mb-1">Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-primary-500"
            />
          </div>

          {!editingSlug && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Product Images {isBulkMode && <span className="text-xs text-gray-500">(will be applied to all variants)</span>}
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setCreateImages(Array.from(e.target.files || []))}
                className="block w-full text-sm text-gray-600
                  file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0
                  file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700
                  hover:file:bg-primary-100"
              />
              <p className="text-xs text-gray-500 mt-2">
                Selected: {createImages.length || 0} image(s). {isBulkMode ? 'These will be uploaded for each variant when you click "Create Bulk Products".' : 'These will be uploaded when you click "Create Product".'}
              </p>
            </div>
          )}
          <div className="flex items-center gap-4 md:col-span-2">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={formData.is_featured}
                onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                className="rounded border-gray-300 text-primary-500 focus:ring-primary-500"
              />
              Featured
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded border-gray-300 text-primary-500 focus:ring-primary-500"
              />
              Active
            </label>
          </div>
          <div className="flex gap-2 md:col-span-2 mt-2">
            <button
              type="submit"
              disabled={creatingBulk}
              className="px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {creatingBulk
                ? 'Creating Products...'
                : editingSlug
                ? 'Save Changes'
                : isBulkMode
                ? 'Create Bulk Products'
                : 'Create Product'}
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

        {/* Image & Variant Management Section - Only show when editing */}
        {editingSlug && (
          <div className="mt-6 pt-6 border-t border-gray-200 space-y-8">
            <div>
              <h3 className="font-semibold text-gray-800 mb-4">Product Images</h3>
              {/* Existing Images */}
              {productImages.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
                  {productImages.map((img) => (
                    <div key={img.id} className="relative group">
                      <img
                        src={img.image}
                        alt="Product"
                        className="w-full h-32 object-cover rounded-lg bg-gray-100"
                      />
                      <button
                        onClick={() => handleImageDelete(img.id)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete image"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload New Image */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Upload New Image
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex-1 cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                    <div className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-xl text-center text-sm text-gray-600 hover:border-primary-400 hover:text-primary-600 transition-colors">
                      {uploadingImage ? 'Uploading...' : 'Choose Image File'}
                    </div>
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Supported formats: JPG, PNG, GIF. Upload images after creating the product.
                </p>
              </div>
            </div>

            {/* Variants Management */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-gray-800">Variants (size × color stock)</h3>
                <button
                  type="button"
                  onClick={handleAddVariantRow}
                  className="px-3 py-1.5 rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100 text-xs font-medium"
                >
                  + Add Variant
                </button>
              </div>
              {variants.length === 0 ? (
                <p className="text-sm text-gray-500 mb-2">
                  No variants yet. Add rows for each size/color with its own stock (e.g. S/blue = 10).
                </p>
              ) : (
                <div className="space-y-2 mb-3">
                  {variants.map((variant, index) => (
                    <div key={variant.id ?? index} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-3">
                        <input
                          type="text"
                          placeholder="Size"
                          value={variant.size}
                          onChange={(e) => handleVariantChange(index, 'size', e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-sm"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="text"
                          placeholder="Color"
                          value={variant.color}
                          onChange={(e) => handleVariantChange(index, 'color', e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-sm"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          min="0"
                          placeholder="Stock"
                          value={variant.stock}
                          onChange={(e) => handleVariantChange(index, 'stock', e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-sm"
                        />
                      </div>
                      <div className="col-span-3 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveVariantRow(index)}
                          className="px-2 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-xs font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={handleSaveVariants}
                className="px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 text-sm font-semibold"
              >
                Save Variants
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
