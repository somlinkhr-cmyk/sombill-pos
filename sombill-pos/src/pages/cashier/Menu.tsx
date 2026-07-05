import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Search, Barcode, Star, Filter, Grid, List, ArrowLeft } from 'lucide-react'
import { formatCurrency } from '../../lib/utils'

interface Product {
  id: string
  category_id: string
  name: string
  description: string
  barcode?: string
  sku?: string
  cost_price: number
  selling_price: number
  tax_rate: number
  preparation_time: number
  image_url?: string
  is_available: boolean
  is_best_seller: boolean
  is_featured: boolean
  created_at: string
}

interface Category {
  id: string
  name: string
  description: string
  image_url?: string
  display_order: number
  is_active: boolean
}

export default function Menu() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFavorites, setShowFavorites] = useState(false)
  const [showBestSellers, setShowBestSellers] = useState(false)

  useEffect(() => {
    loadMenuData()
  }, [])

  useEffect(() => {
    filterProducts()
  }, [products, searchQuery, selectedCategory, showFavorites, showBestSellers])

  async function loadMenuData() {
    try {
      setLoading(true)
      const [productsRes, categoriesRes] = await Promise.all([
        supabase.from('products').select('*').order('name'),
        supabase.from('categories').select('*').eq('is_active', true).order('display_order')
      ])

      if (productsRes.error) throw productsRes.error
      if (categoriesRes.error) throw categoriesRes.error

      setProducts(productsRes.data || [])
      setCategories(categoriesRes.data || [])
    } catch (error) {
      console.error('Error loading menu data:', error)
    } finally {
      setLoading(false)
    }
  }

  function filterProducts() {
    let filtered = [...products]

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category_id === selectedCategory)
    }

    // Favorites filter
    if (showFavorites) {
      filtered = filtered.filter(p => p.is_featured)
    }

    // Best sellers filter
    if (showBestSellers) {
      filtered = filtered.filter(p => p.is_best_seller)
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.barcode?.toLowerCase().includes(query) ||
        p.sku?.toLowerCase().includes(query)
      )
    }

    setFilteredProducts(filtered)
  }

  function getCategoryName(categoryId: string) {
    const category = categories.find(c => c.id === categoryId)
    return category?.name || 'Uncategorized'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1976D2]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/cashier')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Menu</h1>
              <p className="text-gray-600">Browse products and categories</p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search products, barcode, or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1976D2]"
                />
              </div>
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1976D2]"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>

            {/* Toggle Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowFavorites(!showFavorites)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  showFavorites ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-700'
                }`}
              >
                <Star className={`w-4 h-4 ${showFavorites ? 'fill-current' : ''}`} />
                Favorites
              </button>
              <button
                onClick={() => setShowBestSellers(!showBestSellers)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  showBestSellers ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-700'
                }`}
              >
                <Star className={`w-4 h-4 ${showBestSellers ? 'fill-current' : ''}`} />
                Best Sellers
              </button>
            </div>

            {/* View Mode */}
            <div className="flex gap-1 border rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-[#1976D2] text-white' : 'text-gray-600'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-[#1976D2] text-white' : 'text-gray-600'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Products Display */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredProducts.map(product => (
              <div
                key={product.id}
                className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow"
              >
                {/* Product Image */}
                <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0D47A1] to-[#1976D2]">
                      <span className="text-4xl text-white font-bold">{product.name.charAt(0)}</span>
                    </div>
                  )}
                </div>

                {/* Badges */}
                <div className="flex gap-1 mb-2">
                  {!product.is_available && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full">Out of Stock</span>
                  )}
                  {product.is_best_seller && (
                    <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" />
                      Best Seller
                    </span>
                  )}
                  {product.is_featured && (
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full">Featured</span>
                  )}
                </div>

                {/* Product Info */}
                <h3 className="font-semibold text-gray-900 truncate mb-1">{product.name}</h3>
                <p className="text-sm text-gray-500 mb-2">{getCategoryName(product.category_id)}</p>
                {product.description && (
                  <p className="text-xs text-gray-600 mb-2 line-clamp-2">{product.description}</p>
                )}

                {/* Price */}
                <div className="flex items-center justify-between">
                  <p className="text-lg font-bold text-[#0D47A1]">{formatCurrency(product.selling_price)}</p>
                  {product.preparation_time > 0 && (
                    <p className="text-xs text-gray-500">{product.preparation_time} min</p>
                  )}
                </div>

                {/* Barcode/SKU */}
                {(product.barcode || product.sku) && (
                  <div className="mt-2 pt-2 border-t text-xs text-gray-500">
                    {product.barcode && <p>Barcode: {product.barcode}</p>}
                    {product.sku && <p>SKU: {product.sku}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Product</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Category</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Price</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Barcode/SKU</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProducts.map(product => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0D47A1] to-[#1976D2]">
                              <span className="text-white font-bold">{product.name.charAt(0)}</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{product.name}</p>
                          <div className="flex gap-1 mt-1">
                            {product.is_best_seller && <Star className="w-3 h-3 text-yellow-500 fill-current" />}
                            {product.is_featured && <span className="text-xs text-purple-600">Featured</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{getCategoryName(product.category_id)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-[#0D47A1]">{formatCurrency(product.selling_price)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        product.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {product.is_available ? 'Available' : 'Out of Stock'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <div>
                        {product.barcode && <p>{product.barcode}</p>}
                        {product.sku && <p>{product.sku}</p>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No products found</p>
          </div>
        )}
      </div>
    </div>
  )
}
