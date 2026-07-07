import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import {
  ChefHat,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  Flame,
  Timer,
  Activity,
  TrendingUp,
  Zap,
} from 'lucide-react'

interface KitchenSession {
  id: string
  chef_id: string
  chef_name: string
  station_id: string
  station_name: string
  started_at: string
  orders_completed: number
  active_orders: number
}

interface KitchenStats {
  active_sessions: number
  total_orders_today: number
  orders_in_queue: number
  avg_prep_time: number
  delayed_orders: number
  busy_stations: number
}

export default function KitchenOperations() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [sessions, setSessions] = useState<KitchenSession[]>([])
  const [stats, setStats] = useState<KitchenStats>({
    active_sessions: 0,
    total_orders_today: 0,
    orders_in_queue: 0,
    avg_prep_time: 0,
    delayed_orders: 0,
    busy_stations: 0,
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
      // Load active kitchen sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('kitchen_sessions')
        .select('*, kitchen_stations(name), users(name)')
        .is('active', true)
        .order('started_at', { ascending: false })

      if (sessionsError) {
        console.error('Error loading sessions:', sessionsError)
      } else {
        const formattedSessions = (sessionsData || []).map((session: any) => ({
          id: session.id,
          chef_id: session.chef_id,
          chef_name: session.users?.name || 'Unknown',
          station_id: session.station_id,
          station_name: session.kitchen_stations?.name || 'Unassigned',
          started_at: session.started_at,
          orders_completed: session.orders_completed || 0,
          active_orders: session.active_orders || 0,
        }))
        setSessions(formattedSessions)
      }

      // Load stats
      const today = new Date().toISOString().split('T')[0]
      
      const [{ count: totalOrders }, { count: queueOrders }, { data: completedOrders }] = await Promise.all([
        supabase.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', today),
        supabase.from('orders').select('*', { count: 'exact', head: true }).in('status', ['new', 'preparing']),
        supabase.from('orders').select('preparing_started_at, ready_at').eq('status', 'completed').gte('created_at', today),
      ])

      // Calculate average prep time
      const prepTimes = (completedOrders || [])
        .filter((o: any) => o.preparing_started_at && o.ready_at)
        .map((o: any) => {
          const start = new Date(o.preparing_started_at).getTime()
          const end = new Date(o.ready_at).getTime()
          return (end - start) / 60000
        })
      
      const avgPrepTime = prepTimes.length > 0 ? prepTimes.reduce((a, b) => a + b, 0) / prepTimes.length : 0

      // Count delayed orders (orders taking longer than 15 minutes)
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString()
      const { count: delayedCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .in('status', ['new', 'preparing'])
        .lt('created_at', fifteenMinutesAgo)

      // Count busy stations (stations with active orders)
      const { data: busyStations } = await supabase
        .from('orders')
        .select('kitchen_station')
        .in('status', ['new', 'preparing'])
        .not('kitchen_station', 'is', null)

      const uniqueBusyStations = new Set((busyStations || []).map((o: any) => o.kitchen_station))

      setStats({
        active_sessions: sessionsData?.length || 0,
        total_orders_today: totalOrders || 0,
        orders_in_queue: queueOrders || 0,
        avg_prep_time: Math.round(avgPrepTime),
        delayed_orders: delayedCount || 0,
        busy_stations: uniqueBusyStations.size,
      })
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  function getSessionDuration(session: KitchenSession): string {
    const start = new Date(session.started_at).getTime()
    const elapsed = Date.now() - start
    const hours = Math.floor(elapsed / 3600000)
    const minutes = Math.floor((elapsed % 3600000) / 60000)
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f5f6f8]">
        <div className="text-center">
          <Activity className="w-12 h-12 animate-spin mx-auto mb-4 text-[#3d0f91]" />
          <p className="text-[#1c1530]">Loading Kitchen Operations...</p>
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
              Kitchen Operations
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="text-[10.5px] font-semibold tracking-[0.09em] uppercase text-white/38 p-[16px_10px_8px] relative z-10">
          Operations
        </div>
        <ul className="flex flex-col gap-0.5 relative z-10">
          <li>
            <Link to="/kitchen/operations" className="flex items-center gap-[11px] p-[9px_12px] rounded-[10px] bg-white/10 text-white text-[13.5px] font-medium transition-all shadow-[inset_3px_0_0_#86abc9]">
              <ChefHat width="17" height="17" />
              Operations
            </Link>
          </li>
          <li>
            <Link to="/kitchen/dashboard" className="flex items-center gap-[11px] p-[9px_12px] rounded-[10px] text-white/72 hover:bg-white/6 hover:text-white text-[13.5px] font-medium transition-all">
              <Activity width="17" height="17" />
              Dashboard
            </Link>
          </li>
          <li>
            <Link to="/kitchen/system" className="flex items-center gap-[11px] p-[9px_12px] rounded-[10px] text-white/72 hover:bg-white/6 hover:text-white text-[13.5px] font-medium transition-all">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 3v10a2 2 0 0 0 2 2h1"/><path d="M7 3v6"/><path d="M4 3h3"/><path d="M15 3c-2 0-3 2-3 4s1 3 2 3v11"/><circle cx="19" cy="19" r="0"/></svg>
              Kitchen Display
            </Link>
          </li>
          <li>
            <Link to="/kitchen/orders" className="flex items-center gap-[11px] p-[9px_12px] rounded-[10px] text-white/72 hover:bg-white/6 hover:text-white text-[13.5px] font-medium transition-all">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2h12l2 5H4l2-5Z"/><path d="M4 7v13a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V7"/><path d="M9 12h6"/></svg>
              Orders
            </Link>
          </li>
          <li>
            <Link to="/kitchen/menu" className="flex items-center gap-[11px] p-[9px_12px] rounded-[10px] text-white/72 hover:bg-white/6 hover:text-white text-[13.5px] font-medium transition-all">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
              Menu
            </Link>
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
            <h1 className="font-['Sora'] text-[19px] font-bold tracking-[-0.01em]">Kitchen Operations</h1>
            <p className="text-[12.5px] text-[#5c5570] mt-0.5">Overview of kitchen activity and performance</p>
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
              <span className="text-[12px] font-semibold text-[#5c5570]">Active Sessions</span>
              <div className="w-[30px] h-[30px] rounded-[8px] bg-[#efeafc] text-[#3d0f91] flex items-center justify-center">
                <Users width="16" height="16" />
              </div>
            </div>
            <div className="font-['Sora'] text-[26px] font-bold tracking-[-0.01em]">{stats.active_sessions}</div>
            <div className="text-[11.5px] font-semibold text-[#5c5570]">Chefs currently working</div>
          </div>

          <div className="bg-white border border-[#e7e8ea] rounded-[14px] p-[16px_18px] shadow-[0_1px_2px_rgba(28,21,48,0.04),0_8px_24px_-12px_rgba(28,21,48,0.12)] flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-[#5c5570]">Orders Today</span>
              <div className="w-[30px] h-[30px] rounded-[8px] bg-[#eaf2f7] text-[#6d97b8] flex items-center justify-center">
                <CheckCircle width="16" height="16" />
              </div>
            </div>
            <div className="font-['Sora'] text-[26px] font-bold tracking-[-0.01em]">{stats.total_orders_today}</div>
            <div className="text-[11.5px] font-semibold text-[#1a9a56]">Total processed</div>
          </div>

          <div className="bg-white border border-[#e7e8ea] rounded-[14px] p-[16px_18px] shadow-[0_1px_2px_rgba(28,21,48,0.04),0_8px_24px_-12px_rgba(28,21,48,0.12)] flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-[#5c5570]">Orders in Queue</span>
              <div className="w-[30px] h-[30px] rounded-[8px] bg-[#fdf1e2] text-[#d97706] flex items-center justify-center">
                <Clock width="16" height="16" />
              </div>
            </div>
            <div className="font-['Sora'] text-[26px] font-bold tracking-[-0.01em]">{stats.orders_in_queue}</div>
            <div className="text-[11.5px] font-semibold text-[#d97706]">Awaiting preparation</div>
          </div>

          <div className="bg-white border border-[#e7e8ea] rounded-[14px] p-[16px_18px] shadow-[0_1px_2px_rgba(28,21,48,0.04),0_8px_24px_-12px_rgba(28,21,48,0.12)] flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-[#5c5570]">Avg Prep Time</span>
              <div className="w-[30px] h-[30px] rounded-[8px] bg-[#e6f6ec] text-[#1a9a56] flex items-center justify-center">
                <Timer width="16" height="16" />
              </div>
            </div>
            <div className="font-['Sora'] text-[26px] font-bold tracking-[-0.01em]">{stats.avg_prep_time > 0 ? `${stats.avg_prep_time}m` : '--'}</div>
            <div className="text-[11.5px] font-semibold text-[#5c5570]">Average today</div>
          </div>
        </section>

        {/* Secondary Stats */}
        <section className="grid grid-cols-3 gap-4 p-[0_30px_20px_30px]">
          <div className="bg-white border border-[#e7e8ea] rounded-[14px] p-[16px_18px] shadow-[0_1px_2px_rgba(28,21,48,0.04),0_8px_24px_-12px_rgba(28,21,48,0.12)] flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-[#5c5570]">Delayed Orders</span>
              <div className="w-[30px] h-[30px] rounded-[8px] bg-[#fce9e8] text-[#dc2626] flex items-center justify-center">
                <AlertTriangle width="16" height="16" />
              </div>
            </div>
            <div className="font-['Sora'] text-[26px] font-bold tracking-[-0.01em]">{stats.delayed_orders}</div>
            <div className="text-[11.5px] font-semibold text-[#dc2626]">Past 15 min target</div>
          </div>

          <div className="bg-white border border-[#e7e8ea] rounded-[14px] p-[16px_18px] shadow-[0_1px_2px_rgba(28,21,48,0.04),0_8px_24px_-12px_rgba(28,21,48,0.12)] flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-[#5c5570]">Busy Stations</span>
              <div className="w-[30px] h-[30px] rounded-[8px] bg-[#f3e8ff] text-[#7c3aed] flex items-center justify-center">
                <Flame width="16" height="16" />
              </div>
            </div>
            <div className="font-['Sora'] text-[26px] font-bold tracking-[-0.01em]">{stats.busy_stations}</div>
            <div className="text-[11.5px] font-semibold text-[#5c5570]">Stations with active orders</div>
          </div>

          <div className="bg-white border border-[#e7e8ea] rounded-[14px] p-[16px_18px] shadow-[0_1px_2px_rgba(28,21,48,0.04),0_8px_24px_-12px_rgba(28,21,48,0.12)] flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-[#5c5570]">Kitchen Efficiency</span>
              <div className="w-[30px] h-[30px] rounded-[8px] bg-[#ecfdf5] text-[#059669] flex items-center justify-center">
                <TrendingUp width="16" height="16" />
              </div>
            </div>
            <div className="font-['Sora'] text-[26px] font-bold tracking-[-0.01em]">{stats.total_orders_today > 0 ? Math.round((stats.total_orders_today / (stats.active_sessions || 1)) * 10) / 10 : 0}</div>
            <div className="text-[11.5px] font-semibold text-[#059669]">Orders per chef</div>
          </div>
        </section>

        {/* Active Sessions */}
        <section className="p-[0_30px_30px_30px]">
          <h2 className="font-['Sora'] text-[16px] font-bold mb-4">Active Kitchen Sessions</h2>
          {sessions.length === 0 ? (
            <div className="bg-white border border-[#e7e8ea] rounded-[14px] p-8 text-center text-[#5c5570]">
              No active kitchen sessions
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {sessions.map(session => (
                <div key={session.id} className="bg-white border border-[#e7e8ea] rounded-[14px] p-[18px] shadow-[0_1px_2px_rgba(28,21,48,0.04),0_8px_24px_-12px_rgba(28,21,48,0.12)]">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-[44px] h-[44px] rounded-[10px] bg-[#3d0f91] text-white flex items-center justify-center font-['Sora'] font-bold text-[15px]">
                        {session.chef_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-['Sora'] font-bold text-[15px]">{session.chef_name}</div>
                        <div className="text-[12px] text-[#5c5570]">{session.station_name}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-[#5c5570]">
                      <Clock width="14" height="14" />
                      {getSessionDuration(session)}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#f5f6f8] rounded-[8px] p-3">
                      <div className="text-[11px] text-[#5c5570] mb-1">Orders Completed</div>
                      <div className="font-['Sora'] font-bold text-[20px] text-[#1a9a56]">{session.orders_completed}</div>
                    </div>
                    <div className="bg-[#f5f6f8] rounded-[8px] p-3">
                      <div className="text-[11px] text-[#5c5570] mb-1">Active Orders</div>
                      <div className="font-['Sora'] font-bold text-[20px] text-[#d97706]">{session.active_orders}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
