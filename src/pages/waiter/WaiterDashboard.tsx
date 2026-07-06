import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { formatCurrency } from '../../lib/utils'
import { Card, CardHeader, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Form } from '../../components/ui/Form'
import toast from 'react-hot-toast'
import {
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Bell,
  Plus,
  Search,
  LogOut,
  UtensilsCrossed,
  Coffee,
  Menu as MenuIcon,
  Settings,
  RefreshCw,
  AlertTriangle,
  DollarSign,
  Table as TableIcon,
  Phone,
  MapPin,
} from 'lucide-react'

interface Table {
  id: string
  number: number
  capacity: number
  status: 'available' | 'occupied' | 'reserved' | 'cleaning'
  position_x?: number
  position_y?: number
  call_bell_requested: boolean
  call_bell_requested_at?: string
  call_bell_acknowledged_at?: string
  current_order?: Order
  created_at: string
  updated_at: string
}

interface Order {
  id: string
  table_id: string
  status: 'new' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled'
  total: number
  payment_status: 'pending' | 'paid' | 'refunded'
  created_at: string
  items?: OrderItem[]
}

interface OrderItem {
  id: string
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
  notes?: string
}

interface Product {
  id: string
  name: string
  name_so?: string
  description?: string
  selling_price: number
  is_available: boolean
  category_id: string
  categories?: {
    name: string
  }
}

