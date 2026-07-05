import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { formatTime, formatCurrency } from '../../lib/utils'
import { Card, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import {
  Users,
  LogOut,
  Plus,
  Clock,
  Utensils,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { Table, Order, Product, Category } from '../../types'

export default function WaiterPanel() {
  const { user, logout } = useAuth()
  const [tables, setTables] = useState<Table[]>([])
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [cart, setCart] = useState<any[]>([])
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
    setupRealtimeSubscriptions()
  }, [])

  async function loadData() {
    try {
      const [tablesRes, productsRes, categoriesRes] = await Promise.all([
        supabase.from('tables').select('*, current_order:orders(*)').order('number'),
        supabase.from('products').select('*, category(*)').eq('is_available', true),
        supabase.from('categories').select('*').eq('is_active', true).order('display_order'),
      ])

      if (tablesRes.data) setTables(tablesRes.data)
      if (productsRes.data) setProducts(productsRes.data)
      if (categoriesRes.data) setCategories(categoriesRes.data)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  function setupRealtimeSubscriptions() {
    const tablesSubscription = supabase
      .channel('tables-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tables' }, () => {
        loadData()
      })
      .subscribe()

    const ordersSubscription = supabase
      .channel('orders-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        loadData()
      })
      .subscribe()

    return () => {
      tablesSubscription.unsubscribe()
      ordersSubscription.unsubscribe()
    }
  }

  function openTable(table: Table) {
    setSelectedTable(table)
    setShowOrderModal(true)
    setCart([])
  }

  function addToCart(product: Product) {
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
  }

  function updateQuantity(productId: string, delta: number) {
    setCart(cart.map(item => {
      if (item.product.id === productId) {
        const newQuantity = Math.max(0, item.quantity + delta)
        return { ...item, quantity: newQuantity }
      }
      return item
    }).filter(item => item.quantity > 0))
  }

  async function submitOrder() {
    if (!selectedTable || cart.length === 0) return

    try {
      const { data: order } = await supabase.from('orders').insert({
        table_id: selectedTable.id,
        waiter_id: user?.id,
        order_type: 'dine_in',
        status: 'new',
        subtotal: cart.reduce((sum, item) => sum + (item.product.selling_price * item.quantity), 0),
        total: cart.reduce((sum, item) => sum + (item.product.selling_price * item.quantity), 0),
        payment_status: 'pending',
      }).select().single()

      if (order) {
        for (const item of cart) {
          await supabase.from('order_items').insert({
            order_id: order.id,
            product_id: item.product.id,
            quantity: item.quantity,
            unit_price: item.product.selling_price,
            total_price: item.product.selling_price * item.quantity,
          })
        }

        await supabase.from('tables').update({ status: 'occupied' }).eq('id', selectedTable.id)
        
        setShowOrderModal(false)
        setCart([])
        setSelectedTable(null)
        loadData()
      }
    } catch (error) {
      console.error('Error submitting order:', error)
    }
  }

  const tableStatusColors: Record<string, string> = {
    available: 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200',
    occupied: 'bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-200',
    reserved: 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200',
    cleaning: 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200',
  }

  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(p => p.category_id === selectedCategory)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-700"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
            <Users className="w-6 h-6 text-primary-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Waiter Panel</h1>
            <p className="text-sm text-gray-600">Waiter: {user?.name}</p>
          </div>
        </div>
        <Button variant="ghost" onClick={logout}>
          <LogOut className="w-4 h-4" />
        </Button>
      </header>

      {/* Tables Grid */}
      <main className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Table Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {tables.map(table => (
              <button
                key={table.id}
                onClick={() => openTable(table)}
                disabled={table.status === 'cleaning'}
                className={`p-4 rounded-xl border-2 transition-all ${
                  tableStatusColors[table.status]
                }`}
              >
                <div className="text-2xl font-bold mb-1">{table.number}</div>
                <div className="text-sm capitalize">{table.status}</div>
                {table.current_order && (
                  <div className="text-xs mt-2">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {formatTime(table.current_order.created_at)}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Active Orders */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Orders</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tables.filter(t => t.status === 'occupied').map(table => (
              <Card key={table.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-lg">Table {table.number}</h3>
                      {table.current_order && (
                        <p className="text-sm text-gray-600">
                          {formatTime(table.current_order.created_at)}
                        </p>
                      )}
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      table.current_order?.status === 'new' ? 'bg-blue-100 text-blue-700' :
                      table.current_order?.status === 'preparing' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {table.current_order?.status || 'No order'}
                    </div>
                  </div>
                  <Button
                    onClick={() => openTable(table)}
                    variant="outline"
                    className="w-full text-sm"
                  >
                    <Utensils className="w-4 h-4 mr-2" />
                    Add Items
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

      {/* Order Modal */}
      <Modal isOpen={showOrderModal} onClose={() => setShowOrderModal(false)} size="xl">
        <div className="flex h-[80vh]">
          {/* Products */}
          <div className="flex-1 p-6 overflow-auto border-r border-gray-200">
            <h3 className="text-xl font-bold mb-4">Menu - Table {selectedTable?.number}</h3>
            
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
                  selectedCategory === 'all'
                    ? 'bg-primary-700 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
                    selectedCategory === category.id
                      ? 'bg-primary-700 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {filteredProducts.map(product => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="bg-white rounded-lg border border-gray-200 p-3 hover:border-primary-300 transition-all text-left"
                >
                  <div className="font-medium text-gray-900 text-sm">{product.name}</div>
                  <div className="text-primary-700 font-bold mt-1">{formatCurrency(product.selling_price)}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Cart */}
          <div className="w-80 p-6 flex flex-col bg-gray-50">
            <h3 className="text-xl font-bold mb-4">Order</h3>
            
            <div className="flex-1 overflow-auto space-y-2">
              {cart.map(item => (
                <div key={item.product.id} className="bg-white rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.product.name}</p>
                      <p className="text-xs text-gray-600">{formatCurrency(item.product.selling_price)}</p>
                    </div>
                    <button
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="w-6 h-6 rounded bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="w-6 h-6 rounded bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                    >
                      -
                    </button>
                    <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="w-6 h-6 rounded bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between text-lg font-bold mb-4">
                <span>Total</span>
                <span>{formatCurrency(cart.reduce((sum, item) => sum + (item.product.selling_price * item.quantity), 0))}</span>
              </div>
              <Button
                onClick={submitOrder}
                disabled={cart.length === 0}
                className="w-full"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Send to Kitchen
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
