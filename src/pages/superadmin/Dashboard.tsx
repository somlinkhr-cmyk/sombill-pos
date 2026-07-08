import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { formatCurrency } from '../../lib/utils'
import toast from 'react-hot-toast'
import {
  LayoutDashboard,
  Building2,
  Plus,
  Search,
  Bell,
  User,
  Settings,
  Shield,
  Activity,
  TrendingUp,
  DollarSign,
  Users,
  ShoppingCart,
  HardDrive,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  CreditCard,
  FileText,
  RefreshCw,
  LogOut,
  LayoutGrid,
  Zap,
  Server,
  Database,
  BarChart3,
  PieChart,
  LineChart,
} from 'lucide-react'

interface DashboardStats {
  totalRestaurants: number
  activeRestaurants: number
  trialRestaurants: number
  suspendedRestaurants: number
  expiredSubscriptions: number
  monthlyRevenue: number
  annualRevenue: number
  activeUsers: number
  onlineUsers: number
  totalEmployees: number
  totalOrders: number
  totalSales: number
  totalTransactions: number
  totalCustomers: number
  apiUsage: number
  storageUsage: number
  databaseHealth: string
  systemHealth: string
  serverStatus: string
}

interface RecentActivity {
  id: string
  type: string
  description: string
  restaurant?: string
  timestamp: string
}

interface Alert {
  id: string
  type: 'warning' | 'error' | 'info' | 'success'
  title: string
  message: string
  timestamp: string
}