export default function WaiterDashboard() {
  const { user, logout, hasModuleAccess } = useAuth()
  const navigate = useNavigate()
  const [tables, setTables] = useState<Table[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [cart, setCart] = useState<OrderItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [categories, setCategories] = useState<any[]>([])
  const [currentTime, setCurrentTime] = useState(new Date())
  const [activeOrders, setActiveOrders] = useState<Order[]>([])

  useEffect(() => {
    console.log('WaiterDashboard: user', user)
    console.log('WaiterDashboard: hasModuleAccess', hasModuleAccess('waiter_dashboard'))
    
    if (!hasModuleAccess('waiter_dashboard')) {
      toast.error('Your subscription plan does not include the Waiter Dashboard module')
      navigate('/')
      return
    }

    loadData()
    setupRealtimeSubscriptions()

    // Update time every second
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000)

    return () => {
      clearInterval(timeInterval)
    }
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      console.log('WaiterDashboard: Loading data...')
      
      // Load tables - filter by tenant_id if available, otherwise load all
      let tablesQuery = supabase.from('tables').select('*').order('number')
      if (user?.tenant_id) {
        tablesQuery = tablesQuery.eq('tenant_id', user.tenant_id)
      }
      
      const { data: tablesData, error: tablesError } = await tablesQuery
      
      if (tablesError) {
        console.error('WaiterDashboard: Tables error', tablesError)
      } else {
        console.log('WaiterDashboard: Tables loaded', tablesData?.length)
        setTables(tablesData || [])
      }

      // Load products - filter by tenant_id if available, otherwise load all
      let productsQuery = supabase.from('products').select('*, categories(name)').eq('is_available', true).order('name')
      if (user?.tenant_id) {
        productsQuery = productsQuery.eq('tenant_id', user.tenant_id)
      }
      
      const { data: productsData, error: productsError } = await productsQuery
      
      if (productsError) {
        console.error('WaiterDashboard: Products error', productsError)
      } else {
        console.log('WaiterDashboard: Products loaded', productsData?.length)
        setProducts(productsData || [])
        
        // Extract unique categories
        const uniqueCategories = Array.from(
          new Set((productsData || []).map(p => p.category_id))
        ).map(catId => {
          const cat = (productsData || []).find(p => p.category_id === catId)?.categories
          return cat ? { id: catId, name: cat.name } : null
        }).filter(Boolean)
        
        setCategories(uniqueCategories)
      }

      // Load active orders for this waiter - filter by tenant_id if available
      let ordersQuery = supabase
        .from('orders')
        .select('*, tables(number)')
        .eq('waiter_id', user?.id)
        .in('status', ['new', 'preparing', 'ready'])
        .order('created_at', { ascending: false })
      
      if (user?.tenant_id) {
        ordersQuery = ordersQuery.eq('tenant_id', user.tenant_id)
      }
      
      const { data: ordersData, error: ordersError } = await ordersQuery
      
      if (ordersError) {
        console.error('WaiterDashboard: Orders error', ordersError)
      } else {
        console.log('WaiterDashboard: Orders loaded', ordersData?.length)
        setActiveOrders(ordersData || [])
      }
    } catch (error) {
      console.error('WaiterDashboard: Error loading data:', error)
      toast.error('Failed to load data')
    } finally {
      console.log('WaiterDashboard: Loading complete')
      setLoading(false)
    }
  }

  function setupRealtimeSubscriptions() {
    // Subscribe to table changes - only filter by tenant_id if available
    const tablesFilter = user?.tenant_id ? `tenant_id=eq.${user.tenant_id}` : undefined
    
    const tablesSubscription = supabase
      .channel('tables-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tables',
          filter: tablesFilter,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setTables(prev => prev.map(t => 
              t.id === payload.new.id ? { ...t, ...payload.new } : t
            ))
          }
        }
      )
      .subscribe()

    // Subscribe to order changes - only filter by tenant_id if available
    const ordersFilter = user?.tenant_id ? `tenant_id=eq.${user.tenant_id}` : undefined
    
    const ordersSubscription = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: ordersFilter,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setActiveOrders(prev => [payload.new as Order, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setActiveOrders(prev => prev.map(o => 
              o.id === payload.new.id ? { ...o, ...payload.new } as Order : o
            ))
          } else if (payload.eventType === 'DELETE') {
            setActiveOrders(prev => prev.filter(o => o.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      tablesSubscription.unsubscribe()
      ordersSubscription.unsubscribe()
    }
  }

  async function handleCallBellAcknowledge(tableId: string) {
    try {
      await supabase
        .from('tables')
        .update({
          call_bell_requested: false,
          call_bell_acknowledged_at: new Date().toISOString(),
        })
        .eq('id', tableId)
      
      toast.success('Call bell acknowledged')
    } catch (error) {
      console.error('Error acknowledging call bell:', error)
      toast.error('Failed to acknowledge call bell')
    }
  }

  async function handleUpdateTableStatus(tableId: string, status: Table['status']) {
    try {
      await supabase
        .from('tables')
        .update({ status })
        .eq('id', tableId)
      
      toast.success('Table status updated')
    } catch (error) {
      console.error('Error updating table status:', error)
      toast.error('Failed to update table status')
    }
  }

  function handleOpenOrderModal(table: Table) {
    setSelectedTable(table)
    setCart([])
    setShowOrderModal(true)
  }

  function handleAddToCart(product: Product) {
    const existingItem = cart.find(item => item.product_id === product.id)
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.product_id === product.id
          ? { ...item, quantity: item.quantity + 1, total_price: (item.quantity + 1) * item.unit_price }
          : item
      ))
    } else {
      setCart([...cart, {
        id: crypto.randomUUID(),
        product_id: product.id,
        product_name: product.name,
        quantity: 1,
        unit_price: product.selling_price,
        total_price: product.selling_price,
      }])
    }
  }

  function handleRemoveFromCart(productId: string) {
    setCart(cart.filter(item => item.product_id !== productId))
  }

  function handleUpdateQuantity(productId: string, delta: number) {
    setCart(cart.map(item => {
      if (item.product_id === productId) {
        const newQuantity = Math.max(1, item.quantity + delta)
        return {
          ...item,
          quantity: newQuantity,
          total_price: newQuantity * item.unit_price,
        }
      }
      return item
    }))
  }

  async function handleSubmitOrder() {
    if (!selectedTable || cart.length === 0) {
      toast.error('Please add items to the order')
      return
    }

    try {
      const total = cart.reduce((sum, item) => sum + item.total_price, 0)
      
      const { data: order } = await supabase
        .from('orders')
        .insert({
          table_id: selectedTable.id,
          waiter_id: user?.id,
          order_type: 'dine_in',
          status: 'new',
          subtotal: total,
          total,
          payment_status: 'pending',
          tenant_id: user?.tenant_id,
          source: 'waiter',
        })
        .select()
        .single()

      if (order) {
        // Insert order items
        for (const item of cart) {
          await supabase.from('order_items').insert({
            order_id: order.id,
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
            tenant_id: user?.tenant_id,
          })
        }

        // Update table status
        await supabase
          .from('tables')
          .update({ status: 'occupied' })
          .eq('id', selectedTable.id)

        toast.success('Order submitted successfully')
        setShowOrderModal(false)
        setCart([])
        setSelectedTable(null)
        loadData()
      }
    } catch (error) {
      console.error('Error submitting order:', error)
      toast.error('Failed to submit order')
    }
  }

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category_id === selectedCategory
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (product.name_so && product.name_so.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  const cartTotal = cart.reduce((sum, item) => sum + item.total_price, 0)

  const tablesByStatus = {
    available: tables.filter(t => t.status === 'available'),
    occupied: tables.filter(t => t.status === 'occupied'),
    reserved: tables.filter(t => t.status === 'reserved'),
    cleaning: tables.filter(t => t.status === 'cleaning'),
  }

  const callBellTables = tables.filter(t => t.call_bell_requested)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading Waiter Dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <UtensilsCrossed className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Waiter Dashboard</h1>
              <p className="text-sm text-gray-500">Welcome, {user?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{currentTime.toLocaleTimeString()}</p>
              <p className="text-xs text-gray-500">{currentTime.toLocaleDateString()}</p>
            </div>
            {callBellTables.length > 0 && (
              <div className="relative">
                <Bell className="w-6 h-6 text-red-600 animate-pulse" />
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {callBellTables.length}
                </span>
              </div>
            )}
            <Button variant="outline" onClick={() => logout()}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Call Bell Alerts */}
        {callBellTables.length > 0 && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Bell className="w-5 h-5 text-red-600" />
              <h3 className="font-semibold text-red-900">Call Bell Requests</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {callBellTables.map(table => (
                <div
                  key={table.id}
                  className="bg-white border border-red-200 rounded-lg p-3 flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-gray-900">Table {table.number}</p>
                    <p className="text-xs text-gray-500">
                      {table.call_bell_requested_at && new Date(table.call_bell_requested_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => handleCallBellAcknowledge(table.id)}
                  >
                    <CheckCircle className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TableIcon className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{tablesByStatus.available.length}</p>
                  <p className="text-sm text-gray-500">Available</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{tablesByStatus.occupied.length}</p>
                  <p className="text-sm text-gray-500">Occupied</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{activeOrders.length}</p>
                  <p className="text-sm text-gray-500">Active Orders</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(activeOrders.reduce((sum, o) => sum + (o.total || 0), 0))}
                  </p>
                  <p className="text-sm text-gray-500">Today's Sales</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tables Grid */}
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Tables</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {tables.map(table => (
                <div
                  key={table.id}
                  className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-lg ${
                    table.status === 'available' ? 'border-green-300 bg-green-50' :
                    table.status === 'occupied' ? 'border-blue-300 bg-blue-50' :
                    table.status === 'reserved' ? 'border-yellow-300 bg-yellow-50' :
                    'border-gray-300 bg-gray-50'
                  } ${table.call_bell_requested ? 'ring-2 ring-red-500 ring-offset-2' : ''}`}
                  onClick={() => handleOpenOrderModal(table)}
                >
                  {table.call_bell_requested && (
                    <div className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1">
                      <Bell className="w-4 h-4" />
                    </div>
                  )}
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{table.number}</p>
                    <p className="text-sm text-gray-600 capitalize">{table.status.replace('_', ' ')}</p>
                    <p className="text-xs text-gray-500 mt-1">Capacity: {table.capacity}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Active Orders */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Active Orders</h2>
          </CardHeader>
          <CardContent>
            {activeOrders.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No active orders</p>
            ) : (
              <div className="space-y-3">
                {activeOrders.map(order => (
                  <div
                    key={order.id}
                    className="border rounded-lg p-4 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        Table {(order as any).tables?.number || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{formatCurrency(order.total)}</p>
                        <p className={`text-sm capitalize ${
                          order.status === 'new' ? 'text-blue-600' :
                          order.status === 'preparing' ? 'text-yellow-600' :
                          order.status === 'ready' ? 'text-green-600' :
                          'text-gray-600'
                        }`}>
                          {order.status}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => {/* View order details */}}
                      >
                        <MenuIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order Modal */}
      {showOrderModal && selectedTable && (
        <Modal
          isOpen={showOrderModal}
          onClose={() => setShowOrderModal(false)}
          title={`Order for Table ${selectedTable.number}`}
          size="xl"
        >
          <div className="grid grid-cols-2 gap-6">
            {/* Products */}
            <div>
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              
              <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                    selectedCategory === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  All
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                      selectedCategory === cat.id ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                {filteredProducts.map(product => (
                  <button
                    key={product.id}
                    onClick={() => handleAddToCart(product)}
                    className="border rounded-lg p-3 text-left hover:bg-gray-50 transition-colors"
                  >
                    <p className="font-medium text-gray-900">{product.name}</p>
                    {product.name_so && (
                      <p className="text-sm text-gray-500">{product.name_so}</p>
                    )}
                    <p className="text-sm font-semibold text-blue-600 mt-1">
                      {formatCurrency(product.selling_price)}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Cart */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Order Items</h3>
              <div className="border rounded-lg p-4 min-h-64">
                {cart.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No items in cart</p>
                ) : (
                  <div className="space-y-3">
                    {cart.map(item => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between border-b pb-3"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.product_name}</p>
                          <p className="text-sm text-gray-500">{formatCurrency(item.unit_price)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleUpdateQuantity(item.product_id, -1)}
                            className="w-6 h-6 rounded bg-gray-200 flex items-center justify-center"
                          >
                            -
                          </button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateQuantity(item.product_id, 1)}
                            className="w-6 h-6 rounded bg-gray-200 flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>
                        <p className="font-medium text-gray-900 w-20 text-right">
                          {formatCurrency(item.total_price)}
                        </p>
                        <button
                          onClick={() => handleRemoveFromCart(item.product_id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-semibold text-gray-900">Total:</span>
                  <span className="text-xl font-bold text-gray-900">{formatCurrency(cartTotal)}</span>
                </div>
                <Button
                  onClick={handleSubmitOrder}
                  disabled={cart.length === 0}
                  className="w-full"
                >
                  Submit Order
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
