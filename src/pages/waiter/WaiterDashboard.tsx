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
  subtotal: number
  payment_status: 'pending' | 'paid' | 'refunded'
  created_at: string
  items?: OrderItem[]
  notes?: string
}

interface OrderItem {
  id: string
  order_id?: string
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
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [showDiscountModal, setShowDiscountModal] = useState(false)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [discountReason, setDiscountReason] = useState('')
  const [splitType, setSplitType] = useState<'even' | 'items' | null>(null)
  const [splitGuests, setSplitGuests] = useState(2)
  const [tableSearchQuery, setTableSearchQuery] = useState('')
  const [tableStatusFilter, setTableStatusFilter] = useState<string>('all')
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('active')
  const [showMoveTableModal, setShowMoveTableModal] = useState(false)
  const [showMergeTableModal, setShowMergeTableModal] = useState(false)
  const [showEditOrderModal, setShowEditOrderModal] = useState(false)
  const [selectedOrderForEdit, setSelectedOrderForEdit] = useState<Order | null>(null)
  const [editOrderCart, setEditOrderCart] = useState<OrderItem[]>([])
  const [orderNotes, setOrderNotes] = useState('')
  const [completedOrders, setCompletedOrders] = useState<Order[]>([])
  const [cancelledOrders, setCancelledOrders] = useState<Order[]>([])

  // Filtered tables
  const filteredTables = tables.filter(table => {
    const matchesSearch = tableSearchQuery === '' || 
      table.number.toString().includes(tableSearchQuery)
    const matchesStatus = tableStatusFilter === 'all' || 
      table.status === tableStatusFilter
    return matchesSearch && matchesStatus
  })

  // Filtered orders based on status
  const filteredOrders = orderStatusFilter === 'active' ? activeOrders :
    orderStatusFilter === 'completed' ? completedOrders :
    orderStatusFilter === 'cancelled' ? cancelledOrders :
    activeOrders

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
        .in('status', ['new', 'preparing', 'ready', 'served'])
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