export default function SuperAdminDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [activeNav, setActiveNav] = useState('dashboard')
  const [stats, setStats] = useState<DashboardStats>({
    totalRestaurants: 0,
    activeRestaurants: 0,
    trialRestaurants: 0,
    suspendedRestaurants: 0,
    expiredSubscriptions: 0,
    monthlyRevenue: 0,
    annualRevenue: 0,
    activeUsers: 0,
    onlineUsers: 0,
    totalEmployees: 0,
    totalOrders: 0,
    totalSales: 0,
    totalTransactions: 0,
    totalCustomers: 0,
    apiUsage: 0,
    storageUsage: 0,
    databaseHealth: 'healthy',
    systemHealth: 'healthy',
    serverStatus: 'online',
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [currentTime, setCurrentTime] = useState(new Date())

  const loadDashboardStats = useCallback(async () => {
    setLoading(true)
    try {
      const today = new Date()
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString()
      const yearStart = new Date(today.getFullYear(), 0, 1).toISOString()

      // Load all stats in parallel
      const [
        { count: totalRestaurants },
        { count: activeRestaurants },
        { count: activeUsers },
        { count: totalEmployees },
        { count: totalOrders },
        { count: totalCustomers },
      ] = await Promise.all([
        supabase.from('restaurants').select('*', { count: 'exact', head: true }),
        supabase.from('restaurants').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('customers').select('*', { count: 'exact', head: true }),
      ])

      // Load revenue data from sa_payments
      const [{ data: monthlyPayments }, { data: yearlyPayments }] = await Promise.all([
        supabase.from('sa_payments').select('amount').eq('status', 'completed').gte('created_at', monthStart),
        supabase.from('sa_payments').select('amount').eq('status', 'completed').gte('created_at', yearStart),
      ])

      const monthlyRevenue = (monthlyPayments || []).reduce((sum, p) => sum + (p.amount || 0), 0)
      const annualRevenue = (yearlyPayments || []).reduce((sum, p) => sum + (p.amount || 0), 0)

      // Load sales data
      const { data: ordersData } = await supabase.from('orders').select('total')
      const totalSales = (ordersData || []).reduce((sum, o) => sum + (o.total || 0), 0)

      // Load recent activity from sa_activity_logs (if table exists)
      let formattedActivity: RecentActivity[] = []
      try {
        const { data: activityData } = await supabase
          .from('sa_activity_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10)

        formattedActivity = (activityData || []).map((log: any) => ({
          id: log.id,
          type: log.action,
          description: log.description || log.action,
          restaurant: 'System',
          timestamp: log.created_at,
        }))
      } catch (e) {
        // Table doesn't exist yet, use empty array
        formattedActivity = []
      }

      // Load alerts from sa_notifications (if table exists)
      let formattedAlerts: Alert[] = []
      try {
        const { data: notificationsData } = await supabase
          .from('sa_notifications')
          .select('*')
          .eq('is_read', false)
          .order('created_at', { ascending: false })
          .limit(5)

        formattedAlerts = (notificationsData || []).map((notif: any) => ({
          id: notif.id,
          type: (notif.type === 'error' ? 'error' : notif.type === 'warning' ? 'warning' : 'info') as 'error' | 'success' | 'info' | 'warning',
          title: notif.title,
          message: notif.message,
          timestamp: notif.created_at,
        }))
      } catch (e) {
        // Table doesn't exist yet, use empty array
        formattedAlerts = []
      }

      setStats({
        totalRestaurants: totalRestaurants || 0,
        activeRestaurants: activeRestaurants || 0,
        trialRestaurants: 0,
        suspendedRestaurants: 0,
        expiredSubscriptions: 0,
        monthlyRevenue,
        annualRevenue,
        activeUsers: activeUsers || 0,
        onlineUsers: Math.floor((activeUsers || 0) * 0.3),
        totalEmployees: totalEmployees || 0,
        totalOrders: totalOrders || 0,
        totalSales,
        totalTransactions: totalOrders || 0,
        totalCustomers: totalCustomers || 0,
        apiUsage: Math.floor(Math.random() * 50000) + 10000,
        storageUsage: 0,
        databaseHealth: 'healthy',
        systemHealth: 'healthy',
        serverStatus: 'online',
      })

      setRecentActivity(formattedActivity)
      setAlerts(formattedAlerts)
    } catch (error) {
      console.error('Error loading dashboard stats:', error)
      toast.error('Failed to load dashboard stats')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDashboardStats()
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timeInterval)
  }, [loadDashboardStats])

  const revenueChartData = useMemo(() => ({
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [{
      label: 'Revenue',
      data: [12000, 19000, 15000, 25000, 22000, 30000, 28000, 35000, 40000, 38000, 45000, 50000],
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true,
    }]
  }), [])

  const restaurantStatusChartData = useMemo(() => ({
    labels: ['Active', 'Trial', 'Suspended', 'Archived'],
    datasets: [{
      data: [stats.activeRestaurants, stats.trialRestaurants, stats.suspendedRestaurants, 0],
      backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b', '#6b7280'],
    }]
  }), [stats])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#F3F4F9]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4338CA]"></div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#F3F4F9] font-sans text-[#181A2E]">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 bg-gradient-to-b from-[#14103A] via-[#1B1650] to-[#241E66] text-[#EDEBFB] flex flex-col sticky top-0 h-screen">
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-5.5 py-5.5 border-b border-white/8">
          <div className="w-8.5 h-8.5 rounded-[9px] bg-gradient-to-br from-[#5286B3] to-[#5B4FE0] flex items-center justify-center font-sans font-bold text-base text-air-">S</div>
          <div>
            <div className="font-sans font-semibold text-[15.5px] tracking-[0.2px]">SomBill</div>
            <div className="text-[10.5px] text-[#A9A5DE] tracking-[1.2px] uppercase mt-px">Super Admin</div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4 px-3">
          <div className="mb-1.5">
            <div className="text-[10.5px] tracking-[1.3px] uppercase text-[#7C77B3] px-3 py-3.5 font-semibold">Overview</div>
            <div className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13.3px] cursor-pointer ${activeNav === 'dashboard' ? 'bg-white/12 text-white font-medium' : 'text-[#C9C6EA] hover:bg-white/6'}`} onClick={() => setActiveNav('dashboard')}>
              <LayoutDashboard className="w-4 h-4" />
              Command Center
            </div>
          </div>

          <div className="mb-1.5">
            <div className="text-[10.5px] tracking-[1.3px] uppercase text-[#7C77B3] px-3 py-3.5 font-semibold">Restaurants</div>
            <Link to="/superadmin/restaurants" className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13.3px] ${window.location.pathname === '/superadmin/restaurants' ? 'bg-white/12 text-white font-medium' : 'text-[#C9C6EA] hover:bg-white/6'}`}>
              <Building2 className="w-4 h-4" />
              All Restaurants <span className="ml-auto font-mono text-[10.5px] bg-white/10 px-1.5 py-px rounded-[20px] text-[#D9D6F5]">{stats.totalRestaurants}</span>
            </Link>
            <Link to="/superadmin/restaurants/new" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13.3px] text-[#C9C6EA] hover:bg-white/6">
              <Plus className="w-4 h-4" />
              Onboarding Wizard
            </Link>
          </div>

          <div className="mb-1.5">
            <div className="text-[10.5px] tracking-[1.3px] uppercase text-[#7C77B3] px-3 py-3.5 font-semibold">Subscriptions</div>
            <Link to="/superadmin/subscriptions" className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13.3px] ${window.location.pathname === '/superadmin/subscriptions' ? 'bg-white/12 text-white font-medium' : 'text-[#C9C6EA] hover:bg-white/6'}`}>
              <CreditCard className="w-4 h-4" />
              Plans & Pricing
            </Link>
            <Link to="/superadmin/payments" className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13.3px] ${window.location.pathname === '/superadmin/payments' ? 'bg-white/12 text-white font-medium' : 'text-[#C9C6EA] hover:bg-white/6'}`}>
              <DollarSign className="w-4 h-4" />
              Billing & Invoices
            </Link>
          </div>

          <div className="mb-1.5">
            <div className="text-[10.5px] tracking-[1.3px] uppercase text-[#7C77B3] px-3 py-3.5 font-semibold">Users</div>
            <Link to="/superadmin/users" className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13.3px] ${window.location.pathname === '/superadmin/users' ? 'bg-white/12 text-white font-medium' : 'text-[#C9C6EA] hover:bg-white/6'}`}>
              <Users className="w-4 h-4" />
              Owners & Staff
            </Link>
          </div>

          <div className="mb-1.5">
            <div className="text-[10.5px] tracking-[1.3px] uppercase text-[#7C77B3] px-3 py-3.5 font-semibold">System</div>
            <Link to="/superadmin/settings" className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13.3px] ${window.location.pathname === '/superadmin/settings' ? 'bg-white/12 text-white font-medium' : 'text-[#C9C6EA] hover:bg-white/6'}`}>
              <Settings className="w-4 h-4" />
              Settings
            </Link>
            <Link to="/superadmin/reports" className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13.3px] ${window.location.pathname === '/superadmin/reports' ? 'bg-white/12 text-white font-medium' : 'text-[#C9C6EA] hover:bg-white/6'}`}>
              <FileText className="w-4 h-4" />
              Reports
            </Link>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="px-5 py-4 border-t border-white/8 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#5286B3] flex items-center justify-center text-xs font-semibold text-white flex-shrink-0">SA</div>
          <div className="flex-1">
            <div className="text-[12.5px] font-medium text-white">Super Admin</div>
            <div className="text-[10.5px] text-[#9C98CE]">Root Access</div>
          </div>
          <button 
            onClick={() => logout()}
            className="p-2 rounded-lg text-[#C9C6EA] hover:bg-white/10 transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar */}
        <div className="h-16 bg-white border-b border-[#E4E5EF] flex items-center justify-between px-7 sticky top-0 z-5">
          <div className="flex items-center gap-2 bg-[#F3F4F9] border border-[#E4E5EF] rounded-lg px-3 py-2 w-[340px] text-[#6C7089]">
            <Search className="w-3.75 h-3.75" />
            <input 
              type="text" 
              placeholder="Search restaurants, owners, invoices…" 
              className="border-none bg-transparent outline-none text-[13px] w-full text-[#181A2E]"
            />
            <span className="font-mono text-[10.5px] bg-white border border-[#D3D5E4] rounded px-1.25 py-px text-[#6C7089]">⌘K</span>
          </div>
          <div className="flex items-center gap-4.5">
            <div className="flex items-center gap-1.5 text-[11.5px] font-mono text-[#177A4E] bg-[#E1F3EA] px-2.5 py-1.25 rounded-[20px]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#177A4E] animate-pulse"></span>
              All systems operational
            </div>
            <div className="relative w-8.5 h-8.5 rounded-lg flex items-center justify-center text-[#6C7089] cursor-pointer hover:bg-[#F3F4F9]">
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute top-0.75 right-0.75 w-3.75 h-3.75 rounded-full bg-[#BF3B34] text-white text-[9px] font-semibold flex items-center justify-center font-mono">{alerts.length}</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#4338CA] text-white flex items-center justify-center text-xs font-semibold">SA</div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6.5 pb-12.5">
          {/* Page Header */}
          <div className="flex items-end justify-between mb-5 flex-wrap gap-3.5">
            <div>
              <div className="font-sora text-[23px] font-semibold text-[#181A2E]">Command Center</div>
              <div className="text-[12.8px] text-[#6C7089] mt-0.75">Platform-wide visibility across every restaurant, tenant, and transaction · Updated moments ago</div>
            </div>
            <div className="flex gap-2.5">
              <button className="text-[13px] font-medium px-4 py-2.25 rounded-lg border border-[#D3D5E4] bg-white text-[#3C3F58] flex items-center gap-1.75 cursor-pointer hover:bg-[#F3F4F9]">
                <FileText className="w-3.5 h-3.5" />
                Export report
              </button>
              <Link to="/superadmin/restaurants/new">
                <button className="text-[13px] font-medium px-4 py-2.25 rounded-lg border border-[#4338CA] bg-[#4338CA] text-white flex items-center gap-1.75 cursor-pointer hover:bg-[#332B85]">
                  <Plus className="w-3.5 h-3.5" />
                  New restaurant
                </button>
              </Link>
            </div>
          </div>

          {/* Pulse Strip - System Health */}
          <div className="bg-gradient-to-r from-[#14103A] to-[#241E66] rounded-[14px] p-4.5 grid grid-cols-4 gap-0 mb-5.5 relative overflow-hidden">
            <div className="px-5.5 border-r border-white/10 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] tracking-[0.6px] uppercase text-[#B9B4E8] font-semibold">System health</span>
                <span className="flex items-center gap-1.25 text-[10.5px] font-mono text-[#8FE3B4]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3FD988] shadow-[0_0_0_3px_rgba(63,217,136,0.18)] animate-pulse"></span>
                  Nominal
                </span>
              </div>
              <div className="font-mono text-[21px] font-semibold text-white">99.98%</div>
            </div>
            <div className="px-5.5 border-r border-white/10 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] tracking-[0.6px] uppercase text-[#B9B4E8] font-semibold">Database</span>
                <span className="flex items-center gap-1.25 text-[10.5px] font-mono text-[#8FE3B4]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3FD988] shadow-[0_0_0_3px_rgba(63,217,136,0.18)] animate-pulse"></span>
                  Healthy
                </span>
              </div>
              <div className="font-mono text-[21px] font-semibold text-white">18ms</div>
            </div>
            <div className="px-5.5 border-r border-white/10 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] tracking-[0.6px] uppercase text-[#B9B4E8] font-semibold">API gateway</span>
                <span className="flex items-center gap-1.25 text-[10.5px] font-mono text-[#8FE3B4]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3FD988] shadow-[0_0_0_3px_rgba(63,217,136,0.18)] animate-pulse"></span>
                  78% quota
                </span>
              </div>
              <div className="font-mono text-[21px] font-semibold text-white">4.2M<span className="text-[12px] text-[#B9B4E8]">/day</span></div>
            </div>
            <div className="px-5.5 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] tracking-[0.6px] uppercase text-[#B9B4E8] font-semibold">Server fleet</span>
                <span className="flex items-center gap-1.25 text-[10.5px] font-mono text-[#8FE3B4]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3FD988] shadow-[0_0_0_3px_rgba(63,217,136,0.18)] animate-pulse"></span>
                  12/12 up
                </span>
              </div>
              <div className="font-mono text-[21px] font-semibold text-white">41%<span className="text-[12px] text-[#B9B4E8]"> load</span></div>
            </div>
          </div>

          {/* Restaurants KPI Cluster */}
          <div className="mb-6.5">
            <div className="flex items-center gap-2 mb-2.75">
              <span className="text-[11.5px] font-semibold tracking-[0.8px] uppercase text-[#6C7089]">Restaurants</span>
              <div className="flex-1 h-px bg-[#E4E5EF]"></div>
            </div>
            <div className="grid grid-cols-5 gap-3.5">
              <div className="bg-white border border-[#E4E5EF] rounded-[12px] p-4 px-4.25">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[12px] text-[#6C7089]">Total restaurants</span>
                  <div className="w-7.5 h-7.5 rounded-lg bg-[#EDEBFC] text-[#4338CA] flex items-center justify-center">
                    <Building2 className="w-3.75 h-3.75" />
                  </div>
                </div>
                <div className="font-mono text-[22px] font-semibold text-[#181A2E]">{stats.totalRestaurants.toLocaleString()}</div>
                <div className="text-[11px] mt-1.5 flex items-center gap-1 font-medium text-[#177A4E]">↑ 4.8% this month</div>
              </div>
              <div className="bg-white border border-[#E4E5EF] rounded-[12px] p-4 px-4.25">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[12px] text-[#6C7089]">Active</span>
                  <div className="w-7.5 h-7.5 rounded-lg bg-[#E1F3EA] text-[#177A4E] flex items-center justify-center">
                    <CheckCircle className="w-3.75 h-3.75" />
                  </div>
                </div>
                <div className="font-mono text-[22px] font-semibold text-[#181A2E]">{stats.activeRestaurants.toLocaleString()}</div>
                <div className="text-[11px] mt-1.5 flex items-center gap-1 font-medium text-[#177A4E]">88.9% of total</div>
              </div>
              <div className="bg-white border border-[#E4E5EF] rounded-[12px] p-4 px-4.25">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[12px] text-[#6C7089]">On trial</span>
                  <div className="w-7.5 h-7.5 rounded-lg bg-[#E6EDF4] text-[#3E6B9E] flex items-center justify-center">
                    <Clock className="w-3.75 h-3.75" />
                  </div>
                </div>
                <div className="font-mono text-[22px] font-semibold text-[#181A2E]">{stats.trialRestaurants.toLocaleString()}</div>
                <div className="text-[11px] mt-1.5 flex items-center gap-1 font-medium text-[#6C7089]">32 convert this week</div>
              </div>
              <div className="bg-white border border-[#E4E5EF] rounded-[12px] p-4 px-4.25">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[12px] text-[#6C7089]">Suspended</span>
                  <div className="w-7.5 h-7.5 rounded-lg bg-[#FBE6E4] text-[#BF3B34] flex items-center justify-center">
                    <XCircle className="w-3.75 h-3.75" />
                  </div>
                </div>
                <div className="font-mono text-[22px] font-semibold text-[#181A2E]">{stats.suspendedRestaurants.toLocaleString()}</div>
                <div className="text-[11px] mt-1.5 flex items-center gap-1 font-medium text-[#BF3B34]">↑ 6 vs last week</div>
              </div>
              <div className="bg-white border border-[#E4E5EF] rounded-[12px] p-4 px-4.25">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[12px] text-[#6C7089]">Expired subs</span>
                  <div className="w-7.5 h-7.5 rounded-lg bg-[#FBEDD8] text-[#B4720B] flex items-center justify-center">
                    <AlertTriangle className="w-3.75 h-3.75" />
                  </div>
                </div>
                <div className="font-mono text-[22px] font-semibold text-[#181A2E]">{stats.expiredSubscriptions.toLocaleString()}</div>
                <div className="text-[11px] mt-1.5 flex items-center gap-1 font-medium text-[#6C7089]">Needs follow-up</div>
              </div>
            </div>
          </div>

          {/* Revenue KPI Cluster */}
          <div className="mb-6.5">
            <div className="flex items-center gap-2 mb-2.75">
              <span className="text-[11.5px] font-semibold tracking-[0.8px] uppercase text-[#6C7089]">Revenue & commerce</span>
              <div className="flex-1 h-px bg-[#E4E5EF]"></div>
            </div>
            <div className="grid grid-cols-5 gap-3.5">
              <div className="bg-white border border-[#E4E5EF] rounded-[12px] p-4 px-4.25">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[12px] text-[#6C7089]">Monthly revenue</span>
                  <div className="w-7.5 h-7.5 rounded-lg bg-[#EDEBFC] text-[#4338CA] flex items-center justify-center">
                    <DollarSign className="w-3.75 h-3.75" />
                  </div>
                </div>
                <div className="font-mono text-[22px] font-semibold text-[#181A2E]">{formatCurrency(stats.monthlyRevenue)}</div>
                <div className="text-[11px] mt-1.5 flex items-center gap-1 font-medium text-[#177A4E]">↑ 12.3% MoM</div>
              </div>
              <div className="bg-white border border-[#E4E5EF] rounded-[12px] p-4 px-4.25">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[12px] text-[#6C7089]">Annual revenue</span>
                  <div className="w-7.5 h-7.5 rounded-lg bg-[#EDEBFC] text-[#4338CA] flex items-center justify-center">
                    <TrendingUp className="w-3.75 h-3.75" />
                  </div>
                </div>
                <div className="font-mono text-[22px] font-semibold text-[#181A2E]">{formatCurrency(stats.annualRevenue)}</div>
                <div className="text-[11px] mt-1.5 flex items-center gap-1 font-medium text-[#177A4E]">On pace vs plan</div>
              </div>
              <div className="bg-white border border-[#E4E5EF] rounded-[12px] p-4 px-4.25">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[12px] text-[#6C7089]">Total orders (24h)</span>
                  <div className="w-7.5 h-7.5 rounded-lg bg-[#E6EDF4] text-[#3E6B9E] flex items-center justify-center">
                    <ShoppingCart className="w-3.75 h-3.75" />
                  </div>
                </div>
                <div className="font-mono text-[22px] font-semibold text-[#181A2E]">{stats.totalOrders.toLocaleString()}</div>
                <div className="text-[11px] mt-1.5 flex items-center gap-1 font-medium text-[#177A4E]">↑ 3.1% vs yesterday</div>
              </div>
              <div className="bg-white border border-[#E4E5EF] rounded-[12px] p-4 px-4.25">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[12px] text-[#6C7089]">Total sales (24h)</span>
                  <div className="w-7.5 h-7.5 rounded-lg bg-[#E6EDF4] text-[#3E6B9E] flex items-center justify-center">
                    <CreditCard className="w-3.75 h-3.75" />
                  </div>
                </div>
                <div className="font-mono text-[22px] font-semibold text-[#181A2E]">{formatCurrency(stats.totalSales)}</div>
                <div className="text-[11px] mt-1.5 flex items-center gap-1 font-medium text-[#177A4E]">↑ 2.4% vs yesterday</div>
              </div>
              <div className="bg-white border border-[#E4E5EF] rounded-[12px] p-4 px-4.25">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[12px] text-[#6C7089]">Total customers</span>
                  <div className="w-7.5 h-7.5 rounded-lg bg-[#EDEBFC] text-[#4338CA] flex items-center justify-center">
                    <Users className="w-3.75 h-3.75" />
                  </div>
                </div>
                <div className="font-mono text-[22px] font-semibold text-[#181A2E]">{stats.totalCustomers.toLocaleString()}</div>
                <div className="text-[11px] mt-1.5 flex items-center gap-1 font-medium text-[#177A4E]">↑ 941 today</div>
              </div>
            </div>
          </div>

          {/* Users & Infrastructure KPI Cluster */}
          <div className="mb-6.5">
            <div className="flex items-center gap-2 mb-2.75">
              <span className="text-[11.5px] font-semibold tracking-[0.8px] uppercase text-[#6C7089]">Users & infrastructure</span>
              <div className="flex-1 h-px bg-[#E4E5EF]"></div>
            </div>
            <div className="grid grid-cols-4 gap-3.5">
              <div className="bg-white border border-[#E4E5EF] rounded-[12px] p-4 px-4.25">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[12px] text-[#6C7089]">Active users</span>
                  <div className="w-7.5 h-7.5 rounded-lg bg-[#EDEBFC] text-[#4338CA] flex items-center justify-center">
                    <Users className="w-3.75 h-3.75" />
                  </div>
                </div>
                <div className="font-mono text-[22px] font-semibold text-[#181A2E]">{stats.activeUsers.toLocaleString()}</div>
                <div className="text-[11px] mt-1.5 flex items-center gap-1 font-medium text-[#6C7089]">{stats.onlineUsers.toLocaleString()} online now</div>
              </div>
              <div className="bg-white border border-[#E4E5EF] rounded-[12px] p-4 px-4.25">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[12px] text-[#6C7089]">Total employees</span>
                  <div className="w-7.5 h-7.5 rounded-lg bg-[#E6EDF4] text-[#3E6B9E] flex items-center justify-center">
                    <Shield className="w-3.75 h-3.75" />
                  </div>
                </div>
                <div className="font-mono text-[22px] font-semibold text-[#181A2E]">{stats.totalEmployees.toLocaleString()}</div>
                <div className="text-[11px] mt-1.5 flex items-center gap-1 font-medium text-[#177A4E]">Across {stats.activeRestaurants} restaurants</div>
              </div>
              <div className="bg-white border border-[#E4E5EF] rounded-[12px] p-4 px-4.25">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[12px] text-[#6C7089]">Storage usage</span>
                  <div className="w-7.5 h-7.5 rounded-lg bg-[#FBEDD8] text-[#B4720B] flex items-center justify-center">
                    <HardDrive className="w-3.75 h-3.75" />
                  </div>
                </div>
                <div className="font-mono text-[22px] font-semibold text-[#181A2E]">62%</div>
                <div className="text-[11px] mt-1.5 flex items-center gap-1 font-medium text-[#6C7089]">2.9 TB of 4.7 TB</div>
              </div>
              <div className="bg-white border border-[#E4E5EF] rounded-[12px] p-4 px-4.25">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[12px] text-[#6C7089]">Audit events (24h)</span>
                  <div className="w-7.5 h-7.5 rounded-lg bg-[#EDEBFC] text-[#4338CA] flex items-center justify-center">
                    <Shield className="w-3.75 h-3.75" />
                  </div>
                </div>
                <div className="font-mono text-[22px] font-semibold text-[#181A2E]">3,908</div>
                <div className="text-[11px] mt-1.5 flex items-center gap-1 font-medium text-[#6C7089]">2 flagged for review</div>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-[1.6fr_1fr] gap-4 mb-6.5">
            <div className="bg-white border border-[#E4E5EF] rounded-[12px] p-5">
              <div className="flex items-center justify-between mb-3.5">
                <div>
                  <div className="font-sora text-[14.5px] font-semibold">Revenue trend</div>
                  <div className="text-[11.5px] text-[#6C7089]">Recognized revenue across all tenants</div>
                </div>
              </div>
              <div className="h-[230px] flex items-center justify-center text-[#6C7089]">
                <LineChart className="w-12 h-12" />
                <span className="ml-2">Revenue chart placeholder</span>
              </div>
            </div>
            <div className="bg-white border border-[#E4E5EF] rounded-[12px] p-5">
              <div className="flex items-center justify-between mb-3.5">
                <div>
                  <div className="font-sora text-[14.5px] font-semibold">Restaurant status</div>
                  <div className="text-[11.5px] text-[#6C7089]">Distribution across {stats.totalRestaurants} tenants</div>
                </div>
              </div>
              <div className="h-[230px] flex items-center justify-center text-[#6C7089]">
                <PieChart className="w-12 h-12" />
                <span className="ml-2">Status chart placeholder</span>
              </div>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="bg-white border border-[#E4E5EF] rounded-[12px] p-5">
            <div className="flex items-center justify-between mb-3.5">
              <div>
                <div className="font-sora text-[14.5px] font-semibold">Live activity</div>
                <div className="text-[11.5px] text-[#6C7089]">Audit feed, platform-wide</div>
              </div>
            </div>
            <div className="flex gap-1 bg-[#F3F4F9] p-0.75 rounded-lg mb-3.5">
              <div className="text-[11.5px] px-3 py-1.5 rounded-md text-[#6C7089] cursor-pointer font-medium bg-white text-[#181A2E] shadow-sm">All</div>
              <div className="text-[11.5px] px-3 py-1.5 rounded-md text-[#6C7089] cursor-pointer font-medium">Alerts</div>
              <div className="text-[11.5px] px-3 py-1.5 rounded-md text-[#6C7089] cursor-pointer font-medium">Billing</div>
            </div>
            <div className="space-y-0">
              {recentActivity.length === 0 ? (
                <p className="text-[#6C7089] text-center py-4">No recent activity</p>
              ) : (
                recentActivity.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex gap-2.5 py-2.75 border-b border-[#E4E5EF] last:border-0 last:pb-0">
                    <div className="w-2 h-2 rounded-full mt-1.25 flex-shrink-0 bg-[#3E6B9E]"></div>
                    <div className="flex-1">
                      <div className="text-[12.5px] text-[#3C3F58] leading-relaxed">
                        <span className="font-semibold text-[#181A2E]">{activity.restaurant || 'System'}</span> {activity.description}
                      </div>
                      <div className="text-[10.8px] text-[#9598AC] mt-0.5 font-mono">
                        {new Date(activity.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
