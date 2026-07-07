import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import {
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Printer,
  RefreshCw,
  ChefHat,
  Users,
  Calendar,
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
  priority?: 'low' | 'normal' | 'high' | 'urgent'
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
}

export default function KitchenOrders() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [showOrderDetail, setShowOrderDetail] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    loadData()
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timeInterval)
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      let query = supabase
        .from('orders')
        .select('*, tables(number), users(name)')
        .order('created_at', { ascending: false })

      if (user?.tenant_id) {
        query = query.eq('tenant_id', user.tenant_id)
      }

      const { data: ordersData, error } = await query

      if (error) {
        console.error('Error loading orders:', error)
        toast.error('Failed to load orders')
      } else {
        const ordersWithItems = await Promise.all(
          (ordersData || []).map(async (order: any) => {
            const { data: items } = await supabase
              .from('order_items')
              .select('*')
              .eq('order_id', order.id)

            return {
              ...order,
              table_number: order.tables?.number,
              waiter: order.users ? { name: order.users.name } : undefined,
              items: items || [],
            }
          })
        )
        setOrders(ordersWithItems)
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
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

  async function handlePrintTicket(order: Order) {
    try {
      toast.success('Printing kitchen ticket...')
      // In a real implementation, this would trigger a print dialog
      // or send to a kitchen printer
    } catch (error) {
      console.error('Error printing ticket:', error)
      toast.error('Failed to print ticket')
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

  function isOrderDelayed(order: Order): boolean {
    if (!order.created_at) return false
    const elapsed = Date.now() - new Date(order.created_at).getTime()
    return elapsed > 15 * 60 * 1000
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.table_number?.toString().includes(searchQuery) ||
      order.waiter?.name.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    const matchesType = typeFilter === 'all' || order.order_type === typeFilter
    
    return matchesSearch && matchesStatus && matchesType
  })

  const statusCounts = {
    all: orders.length,
    new: orders.filter(o => o.status === 'new').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready: orders.filter(o => o.status === 'ready').length,
    served: orders.filter(o => o.status === 'served').length,
    completed: orders.filter(o => o.status === 'completed').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f5f6f8]">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 text-[#3d0f91]" />
          <p className="text-[#1c1530]">Loading Kitchen Orders...</p>
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
              Kitchen Orders
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="text-[10.5px] font-semibold tracking-[0.09em] uppercase text-white/38 p-[16px_10px_8px] relative z-10">
          Operations
        </div>
        <ul className="flex flex-col gap-0.5 relative z-10">
          <li>
            <Link to="/kitchen/operations" className="flex items-center gap-[11px] p-[9px_12px] rounded-[10px] text-white/72 hover:bg-white/6 hover:text-white text-[13.5px] font-medium transition-all">
              <ChefHat width="17" height="17" />
              Operations
            </Link>
          </li>
          <li>
            <Link to="/kitchen/dashboard" className="flex items-center gap-[11px] p-[9px_12px] rounded-[10px] text-white/72 hover:bg-white/6 hover:text-white text-[13.5px] font-medium transition-all">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="m7 15 4-6 3 3 5-7"/></svg>
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
            <Link to="/kitchen/orders" className="flex items-center gap-[11px] p-[9px_12px] rounded-[10px] bg-white/10 text-white text-[13.5px] font-medium transition-all shadow-[inset_3px_0_0_#86abc9]">
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
            <h1 className="font-['Sora'] text-[19px] font-bold tracking-[-0.01em]">Kitchen Orders</h1>
            <p className="text-[12.5px] text-[#5c5570] mt-0.5">Manage and track all kitchen orders</p>
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

        {/* Search and Filters */}
        <section className="p-[20px_30px]">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5c5570] w-4 h-4" />
              <input
                type="text"
                placeholder="Search orders by ID, table, or waiter..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-[10px] border border-[#e7e8ea] bg-white text-[13px] focus:outline-none focus:border-[#3d0f91]"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 rounded-[10px] border border-[#e7e8ea] bg-white text-[13px] focus:outline-none focus:border-[#3d0f91]"
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="served">Served</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2.5 rounded-[10px] border border-[#e7e8ea] bg-white text-[13px] focus:outline-none focus:border-[#3d0f91]"
            >
              <option value="all">All Types</option>
              <option value="dine_in">Dine-in</option>
              <option value="takeaway">Takeaway</option>
              <option value="delivery">Delivery</option>
            </select>
            <button
              onClick={loadData}
              className="flex items-center gap-2 px-4 py-2.5 rounded-[10px] border border-[#e7e8ea] bg-white text-[13px] font-semibold hover:bg-[#f5f6f8] transition-all"
            >
              <RefreshCw width="16" height="16" />
              Refresh
            </button>
          </div>
        </section>

        {/* Status Tabs */}
        <section className="flex gap-2 px-[30px] pb-4 flex-wrap">
          {Object.entries(statusCounts).map(([status, count]) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-[100px] text-[13px] font-semibold border cursor-pointer flex items-center gap-1.5 transition-all ${
                statusFilter === status ? 'bg-[#3d0f91] border-[#3d0f91] text-white' : 'bg-white border-[#e7e8ea] text-[#1c1530]'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)} <span className={`text-[11px] px-[7px] py-[1px] rounded-[100px] ${statusFilter === status ? 'bg-white/20 text-white' : 'bg-[#f5f6f8] text-[#1c1530]'}`}>{count}</span>
            </button>
          ))}
        </section>

        {/* Orders Table */}
        <section className="px-[30px] pb-[30px]">
          <div className="bg-white border border-[#e7e8ea] rounded-[14px] shadow-[0_1px_2px_rgba(28,21,48,0.04),0_8px_24px_-12px_rgba(28,21,48,0.12)] overflow-hidden">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12 text-[#5c5570] text-[13px]">
                No orders found
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-[#f5f6f8] border-b border-[#e7e8ea]">
                  <tr>
                    <th className="text-left p-[14px_18px] text-[12px] font-semibold text-[#5c5570] uppercase tracking-[0.03em]">Order ID</th>
                    <th className="text-left p-[14px_18px] text-[12px] font-semibold text-[#5c5570] uppercase tracking-[0.03em]">Table</th>
                    <th className="text-left p-[14px_18px] text-[12px] font-semibold text-[#5c5570] uppercase tracking-[0.03em]">Type</th>
                    <th className="text-left p-[14px_18px] text-[12px] font-semibold text-[#5c5570] uppercase tracking-[0.03em]">Status</th>
                    <th className="text-left p-[14px_18px] text-[12px] font-semibold text-[#5c5570] uppercase tracking-[0.03em]">Time</th>
                    <th className="text-left p-[14px_18px] text-[12px] font-semibold text-[#5c5570] uppercase tracking-[0.03em]">Items</th>
                    <th className="text-left p-[14px_18px] text-[12px] font-semibold text-[#5c5570] uppercase tracking-[0.03em]">Total</th>
                    <th className="text-left p-[14px_18px] text-[12px] font-semibold text-[#5c5570] uppercase tracking-[0.03em]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map(order => (
                    <tr key={order.id} className="border-b border-[#e7e8ea] hover:bg-[#f5f6f8] transition-colors">
                      <td className="p-[14px_18px]">
                        <div className="flex items-center gap-2">
                          <span className="font-['Sora'] font-bold text-[14px]">#{order.id.slice(-4)}</span>
                          {order.priority && order.priority !== 'normal' && (
                            <span className={`text-[10px] font-bold uppercase tracking-[0.03em] px-1.5 py-0.5 rounded-[5px] ${
                              order.priority === 'urgent' ? 'bg-[#dc2626] text-white' :
                              order.priority === 'high' ? 'bg-[#f59e0b] text-white' :
                              'bg-[#6b7280] text-white'
                            }`}>
                              {order.priority}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-[14px_18px] text-[13px]">
                        {order.order_type === 'dine_in' ? `Table ${order.table_number || 'N/A'}` : 'N/A'}
                      </td>
                      <td className="p-[14px_18px]">
                        <span className={`text-[11px] font-bold uppercase tracking-[0.03em] px-2 py-1 rounded-[6px] ${
                          order.order_type === 'dine_in' ? 'bg-[#efeafc] text-[#3d0f91]' : 
                          order.order_type === 'takeaway' ? 'bg-[#eaf2f7] text-[#6d97b8]' : 
                          'bg-[#fdf1e2] text-[#d97706]'
                        }`}>
                          {order.order_type === 'dine_in' ? 'Dine-in' : order.order_type === 'takeaway' ? 'Takeaway' : 'Delivery'}
                        </span>
                      </td>
                      <td className="p-[14px_18px]">
                        <span className={`text-[11px] font-bold uppercase tracking-[0.03em] px-2 py-1 rounded-[6px] ${
                          order.status === 'new' ? 'bg-[#3d0f91] text-white' :
                          order.status === 'preparing' ? 'bg-[#6d97b8] text-white' :
                          order.status === 'ready' ? 'bg-[#1a9a56] text-white' :
                          order.status === 'served' ? 'bg-[#059669] text-white' :
                          order.status === 'completed' ? 'bg-[#6b7280] text-white' :
                          'bg-[#dc2626] text-white'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="p-[14px_18px] text-[13px]">
                        <div className="flex items-center gap-1.5">
                          <Clock width="14" height="14" className={isOrderDelayed(order) ? 'text-[#dc2626]' : 'text-[#5c5570]'} />
                          {getOrderElapsedTime(order)}
                        </div>
                      </td>
                      <td className="p-[14px_18px] text-[13px]">{order.items?.length || 0}</td>
                      <td className="p-[14px_18px] font-['IBM_Plex_Mono'] font-bold text-[13px]">${order.total.toFixed(2)}</td>
                      <td className="p-[14px_18px]">
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setSelectedOrder(order); setShowOrderDetail(true) }}
                            className="p-2 rounded-[8px] border border-[#e7e8ea] bg-white hover:bg-[#f5f6f8] transition-all"
                            title="View Details"
                          >
                            <Eye width="14" height="14" />
                          </button>
                          <button
                            onClick={() => handlePrintTicket(order)}
                            className="p-2 rounded-[8px] border border-[#e7e8ea] bg-white hover:bg-[#f5f6f8] transition-all"
                            title="Print Ticket"
                          >
                            <Printer width="14" height="14" />
                          </button>
                          {order.status === 'new' && (
                            <button
                              onClick={() => handleUpdateOrderStatus(order.id, 'preparing')}
                              className="p-2 rounded-[8px] bg-[#3d0f91] text-white hover:brightness-0.94 transition-all"
                              title="Start Preparing"
                            >
                              <ChefHat width="14" height="14" />
                            </button>
                          )}
                          {order.status === 'preparing' && (
                            <button
                              onClick={() => handleUpdateOrderStatus(order.id, 'ready')}
                              className="p-2 rounded-[8px] bg-[#6d97b8] text-white hover:brightness-0.94 transition-all"
                              title="Mark Ready"
                            >
                              <CheckCircle width="14" height="14" />
                            </button>
                          )}
                          {order.status === 'ready' && (
                            <button
                              onClick={() => handleUpdateOrderStatus(order.id, 'served')}
                              className="p-2 rounded-[8px] bg-[#1a9a56] text-white hover:brightness-0.94 transition-all"
                              title="Mark Served"
                            >
                              <CheckCircle width="14" height="14" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Order Detail Modal */}
        {showOrderDetail && selectedOrder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[14px] max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-[20px] border-b border-[#e7e8ea] flex items-center justify-between">
                <h2 className="font-['Sora'] text-[18px] font-bold">Order #{selectedOrder.id.slice(-4)}</h2>
                <button
                  onClick={() => setShowOrderDetail(false)}
                  className="p-2 rounded-[8px] hover:bg-[#f5f6f8] transition-all"
                >
                  <XCircle width="20" height="20" />
                </button>
              </div>
              <div className="p-[20px]">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <div className="text-[11px] text-[#5c5570] mb-1">Table</div>
                    <div className="font-semibold text-[14px]">
                      {selectedOrder.order_type === 'dine_in' ? `Table ${selectedOrder.table_number || 'N/A'}` : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-[#5c5570] mb-1">Order Type</div>
                    <div className="font-semibold text-[14px] capitalize">{selectedOrder.order_type.replace('_', ' ')}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-[#5c5570] mb-1">Status</div>
                    <div className="font-semibold text-[14px] capitalize">{selectedOrder.status}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-[#5c5570] mb-1">Waiter</div>
                    <div className="font-semibold text-[14px]">{selectedOrder.waiter?.name || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-[#5c5570] mb-1">Created</div>
                    <div className="font-semibold text-[14px]">{new Date(selectedOrder.created_at).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-[#5c5570] mb-1">Elapsed</div>
                    <div className="font-semibold text-[14px]">{getOrderElapsedTime(selectedOrder)}</div>
                  </div>
                </div>

                {selectedOrder.notes && (
                  <div className="mb-6 p-3 bg-[#fdf1e2] rounded-[8px]">
                    <div className="text-[11px] text-[#d97706] mb-1">Order Notes</div>
                    <div className="text-[13px]">{selectedOrder.notes}</div>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="font-['Sora'] text-[15px] font-bold mb-3">Order Items</h3>
                  <div className="space-y-2">
                    {selectedOrder.items?.map(item => (
                      <div key={item.id} className="flex justify-between items-center p-3 bg-[#f5f6f8] rounded-[8px]">
                        <div>
                          <div className="font-semibold text-[13px]">{item.product_name}</div>
                          <div className="text-[11px] text-[#5c5570]">Qty: {item.quantity} × ${item.unit_price.toFixed(2)}</div>
                          {item.notes && <div className="text-[11px] text-[#d97706] italic mt-1">{item.notes}</div>}
                        </div>
                        <div className="font-['IBM_Plex_Mono'] font-bold text-[13px]">${item.total_price.toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-[#e7e8ea]">
                  <div className="text-[11px] text-[#5c5570]">Total</div>
                  <div className="font-['Sora'] text-[24px] font-bold">${selectedOrder.total.toFixed(2)}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
