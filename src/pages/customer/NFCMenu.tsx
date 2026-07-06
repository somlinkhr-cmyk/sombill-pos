import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { formatCurrency } from '../../lib/utils'
import { Card, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Form } from '../../components/ui/Form'
import toast from 'react-hot-toast'
import {
  Search,
  Menu as MenuIcon,
  X,
  Plus,
  Minus,
  ShoppingCart,
  UtensilsCrossed,
  Coffee,
  Star,
  Clock,
  Phone,
  MapPin,
  Info,
  ChevronLeft,
  ChevronRight,
  Grid,
  List,
  Heart,
  Share2,
} from 'lucide-react'

interface Product {
  id: string
  name: string
  name_so?: string
  description?: string
  short_description?: string
  selling_price: number
  image_url?: string
  is_available: boolean
  is_featured: boolean
  is_best_seller: boolean
  preparation_time: number
  category_id: string
  categories?: {
    name: string
  }
}

interface Category {
  id: string
  name: string
  description?: string
  image_url?: string
  display_order: number
}

interface CartItem {
  product: Product
  quantity: number
  notes?: string
}

interface Table {
  id: string
  number: number
  capacity: number
  status: string
}

export default function NFCMenu() {
  const { tableId } = useParams<{ tableId: string }>()
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [table, setTable] = useState<Table | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCartModal, setShowCartModal] = useState(false)
  const [showProductModal, setShowProductModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [language, setLanguage] = useState<'en' | 'so'>('en')
  const [restaurantInfo, setRestaurantInfo] = useState<any>(null)

  useEffect(() => {
    loadData()
  }, [tableId])

  async function loadData() {
    setLoading(true)
    try {
      // Load table info
      if (tableId) {
        const { data: tableData } = await supabase
          .from('tables')
          .select('*')
          .eq('id', tableId)
          .single()
        
        if (tableData) {
          setTable(tableData)
        }
      }

      // Load categories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order')
      
      if (categoriesData) {
        setCategories(categoriesData)
      }

      // Load products
      const { data: productsData } = await supabase
        .from('products')
        .select('*, categories(*)')
        .eq('is_available', true)
        .eq('status', 'active')
        .order('display_order')
      
      if (productsData) {
        setProducts(productsData)
      }

      // Load restaurant info (from tenant)
      if (table) {
        const { data: tenantData } = await supabase
          .from('tenants')
          .select('*')
          .eq('id', (table as any).tenant_id)
          .single()
        
        if (tenantData) {
          setRestaurantInfo(tenantData)
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load menu')
    } finally {
      setLoading(false)
    }
  }

  function handleAddToCart(product: Product) {
    const existingItem = cart.find(item => item.product.id === product.id)
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setCart([...cart, { product, quantity: 1 }])
    }
    
    toast.success(`${getProductName(product)} added to cart`)
  }

  function handleRemoveFromCart(productId: string) {
    setCart(cart.filter(item => item.product.id !== productId))
  }

  function handleUpdateQuantity(productId: string, delta: number) {
    setCart(cart.map(item => {
      if (item.product.id === productId) {
        const newQuantity = Math.max(1, item.quantity + delta)
        return { ...item, quantity: newQuantity }
      }
      return item
    }))
  }

  function getProductName(product: Product): string {
    return language === 'so' && product.name_so ? product.name_so : product.name
  }

  function getProductDescription(product: Product): string {
    return language === 'so' && (product as any).description_so ? (product as any).description_so : (product.description || product.short_description || '')
  }

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category_id === selectedCategory
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (product.name_so && product.name_so.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  const cartTotal = cart.reduce((sum, item) => sum + (item.product.selling_price * item.quantity), 0)
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading menu...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UtensilsCrossed className="w-8 h-8 text-orange-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {restaurantInfo?.name || 'Restaurant Menu'}
                </h1>
                {table && (
                  <p className="text-sm text-gray-500">Table {table.number}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setLanguage(language === 'en' ? 'so' : 'en')}
                className="px-3 py-1 bg-orange-100 text-orange-700 rounded-lg font-medium text-sm"
              >
                {language === 'en' ? 'SO' : 'EN'}
              </button>
              <button
                onClick={() => setShowCartModal(true)}
                className="relative p-2 bg-orange-600 text-white rounded-full"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={language === 'en' ? 'Search menu...' : 'Raadi cuntada...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="mb-6 overflow-x-auto pb-2">
          <div className="flex gap-3">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                selectedCategory === 'all' 
                  ? 'bg-orange-600 text-white shadow-lg' 
                  : 'bg-white text-gray-700 hover:bg-orange-100'
              }`}
            >
              {language === 'en' ? 'All' : 'Dhammaan'}
            </button>
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                  selectedCategory === category.id 
                    ? 'bg-orange-600 text-white shadow-lg' 
                    : 'bg-white text-gray-700 hover:bg-orange-100'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* View Toggle */}
        <div className="mb-4 flex justify-end">
          <div className="flex bg-white rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'grid' ? 'bg-orange-100 text-orange-600' : 'text-gray-400'
              }`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'list' ? 'bg-orange-100 text-orange-600' : 'text-gray-400'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Products */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              <Card
                key={product.id}
                className="overflow-hidden hover:shadow-xl transition-all cursor-pointer group"
                onClick={() => {
                  setSelectedProduct(product)
                  setShowProductModal(true)
                }}
              >
                <div className="relative">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={getProductName(product)}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
                      <UtensilsCrossed className="w-16 h-16 text-orange-300" />
                    </div>
                  )}
                  {product.is_featured && (
                    <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                      <Star className="w-3 h-3 inline mr-1" />
                      Featured
                    </div>
                  )}
                  {product.is_best_seller && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                      Best Seller
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1">{getProductName(product)}</h3>
                  {product.categories && (
                    <p className="text-sm text-gray-500 mb-2">{product.categories.name}</p>
                  )}
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {getProductDescription(product)}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-bold text-orange-600">
                      {formatCurrency(product.selling_price)}
                    </p>
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleAddToCart(product)
                      }}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProducts.map(product => (
              <Card
                key={product.id}
                className="overflow-hidden hover:shadow-lg transition-all cursor-pointer"
                onClick={() => {
                  setSelectedProduct(product)
                  setShowProductModal(true)
                }}
              >
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={getProductName(product)}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-amber-100 rounded-lg flex items-center justify-center">
                        <UtensilsCrossed className="w-8 h-8 text-orange-300" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">{getProductName(product)}</h3>
                          {product.categories && (
                            <p className="text-sm text-gray-500">{product.categories.name}</p>
                          )}
                        </div>
                        <p className="text-lg font-bold text-orange-600">
                          {formatCurrency(product.selling_price)}
                        </p>
                      </div>
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                        {getProductDescription(product)}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        {product.preparation_time > 0 && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {product.preparation_time} min
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleAddToCart(product)
                      }}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <MenuIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {language === 'en' ? 'No items found' : 'Wax lama helin'}
            </p>
          </div>
        )}
      </div>

      {/* Cart Modal */}
      <Modal
        isOpen={showCartModal}
        onClose={() => setShowCartModal(false)}
        title={language === 'en' ? 'Your Order' : 'Aadankaaga'}
        size="lg"
      >
        <div className="max-h-96 overflow-y-auto mb-4">
          {cart.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>{language === 'en' ? 'Your cart is empty' : 'Aadankaaga waa madhan'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item, index) => (
                <div
                  key={item.product.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  {item.product.image_url && (
                    <img
                      src={item.product.image_url}
                      alt={getProductName(item.product)}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{getProductName(item.product)}</p>
                    <p className="text-sm text-gray-400">{formatCurrency(item.product.selling_price)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUpdateQuantity(item.product.id, -1)}
                      className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => handleUpdateQuantity(item.product.id, 1)}
                      className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="font-semibold text-gray-900 w-20 text-right">
                    {formatCurrency(item.product.selling_price * item.quantity)}
                  </p>
                  <button
                    onClick={() => handleRemoveFromCart(item.product.id)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {cart.length > 0 && (
          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-4">
              <span className="font-semibold text-gray-900">
                {language === 'en' ? 'Total:' : 'Guud:'}
              </span>
              <span className="text-xl font-bold text-orange-600">{formatCurrency(cartTotal)}</span>
            </div>
            <Button
              onClick={() => {
                // Submit order logic here
                toast.success(language === 'en' ? 'Order submitted!' : 'Aadanka waa la diray!')
                setCart([])
                setShowCartModal(false)
              }}
              className="w-full bg-orange-600 hover:bg-orange-700"
              size="lg"
            >
              {language === 'en' ? 'Submit Order' : 'Gudbi Aadanka'}
            </Button>
          </div>
        )}
      </Modal>

      {/* Product Detail Modal */}
      {showProductModal && selectedProduct && (
        <Modal
          isOpen={showProductModal}
          onClose={() => setShowProductModal(false)}
          title={getProductName(selectedProduct)}
          size="lg"
        >
          <div className="space-y-4">
            {selectedProduct.image_url && (
              <img
                src={selectedProduct.image_url}
                alt={getProductName(selectedProduct)}
                className="w-full h-64 object-cover rounded-lg"
              />
            )}
            
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {getProductName(selectedProduct)}
              </h3>
              {selectedProduct.categories && (
                <p className="text-sm text-orange-600 font-medium">
                  {selectedProduct.categories.name}
                </p>
              )}
            </div>

            <p className="text-gray-600">{getProductDescription(selectedProduct)}</p>

            <div className="flex items-center gap-4 text-sm text-gray-500">
              {selectedProduct.preparation_time > 0 && (
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {selectedProduct.preparation_time} {language === 'en' ? 'minutes' : 'daqiiqo'}
                </span>
              )}
              {selectedProduct.is_featured && (
                <span className="flex items-center gap-1 text-yellow-600">
                  <Star className="w-4 h-4" />
                  {language === 'en' ? 'Featured' : 'Muujiyaha'}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-3xl font-bold text-orange-600">
                {formatCurrency(selectedProduct.selling_price)}
              </p>
              <Button
                onClick={() => {
                  handleAddToCart(selectedProduct)
                  setShowProductModal(false)
                }}
                className="bg-orange-600 hover:bg-orange-700"
                size="lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                {language === 'en' ? 'Add to Cart' : 'Ku Dar Aadanka'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Restaurant Info Footer */}
      {restaurantInfo && (
        <footer className="bg-white border-t mt-12">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">{restaurantInfo.name}</h3>
                {restaurantInfo.address && (
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {restaurantInfo.address}
                  </p>
                )}
                {restaurantInfo.phone && (
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                    <Phone className="w-4 h-4" />
                    {restaurantInfo.phone}
                  </p>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  {language === 'en' ? 'Hours' : 'Saacadaha'}
                </h3>
                <p className="text-sm text-gray-500">
                  {restaurantInfo.opening_hours || language === 'en' ? 'Open daily' : 'Maalin kasta'}
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  {language === 'en' ? 'Share' : 'La Wadaag'}
                </h3>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Share2 className="w-4 h-4 mr-2" />
                    {language === 'en' ? 'Share Menu' : 'La Wadaag Cuntada'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  )
}
