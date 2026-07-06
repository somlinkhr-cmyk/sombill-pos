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
  Grid3x3,
  ClipboardList,
  Receipt,
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
  const [selectedTableForPanel, setSelectedTableForPanel] = useState<Table | null>(null)
  const [activeTab, setActiveTab] = useState('tables')

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
      .channel(`tables-changes-${Date.now()}`)
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
      .channel(`orders-changes-${Date.now()}`)
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
    <div className="flex min-h-screen bg-[#EEF5FA]">
      {/* Sidebar */}
      <div className="w-[88px] bg-[#170438] flex flex-col items-center py-[22px] gap-2 flex-shrink-0">
        {/* Logo */}
        <svg className="w-[38px] h-[38px] mb-[22px]" viewBox="0 0 100 100" fill="none">
          <path d="M62 8 L28 34 C20 40 20 50 28 56 L62 82" stroke="#DDE1E6" strokeWidth="16" strokeLinecap="round"/>
          <path d="M38 18 L72 44 C80 50 80 60 72 66 L38 92" stroke="#8FB9D6" strokeWidth="16" strokeLinecap="round"/>
        </svg>

        {/* Navigation Items */}
        <div 
          className={`w-[56px] h-[56px] rounded-[14px] flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${activeTab === 'tables' ? 'bg-[#8FB9D6] text-[#170438]' : 'text-[#B4B7C0] hover:bg-white/8 hover:text-white'}`}
          onClick={() => setActiveTab('tables')}
        >
          <Grid3x3 className="w-5 h-5" />
          <span className="text-[9.5px] font-semibold">Tables</span>
        </div>
        <div 
          className={`w-[56px] h-[56px] rounded-[14px] flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${activeTab === 'orders' ? 'bg-[#8FB9D6] text-[#170438]' : 'text-[#B4B7C0] hover:bg-white/8 hover:text-white'}`}
          onClick={() => setActiveTab('orders')}
        >
          <ClipboardList className="w-5 h-5" />
          <span className="text-[9.5px] font-semibold">Orders</span>
        </div>
        <div 
          className={`w-[56px] h-[56px] rounded-[14px] flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${activeTab === 'menu' ? 'bg-[#8FB9D6] text-[#170438]' : 'text-[#B4B7C0] hover:bg-white/8 hover:text-white'}`}
          onClick={() => setActiveTab('menu')}
        >
          <MenuIcon className="w-5 h-5" />
          <span className="text-[9.5px] font-semibold">Menu</span>
        </div>
        <div 
          className={`w-[56px] h-[56px] rounded-[14px] flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${activeTab === 'bill' ? 'bg-[#8FB9D6] text-[#170438]' : 'text-[#B4B7C0] hover:bg-white/8 hover:text-white'}`}
          onClick={() => setActiveTab('bill')}
        >
          <Receipt className="w-5 h-5" />
          <span className="text-[9.5px] font-semibold">Bill</span>
        </div>

        {/* Logout */}
        <div className="mt-auto mb-4">
          <div 
            className="w-[56px] h-[56px] rounded-[14px] flex flex-col items-center justify-center gap-1 cursor-pointer transition-all text-[#B4B7C0] hover:bg-white/8 hover:text-white"
            onClick={() => logout()}
          >
            <LogOut className="w-5 h-5" />
            <span className="text-[9.5px] font-semibold">Logout</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-8 py-5 bg-white border-b border-[#DADCE1]">
          <div>
            <div className="text-[22px] font-bold text-[#170438] font-['Outfit']">
              Good afternoon, {user?.name?.split(' ')[0] || 'Waiter'}
            </div>
            <div className="text-[13px] text-[#8A8E98] mt-1">
              Floor 1 · {tables.length} tables assigned
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-[#F1F2F4] rounded-[10px] px-4 py-2 text-[13px] text-[#8A8E98] w-[220px] flex items-center gap-2">
              <Search className="w-4 h-4" />
              <input 
                type="text" 
                placeholder="Search tables, orders…" 
                className="bg-transparent outline-none w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="relative cursor-pointer">
              <Bell className="w-[22px] h-[22px] text-[#170438]" />
              {callBellTables.length > 0 && (
                <div className="absolute -top-1 -right-1 bg-[#E1505C] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {callBellTables.length}
                </div>
              )}
            </div>
            <div className="w-[38px] h-[38px] rounded-full bg-[#B7D4E8] flex items-center justify-center font-['Outfit'] font-bold text-[#170438] text-[14px]">
              {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'WA'}
            </div>
          </div>
        </div>

        {/* Alert Banner */}
        {callBellTables.length > 0 && (
          <div className="mx-8 mt-[18px] bg-gradient-to-r from-[rgba(225,80,92,0.08)] to-[rgba(225,80,92,0.02)] border border-[rgba(225,80,92,0.35)] rounded-[14px] p-[13px_18px] flex items-center gap-3 animate-slideIn">
            <div className="w-[34px] h-[34px] rounded-full bg-[#E1505C] flex-shrink-0 flex items-center justify-center text-white text-[16px] animate-ring">
              🔔
            </div>
            <div className="flex-1">
              <div className="font-bold text-[13.5px] text-[#170438]">
                Table {callBellTables[0].number} is calling — NFC Call Bell
              </div>
              <div className="text-[12px] text-[#8A8E98] mt-0.5">
                Requested {callBellTables[0].call_bell_requested_at ? (() => {
                  const elapsed = Math.floor((Date.now() - new Date(callBellTables[0].call_bell_requested_at!).getTime()) / 1000 / 60)
                  return `${elapsed} min ago`
                })() : 'just now'} · Also needs the bill
              </div>
            </div>
            <button 
              onClick={() => handleCallBellAcknowledge(callBellTables[0].id)}
              className="bg-[#170438] text-white border-none px-4 py-2 rounded-[9px] text-[12.5px] font-semibold cursor-pointer font-['Inter']"
            >
              Acknowledge
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex flex-1 min-h-0">
          {/* Floor Grid */}
          <div className="flex-1 p-[22px_32px] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[16px] font-semibold font-['Outfit'] text-[#170438]">
                Dining Floor — {tables.length} tables
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2 text-[12px] text-[#8A8E98] font-medium">
                  <div className="w-[9px] h-[9px] rounded-full bg-[#8FB9D6]" />
                  Available
                </div>
                <div className="flex items-center gap-2 text-[12px] text-[#8A8E98] font-medium">
                  <div className="w-[9px] h-[9px] rounded-full bg-[#B7D4E8]" />
                  Occupied
                </div>
                <div className="flex items-center gap-2 text-[12px] text-[#8A8E98] font-medium">
                  <div className="w-[9px] h-[9px] rounded-full bg-[#E3922E]" />
                  Needs attention
                </div>
                <div className="flex items-center gap-2 text-[12px] text-[#8A8E98] font-medium">
                  <div className="w-[9px] h-[9px] rounded-full bg-[#8A8E98]" />
                  Bill requested
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              {tables.map(table => (
                <div
                  key={table.id}
                  onClick={() => setSelectedTableForPanel(table)}
                  className={`relative bg-white rounded-[16px] p-[18px] cursor-pointer transition-all border-2 ${
                    table.status === 'available' 
                      ? 'border-transparent shadow-[inset_0_0_0_1.5px_#DADCE1]' 
                      : table.status === 'occupied'
                      ? 'bg-gradient-to-br from-[#2C0F72] to-[#170438] text-white border-transparent'
                      : table.call_bell_requested
                      ? 'border-[#E3922E] border-2'
                      : 'border-[#B4B7C0] border-2'
                  } ${selectedTableForPanel?.id === table.id ? 'border-[#8FB9D6]' : ''} hover:-translate-y-0.5 hover:shadow-lg`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-['IBM_Plex_Mono'] text-[20px] font-bold">
                        T-{String(table.number).padStart(2, '0')}
                      </div>
                      <div className="text-[11px] opacity-70 mt-0.5">
                        {table.capacity} seats
                      </div>
                    </div>
                    <div className={`w-[9px] h-[9px] rounded-full mt-1 ${
                      table.status === 'available' ? 'bg-[#8FB9D6]' :
                      table.status === 'occupied' ? 'bg-[#B7D4E8]' :
                      table.call_bell_requested ? 'bg-[#E3922E] animate-pulse-custom' :
                      'bg-[#8A8E98]'
                    }`} />
                  </div>
                  
                  {table.status === 'occupied' && (
                    <>
                      <div className="mt-[14px] text-[12px] opacity-85">
                        Seated 14 min ago
                      </div>
                      <div className="font-['IBM_Plex_Mono'] font-bold text-[15px] mt-1.5">
                        ${formatCurrency(Math.floor(Math.random() * 100) + 10)}
                      </div>
                      <div className="mt-3 text-[10.5px] uppercase tracking-wider font-bold text-[#B7D4E8]">
                        Order in kitchen
                      </div>
                    </>
                  )}
                  
                  {table.status === 'available' && (
                    <div className="mt-12 text-[10.5px] uppercase tracking-wider font-bold text-[#6FA3C7]">
                      Available
                    </div>
                  )}
                  
                  {table.call_bell_requested && (
                    <div className="mt-12 text-[10.5px] uppercase tracking-wider font-bold text-[#E3922E]">
                      Calling waiter
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Order Panel */}
          {selectedTableForPanel && (
            <div className="w-[340px] bg-white border-l border-[#DADCE1] flex flex-col flex-shrink-0">
              <div className="p-[22px_22px_14px] border-b border-[#F1F2F4]">
                <div className="font-['Outfit'] text-[19px] font-bold text-[#170438]">
                  Table {selectedTableForPanel.number}
                </div>
                <div className="text-[12px] text-[#8A8E98] mt-1">
                  {selectedTableForPanel.capacity} guests · {selectedTableForPanel.status === 'occupied' ? 'Opened 12:58 PM' : 'Available'} · Waiter: {user?.name}
                </div>
              </div>

              <div className="flex-1 p-[14px_22px] overflow-auto">
                {selectedTableForPanel.status === 'occupied' ? (
                  <div className="space-y-3">
                    <div className="flex justify-between py-3 border-b border-[#F1F2F4]">
                      <div className="flex gap-2.5">
                        <div className="w-6 h-6 rounded-[7px] bg-[#EEF5FA] text-[#39129A] flex items-center justify-center font-['IBM_Plex_Mono'] text-[12px] font-bold flex-shrink-0">
                          2
                        </div>
                        <div>
                          <div className="text-[13.5px] font-semibold">Bariis Iskukaris</div>
                          <div className="text-[11px] text-[#8A8E98]">No raisins</div>
                        </div>
                      </div>
                      <div className="font-['IBM_Plex_Mono'] text-[13px] font-semibold text-[#170438]">
                        $18.00
                      </div>
                    </div>
                    <div className="flex justify-between py-3 border-b border-[#F1F2F4]">
                      <div className="flex gap-2.5">
                        <div className="w-6 h-6 rounded-[7px] bg-[#EEF5FA] text-[#39129A] flex items-center justify-center font-['IBM_Plex_Mono'] text-[12px] font-bold flex-shrink-0">
                          1
                        </div>
                        <div>
                          <div className="text-[13.5px] font-semibold">Grilled Hilib Ari</div>
                        </div>
                      </div>
                      <div className="font-['IBM_Plex_Mono'] text-[13px] font-semibold text-[#170438]">
                        $12.50
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-[#8A8E98] py-8">
                    Table is available
                  </div>
                )}
              </div>

              <div className="p-[18px_22px_22px] border-t border-[#F1F2F4]">
                <div className="flex justify-between text-[13px] text-[#8A8E98] mb-1.5">
                  <span>Subtotal</span>
                  <span>$30.50</span>
                </div>
                <div className="flex justify-between text-[13px] text-[#8A8E98] mb-1.5">
                  <span>Service (5%)</span>
                  <span>$1.53</span>
                </div>
                <div className="flex justify-between font-['Outfit'] font-bold text-[18px] mt-2 mb-4">
                  <span>Total</span>
                  <span>$32.03</span>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleOpenOrderModal(selectedTableForPanel)}
                    className="flex-1 py-3 rounded-[11px] font-bold text-[13px] border-none cursor-pointer font-['Inter'] bg-[#F1F2F4] text-[#170438]"
                  >
                    Add Items
                  </button>
                  <button className="flex-1 py-3 rounded-[11px] font-bold text-[13px] border-none cursor-pointer font-['Inter'] bg-[#170438] text-white">
                    Print Bill
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
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
                    selectedCategory === 'all' ? 'bg-[#170438] text-white' : 'bg-[#F1F2F4] text-[#170438]'
                  }`}
                >
                  All
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                      selectedCategory === cat.id ? 'bg-[#170438] text-white' : 'bg-[#F1F2F4] text-[#170438]'
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
                    <p className="text-sm font-semibold text-[#39129A] mt-1">
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
