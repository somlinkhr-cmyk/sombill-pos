import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/auth'
import { formatCurrency } from '../../lib/utils'
import toast from 'react-hot-toast'
import { Bell } from 'lucide-react'

interface Product {
  id: string
  name: string
  name_so?: string
  description?: string
  description_so?: string
  short_description?: string
  short_description_so?: string
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
  const [cart, setCart] = useState<CartItem[]>([])
  const [language, setLanguage] = useState<'en' | 'so'>('en')
  const [restaurantInfo, setRestaurantInfo] = useState<any>(null)
  const [showCartModal, setShowCartModal] = useState(false)

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
    return language === 'so' && product.description_so ? product.description_so : (product.description || product.short_description || '')
  }

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category_id === selectedCategory
    return matchesCategory
  })

  const cartTotal = cart.reduce((sum, item) => sum + (item.product.selling_price * item.quantity), 0)
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0221] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#8FB9D6] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Loading menu...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0D0221]">
      {/* Phone Container */}
      <div className="max-w-[390px] mx-auto min-h-screen bg-white relative overflow-hidden">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-[#170438] via-[#10022C] to-[#170438] p-6 pt-12 pb-6 text-white relative">
          {/* Background gradients */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-0 w-40 h-40 bg-[#8FB9D6] opacity-28 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-[#4B1FBE] opacity-40 rounded-full blur-3xl"></div>
          </div>

          <div className="relative z-10">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <svg viewBox="0 0 100 100" fill="none" className="w-6 h-6">
                  <path d="M62 8 L28 34 C20 40 20 50 28 56 L62 82" stroke="#DDE1E6" strokeWidth="16" strokeLinecap="round"/>
                  <path d="M38 18 L72 44 C80 50 80 60 72 66 L38 92" stroke="#8FB9D6" strokeWidth="16" strokeLinecap="round"/>
                </svg>
                <div className="font-['Outfit'] font-bold text-sm">
                  SomBill<span className="text-[#8FB9D6]">POS</span>
                </div>
              </div>
              <div className="flex bg-white/10 rounded-full p-0.5">
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    language === 'en' ? 'bg-[#8FB9D6] text-[#170438]' : 'text-white/60'
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => setLanguage('so')}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    language === 'so' ? 'bg-[#8FB9D6] text-[#170438]' : 'text-white/60'
                  }`}
                >
                  SO
                </button>
              </div>
            </div>

            {/* Title */}
            <h1 className="font-['Outfit'] font-bold text-2xl leading-tight mb-2">
              Welcome to<br/>{restaurantInfo?.name || 'Restaurant'}
            </h1>
            <p className="text-xs text-[#B7D4E8] mb-4">
              Powered by SomBill · Trusted Hospitality Partner
            </p>

            {/* Meta Pills */}
            <div className="flex gap-3">
              {table && (
                <div className="bg-white/8 border border-white/14 rounded-full px-3 py-1.5 text-xs flex items-center gap-1.5 text-[#E1E3E8]">
                  🪑 Table {table.number}
                </div>
              )}
              <div className="bg-white/8 border border-white/14 rounded-full px-3 py-1.5 text-xs flex items-center gap-1.5 text-[#E1E3E8]">
                ⏱ Kitchen: ~15 min
              </div>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 px-5 py-4 overflow-x-auto bg-white border-b border-[#F3F4F6] sticky top-0 z-20">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === 'all' 
                ? 'bg-[#170438] text-[#B7D4E8]' 
                : 'bg-[#F3F4F6] text-[#170438]'
            }`}
          >
            All
          </button>
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === category.id 
                  ? 'bg-[#170438] text-[#B7D4E8]' 
                  : 'bg-[#F3F4F6] text-[#170438]'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Products List */}
        <div className="px-5 py-5 space-y-2">
          {filteredProducts.map(product => (
            <div
              key={product.id}
              className="flex gap-3 py-3 border-b border-[#F3F4F6]"
            >
              {/* Product Image */}
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={getProductName(product)}
                  className="w-[76px] h-[76px] rounded-xl object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-[76px] h-[76px] rounded-xl bg-gradient-to-br from-[#B7D4E8] to-[#F1F7FB] flex-shrink-0"></div>
              )}

              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2 mb-1">
                  <div>
                    <div className="font-bold text-sm text-[#170438]">
                      {getProductName(product)}
                      {product.is_best_seller && (
                        <span className="ml-1 text-[9px] bg-[#FFF3E0] text-[#D8B26B] px-1.5 py-0.5 rounded font-bold">
                          Popular
                        </span>
                      )}
                    </div>
                    {product.name_so && language === 'en' && (
                      <div className="text-[11px] text-[#9497A2]">{product.name_so}</div>
                    )}
                  </div>
                </div>
                <div className="text-[11.5px] text-[#8B8E99] mb-2 line-clamp-2">
                  {getProductDescription(product)}
                </div>
                <div className="flex justify-between items-center">
                  <div className="font-['IBM_Plex_Mono'] font-semibold text-sm text-[#170438]">
                    {formatCurrency(product.selling_price)}
                  </div>
                  <button
                    onClick={() => handleAddToCart(product)}
                    className="w-7 h-7 rounded-lg bg-[#170438] text-[#8FB9D6] flex items-center justify-center text-lg font-bold active:scale-90 transition-transform"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredProducts.length === 0 && (
            <div className="text-center py-12 text-[#9497A2]">
              No items found
            </div>
          )}
        </div>

        {/* Call Waiter Button */}
        <div className="mx-5 mb-2 flex items-center justify-center gap-2 border-2 border-dashed border-[#C6C9D1] rounded-xl p-3 text-xs font-semibold text-[#170438] cursor-pointer hover:border-[#8FB9D6] hover:bg-[#F1F7FB] transition-all">
          <Bell className="w-4 h-4" />
          Tap to call your waiter
        </div>

        {/* Sticky Cart Bar */}
        {cartItemCount > 0 && (
          <div className="sticky bottom-0 mx-4 mb-4 bg-[#170438] rounded-2xl p-3.5 flex items-center justify-between shadow-lg z-30">
            <div className="flex items-center gap-2.5 text-white">
              <div className="bg-[#8FB9D6] text-[#170438] w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs font-['IBM_Plex_Mono']">
                {cartItemCount}
              </div>
              <div className="font-['IBM_Plex_Mono'] font-semibold text-xs">
                {formatCurrency(cartTotal)} total
              </div>
            </div>
            <button
              onClick={() => setShowCartModal(true)}
              className="bg-[#8FB9D6] text-[#170438] px-4.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5"
            >
              View Order →
            </button>
          </div>
        )}

        {/* Cart Modal */}
        {showCartModal && (
          <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-4">
            <div className="bg-white rounded-t-3xl w-full max-w-[390px] max-h-[70vh] overflow-hidden">
              <div className="p-5 border-b border-[#F3F4F6]">
                <div className="flex justify-between items-center">
                  <h2 className="font-['Outfit'] font-bold text-lg text-[#170438]">
                    {language === 'en' ? 'Your Order' : 'Aadankaaga'}
                  </h2>
                  <button
                    onClick={() => setShowCartModal(false)}
                    className="text-[#9497A2] text-2xl"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="p-5 overflow-y-auto max-h-[50vh]">
                {cart.length === 0 ? (
                  <div className="text-center py-8 text-[#9497A2]">
                    Your cart is empty
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map(item => (
                      <div
                        key={item.product.id}
                        className="flex items-center gap-3 p-3 bg-[#F3F4F6] rounded-xl"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm text-[#170438]">{getProductName(item.product)}</p>
                          <p className="text-xs text-[#9497A2]">{formatCurrency(item.product.selling_price)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleUpdateQuantity(item.product.id, -1)}
                            className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-sm font-bold text-[#170438] shadow-sm"
                          >
                            −
                          </button>
                          <span className="w-6 text-center font-medium text-sm">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateQuantity(item.product.id, 1)}
                            className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-sm font-bold text-[#170438] shadow-sm"
                          >
                            +
                          </button>
                        </div>
                        <p className="font-semibold text-sm text-[#170438] w-16 text-right">
                          {formatCurrency(item.product.selling_price * item.quantity)}
                        </p>
                        <button
                          onClick={() => handleRemoveFromCart(item.product.id)}
                          className="text-red-500 text-lg"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-5 border-t border-[#F3F4F6] bg-white">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-semibold text-[#170438]">
                      {language === 'en' ? 'Total:' : 'Guud:'}
                    </span>
                    <span className="text-xl font-bold text-[#170438]">{formatCurrency(cartTotal)}</span>
                  </div>
                  <button
                    onClick={() => {
                      toast.success(language === 'en' ? 'Order submitted!' : 'Aadanka waa la diray!')
                      setCart([])
                      setShowCartModal(false)
                    }}
                    className="w-full bg-[#8FB9D6] text-[#170438] py-3 rounded-xl font-bold text-sm"
                  >
                    {language === 'en' ? 'Submit Order' : 'Gudbi Aadanka'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
