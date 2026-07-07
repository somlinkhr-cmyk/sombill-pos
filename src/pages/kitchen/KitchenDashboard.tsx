import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import {
  Activity,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Users,
  ChefHat,
  Flame,
  BarChart3,
  PieChart,
} from 'lucide-react'

interface DashboardStats {
  totalActiveOrders: number
  ordersWaiting: number
  ordersCooking: number
  readyForPickup: number
  completedToday: number
  avgPrepTime: number
  delayedOrders: number
  busyStations: number
  kitchenStaffOnline: number
  popularItems: { name: string; count: number }[]
  hourlyData: { hour: string; orders: number }[]
}

export default function KitchenDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    totalActiveOrders: 0,
    ordersWaiting: 0,
    ordersCooking: 0,
    readyForPickup: 0,
    completedToday: 0,
    avgPrepTime: 0,
    delayedOrders: 0,
    busyStations: 0,
    kitchenStaffOnline: 0,
    popularItems: [],
    hourlyData: [],
  })
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    loadData()
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timeInterval)
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]

      // Load order stats
      const [
        { count: activeOrders },
        { count: waitingOrders },
        { count: cookingOrders },
        { count: readyOrders },
        { count: completedOrders },
        { data: orderItems },
        { data: allOrders },
      ] = await Promise.all([
        supabase.from('orders').select('*', { count: 'exact', head: true }).in('status', ['new', 'preparing', 'ready']),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'new'),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'preparing'),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'ready'),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'completed').gte('created_at', today),
        supabase.from('order_items').select('product_name').gte('created_at', today),
        supabase.from('orders').select('created_at, status').gte('created_at', today),
      ])

      // Calculate average prep time
      const { data: prepTimeOrders } = await supabase
        .from('orders')
        .select('preparing_started_at, ready_at')
        .eq('status', 'completed')
        .gte('created_at', today)

      const prepTimes = (prepTimeOrders || [])
        .filter((o: any) => o.preparing_started_at && o.ready_at)
        .map((o: any) => {
          const start = new Date(o.preparing_started_at).getTime()
          const end = new Date(o.ready_at).getTime()
          return (end - start) / 60000
        })

      const avgPrepTime = prepTimes.length > 0 ? prepTimes.reduce((a, b) => a + b, 0) / prepTimes.length : 0

      // Count delayed orders
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString()
      const { count: delayedCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .in('status', ['new', 'preparing'])
        .lt('created_at', fifteenMinutesAgo)

      // Count busy stations
      const { data: busyStations } = await supabase
        .from('orders')
        .select('kitchen_station')
        .in('status', ['new', 'preparing'])
        .not('kitchen_station', 'is', null)

      const uniqueBusyStations = new Set((busyStations || []).map((o: any) => o.kitchen_station))

      // Count online kitchen staff
      const { count: staffCount } = await supabase
        .from('kitchen_sessions')
        .select('*', { count: 'exact', head: true })
        .is('active', true)

      // Calculate popular items
      const itemCounts = new Map<string, number>()
      ;(orderItems || []).forEach((item: any) => {
        const count = itemCounts.get(item.product_name) || 0
        itemCounts.set(item.product_name, count + 1)
      })

      const popularItems = Array.from(itemCounts.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      // Calculate hourly data
      const hourlyData: { hour: string; orders: number }[] = []
      for (let i = 0; i < 24; i++) {
        const hourStart = new Date()
        hourStart.setHours(i, 0, 0, 0)
        const hourEnd = new Date()
        hourEnd.setHours(i, 59, 59, 999)

        const hourOrders = (allOrders || []).filter((order: any) => {
          const orderTime = new Date(order.created_at)
          return orderTime >= hourStart && orderTime <= hourEnd
        }).length

        hourlyData.push({
          hour: `${i.toString().padStart(2, '0')}:00`,
          orders: hourOrders,
        })
      }

      setStats({
        totalActiveOrders: activeOrders || 0,
        ordersWaiting: waitingOrders || 0,
        ordersCooking: cookingOrders || 0,
        readyForPickup: readyOrders || 0,
        completedToday: completedOrders || 0,
        avgPrepTime: Math.round(avgPrepTime),
        delayedOrders: delayedCount || 0,
        busyStations: uniqueBusyStations.size,
        kitchenStaffOnline: staffCount || 0,
        popularItems,
        hourlyData,
      })
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f5f6f8]">
        <div className="text-center">
          <Activity className="w-12 h-12 animate-spin mx-auto mb-4 text-[#3d0f91]" />
          <p className="text-[#1c1530]">Loading Kitchen Dashboard...</p>
        </div>
      </div>
    )
  }

  const maxHourlyOrders = Math.max(...stats.hourlyData.map(d => d.orders), 1)

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
              Kitchen Dashboard
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="text-[10.5px] font-semibold tracking-[0.09em] uppercase text-white/38 p-[16px_10px_8px] relative z-10">
          Operations
        </div>
        <ul className="flex flex-col gap-0.5 relative z-10">
          <li>
            <a href="/kitchen/operations" className="flex items-center gap-[11px] p-[9px_12px] rounded-[10px] text-white/72 hover:bg-white/6 hover:text-white text-[13.5px] font-medium transition-all">
              <ChefHat width="17" height="17" />
              Operations
            </a>
          </li>
          <li>
            <a href="/kitchen/dashboard" className="flex items-center gap-[11px] p-[9px_12px] rounded-[10px] bg-white/10 text-white text-[13.5px] font-medium transition-all shadow-[inset_3px_0_0_#86abc9]">
              <Activity width="17" height="17" />
              Dashboard
            </a>
          </li>
          <li>
            <a href="/kitchen/system" className="flex items-center gap-[11px] p-[9px_12px] rounded-[10px] text-white/72 hover:bg-white/6 hover:text-white text-[13.5px] font-medium transition-all">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 3v10a2 2 0 0 0 2 2h1"/><path d="M7 3v6"/><path d="M4 3h3"/><path d="M15 3c-2 0-3 2-3 4s1 3 2 3v11"/><circle cx="19" cy="19" r="0"/></svg>
              Kitchen Display
            </a>
          </li>
          <li>
            <a href="/kitchen/orders" className="flex items-center gap-[11px] p-[9px_12px] rounded-[10px] text-white/72 hover:bg-white/6 hover:text-white text-[13.5px] font-medium transition-all">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2h12l2 5H4l2-5Z"/><path d="M4 7v13a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V7"/><path d="M9 12h6"/></svg>
              Orders
            </a>
          </li>
          <li>
            <a href="/kitchen/menu" className="flex items-center gap-[11px] p-[9px_12px] rounded-[10px] text-white/72 hover:bg-white/6 hover:text-white text-[13.5px] font-medium transition-all">
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
              <div className="text-[11px] text-white/45">Kitchen Manager</div>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="flex items-center gap-[11px] p-[9px_12px] rounded-[10px] text-white/72 hover:bg-white/6 hover:text-white text-[13.5px] font-medium transition-all w-full"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-y-auto bg-[#f5f6f8]">
        {/* Header */}
        <header className="bg-white border-b border-[#e7e8ea] p-[18px_30px] flex items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="font-['Sora'] text-[19px] font-bold tracking-[-0.01em]">Kitchen Dashboard</h1>
            <p className="text-[12.5px] text-[#5c5570] mt-0.5">Real-time kitchen analytics and performance metrics</p>
          </div>
          <div className="flex items-center gap-3.5">
            <div className="flex flex-col items-end pr-3.5 border-r border-[#e7e8ea]">
              <div className="font-['Sora'] font-bold text-[15px]">{currentTime.toLocaleTimeString()}</div>
              <div className="text-[11px] text-[#5c5570]">{currentTime.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
            </div>
            <div className="w-[38px] h-[38px] rounded-[10px] bg-[#3d0f91] text-white flex items-center justify-center font-['Sora'] font-bold text-[13px]">
              {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'KD'}
            </div>
          </div>
        </header>

        {/* Stats Grid */}
        <section className="grid grid-cols-4 gap-4 p-[20px_30px]">
          <div className="bg-white border border-[#e7e8ea] rounded-[14px] p-[16px_18px] shadow-[0_1px_2px_rgba(28,21,48,0.04),0_8px_24px_-12px_rgba(28,21,48,0.12)] flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-[#5c5570]">Total Active Orders</span>
              <div className="w-[30px] h-[30px] rounded-[8px] bg-[#efeafc] text-[#3d0f91] flex items-center justify-center">
                <Activity width="16" height="16" />
              </div>
            </div>
            <div className="font-['Sora'] text-[26px] font-bold tracking-[-0.01em]">{stats.totalActiveOrders}</div>
            <div className="text-[11.5px] font-semibold text-[#5c5570]">Currently in kitchen</div>
          </div>

          <div className="bg-white border border-[#e7e8ea] rounded-[14px] p-[16px_18px] shadow-[0_1px_2px_rgba(28,21,48,0.04),0_8px_24px_-12px_rgba(28,21,48,0.12)] flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-[#5c5570]">Orders Waiting</span>
              <div className="w-[30px] h-[30px] rounded-[8px] bg-[#fdf1e2] text-[#d97706] flex items-center justify-center">
                <Clock width="16" height="16" />
              </div>
            </div>
            <div className="font-['Sora'] text-[26px] font-bold tracking-[-0.01em]">{stats.ordersWaiting}</div>
            <div className="text-[11.5px] font-semibold text-[#d97706]">Awaiting preparation</div>
          </div>

          <div className="bg-white border border-[#e7e8ea] rounded-[14px] p-[16px_18px] shadow-[0_1px_2px_rgba(28,21,48,0.04),0_8px_24px_-12px_rgba(28,21,48,0.12)] flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-[#5c5570]">Orders Cooking</span>
              <div className="w-[30px] h-[30px] rounded-[8px] bg-[#eaf2f7] text-[#6d97b8] flex items-center justify-center">
                <Flame width="16" height="16" />
              </div>
            </div>
            <div className="font-['Sora'] text-[26px] font-bold tracking-[-0.01em]">{stats.ordersCooking}</div>
            <div className="text-[11.5px] font-semibold text-[#5c5570]">Currently being prepared</div>
          </div>

          <div className="bg-white border border-[#e7e8ea] rounded-[14px] p-[16px_18px] shadow-[0_1px_2px_rgba(28,21,48,0.04),0_8px_24px_-12px_rgba(28,21,48,0.12)] flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-[#5c5570]">Ready for Pickup</span>
              <div className="w-[30px] h-[30px] rounded-[8px] bg-[#e6f6ec] text-[#1a9a56] flex items-center justify-center">
                <CheckCircle width="16" height="16" />
              </div>
            </div>
            <div className="font-['Sora'] text-[26px] font-bold tracking-[-0.01em]">{stats.readyForPickup}</div>
            <div className="text-[11.5px] font-semibold text-[#1a9a56]">Awaiting service</div>
          </div>
        </section>

        {/* Secondary Stats */}
        <section className="grid grid-cols-4 gap-4 p-[0_30px_20px_30px]">
          <div className="bg-white border border-[#e7e8ea] rounded-[14px] p-[16px_18px] shadow-[0_1px_2px_rgba(28,21,48,0.04),0_8px_24px_-12px_rgba(28,21,48,0.12)] flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-[#5c5570]">Completed Today</span>
              <div className="w-[30px] h-[30px] rounded-[8px] bg-[#ecfdf5] text-[#059669] flex items-center justify-center">
                <CheckCircle width="16" height="16" />
              </div>
            </div>
            <div className="font-['Sora'] text-[26px] font-bold tracking-[-0.01em]">{stats.completedToday}</div>
            <div className="text-[11.5px] font-semibold text-[#059669]">Orders served</div>
          </div>

          <div className="bg-white border border-[#e7e8ea] rounded-[14px] p-[16px_18px] shadow-[0_1px_2px_rgba(28,21,48,0.04),0_8px_24px_-12px_rgba(28,21,48,0.12)] flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-[#5c5570]">Avg Prep Time</span>
              <div className="w-[30px] h-[30px] rounded-[8px] bg-[#f3e8ff] text-[#7c3aed] flex items-center justify-center">
                <Clock width="16" height="16" />
              </div>
            </div>
            <div className="font-['Sora'] text-[26px] font-bold tracking-[-0.01em]">{stats.avgPrepTime > 0 ? `${stats.avgPrepTime}m` : '--'}</div>
            <div className="text-[11.5px] font-semibold text-[#5c5570]">Average today</div>
          </div>

          <div className="bg-white border border-[#e7e8ea] rounded-[14px] p-[16px_18px] shadow-[0_1px_2px_rgba(28,21,48,0.04),0_8px_24px_-12px_rgba(28,21,48,0.12)] flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-[#5c5570]">Delayed Orders</span>
              <div className="w-[30px] h-[30px] rounded-[8px] bg-[#fce9e8] text-[#dc2626] flex items-center justify-center">
                <AlertTriangle width="16" height="16" />
              </div>
            </div>
            <div className="font-['Sora'] text-[26px] font-bold tracking-[-0.01em]">{stats.delayedOrders}</div>
            <div className="text-[11.5px] font-semibold text-[#dc2626]">Past 15 min target</div>
          </div>

          <div className="bg-white border border-[#e7e8ea] rounded-[14px] p-[16px_18px] shadow-[0_1px_2px_rgba(28,21,48,0.04),0_8px_24px_-12px_rgba(28,21,48,0.12)] flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-[#5c5570]">Staff Online</span>
              <div className="w-[30px] h-[30px] rounded-[8px] bg-[#eff6ff] text-[#2563eb] flex items-center justify-center">
                <Users width="16" height="16" />
              </div>
            </div>
            <div className="font-['Sora'] text-[26px] font-bold tracking-[-0.01em]">{stats.kitchenStaffOnline}</div>
            <div className="text-[11.5px] font-semibold text-[#5c5570]">Active chefs</div>
          </div>
        </section>

        {/* Charts Section */}
        <section className="grid grid-cols-2 gap-4 p-[0_30px_20px_30px]">
          {/* Hourly Orders Chart */}
          <div className="bg-white border border-[#e7e8ea] rounded-[14px] p-[18px] shadow-[0_1px_2px_rgba(28,21,48,0.04),0_8px_24px_-12px_rgba(28,21,48,0.12)]">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 width="18" height="18" className="text-[#3d0f91]" />
              <h3 className="font-['Sora'] text-[15px] font-bold">Orders by Hour</h3>
            </div>
            <div className="flex items-end gap-1 h-[180px]">
              {stats.hourlyData.map((data, index) => (
                <div key={data.hour} className="flex-1 flex flex-col items-center gap-1">
                  <div 
                    className="w-full bg-[#3d0f91] rounded-t-sm transition-all hover:bg-[#2a0a6b]"
                    style={{ 
                      height: `${(data.orders / maxHourlyOrders) * 100}%`,
                      minHeight: data.orders > 0 ? '4px' : '0'
                    }}
                  />
                  <span className="text-[10px] text-[#5c5570]">{data.hour}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Popular Items */}
          <div className="bg-white border border-[#e7e8ea] rounded-[14px] p-[18px] shadow-[0_1px_2px_rgba(28,21,48,0.04),0_8px_24px_-12px_rgba(28,21,48,0.12)]">
            <div className="flex items-center gap-2 mb-4">
              <PieChart width="18" height="18" className="text-[#3d0f91]" />
              <h3 className="font-['Sora'] text-[15px] font-bold">Popular Items Today</h3>
            </div>
            {stats.popularItems.length === 0 ? (
              <div className="text-center py-8 text-[#5c5570] text-[13px]">
                No orders today
              </div>
            ) : (
              <div className="space-y-3">
                {stats.popularItems.map((item, index) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <div className="w-[24px] h-[24px] rounded-[6px] bg-[#3d0f91] text-white flex items-center justify-center font-['Sora'] font-bold text-[12px]">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="text-[13px] font-semibold">{item.name}</div>
                      <div className="w-full bg-[#f5f6f8] rounded-full h-2 mt-1">
                        <div 
                          className="bg-[#3d0f91] h-2 rounded-full"
                          style={{ width: `${(item.count / stats.popularItems[0].count) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="font-['Sora'] font-bold text-[15px]">{item.count}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Performance Metrics */}
        <section className="p-[0_30px_30px_30px]">
          <div className="bg-white border border-[#e7e8ea] rounded-[14px] p-[18px] shadow-[0_1px_2px_rgba(28,21,48,0.04),0_8px_24px_-12px_rgba(28,21,48,0.12)]">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp width="18" height="18" className="text-[#3d0f91]" />
              <h3 className="font-['Sora'] text-[15px] font-bold">Kitchen Performance</h3>
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-[11px] text-[#5c5570] mb-1">Orders per Chef</div>
                <div className="font-['Sora'] text-[28px] font-bold text-[#3d0f91]">
                  {stats.kitchenStaffOnline > 0 ? (stats.completedToday / stats.kitchenStaffOnline).toFixed(1) : '0'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-[11px] text-[#5c5570] mb-1">Completion Rate</div>
                <div className="font-['Sora'] text-[28px] font-bold text-[#1a9a56]">
                  {stats.totalActiveOrders > 0 ? Math.round((stats.completedToday / (stats.completedToday + stats.totalActiveOrders)) * 100) : 100}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-[11px] text-[#5c5570] mb-1">On-Time Rate</div>
                <div className="font-['Sora'] text-[28px] font-bold text-[#059669]">
                  {stats.totalActiveOrders > 0 ? Math.round(((stats.totalActiveOrders - stats.delayedOrders) / stats.totalActiveOrders) * 100) : 100}%
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
