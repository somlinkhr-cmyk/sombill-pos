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
      <div className="flex items-center justify-center min-h-screen bg-[#f5f6f8]">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 text-[#3d0f91]" />
          <p className="text-[#1c1530]">Loading Kitchen Display System...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#f5f6f8] text-[#1c1530] font-['Inter']">
      {/* Sidebar */}
      <aside className="w-[236px] min-w-[236px] h-screen bg-gradient-to-b from-[#190a42] via-[#22105c] to-[#3d0f91] text-white flex flex-col p-[26px_18px] relative overflow-hidden">
        <div className="absolute right-[-70px] bottom-[-70px] w-[230px] h-[230px] rounded-full bg-[radial-gradient(circle,rgba(134,171,201,0.18),transparent_70%)]" />
        
        {/* Brand */}
        <div className="flex items-center gap-2.5 p-[4px_6px_28px_6px] relative z-10">
          <svg width="34" height="34" viewBox="0 0 100 100" fill="none">
            <path d="M25 30 L55 30 Q70 30 70 42 Q70 54 55 54 L35 54 Q22 54 22 66 Q22 78 35 78 L65 78" stroke="#d7d9dc" strokeWidth="13" strokeLinecap="round" fill="none"/>
            <path d="M25 30 L55 54 L35 78" stroke="#86abc9" strokeWidth="13" strokeLinecap="round" fill="none"/>
            <circle cx="70" cy="42" r="9" fill="#86abc9"/>
            <circle cx="22" cy="78" r="9" fill="#d7d9dc"/>
          </svg>
          <div>
            <div className="font-['Sora'] font-bold text-[19px] tracking-[-0.01em]">
              Som<span className="text-[#86abc9]">Bill</span>
            </div>
            <div className="text-[10.5px] text-white/50 tracking-[0.04em] uppercase mt-0.5">
              Kitchen Display
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="text-[10.5px] font-semibold tracking-[0.09em] uppercase text-white/38 p-[16px_10px_8px] relative z-10">
          Operations
        </div>
        <ul className="flex flex-col gap-0.5 relative z-10">
          <li>
            <a href="/manager" className="flex items-center gap-[11px] p-[9px_12px] rounded-[10px] text-white/72 hover:bg-white/6 hover:text-white text-[13.5px] font-medium transition-all">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>
              Dashboard
            </a>
          </li>
          <li>
            <a href="/kitchen/system" className="flex items-center gap-[11px] p-[9px_12px] rounded-[10px] bg-white/10 text-white text-[13.5px] font-medium transition-all shadow-[inset_3px_0_0_#86abc9]">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 3v10a2 2 0 0 0 2 2h1"/><path d="M7 3v6"/><path d="M4 3h3"/><path d="M15 3c-2 0-3 2-3 4s1 3 2 3v11"/><circle cx="19" cy="19" r="0"/></svg>
              Kitchen Display
            </a>
          </li>
          <li>
            <a href="/cashier/orders" className="flex items-center gap-[11px] p-[9px_12px] rounded-[10px] text-white/72 hover:bg-white/6 hover:text-white text-[13.5px] font-medium transition-all">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2h12l2 5H4l2-5Z"/><path d="M4 7v13a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V7"/><path d="M9 12h6"/></svg>
              Orders
            </a>
          </li>
          <li>
            <a href="/manager/menu" className="flex items-center gap-[11px] p-[9px_12px] rounded-[10px] text-white/72 hover:bg-white/6 hover:text-white text-[13.5px] font-medium transition-all">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
              Menu
            </a>
          </li>
        </ul>

        {/* Footer */}
        <div className="mt-auto border-t border-white/10 pt-4 relative z-10">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-[34px] h-[34px] rounded-[9px] bg-[#86abc9] text-[#190a42] flex items-center justify-center font-['Sora'] font-bold text-[13px]">
              {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'KD'}
            </div>
            <div>
              <div className="text-[13px] font-semibold">{user?.name || 'Kitchen Staff'}</div>
              <div className="text-[11px] text-white/45">Head Chef · Line 1</div>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="flex items-center gap-[11px] p-[9px_12px] rounded-[10px] text-white/72 hover:bg-white/6 hover:text-white text-[13.5px] font-medium transition-all w-full"
          >
            <LogOut width="17" height="17" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-y-auto bg-[#f5f6f8]">
        {/* Header */}
        <header className="bg-white border-b border-[#e7e8ea] p-[18px_30px] flex items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="font-['Sora'] text-[19px] font-bold tracking-[-0.01em]">Kitchen Display — Main Line</h1>
            <p className="text-[12.5px] text-[#5c5570] mt-0.5">Hargeisa Branch · {stats.total} open orders · avg prep 11m 20s</p>
          </div>
          <div className="flex items-center gap-3.5">
            <div className="flex flex-col items-end pr-3.5 border-r border-[#e7e8ea]">
              <div className="font-['Sora'] font-bold text-[15px]">{currentTime.toLocaleTimeString()}</div>
              <div className="text-[11px] text-[#5c5570]">{currentTime.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
            </div>
            <div className="w-[38px] h-[38px] rounded-[10px] border border-[#e7e8ea] bg-white flex items-center justify-center cursor-pointer relative">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>
              <div className="absolute top-1.5 right-1.5 w-[7px] h-[7px] rounded-full bg-[#dc2626] border-[1.5px] border-white" />
            </div>
            <div className="w-[38px] h-[38px] rounded-[10px] bg-[#3d0f91] text-white flex items-center justify-center font-['Sora'] font-bold text-[13px]">
              {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'KD'}
            </div>
            <button
              onClick={() => logout()}
              className="flex items-center gap-2 px-4 py-2 rounded-[10px] border border-[#e7e8ea] bg-white text-[#1c1530] text-[13px] font-semibold hover:bg-[#f5f6f8] transition-all"
            >
              <LogOut width="16" height="16" />
              Logout
            </button>
          </div>
        </header>

        {/* Station Tabs */}
        <div className="flex gap-2 p-[16px_30px_0_30px] flex-wrap">
          <button
            onClick={() => setSelectedStation('all')}
            className={`px-4 py-2 rounded-[100px] text-[13px] font-semibold border cursor-pointer flex items-center gap-1.5 transition-all ${
              selectedStation === 'all' ? 'bg-[#3d0f91] border-[#3d0f91] text-white' : 'bg-white border-[#e7e8ea] text-[#1c1530]'
            }`}
          >
            All Stations <span className={`text-[11px] px-[7px] py-[1px] rounded-[100px] ${selectedStation === 'all' ? 'bg-white/20 text-white' : 'bg-[#f5f6f8] text-[#1c1530]'}`}>{stats.total}</span>
          </button>
          {stations.map(station => {
            const count = orders.filter(o => o.kitchen_station === station.id).length
            return (
              <button
                key={station.id}
                onClick={() => setSelectedStation(station.id)}
                className={`px-4 py-2 rounded-[100px] text-[13px] font-semibold border cursor-pointer flex items-center gap-1.5 transition-all ${
                  selectedStation === station.id ? 'bg-[#3d0f91] border-[#3d0f91] text-white' : 'bg-white border-[#e7e8ea] text-[#1c1530]'
                }`}
              >
                {station.name} <span className={`text-[11px] px-[7px] py-[1px] rounded-[100px] ${selectedStation === station.id ? 'bg-white/20 text-white' : 'bg-[#f5f6f8] text-[#1c1530]'}`}>{count}</span>
              </button>
            )
          })}
        </div>

        {/* Stats */}
        <section className="grid grid-cols-4 gap-4 p-[20px_30px_6px_30px]">
          <div className="bg-white border border-[#e7e8ea] rounded-[14px] p-[16px_18px] shadow-[0_1px_2px_rgba(28,21,48,0.04),0_8px_24px_-12px_rgba(28,21,48,0.12)] flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-[#5c5570]">Active Orders</span>
              <div className="w-[30px] h-[30px] rounded-[8px] bg-[#efeafc] text-[#3d0f91] flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 9h6M9 13h6M9 17h3"/></svg>
              </div>
            </div>
            <div className="font-['Sora'] text-[26px] font-bold tracking-[-0.01em]">{stats.total}</div>
            <div className="text-[11.5px] font-semibold text-[#1a9a56]">▲ 3 vs last hour</div>
          </div>
          <div className="bg-white border border-[#e7e8ea] rounded-[14px] p-[16px_18px] shadow-[0_1px_2px_rgba(28,21,48,0.04),0_8px_24px_-12px_rgba(28,21,48,0.12)] flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-[#5c5570]">Avg Prep Time</span>
              <div className="w-[30px] h-[30px] rounded-[8px] bg-[#eaf2f7] text-[#6d97b8] flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
              </div>
            </div>
            <div className="font-['Sora'] text-[26px] font-bold tracking-[-0.01em]">11m 20s</div>
            <div className="text-[11.5px] font-semibold text-[#dc2626]">▼ 1m 05s faster</div>
          </div>
          <div className="bg-white border border-[#e7e8ea] rounded-[14px] p-[16px_18px] shadow-[0_1px_2px_rgba(28,21,48,0.04),0_8px_24px_-12px_rgba(28,21,48,0.12)] flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-[#5c5570]">Ready for Pickup</span>
              <div className="w-[30px] h-[30px] rounded-[8px] bg-[#e6f6ec] text-[#1a9a56] flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6 9 17l-5-5"/></svg>
              </div>
            </div>
            <div className="font-['Sora'] text-[26px] font-bold tracking-[-0.01em]">{stats.ready}</div>
            <div className="text-[11.5px] font-semibold text-[#5c5570]">Awaiting server pickup</div>
          </div>
          <div className="bg-white border border-[#e7e8ea] rounded-[14px] p-[16px_18px] shadow-[0_1px_2px_rgba(28,21,48,0.04),0_8px_24px_-12px_rgba(28,21,48,0.12)] flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-[#5c5570]">Delayed Orders</span>
              <div className="w-[30px] h-[30px] rounded-[8px] bg-[#fce9e8] text-[#dc2626] flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.3 3.9 2.7 17a2 2 0 0 0 1.8 3h15a2 2 0 0 0 1.8-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/></svg>
              </div>
            </div>
            <div className="font-['Sora'] text-[26px] font-bold tracking-[-0.01em]">{orders.filter(o => isOrderDelayed(o)).length}</div>
            <div className="text-[11.5px] font-semibold text-[#dc2626]">Past 15 min target</div>
          </div>
        </section>

        {/* Board */}
        <section className="flex gap-4.5 p-[22px_30px_30px_30px] items-start">
          {/* New Orders */}
          <div className="flex-1 min-w-[320px] bg-white border border-[#e7e8ea] rounded-[18px] flex flex-col max-h-[calc(100vh-260px)]">
            <div className="flex items-center justify-between p-[16px_18px] border-b border-[#e7e8ea]">
              <div className="flex items-center gap-2">
                <div className="w-[9px] h-[9px] rounded-full bg-[#3d0f91]" />
                <h2 className="font-['Sora'] text-[14.5px] font-bold">New Orders</h2>
              </div>
              <span className="text-[12px] font-bold text-[#1c1530] bg-[#f5f6f8] px-2.5 py-0.5 rounded-[100px]">{ordersByStatus.new.length}</span>
            </div>
            <div className="p-3.5 flex flex-col gap-3 overflow-y-auto">
              {ordersByStatus.new.map(order => (
                <div key={order.id} className="border border-[#e7e8ea] rounded-[12px] p-[14px_14px_12px_14px] relative bg-white">
                  <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-[3px] bg-[#3d0f91]" />
                  <div className="flex justify-between items-start mb-2.5 pl-2">
                    <div>
                      <div className="font-['Sora'] font-bold text-[15px]">#{order.id.slice(-4)}</div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`text-[10.5px] font-bold uppercase tracking-[0.03em] px-1.5 py-0.5 rounded-[5px] ${
                          order.order_type === 'dine_in' ? 'bg-[#efeafc] text-[#3d0f91]' : order.order_type === 'takeaway' ? 'bg-[#eaf2f7] text-[#6d97b8]' : 'bg-[#fdf1e2] text-[#d97706]'
                        }`}>
                          {order.order_type === 'dine_in' ? 'Dine-in' : order.order_type === 'takeaway' ? 'Takeaway' : 'Delivery'}
                        </span>
                        <span className="text-[11.5px] text-[#1c1530] font-semibold">
                          {order.order_type === 'dine_in' ? `Table ${order.table_number || 'N/A'}` : 'Pickup 2:15'}
                        </span>
                      </div>
                    </div>
                    <div className="w-[46px] h-[46px] rounded-full flex items-center justify-center relative flex-shrink-0">
                      <span className="font-['Sora'] text-[11.5px] font-bold bg-white w-[36px] h-[36px] rounded-full flex items-center justify-center">
                        {getOrderElapsedTime(order)}
                      </span>
                    </div>
                  </div>
                  <div className="pl-2 flex flex-col gap-1.5 mb-2.5">
                    {order.items?.map(item => (
                      <div key={item.id} className="flex gap-2 text-[13px]">
                        <span className="font-bold text-[#3d0f91] min-w-[22px]">{item.quantity}×</span>
                        <div>
                          <span className="font-semibold text-[#1c1530]">{item.product_name}</span>
                          {item.notes && <span className="block text-[11.5px] text-[#5c5570] italic mt-0.5">{item.notes}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pl-2 gap-2">
                    <div className="flex gap-1 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-[0.03em] px-1.5 py-0.5 rounded-[5px] bg-[#f5f6f8] text-[#1c1530]">Grill</span>
                      <span className="text-[10px] font-bold uppercase tracking-[0.03em] px-1.5 py-0.5 rounded-[5px] bg-[#f5f6f8] text-[#1c1530]">Bar</span>
                    </div>
                    <button
                      onClick={() => handleUpdateOrderStatus(order.id, 'preparing')}
                      className="rounded-[8px] px-3.5 py-2 text-[12.5px] font-bold border-none cursor-pointer font-['Inter'] bg-[#3d0f91] text-white hover:brightness-0.94"
                    >
                      Start Preparing
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Preparing */}
          <div className="flex-1 min-w-[320px] bg-white border border-[#e7e8ea] rounded-[18px] flex flex-col max-h-[calc(100vh-260px)]">
            <div className="flex items-center justify-between p-[16px_18px] border-b border-[#e7e8ea]">
              <div className="flex items-center gap-2">
                <div className="w-[9px] h-[9px] rounded-full bg-[#6d97b8]" />
                <h2 className="font-['Sora'] text-[14.5px] font-bold">Preparing</h2>
              </div>
              <span className="text-[12px] font-bold text-[#1c1530] bg-[#f5f6f8] px-2.5 py-0.5 rounded-[100px]">{ordersByStatus.preparing.length}</span>
            </div>
            <div className="p-3.5 flex flex-col gap-3 overflow-y-auto">
              {ordersByStatus.preparing.map(order => (
                <div key={order.id} className="border border-[#e7e8ea] rounded-[12px] p-[14px_14px_12px_14px] relative bg-white">
                  <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-[3px] bg-[#6d97b8]" />
                  <div className="flex justify-between items-start mb-2.5 pl-2">
                    <div>
                      <div className="font-['Sora'] font-bold text-[15px]">#{order.id.slice(-4)}</div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`text-[10.5px] font-bold uppercase tracking-[0.03em] px-1.5 py-0.5 rounded-[5px] ${
                          order.order_type === 'dine_in' ? 'bg-[#efeafc] text-[#3d0f91]' : order.order_type === 'takeaway' ? 'bg-[#eaf2f7] text-[#6d97b8]' : 'bg-[#fdf1e2] text-[#d97706]'
                        }`}>
                          {order.order_type === 'dine_in' ? 'Dine-in' : order.order_type === 'takeaway' ? 'Takeaway' : 'Delivery'}
                        </span>
                        <span className="text-[11.5px] text-[#1c1530] font-semibold">
                          {order.order_type === 'dine_in' ? `Table ${order.table_number || 'N/A'}` : 'Pickup 2:15'}
                        </span>
                      </div>
                    </div>
                    <div className="w-[46px] h-[46px] rounded-full flex items-center justify-center relative flex-shrink-0">
                      <span className="font-['Sora'] text-[11.5px] font-bold bg-white w-[36px] h-[36px] rounded-full flex items-center justify-center">
                        {getOrderElapsedTime(order)}
                      </span>
                    </div>
                  </div>
                  <div className="pl-2 flex flex-col gap-1.5 mb-2.5">
                    {order.items?.map(item => (
                      <div key={item.id} className="flex gap-2 text-[13px]">
                        <span className="font-bold text-[#3d0f91] min-w-[22px]">{item.quantity}×</span>
                        <div>
                          <span className="font-semibold text-[#1c1530]">{item.product_name}</span>
                          {item.notes && <span className="block text-[11.5px] text-[#5c5570] italic mt-0.5">{item.notes}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pl-2 gap-2">
                    <div className="flex gap-1 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-[0.03em] px-1.5 py-0.5 rounded-[5px] bg-[#f5f6f8] text-[#1c1530]">Grill</span>
                    </div>
                    <button
                      onClick={() => handleUpdateOrderStatus(order.id, 'ready')}
                      className="rounded-[8px] px-3.5 py-2 text-[12.5px] font-bold border-none cursor-pointer font-['Inter'] bg-[#6d97b8] text-white hover:brightness-0.94"
                    >
                      Mark Ready
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ready */}
          <div className="flex-1 min-w-[320px] bg-white border border-[#e7e8ea] rounded-[18px] flex flex-col max-h-[calc(100vh-260px)]">
            <div className="flex items-center justify-between p-[16px_18px] border-b border-[#e7e8ea]">
              <div className="flex items-center gap-2">
                <div className="w-[9px] h-[9px] rounded-full bg-[#1a9a56]" />
                <h2 className="font-['Sora'] text-[14.5px] font-bold">Ready for Pickup</h2>
              </div>
              <span className="text-[12px] font-bold text-[#1c1530] bg-[#f5f6f8] px-2.5 py-0.5 rounded-[100px]">{ordersByStatus.ready.length}</span>
            </div>
            <div className="p-3.5 flex flex-col gap-3 overflow-y-auto">
              {ordersByStatus.ready.map(order => (
                <div key={order.id} className="border border-[#e7e8ea] rounded-[12px] p-[14px_14px_12px_14px] relative bg-white">
                  <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-[3px] bg-[#1a9a56]" />
                  <div className="flex justify-between items-start mb-2.5 pl-2">
                    <div>
                      <div className="font-['Sora'] font-bold text-[15px]">#{order.id.slice(-4)}</div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`text-[10.5px] font-bold uppercase tracking-[0.03em] px-1.5 py-0.5 rounded-[5px] ${
                          order.order_type === 'dine_in' ? 'bg-[#efeafc] text-[#3d0f91]' : order.order_type === 'takeaway' ? 'bg-[#eaf2f7] text-[#6d97b8]' : 'bg-[#fdf1e2] text-[#d97706]'
                        }`}>
                          {order.order_type === 'dine_in' ? 'Dine-in' : order.order_type === 'takeaway' ? 'Takeaway' : 'Delivery'}
                        </span>
                        <span className="text-[11.5px] text-[#1c1530] font-semibold">
                          {order.order_type === 'dine_in' ? `Table ${order.table_number || 'N/A'}` : 'Waiting 4m'}
                        </span>
                      </div>
                    </div>
                    <div className="w-[46px] h-[46px] rounded-full flex items-center justify-center relative flex-shrink-0 bg-[#e6f6ec]">
                      <span className="font-['Sora'] text-[11.5px] font-bold text-[#1a9a56]">✓</span>
                    </div>
                  </div>
                  <div className="pl-2 flex flex-col gap-1.5 mb-2.5">
                    {order.items?.map(item => (
                      <div key={item.id} className="flex gap-2 text-[13px]">
                        <span className="font-bold text-[#3d0f91] min-w-[22px]">{item.quantity}×</span>
                        <div>
                          <span className="font-semibold text-[#1c1530]">{item.product_name}</span>
                          {item.notes && <span className="block text-[11.5px] text-[#5c5570] italic mt-0.5">{item.notes}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pl-2 gap-2">
                    <div className="flex gap-1 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-[0.03em] px-1.5 py-0.5 rounded-[5px] bg-[#f5f6f8] text-[#1c1530]">Grill</span>
                    </div>
                    <button
                      onClick={() => handleUpdateOrderStatus(order.id, 'served')}
                      className="rounded-[8px] px-3.5 py-2 text-[12.5px] font-bold border-none cursor-pointer font-['Inter'] bg-[#1a9a56] text-white hover:brightness-0.94"
                    >
                      Mark Served
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