      // Load completed orders
      let completedOrdersQuery = supabase
        .from('orders')
        .select('*, tables(number)')
        .eq('waiter_id', user?.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(50)
      
      if (user?.tenant_id) {
        completedOrdersQuery = completedOrdersQuery.eq('tenant_id', user.tenant_id)
      }
      
      const { data: completedData, error: completedError } = await completedOrdersQuery
      
      if (completedError) {
        console.error('WaiterDashboard: Completed orders error', completedError)
      } else {
        setCompletedOrders(completedData || [])
      }

      // Load cancelled orders
      let cancelledOrdersQuery = supabase
        .from('orders')
        .select('*, tables(number)')
        .eq('waiter_id', user?.id)
        .eq('status', 'cancelled')
        .order('created_at', { ascending: false })
        .limit(50)
      
      if (user?.tenant_id) {
        cancelledOrdersQuery = cancelledOrdersQuery.eq('tenant_id', user.tenant_id)
      }
      
      const { data: cancelledData, error: cancelledError } = await cancelledOrdersQuery
      
      if (cancelledError) {
        console.error('WaiterDashboard: Cancelled orders error', cancelledError)
      } else {
        setCancelledOrders(cancelledData || [])
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

  async function handleMarkOrderServed(orderId: string) {
    try {
      await supabase
        .from('orders')
        .update({ status: 'served' })
        .eq('id', orderId)
      
      toast.success('Order marked as served')
    } catch (error) {
      console.error('Error marking order as served:', error)
      toast.error('Failed to mark order as served')
    }
  }

  async function handleSendToKitchen() {
    if (!selectedTableForPanel || cart.length === 0) {
      toast.error('Please add items to the order')
      return
    }

    try {
      const total = cart.reduce((sum, item) => sum + item.total_price, 0)
      
      const { data: order } = await supabase
        .from('orders')
        .insert({
          table_id: selectedTableForPanel.id,
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

        await supabase
          .from('tables')
          .update({ status: 'occupied' })
          .eq('id', selectedTableForPanel.id)

        toast.success('Order sent to kitchen successfully')
        setCart([])
        loadData()
      }
    } catch (error) {
      console.error('Error sending order to kitchen:', error)
      toast.error('Failed to send order to kitchen')
    }
  }

  function handlePrintKitchenTicket() {
    if (!selectedTableForPanel || cart.length === 0) {
      toast.error('Please add items to the order')
      return
    }

    const total = cart.reduce((sum, item) => sum + item.total_price, 0)
    const ticketContent = `
================================
      KITCHEN TICKET
================================
Table: ${selectedTableForPanel.number}
Date: ${new Date().toLocaleString()}
Waiter: ${user?.name}
================================
${cart.map(item => `
${item.quantity}x ${item.product_name}
    ${formatCurrency(item.total_price)}
${item.notes ? `Note: ${item.notes}` : ''}
`).join('')}
================================
Total: ${formatCurrency(total)}
================================
    `
    
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`<pre>${ticketContent}</pre>`)
      printWindow.document.close()
      printWindow.print()
    }
  }

  function handlePrintReceipt() {
    if (!selectedTableForPanel) {
      toast.error('Please select a table')
      return
    }

    const receiptContent = `
================================
           SomBill
      Restaurant POS
================================
Table: ${selectedTableForPanel.number}
Date: ${new Date().toLocaleDateString()}
Time: ${new Date().toLocaleTimeString()}
Bill #: ${Math.floor(Math.random() * 10000)}
Waiter: ${user?.name}
================================
ITEMS
--------------------------------
2x Bariis Iskukaris          $18.00
   No raisins
1x Grilled Hilib Ari         $12.50
2x Fresh Lime Juice           $4.00
================================
Subtotal                     $34.50
Tax (10%)                     $3.45
Service (5%)                  $1.73
${discountAmount > 0 ? `Discount (${discountReason})  -${formatCurrency(discountAmount)}` : ''}
--------------------------------
TOTAL                       ${formatCurrency(36.23 - discountAmount)}
================================
Thank you for dining with us!
    `
    
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`<pre style="font-family: monospace; font-size: 12px; white-space: pre;">${receiptContent}</pre>`)
      printWindow.document.close()
      printWindow.print()
    }
  }

  async function handleMarkAsPaid() {
    if (!selectedTableForPanel) {
      toast.error('Please select a table')
      return
    }

    try {
      await supabase
        .from('tables')
        .update({ status: 'available' })
        .eq('id', selectedTableForPanel.id)

      toast.success('Bill marked as paid. Table is now available.')
      setSelectedTableForPanel(null)
      setDiscountAmount(0)
      setDiscountReason('')
      loadData()
    } catch (error) {
      console.error('Error marking bill as paid:', error)
      toast.error('Failed to mark bill as paid')
    }
  }

  async function handleMoveTable(targetTableId: string) {
    if (!selectedTableForPanel) return

    try {
      // Update the order's table_id
      await supabase
        .from('orders')
        .update({ table_id: targetTableId })
        .eq('table_id', selectedTableForPanel.id)
        .in('status', ['new', 'preparing', 'ready', 'served'])

      // Mark original table as available
      await supabase
        .from('tables')
        .update({ status: 'available' })
        .eq('id', selectedTableForPanel.id)

      // Mark target table as occupied
      await supabase
        .from('tables')
        .update({ status: 'occupied' })
        .eq('id', targetTableId)

      toast.success('Table moved successfully')
      setShowMoveTableModal(false)
      loadData()
    } catch (error) {
      console.error('Error moving table:', error)
      toast.error('Failed to move table')
    }
  }

  async function handleMergeTables(targetTableId: string) {
    if (!selectedTableForPanel) return

    try {
      // Get orders from source table
      const { data: sourceOrders } = await supabase
        .from('orders')
        .select('*')
        .eq('table_id', selectedTableForPanel.id)
        .in('status', ['new', 'preparing', 'ready', 'served'])

      // Update all orders to target table
      if (sourceOrders) {
        for (const order of sourceOrders) {
          await supabase
            .from('orders')
            .update({ table_id: targetTableId })
            .eq('id', order.id)
        }
      }

      // Mark source table as available
      await supabase
        .from('tables')
        .update({ status: 'available' })
        .eq('id', selectedTableForPanel.id)

      toast.success('Tables merged successfully')
      setShowMergeTableModal(false)
      loadData()
    } catch (error) {
      console.error('Error merging tables:', error)
      toast.error('Failed to merge tables')
    }
  }

  async function handleEditOrder() {
    if (!selectedOrderForEdit || editOrderCart.length === 0) {
      toast.error('Please add items to the order')
      return
    }

    try {
      // Delete existing order items
      await supabase
        .from('order_items')
        .delete()
        .eq('order_id', selectedOrderForEdit.id)

      // Insert new order items
      for (const item of editOrderCart) {
        await supabase.from('order_items').insert({
          order_id: selectedOrderForEdit.id,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          notes: item.notes,
          tenant_id: user?.tenant_id,
        })
      }

      // Update order total
      const total = editOrderCart.reduce((sum, item) => sum + item.total_price, 0)
      await supabase
        .from('orders')
        .update({ 
          subtotal: total,
          total,
          notes: orderNotes
        })
        .eq('id', selectedOrderForEdit.id)

      toast.success('Order updated successfully')
      setShowEditOrderModal(false)
      setEditOrderCart([])
      setOrderNotes('')
      setSelectedOrderForEdit(null)
      loadData()
    } catch (error) {
      console.error('Error editing order:', error)
      toast.error('Failed to edit order')
    }
  }

  function handleOpenEditOrderModal(order: Order) {
    setSelectedOrderForEdit(order)
    setOrderNotes((order as any).notes || '')
    // Load order items
    loadOrderItems(order.id)
    setShowEditOrderModal(true)
  }

  async function loadOrderItems(orderId: string) {
    try {
      const { data: items } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId)

      if (items) {
        setEditOrderCart(items.map(item => ({
          id: item.id,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          notes: item.notes,
        })))
      }
    } catch (error) {
      console.error('Error loading order items:', error)
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
      <div className="flex items-center justify-center min-h-screen bg-[#EEF5FA]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-[#170438]" />
          <p className="text-[#170438]">Loading Waiter Dashboard...</p>
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
          {activeTab === 'tables' && (
            <>
              {/* Floor Grid */}
              <div className="flex-1 p-[22px_32px] overflow-auto">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-[16px] font-semibold font-['Outfit'] text-[#170438]">
                    Dining Floor — {filteredTables.length} tables
                  </div>
                  <div className="flex gap-3">
                    <div className="bg-[#F1F2F4] rounded-[10px] px-3 py-2 text-[13px] text-[#8A8E98] w-[180px] flex items-center gap-2">
                      <Search className="w-4 h-4" />
                      <input 
                        type="text" 
                        placeholder="Search tables..." 
                        className="bg-transparent outline-none w-full"
                        value={tableSearchQuery}
                        onChange={(e) => setTableSearchQuery(e.target.value)}
                      />
                    </div>
                    <select
                      value={tableStatusFilter}
                      onChange={(e) => setTableStatusFilter(e.target.value)}
                      className="px-3 py-2 rounded-[10px] border border-[#DADCE1] text-[13px] text-[#170438] bg-white"
                    >
                      <option value="all">All Status</option>
                      <option value="available">Available</option>
                      <option value="occupied">Occupied</option>
                      <option value="reserved">Reserved</option>
                      <option value="cleaning">Cleaning</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-4 mb-4">
                  <div className="flex items-center gap-2 text-[12px] text-[#8A8E98] font-medium">
                    <div className="w-[9px] h-[9px] rounded-full bg-[#8FB9D6]" />
                    Available ({tablesByStatus.available.length})
                  </div>
                  <div className="flex items-center gap-2 text-[12px] text-[#8A8E98] font-medium">
                    <div className="w-[9px] h-[9px] rounded-full bg-[#B7D4E8]" />
                    Occupied ({tablesByStatus.occupied.length})
                  </div>
                  <div className="flex items-center gap-2 text-[12px] text-[#8A8E98] font-medium">
                    <div className="w-[9px] h-[9px] rounded-full bg-[#E3922E]" />
                    Reserved ({tablesByStatus.reserved.length})
                  </div>
                  <div className="flex items-center gap-2 text-[12px] text-[#8A8E98] font-medium">
                    <div className="w-[9px] h-[9px] rounded-full bg-[#8A8E98]" />
                    Cleaning ({tablesByStatus.cleaning.length})
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  {filteredTables.map(table => (
                    <div
                      key={table.id}
                      onClick={() => {
                        setSelectedTableForPanel(table)
                        if (table.status === 'occupied') {
                          setActiveTab('orders')
                        }
                      }}
                      className={`relative bg-white rounded-[16px] p-[18px] cursor-pointer transition-all border-2 ${
                        table.status === 'available' 
                          ? 'border-transparent shadow-[inset_0_0_0_1.5px_#DADCE1]' 
                          : table.status === 'occupied'
                          ? 'bg-gradient-to-br from-[#2C0F72] to-[#170438] text-white border-transparent'
                          : table.status === 'reserved'
                          ? 'border-[#E3922E] border-2'
                          : table.status === 'cleaning'
                          ? 'border-[#8A8E98] border-2'
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
                            Occupied
                          </div>
                          <div className="mt-3 text-[10.5px] uppercase tracking-wider font-bold text-[#B7D4E8]">
                            Active order
                          </div>
                        </>
                      )}
                      
                      {table.status === 'available' && (
                        <div className="mt-12 text-[10.5px] uppercase tracking-wider font-bold text-[#6FA3C7]">
                          Available
                        </div>
                      )}
                      
                      {table.status === 'reserved' && (
                        <div className="mt-12 text-[10.5px] uppercase tracking-wider font-bold text-[#E3922E]">
                          Reserved
                        </div>
                      )}
                      
                      {table.status === 'cleaning' && (
                        <div className="mt-12 text-[10.5px] uppercase tracking-wider font-bold text-[#8A8E98]">
                          Cleaning
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
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-['Outfit'] text-[19px] font-bold text-[#170438]">
                          Table {selectedTableForPanel.number}
                        </div>
                        <div className="text-[12px] text-[#8A8E98] mt-1">
                          {selectedTableForPanel.capacity} guests · {selectedTableForPanel.status === 'occupied' ? 'Opened 12:58 PM' : 'Available'} · Waiter: {user?.name}
                        </div>
                      </div>
                      <div className="relative">
                        <button
                          onClick={() => setShowStatusMenu(!showStatusMenu)}
                          className="w-8 h-8 rounded-lg bg-[#F1F2F4] flex items-center justify-center hover:bg-[#E5E7EB] transition-colors"
                        >
                          <Settings className="w-4 h-4 text-[#8A8E98]" />
                        </button>
                        {showStatusMenu && (
                          <div className="absolute right-0 top-10 bg-white rounded-lg shadow-lg border border-[#DADCE1] py-2 w-40 z-20">
                            <button
                              onClick={() => {
                                handleUpdateTableStatus(selectedTableForPanel.id, 'available')
                                setShowStatusMenu(false)
                              }}
                              className="w-full px-4 py-2 text-left text-[13px] hover:bg-[#F1F2F4] text-[#170438]"
                            >
                              Mark Available
                            </button>
                            <button
                              onClick={() => {
                                handleUpdateTableStatus(selectedTableForPanel.id, 'occupied')
                                setShowStatusMenu(false)
                              }}
                              className="w-full px-4 py-2 text-left text-[13px] hover:bg-[#F1F2F4] text-[#170438]"
                            >
                              Mark Occupied
                            </button>
                            <button
                              onClick={() => {
                                handleUpdateTableStatus(selectedTableForPanel.id, 'cleaning')
                                setShowStatusMenu(false)
                              }}
                              className="w-full px-4 py-2 text-left text-[13px] hover:bg-[#F1F2F4] text-[#170438]"
                            >
                              Mark Cleaning
                            </button>
                            <button
                              onClick={() => {
                                handleUpdateTableStatus(selectedTableForPanel.id, 'reserved')
                                setShowStatusMenu(false)
                              }}
                              className="w-full px-4 py-2 text-left text-[13px] hover:bg-[#F1F2F4] text-[#170438]"
                            >
                              Mark Reserved
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 p-[14px_22px] overflow-auto">
                    {(() => {
                      const tableOrders = activeOrders.filter(o => o.table_id === selectedTableForPanel.id)
                      if (tableOrders.length === 0) {
                        return (
                          <div className="text-center text-[#8A8E98] py-8">
                            {selectedTableForPanel.status === 'occupied' ? 'No active orders' : 'Table is available'}
                          </div>
                        )
                      }
                      return tableOrders.map(order => (
                        <div key={order.id} className="space-y-3">
                          <div className="text-[12px] font-semibold text-[#170438] uppercase tracking-wider">
                            Order #{order.id.slice(0, 8)}
                          </div>
                          <div className="text-[11px] text-[#8A8E98]">
                            {new Date(order.created_at).toLocaleTimeString()}
                          </div>
                          <div className="space-y-2">
                            {(() => {
                              const orderItems = cart.filter(item => item.order_id === order.id)
                              if (orderItems.length === 0) {
                                return <div className="text-[11px] text-[#8A8E98]">No items</div>
                              }
                              return orderItems.map(item => (
                                <div key={item.id} className="flex justify-between py-2 border-b border-[#F1F2F4]">
                                  <div className="flex gap-2.5">
                                    <div className="w-6 h-6 rounded-[7px] bg-[#EEF5FA] text-[#39129A] flex items-center justify-center font-['IBM_Plex_Mono'] text-[12px] font-bold flex-shrink-0">
                                      {item.quantity}
                                    </div>
                                    <div>
                                      <div className="text-[13.5px] font-semibold">{item.product_name}</div>
                                      {item.notes && (
                                        <div className="text-[11px] text-[#8A8E98]">{item.notes}</div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="font-['IBM_Plex_Mono'] text-[13px] font-semibold text-[#170438]">
                                    {formatCurrency(item.total_price)}
                                  </div>
                                </div>
                              ))
                            })()}
                          </div>
                        </div>
                      ))
                    })()}
                  </div>

                  <div className="p-[18px_22px_22px] border-t border-[#F1F2F4">
                    {(() => {
                      const tableOrders = activeOrders.filter(o => o.table_id === selectedTableForPanel.id)
                      const subtotal = tableOrders.reduce((sum, order) => sum + order.subtotal, 0)
                      const total = tableOrders.reduce((sum, order) => sum + order.total, 0)
                      const serviceCharge = subtotal * 0.05
                      
                      if (tableOrders.length === 0) {
                        return null
                      }
                      
                      return (
                        <>
                          <div className="flex justify-between text-[13px] text-[#8A8E98] mb-1.5">
                            <span>Subtotal</span>
                            <span>{formatCurrency(subtotal)}</span>
                          </div>
                          <div className="flex justify-between text-[13px] text-[#8A8E98] mb-1.5">
                            <span>Service (5%)</span>
                            <span>{formatCurrency(serviceCharge)}</span>
                          </div>
                          <div className="flex justify-between font-['Outfit'] font-bold text-[18px] mt-2 mb-4">
                            <span>Total</span>
                            <span>{formatCurrency(total)}</span>
                          </div>
                        </>
                      )
                    })()}
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleOpenOrderModal(selectedTableForPanel)}
                        className="flex-1 py-3 rounded-[11px] font-bold text-[13px] border-none cursor-pointer font-['Inter'] bg-[#F1F2F4] text-[#170438]"
                      >
                        Add Items
                      </button>
                      <button 
                        onClick={() => setShowMoveTableModal(true)}
                        className="flex-1 py-3 rounded-[11px] font-bold text-[13px] border-none cursor-pointer font-['Inter'] bg-[#F1F2F4] text-[#170438]"
                      >
                        Move
                      </button>
                      <button 
                        onClick={() => setShowMergeTableModal(true)}
                        className="flex-1 py-3 rounded-[11px] font-bold text-[13px] border-none cursor-pointer font-['Inter'] bg-[#F1F2F4] text-[#170438]"
                      >
                        Merge
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedTableForPanel(tables.find(t => t.id === selectedTableForPanel.id))
                          setActiveTab('bill')
                        }}
                        className="flex-1 py-3 rounded-[11px] font-bold text-[13px] border-none cursor-pointer font-['Inter'] bg-[#170438] text-white"
                      >
                        Bill
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'orders' && (
            <div className="flex-1 p-[22px_32px] overflow-auto">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="text-[16px] font-semibold font-['Outfit'] text-[#170438]">
                    Orders — {filteredOrders.length}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setOrderStatusFilter('active')}
                      className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold ${
                        orderStatusFilter === 'active' ? 'bg-[#170438] text-white' : 'bg-white border border-[#DADCE1] text-[#170438]'
                      }`}
                    >
                      Active ({activeOrders.length})
                    </button>
                    <button
                      onClick={() => setOrderStatusFilter('completed')}
                      className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold ${
                        orderStatusFilter === 'completed' ? 'bg-[#170438] text-white' : 'bg-white border border-[#DADCE1] text-[#170438]'
                      }`}
                    >
                      Completed ({completedOrders.length})
                    </button>
                    <button
                      onClick={() => setOrderStatusFilter('cancelled')}
                      className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold ${
                        orderStatusFilter === 'cancelled' ? 'bg-[#170438] text-white' : 'bg-white border border-[#DADCE1] text-[#170438]'
                      }`}
                    >
                      Cancelled ({cancelledOrders.length})
                    </button>
                  </div>
                </div>
                {selectedTableForPanel && orderStatusFilter === 'active' && (
                  <button
                    onClick={() => handleOpenOrderModal(selectedTableForPanel)}
                    className="flex items-center gap-2 px-4 py-2 rounded-[10px] bg-[#170438] text-white text-[13px] font-semibold hover:bg-[#2C0F72] transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    New Order
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {filteredOrders.length === 0 ? (
                  <div className="text-center text-[#8A8E98] py-8">
                    No {orderStatusFilter} orders
                  </div>
                ) : (
                  filteredOrders.map(order => (
                    <div key={order.id} className="bg-white rounded-[16px] p-4 border border-[#DADCE1]">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-['Outfit'] font-bold text-[#170438]">
                            Table {(order as any).tables?.number || 'N/A'}
                          </div>
                          <div className="text-[12px] text-[#8A8E98] mt-1">
                            {new Date(order.created_at).toLocaleString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-[11px] font-semibold ${
                            order.status === 'new' ? 'bg-[#E3922E] text-white' :
                            order.status === 'preparing' ? 'bg-[#39129A] text-white' :
                            order.status === 'ready' ? 'bg-[#2FAF7B] text-white' :
                            order.status === 'served' ? 'bg-[#6FA3C7] text-white' :
                            order.status === 'completed' ? 'bg-[#8A8E98] text-white' :
                            order.status === 'cancelled' ? 'bg-[#E1505C] text-white' :
                            'bg-[#8A8E98] text-white'
                          }`}>
                            {order.status}
                          </span>
                          <span className="font-['IBM_Plex_Mono'] font-bold text-[#170438]">
                            {formatCurrency(order.total)}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        {order.status === 'ready' && (
                          <button
                            onClick={() => handleMarkOrderServed(order.id)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-[8px] bg-[#2FAF7B] text-white text-[12px] font-semibold hover:bg-[#248E62] transition-colors"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Mark Served
                          </button>
                        )}
                        {(order.status === 'new' || order.status === 'preparing') && (
                          <button
                            onClick={() => handleOpenEditOrderModal(order)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-[8px] bg-[#F1F2F4] text-[#170438] text-[12px] font-semibold hover:bg-[#E5E7EB] transition-colors"
                          >
                            Edit
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedTableForPanel(tables.find(t => t.id === order.table_id) || null)
                            setActiveTab('bill')
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-[8px] bg-[#F1F2F4] text-[#170438] text-[12px] font-semibold hover:bg-[#E5E7EB] transition-colors"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          View Bill
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'menu' && (
            <div className="flex-1 p-[22px_32px] overflow-auto">
              <div className="flex items-center justify-between mb-4">
                <div className="text-[16px] font-semibold font-['Outfit'] text-[#170438]">
                  Menu — {products.length} items
                </div>
                <div className="bg-[#F1F2F4] rounded-[10px] px-4 py-2 text-[13px] text-[#8A8E98] w-[220px] flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  <input 
                    type="text" 
                    placeholder="Search menu items…" 
                    className="bg-transparent outline-none w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
                    selectedCategory === 'all' ? 'bg-[#170438] text-white' : 'bg-white border border-[#DADCE1] text-[#170438]'
                  }`}
                >
                  All
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
                      selectedCategory === cat.id ? 'bg-[#170438] text-white' : 'bg-white border border-[#DADCE1] text-[#170438]'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-4">
                {filteredProducts.map(product => (
                  <button
                    key={product.id}
                    onClick={() => {
                      if (selectedTableForPanel) {
                        handleAddToCart(product)
                      } else {
                        toast.error('Please select a table first')
                      }
                    }}
                    disabled={!product.is_available}
                    className={`bg-white rounded-[16px] p-4 text-left hover:shadow-lg transition-all border-2 relative ${
                      !product.is_available ? 'opacity-50 cursor-not-allowed border-[#DADCE1]' : 'border-[#DADCE1] hover:border-[#8FB9D6]'
                    }`}
                  >
                    {!product.is_available && (
                      <div className="absolute top-2 right-2 px-2 py-1 bg-[#8A8E98] text-white text-[10px] font-semibold rounded-full">
                        Unavailable
                      </div>
                    )}
                    <div className="w-full h-24 bg-[#F1F2F4] rounded-lg mb-3 flex items-center justify-center">
                      <UtensilsCrossed className="w-8 h-8 text-[#8A8E98]" />
                    </div>
                    <p className="font-semibold text-[#170438]">{product.name}</p>
                    {product.name_so && (
                      <p className="text-sm text-[#8A8E98]">{product.name_so}</p>
                    )}
                    <p className="text-lg font-bold text-[#39129A] mt-2">
                      {formatCurrency(product.selling_price)}
                    </p>
                  </button>
                ))}
              </div>

              {/* Cart Panel */}
              {selectedTableForPanel && cart.length > 0 && (
                <div className="fixed bottom-0 right-0 w-[380px] bg-white border-t border-[#DADCE1] shadow-lg rounded-tl-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-['Outfit'] font-bold text-[#170438]">
                      Current Order - Table {selectedTableForPanel.number}
                    </div>
                    <button
                      onClick={() => setCart([])}
                      className="text-[#E1505C] text-[12px] font-semibold hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="max-h-48 overflow-auto space-y-2 mb-3">
                    {cart.map(item => (
                      <div key={item.id} className="flex items-center justify-between bg-[#F1F2F4] rounded-lg p-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleUpdateQuantity(item.product_id, -1)}
                            className="w-6 h-6 rounded bg-white flex items-center justify-center text-[#170438] font-bold"
                          >
                            -
                          </button>
                          <span className="font-['IBM_Plex_Mono'] font-bold text-[#170438]">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateQuantity(item.product_id, 1)}
                            className="w-6 h-6 rounded bg-white flex items-center justify-center text-[#170438] font-bold"
                          >
                            +
                          </button>
                        </div>
                        <div className="flex-1 ml-2">
                          <div className="text-[13px] font-semibold text-[#170438]">{item.product_name}</div>
                        </div>
                        <div className="font-['IBM_Plex_Mono'] font-bold text-[#170438]">
                          {formatCurrency(item.total_price)}
                        </div>
                        <button
                          onClick={() => handleRemoveFromCart(item.product_id)}
                          className="ml-2 text-[#E1505C]"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSendToKitchen()}
                      className="flex-1 py-3 rounded-[11px] font-bold text-[13px] border-none cursor-pointer font-['Inter'] bg-[#2FAF7B] text-white hover:bg-[#248E62] transition-colors"
                    >
                      Send to Kitchen
                    </button>
                    <button
                      onClick={() => handlePrintKitchenTicket()}
                      className="flex-1 py-3 rounded-[11px] font-bold text-[13px] border-none cursor-pointer font-['Inter'] bg-[#170438] text-white hover:bg-[#2C0F72] transition-colors"
                    >
                      Print Ticket
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'bill' && (
            <div className="flex-1 p-[22px_32px] overflow-auto">
              <div className="text-[16px] font-semibold font-['Outfit'] text-[#170438] mb-4">
                Bill — Select a table to view bill
              </div>
              {!selectedTableForPanel ? (
                <div className="text-center text-[#8A8E98] py-8">
                  Please select a table from the Tables section to view its bill
                </div>
              ) : (
                <div className="max-w-2xl mx-auto">
                  {/* Bill Header */}
                  <div className="bg-white rounded-[16px] p-6 border border-[#DADCE1] mb-4">
                    <div className="text-center mb-4">
                      <div className="font-['Sora'] text-[28px] font-bold text-[#170438]">
                        Som<span className="text-[#86abc9]">Bill</span>
                      </div>
                      <div className="text-[12px] text-[#8A8E98]">Restaurant POS System</div>
                    </div>
                    <div className="flex justify-between items-start border-t border-[#F1F2F4] pt-4">
                      <div>
                        <div className="font-['Outfit'] text-[18px] font-bold text-[#170438]">
                          Table {selectedTableForPanel.number}
                        </div>
                        <div className="text-[12px] text-[#8A8E98] mt-1">
                          {new Date().toLocaleDateString()} · {new Date().toLocaleTimeString()}
                        </div>
                        <div className="text-[12px] text-[#8A8E98]">
                          Waiter: {user?.name}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[12px] text-[#8A8E98]">Bill #</div>
                        <div className="font-['IBM_Plex_Mono'] text-[14px] font-bold text-[#170438]">
                          {Math.floor(Math.random() * 10000)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bill Items */}
                  <div className="bg-white rounded-[16px] p-6 border border-[#DADCE1] mb-4">
                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between py-2 border-b border-[#F1F2F4]">
                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-[7px] bg-[#EEF5FA] text-[#39129A] flex items-center justify-center font-['IBM_Plex_Mono'] text-[12px] font-bold flex-shrink-0">
                            2
                          </div>
                          <div>
                            <div className="text-[14px] font-semibold text-[#170438]">Bariis Iskukaris</div>
                            <div className="text-[11px] text-[#8A8E98]">No raisins</div>
                          </div>
                        </div>
                        <div className="font-['IBM_Plex_Mono'] text-[14px] font-semibold text-[#170438]">
                          $18.00
                        </div>
                      </div>
                      <div className="flex justify-between py-2 border-b border-[#F1F2F4]">
                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-[7px] bg-[#EEF5FA] text-[#39129A] flex items-center justify-center font-['IBM_Plex_Mono'] text-[12px] font-bold flex-shrink-0">
                            1
                          </div>
                          <div>
                            <div className="text-[14px] font-semibold text-[#170438]">Grilled Hilib Ari</div>
                          </div>
                        </div>
                        <div className="font-['IBM_Plex_Mono'] text-[14px] font-semibold text-[#170438]">
                          $12.50
                        </div>
                      </div>
                      <div className="flex justify-between py-2 border-b border-[#F1F2F4]">
                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-[7px] bg-[#EEF5FA] text-[#39129A] flex items-center justify-center font-['IBM_Plex_Mono'] text-[12px] font-bold flex-shrink-0">
                            2
                          </div>
                          <div>
                            <div className="text-[14px] font-semibold text-[#170438]">Fresh Lime Juice</div>
                          </div>
                        </div>
                        <div className="font-['IBM_Plex_Mono'] text-[14px] font-semibold text-[#170438]">
                          $4.00
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 pt-4 border-t border-[#DADCE1]">
                      <div className="flex justify-between text-[13px] text-[#8A8E98]">
                        <span>Subtotal</span>
                        <span>$34.50</span>
                      </div>
                      <div className="flex justify-between text-[13px] text-[#8A8E98]">
                        <span>Tax (10%)</span>
                        <span>$3.45</span>
                      </div>
                      <div className="flex justify-between text-[13px] text-[#8A8E98]">
                        <span>Service (5%)</span>
                        <span>$1.73</span>
                      </div>
                      {discountAmount > 0 && (
                        <div className="flex justify-between text-[13px] text-[#E1505C]">
                          <span>Discount ({discountReason})</span>
                          <span>-${formatCurrency(discountAmount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-['Outfit'] font-bold text-[24px] mt-4 pt-4 border-t border-[#DADCE1]">
                        <span>Total</span>
                        <span className="text-[#39129A]">${formatCurrency(36.23 - discountAmount)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <button
                      onClick={() => setShowDiscountModal(true)}
                      className="py-3 rounded-[11px] font-bold text-[13px] border-none cursor-pointer font-['Inter'] bg-[#F1F2F4] text-[#170438] hover:bg-[#E5E7EB] transition-colors"
                    >
                      Apply Discount
                    </button>
                    <button
                      onClick={() => setSplitType('even')}
                      className="py-3 rounded-[11px] font-bold text-[13px] border-none cursor-pointer font-['Inter'] bg-[#F1F2F4] text-[#170438] hover:bg-[#E5E7EB] transition-colors"
                    >
                      Split Bill
                    </button>
                  </div>

                  {/* Split Options */}
                  {splitType === 'even' && (
                    <div className="bg-white rounded-[16px] p-6 border border-[#DADCE1] mb-4">
                      <h3 className="font-['Outfit'] font-bold text-[#170438] mb-4">Split Evenly</h3>
                      <div className="flex items-center gap-4 mb-4">
                        <label className="text-[13px] text-[#8A8E98]">Number of guests:</label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={splitGuests}
                          onChange={(e) => setSplitGuests(parseInt(e.target.value) || 2)}
                          className="w-20 px-3 py-2 rounded-lg border border-[#DADCE1] text-[13px]"
                        />
                      </div>
                      <div className="bg-[#F1F2F4] rounded-lg p-4">
                        <div className="text-[13px] text-[#8A8E98] mb-1">Each person pays:</div>
                        <div className="font-['IBM_Plex_Mono'] text-[20px] font-bold text-[#39129A]">
                          {formatCurrency((36.23 - discountAmount) / splitGuests)}
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => setSplitType(null)}
                          className="flex-1 py-2 rounded-lg text-[13px] font-semibold bg-[#F1F2F4] text-[#170438]"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => setSplitType(null)}
                          className="flex-1 py-2 rounded-lg text-[13px] font-semibold bg-[#170438] text-white"
                        >
                          Confirm Split
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Payment Actions */}
                  <div className="bg-white rounded-[16px] p-6 border border-[#DADCE1]">
                    <h3 className="font-['Outfit'] font-bold text-[#170438] mb-4">Payment</h3>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <button className="py-3 rounded-[11px] font-bold text-[13px] border-none cursor-pointer font-['Inter'] bg-[#170438] text-white hover:bg-[#2C0F72] transition-colors">
                        Cash
                      </button>
                      <button className="py-3 rounded-[11px] font-bold text-[13px] border-none cursor-pointer font-['Inter'] bg-[#39129A] text-white hover:bg-[#4B1FBE] transition-colors">
                        Card
                      </button>
                      <button className="py-3 rounded-[11px] font-bold text-[13px] border-none cursor-pointer font-['Inter'] bg-[#F1F2F4] text-[#170438] hover:bg-[#E5E7EB] transition-colors">
                        Split
                      </button>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handlePrintReceipt()}
                        className="flex-1 py-3 rounded-[11px] font-bold text-[13px] border-none cursor-pointer font-['Inter'] bg-[#F1F2F4] text-[#170438] hover:bg-[#E5E7EB] transition-colors"
                      >
                        Print Receipt
                      </button>
                      <button
                        onClick={() => handleMarkAsPaid()}
                        className="flex-1 py-3 rounded-[11px] font-bold text-[13px] border-none cursor-pointer font-['Inter'] bg-[#2FAF7B] text-white hover:bg-[#248E62] transition-colors"
                      >
                        Mark as Paid
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Discount Modal */}
          {showDiscountModal && (
            <Modal
              isOpen={showDiscountModal}
              onClose={() => setShowDiscountModal(false)}
              title="Apply Discount"
              size="md"
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-[13px] font-semibold text-[#170438] mb-2">
                    Discount Amount
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2 rounded-lg border border-[#DADCE1] text-[13px]"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-[#170438] mb-2">
                    Reason (Required)
                  </label>
                  <select
                    value={discountReason}
                    onChange={(e) => setDiscountReason(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-[#DADCE1] text-[13px]"
                  >
                    <option value="">Select a reason...</option>
                    <option value="Manager Comp">Manager Comp</option>
                    <option value="Loyalty Discount">Loyalty Discount</option>
                    <option value="Service Issue">Service Issue</option>
                    <option value="Promotion">Promotion</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDiscountModal(false)}
                    className="flex-1 py-2 rounded-lg text-[13px] font-semibold bg-[#F1F2F4] text-[#170438]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (discountReason) {
                        setShowDiscountModal(false)
                        toast.success('Discount applied')
                      } else {
                        toast.error('Please select a reason')
                      }
                    }}
                    className="flex-1 py-2 rounded-lg text-[13px] font-semibold bg-[#170438] text-white"
                  >
                    Apply Discount
                  </button>
                </div>
              </div>
            </Modal>
          )}

          {/* Move Table Modal */}
          {showMoveTableModal && selectedTableForPanel && (
            <Modal
              isOpen={showMoveTableModal}
              onClose={() => setShowMoveTableModal(false)}
              title="Move Table"
              size="md"
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-[13px] font-semibold text-[#170438] mb-2">
                    Select Target Table
                  </label>
                  <select
                    className="w-full px-4 py-2 rounded-lg border border-[#DADCE1] text-[13px]"
                    onChange={(e) => handleMoveTable(e.target.value)}
                  >
                    <option value="">Select a table...</option>
                    {tables.filter(t => t.id !== selectedTableForPanel.id && t.status === 'available').map(table => (
                      <option key={table.id} value={table.id}>
                        Table {table.number} ({table.capacity} seats)
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowMoveTableModal(false)}
                    className="flex-1 py-2 rounded-lg text-[13px] font-semibold bg-[#F1F2F4] text-[#170438]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </Modal>
          )}

          {/* Merge Table Modal */}
          {showMergeTableModal && selectedTableForPanel && (
            <Modal
              isOpen={showMergeTableModal}
              onClose={() => setShowMergeTableModal(false)}
              title="Merge Tables"
              size="md"
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-[13px] font-semibold text-[#170438] mb-2">
                    Select Target Table to Merge Into
                  </label>
                  <select
                    className="w-full px-4 py-2 rounded-lg border border-[#DADCE1] text-[13px]"
                    onChange={(e) => handleMergeTables(e.target.value)}
                  >
                    <option value="">Select a table...</option>
                    {tables.filter(t => t.id !== selectedTableForPanel.id && t.status === 'occupied').map(table => (
                      <option key={table.id} value={table.id}>
                        Table {table.number} ({table.capacity} seats)
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowMergeTableModal(false)}
                    className="flex-1 py-2 rounded-lg text-[13px] font-semibold bg-[#F1F2F4] text-[#170438]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </Modal>
          )}

          {/* Edit Order Modal */}
          {showEditOrderModal && selectedOrderForEdit && (
            <Modal
              isOpen={showEditOrderModal}
              onClose={() => setShowEditOrderModal(false)}
              title={`Edit Order - Table ${(selectedOrderForEdit as any).tables?.number}`}
              size="xl"
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-[13px] font-semibold text-[#170438] mb-2">
                    Order Notes
                  </label>
                  <textarea
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-[#DADCE1] text-[13px]"
                    rows={2}
                    placeholder="Add special instructions..."
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-[#170438] mb-2">
                    Order Items
                  </label>
                  <div className="space-y-2 max-h-64 overflow-auto">
                    {editOrderCart.map(item => (
                      <div key={item.id} className="flex items-center justify-between bg-[#F1F2F4] rounded-lg p-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const newCart = editOrderCart.map(i =>
                                i.id === item.id ? { ...i, quantity: Math.max(1, i.quantity - 1), total_price: Math.max(1, i.quantity - 1) * i.unit_price } : i
                              )
                              setEditOrderCart(newCart)
                            }}
                            className="w-6 h-6 rounded bg-white flex items-center justify-center text-[#170438] font-bold"
                          >
                            -
                          </button>
                          <span className="font-['IBM_Plex_Mono'] font-bold text-[#170438]">{item.quantity}</span>
                          <button
                            onClick={() => {
                              const newCart = editOrderCart.map(i =>
                                i.id === item.id ? { ...i, quantity: i.quantity + 1, total_price: (i.quantity + 1) * i.unit_price } : i
                              )
                              setEditOrderCart(newCart)
                            }}
                            className="w-6 h-6 rounded bg-white flex items-center justify-center text-[#170438] font-bold"
                          >
                            +
                          </button>
                        </div>
                        <div className="flex-1 ml-2">
                          <div className="text-[13px] font-semibold text-[#170438]">{item.product_name}</div>
                        </div>
                        <div className="font-['IBM_Plex_Mono'] font-bold text-[#170438]">
                          {formatCurrency(item.total_price)}
                        </div>
                        <button
                          onClick={() => setEditOrderCart(editOrderCart.filter(i => i.id !== item.id))}
                          className="ml-2 text-[#E1505C]"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowEditOrderModal(false)
                      setEditOrderCart([])
                      setOrderNotes('')
                      setSelectedOrderForEdit(null)
                    }}
                    className="flex-1 py-2 rounded-lg text-[13px] font-semibold bg-[#F1F2F4] text-[#170438]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEditOrder}
                    className="flex-1 py-2 rounded-lg text-[13px] font-semibold bg-[#170438] text-white"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </Modal>
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
