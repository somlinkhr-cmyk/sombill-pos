import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { formatCurrency, formatDateTime } from '../../lib/utils'
import { Card, CardHeader, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import toast from 'react-hot-toast'
import {
  ChefHat,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  LogOut,
  UtensilsCrossed,
  Bell,
  Flame,
  Users,
  Timer,
  Settings,
  Filter,
  Search,
} from 'lucide-react'

interface Order {
  id: string
  table_id: string
  table_number?: number
  status: 'new' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled'
  order_type: 'dine_in' | 'takeaway' | 'delivery'
  total: number
  notes?: string
  created_at: string
  preparing_started_at?: string
  ready_at?: string
  served_at?: string
  kitchen_station?: string
  items?: OrderItem[]
  waiter?: {
    name: string
  }
}

interface OrderItem {
  id: string
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
  notes?: string
  status: 'pending' | 'preparing' | 'ready' | 'served'
  preparing_started_at?: string
  ready_at?: string
}

interface KitchenStation {
  id: string
  name: string
  description?: string
  display_order: number
  is_active: boolean
}

export default function KitchenDisplaySystem() {
  const { user, logout, hasModuleAccess } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStation, setSelectedStation] = useState<string>('all')
  const [stations, setStations] = useState<KitchenStation[]>([])
  const [currentTime, setCurrentTime] = useState(new Date())
  const [stats, setStats] = useState({
    new: 0,
    preparing: 0,
    ready: 0,
    total: 0,
  })

  useEffect(() => {
    console.log('KitchenDisplaySystem: user', user)
    console.log('KitchenDisplaySystem: hasModuleAccess', hasModuleAccess('kitchen_display'))
    
    if (!hasModuleAccess('kitchen_display')) {
      toast.error('Your subscription plan does not include the Kitchen Display System module')
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
  }, [selectedStation])

  async function loadData() {
    setLoading(true)
    try {
      console.log('KitchenDisplaySystem: Loading data...')
      
      // Load kitchen stations - filter by tenant_id if available, otherwise load all
      let stationsQuery = supabase.from('kitchen_stations').select('*').eq('is_active', true).order('display_order')
      if (user?.tenant_id) {
        stationsQuery = stationsQuery.eq('tenant_id', user.tenant_id)
      }
      
      const { data: stationsData, error: stationsError } = await stationsQuery
      
      if (stationsError) {
        console.error('KitchenDisplaySystem: Stations error', stationsError)
      } else {
        console.log('KitchenDisplaySystem: Stations loaded', stationsData?.length)
        setStations(stationsData || [])
      }

      // Load orders - filter by tenant_id if available, otherwise load all
      let query = supabase
        .from('orders')
        .select('*, tables(number), users(name)')
        .in('status', ['new', 'preparing', 'ready'])
        .order('created_at', { ascending: false })

      if (user?.tenant_id) {
        query = query.eq('tenant_id', user.tenant_id)
      }

      if (selectedStation !== 'all') {
        query = query.eq('kitchen_station', selectedStation)
      }

      const { data: ordersData, error: ordersError } = await query

      if (ordersError) {
        console.error('KitchenDisplaySystem: Orders error', ordersError)
      } else {
        console.log('KitchenDisplaySystem: Orders loaded', ordersData?.length)
        
        // Load order items for each order
        const ordersWithItems = await Promise.all(
          (ordersData || []).map(async (order: any) => {
            let itemsQuery = supabase.from('order_items').select('*').eq('order_id', order.id)
            if (user?.tenant_id) {
              itemsQuery = itemsQuery.eq('tenant_id', user.tenant_id)
            }
            
            const { data: items } = await itemsQuery
            
            return {
              ...order,
              table_number: order.tables?.number,
              waiter: order.users ? { name: order.users.name } : undefined,
              items: items || [],
            }
          })
        )
        
        setOrders(ordersWithItems)
        
        // Update stats
        setStats({
          new: ordersWithItems.filter(o => o.status === 'new').length,
          preparing: ordersWithItems.filter(o => o.status === 'preparing').length,
          ready: ordersWithItems.filter(o => o.status === 'ready').length,
          total: ordersWithItems.length,
        })
      }
    } catch (error) {
      console.error('KitchenDisplaySystem: Error loading data:', error)
      toast.error('Failed to load data')
    } finally {
      console.log('KitchenDisplaySystem: Loading complete')
      setLoading(false)
    }
  }

  function setupRealtimeSubscriptions() {
    // Subscribe to order changes - only filter by tenant_id if available
    const ordersFilter = user?.tenant_id ? `tenant_id=eq.${user.tenant_id}` : undefined
    
    const ordersSubscription = supabase
      .channel(`kitchen-orders-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: ordersFilter,
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            loadData()
          } else if (payload.eventType === 'DELETE') {
            setOrders(prev => prev.filter(o => o.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    // Subscribe to order item changes - only filter by tenant_id if available
    const orderItemsFilter = user?.tenant_id ? `tenant_id=eq.${user.tenant_id}` : undefined
    
    const orderItemsSubscription = supabase
      .channel(`kitchen-order-items-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_items',
          filter: orderItemsFilter,
        },
        (payload) => {
          loadData()
        }
      )
      .subscribe()

    return () => {
      ordersSubscription.unsubscribe()
      orderItemsSubscription.unsubscribe()
    }
  }

  async function handleUpdateOrderStatus(orderId: string, status: Order['status']) {
    try {
      const updateData: any = { status }
      
      if (status === 'preparing') {
        updateData.preparing_started_at = new Date().toISOString()
      } else if (status === 'ready') {
        updateData.ready_at = new Date().toISOString()
      } else if (status === 'served') {
        updateData.served_at = new Date().toISOString()
      }

      await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)
      
      toast.success(`Order marked as ${status}`)
      loadData()
    } catch (error) {
      console.error('Error updating order status:', error)
      toast.error('Failed to update order status')
    }
  }

  async function handleUpdateItemStatus(itemId: string, status: OrderItem['status']) {
    try {
      const updateData: any = { status }
      
      if (status === 'preparing') {
        updateData.preparing_started_at = new Date().toISOString()
      } else if (status === 'ready') {
        updateData.ready_at = new Date().toISOString()
      }

      await supabase
        .from('order_items')
        .update(updateData)
        .eq('id', itemId)
      
      toast.success(`Item marked as ${status}`)
      loadData()
    } catch (error) {
      console.error('Error updating item status:', error)
      toast.error('Failed to update item status')
    }
  }

  function getOrderElapsedTime(order: Order): string {
    const startTime = order.preparing_started_at || order.created_at
    if (!startTime) return 'N/A'
    const elapsed = Date.now() - new Date(startTime).getTime()
    const minutes = Math.floor(elapsed / 60000)
    const seconds = Math.floor((elapsed % 60000) / 1000)
    return `${minutes}m ${seconds}s`
  }

  function getItemElapsedTime(item: OrderItem): string {
    const startTime = item.preparing_started_at || new Date().toISOString()
    if (!startTime) return 'N/A'
    const elapsed = Date.now() - new Date(startTime).getTime()
    const minutes = Math.floor(elapsed / 60000)
    const seconds = Math.floor((elapsed % 60000) / 1000)
    return `${minutes}m ${seconds}s`
  }

  function isOrderDelayed(order: Order): boolean {
    if (!order.created_at) return false
    const elapsed = Date.now() - new Date(order.created_at).getTime()
    return elapsed > 15 * 60 * 1000 // 15 minutes
  }

  function isItemDelayed(item: OrderItem): boolean {
    if (!item.preparing_started_at) return false
    const elapsed = Date.now() - new Date(item.preparing_started_at).getTime()
    return elapsed > 10 * 60 * 1000 // 10 minutes
  }

  const filteredOrders = orders.filter(order => {
    if (selectedStation === 'all') return true
    return order.kitchen_station === selectedStation
  })

  const ordersByStatus = {
    new: filteredOrders.filter(o => o.status === 'new'),
    preparing: filteredOrders.filter(o => o.status === 'preparing'),
    ready: filteredOrders.filter(o => o.status === 'ready'),
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 text-white" />
          <p className="text-white">Loading Kitchen Display System...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-white" style={{
      background: 'radial-gradient(circle at 15% 0%, rgba(143,185,214,0.10), transparent 40%), radial-gradient(circle at 85% 100%, rgba(75,31,190,0.25), transparent 50%), #170438'
    }}>
      {/* Top Bar */}
      <div className="flex items-center justify-between px-8 py-[18px] border-b border-[rgba(143,185,214,0.18)] bg-[rgba(23,4,56,0.6)] backdrop-blur-[6px] sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <svg className="w-[34px] h-[34px]" viewBox="0 0 100 100" fill="none">
            <path d="M62 8 L28 34 C20 40 20 50 28 56 L62 82" stroke="#DDE1E6" strokeWidth="16" strokeLinecap="round"/>
            <path d="M38 18 L72 44 C80 50 80 60 72 66 L38 92" stroke="#8FB9D6" strokeWidth="16" strokeLinecap="round"/>
          </svg>
          <div>
            <div className="font-['Outfit'] font-bold text-[20px] tracking-[0.2px]">
              Som<span className="text-[#8FB9D6]">Bill</span>
            </div>
            <div className="text-[11px] text-[#C7CAD2] font-medium tracking-[0.6px] uppercase mt-0.5">
              Kitchen Display
            </div>
          </div>
        </div>

        {/* Station Tabs */}
        <div className="flex gap-1.5 bg-white/5 p-1.5 rounded-[12px] border border-white/8">
          <button
            onClick={() => setSelectedStation('all')}
            className={`px-4.5 py-2 rounded-[9px] text-[13px] font-semibold cursor-pointer transition-all whitespace-nowrap ${
              selectedStation === 'all' ? 'bg-[#8FB9D6] text-[#170438]' : 'text-[#C7CAD2] hover:bg-white/8 hover:text-white'
            }`}
          >
            All Stations
          </button>
          {stations.map(station => (
            <button
              key={station.id}
              onClick={() => setSelectedStation(station.id)}
              className={`px-4.5 py-2 rounded-[9px] text-[13px] font-semibold cursor-pointer transition-all whitespace-nowrap ${
                selectedStation === station.id ? 'bg-[#8FB9D6] text-[#170438]' : 'text-[#C7CAD2] hover:bg-white/8 hover:text-white'
              }`}
            >
              {station.name}
            </button>
          ))}
        </div>

        <div className="text-right">
          <div className="font-['IBM_Plex_Mono'] text-[22px] font-semibold text-[#B7D4E8]">
            {currentTime.toLocaleTimeString()}
          </div>
          <div className="text-[11px] text-[#9EA2AC] mt-0.5">
            {currentTime.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        </div>
      </div>

      {/* Stats Strip */}
      <div className="flex gap-0 px-8 py-[14px] border-b border-[rgba(143,185,214,0.12)]">
        <div className="flex-1 pr-6 border-r border-white/8">
          <div className="text-[11px] uppercase tracking-[0.7px] text-[#9EA2AC] font-semibold">
            Orders in queue
          </div>
          <div className="font-['IBM_Plex_Mono'] text-[26px] font-semibold mt-1">
            {stats.new}
          </div>
        </div>
        <div className="flex-1 pr-6 border-r border-white/8">
          <div className="text-[11px] uppercase tracking-[0.7px] text-[#9EA2AC] font-semibold">
            Avg. prep time
          </div>
          <div className="font-['IBM_Plex_Mono'] text-[26px] font-semibold mt-1">
            11m 40s
          </div>
        </div>
        <div className="flex-1 pr-6 border-r border-white/8">
          <div className="text-[11px] uppercase tracking-[0.7px] text-[#9EA2AC] font-semibold">
            Running late
          </div>
          <div className="font-['IBM_Plex_Mono'] text-[26px] font-semibold mt-1 text-[#F0A93E]">
            {orders.filter(o => isOrderDelayed(o)).length}
          </div>
        </div>
        <div className="flex-1">
          <div className="text-[11px] uppercase tracking-[0.7px] text-[#9EA2AC] font-semibold">
            Completed today
          </div>
          <div className="font-['IBM_Plex_Mono'] text-[26px] font-semibold mt-1 text-[#3FD08F]">
            86
          </div>
        </div>
      </div>

      {/* Board */}
      <div className="grid grid-cols-3 gap-5 p-6 align-start">
        {/* New Orders */}
        <div>
          <div className="flex items-center justify-between mb-3.5 px-1">
            <div className="font-['Outfit'] text-[15px] font-semibold tracking-[0.3px] flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#8FB9D6]" />
              New Orders
            </div>
            <div className="font-['IBM_Plex_Mono'] text-[12px] bg-white/8 px-2 py-0.5 rounded-[20px] text-[#E8E9ED]">
              {ordersByStatus.new.length}
            </div>
          </div>
          <div className="flex flex-col gap-3.5">
            {ordersByStatus.new.map(order => (
              <div key={order.id} className="relative bg-gradient-to-br from-white/5 to-white/1.5 border border-white/9 rounded-[16px] p-[18px_18px_16px_22px] overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-[6px] bg-[#8FB9D6]" style={{
                  clipPath: 'path("M6 0 C6 22, 0 22, 0 44 C0 66, 6 66, 6 88 L6 400 L0 400 L0 0 Z")'
                }} />
                <div className="flex justify-between items-start mb-2.5">
                  <div>
                    <div className="font-['IBM_Plex_Mono'] text-[19px] font-bold tracking-[0.3px]">
                      #{order.id.slice(-4)}
                    </div>
                    <div className="text-[11px] font-semibold text-[#170438] bg-[#B7D4E8] px-2.5 py-0.5 rounded-[20px] mt-1.5 inline-block">
                      {order.order_type === 'dine_in' ? `Table ${order.table_number || 'N/A'}` : 'Takeaway'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-['IBM_Plex_Mono'] text-[20px] font-bold ${isOrderDelayed(order) ? 'text-[#F0555F]' : 'text-[#3FD08F]'}`}>
                      {getOrderElapsedTime(order)}
                    </div>
                    <div className="text-[10px] uppercase text-[#9EA2AC] tracking-[0.5px] mt-0.5">
                      elapsed
                    </div>
                  </div>
                </div>
                <div className="my-3 flex flex-col gap-1.5">
                  {order.items?.map(item => (
                    <div key={item.id} className="flex justify-between text-[14px] font-medium">
                      <span>
                        <span className="font-['IBM_Plex_Mono'] text-[#B7D4E8] mr-2">{item.quantity}×</span>
                        {item.product_name}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-3.5">
                  <button
                    onClick={() => handleUpdateOrderStatus(order.id, 'preparing')}
                    className="flex-1 py-2.5 rounded-[10px] font-semibold text-[13px] border-none cursor-pointer font-['Inter'] bg-white/7 text-white border border-white/14 hover:bg-white/12 transition-all active:scale-95"
                  >
                    Hold
                  </button>
                  <button
                    onClick={() => handleUpdateOrderStatus(order.id, 'preparing')}
                    className="flex-1 py-2.5 rounded-[10px] font-semibold text-[13px] border-none cursor-pointer font-['Inter'] bg-[#8FB9D6] text-[#170438] hover:bg-[#B7D4E8] transition-all active:scale-95"
                  >
                    Start Preparing
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Preparing */}
        <div>
          <div className="flex items-center justify-between mb-3.5 px-1">
            <div className="font-['Outfit'] text-[15px] font-semibold tracking-[0.3px] flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#F0A93E]" />
              Preparing
            </div>
            <div className="font-['IBM_Plex_Mono'] text-[12px] bg-white/8 px-2 py-0.5 rounded-[20px] text-[#E8E9ED]">
              {ordersByStatus.preparing.length}
            </div>
          </div>
          <div className="flex flex-col gap-3.5">
            {ordersByStatus.preparing.map(order => (
              <div key={order.id} className="relative bg-gradient-to-br from-white/5 to-white/1.5 border border-white/9 rounded-[16px] p-[18px_18px_16px_22px] overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-[6px] bg-[#F0A93E]" style={{
                  clipPath: 'path("M6 0 C6 22, 0 22, 0 44 C0 66, 6 66, 6 88 L6 400 L0 400 L0 0 Z")'
                }} />
                {isOrderDelayed(order) && (
                  <div className="absolute top-3.5 right-4 w-2 h-2 rounded-full bg-[#F0555F] animate-pulse-custom" />
                )}
                <div className="flex justify-between items-start mb-2.5">
                  <div>
                    <div className="font-['IBM_Plex_Mono'] text-[19px] font-bold tracking-[0.3px]">
                      #{order.id.slice(-4)}
                    </div>
                    <div className="text-[11px] font-semibold text-[#170438] bg-[#B7D4E8] px-2.5 py-0.5 rounded-[20px] mt-1.5 inline-block">
                      {order.order_type === 'dine_in' ? `Table ${order.table_number || 'N/A'}` : 'Takeaway'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-['IBM_Plex_Mono'] text-[20px] font-bold ${isOrderDelayed(order) ? 'text-[#F0555F]' : 'text-[#F0A93E]'}`}>
                      {getOrderElapsedTime(order)}
                    </div>
                    <div className="text-[10px] uppercase text-[#9EA2AC] tracking-[0.5px] mt-0.5">
                      elapsed
                    </div>
                  </div>
                </div>
                <div className="my-3 flex flex-col gap-1.5">
                  {order.items?.map(item => (
                    <div key={item.id} className="flex justify-between text-[14px] font-medium">
                      <span>
                        <span className="font-['IBM_Plex_Mono'] text-[#B7D4E8] mr-2">{item.quantity}×</span>
                        {item.product_name}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-3.5">
                  <button
                    className="flex-1 py-2.5 rounded-[10px] font-semibold text-[13px] border-none cursor-pointer font-['Inter'] bg-white/7 text-white border border-white/14 hover:bg-white/12 transition-all active:scale-95"
                  >
                    Notify Waiter
                  </button>
                  <button
                    onClick={() => handleUpdateOrderStatus(order.id, 'ready')}
                    className="flex-1 py-2.5 rounded-[10px] font-semibold text-[13px] border-none cursor-pointer font-['Inter'] bg-[#3FD08F] text-[#170438] hover:opacity-90 transition-all active:scale-95"
                  >
                    Mark Ready
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ready */}
        <div>
          <div className="flex items-center justify-between mb-3.5 px-1">
            <div className="font-['Outfit'] text-[15px] font-semibold tracking-[0.3px] flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#3FD08F]" />
              Ready to Serve
            </div>
            <div className="font-['IBM_Plex_Mono'] text-[12px] bg-white/8 px-2 py-0.5 rounded-[20px] text-[#E8E9ED]">
              {ordersByStatus.ready.length}
            </div>
          </div>
          <div className="flex flex-col gap-3.5">
            {ordersByStatus.ready.map(order => (
              <div key={order.id} className="relative bg-gradient-to-br from-white/5 to-white/1.5 border border-white/9 rounded-[16px] p-[18px_18px_16px_22px] overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-[6px] bg-[#3FD08F]" style={{
                  clipPath: 'path("M6 0 C6 22, 0 22, 0 44 C0 66, 6 66, 6 88 L6 400 L0 400 L0 0 Z")'
                }} />
                <div className="flex justify-between items-start mb-2.5">
                  <div>
                    <div className="font-['IBM_Plex_Mono'] text-[19px] font-bold tracking-[0.3px]">
                      #{order.id.slice(-4)}
                    </div>
                    <div className="text-[11px] font-semibold text-[#170438] bg-[#B7D4E8] px-2.5 py-0.5 rounded-[20px] mt-1.5 inline-block">
                      {order.order_type === 'dine_in' ? `Table ${order.table_number || 'N/A'}` : 'Takeaway'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-['IBM_Plex_Mono'] text-[20px] font-bold text-[#3FD08F]">
                      Ready
                    </div>
                    <div className="text-[10px] uppercase text-[#9EA2AC] tracking-[0.5px] mt-0.5">
                      {order.ready_at ? `${Math.floor((Date.now() - new Date(order.ready_at).getTime()) / 60000)}m ago` : 'Just now'}
                    </div>
                  </div>
                </div>
                <div className="my-3 flex flex-col gap-1.5">
                  {order.items?.map(item => (
                    <div key={item.id} className="flex justify-between text-[14px] font-medium">
                      <span>
                        <span className="font-['IBM_Plex_Mono'] text-[#B7D4E8] mr-2">{item.quantity}×</span>
                        {item.product_name}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-3.5">
                  <button
                    onClick={() => handleUpdateOrderStatus(order.id, 'served')}
                    className="flex-none w-full py-2.5 rounded-[10px] font-semibold text-[13px] border-none cursor-pointer font-['Inter'] bg-[#8FB9D6] text-[#170438] hover:bg-[#B7D4E8] transition-all active:scale-95"
                  >
                    Bump — Order Served
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
