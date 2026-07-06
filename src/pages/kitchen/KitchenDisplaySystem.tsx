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
      .channel('kitchen-orders')
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
      .channel('kitchen-order-items')
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
    const elapsed = Date.now() - new Date(startTime).getTime()
    const minutes = Math.floor(elapsed / 60000)
    const seconds = Math.floor((elapsed % 60000) / 1000)
    return `${minutes}m ${seconds}s`
  }

  function getItemElapsedTime(item: OrderItem): string {
    const startTime = item.preparing_started_at || new Date().toISOString()
    const elapsed = Date.now() - new Date(startTime).getTime()
    const minutes = Math.floor(elapsed / 60000)
    const seconds = Math.floor((elapsed % 60000) / 1000)
    return `${minutes}m ${seconds}s`
  }

  function isOrderDelayed(order: Order): boolean {
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
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <ChefHat className="w-8 h-8 text-orange-500" />
            <div>
              <h1 className="text-2xl font-bold">Kitchen Display System</h1>
              <p className="text-sm text-gray-400">Welcome, {user?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-lg font-medium">{currentTime.toLocaleTimeString()}</p>
              <p className="text-xs text-gray-400">{currentTime.toLocaleDateString()}</p>
            </div>
            <Button variant="outline" onClick={() => logout()} className="border-gray-600 text-white hover:bg-gray-700">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-900 rounded-lg">
                  <Clock className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.new}</p>
                  <p className="text-sm text-gray-400">New Orders</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-900 rounded-lg">
                  <Flame className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.preparing}</p>
                  <p className="text-sm text-gray-400">Preparing</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-900 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.ready}</p>
                  <p className="text-sm text-gray-400">Ready</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-900 rounded-lg">
                  <UtensilsCrossed className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-gray-400">Total Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Station Filter */}
        <div className="mb-6 flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedStation('all')}
              className={`px-4 py-2 rounded-lg ${
                selectedStation === 'all' ? 'bg-orange-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              All Stations
            </button>
            {stations.map(station => (
              <button
                key={station.id}
                onClick={() => setSelectedStation(station.id)}
                className={`px-4 py-2 rounded-lg ${
                  selectedStation === station.id ? 'bg-orange-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {station.name}
              </button>
            ))}
          </div>
        </div>

        {/* Orders Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* New Orders */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              New Orders ({ordersByStatus.new.length})
            </h2>
            <div className="space-y-4">
              {ordersByStatus.new.map(order => (
                <Card key={order.id} className="bg-gray-800 border-blue-500 border-2">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-lg">Table {order.table_number || 'N/A'}</p>
                        <p className="text-sm text-gray-400">
                          {order.order_type === 'dine_in' ? 'Dine In' : order.order_type === 'takeaway' ? 'Takeaway' : 'Delivery'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-400">{formatDateTime(order.created_at)}</p>
                        {isOrderDelayed(order) && (
                          <p className="text-xs text-red-400 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Delayed
                          </p>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      {order.items?.map(item => (
                        <div key={item.id} className="flex items-start gap-2 bg-gray-700 rounded p-2">
                          <span className="font-bold text-blue-400">{item.quantity}x</span>
                          <div className="flex-1">
                            <p className="font-medium">{item.product_name}</p>
                            {item.notes && (
                              <p className="text-xs text-yellow-400 mt-1">Note: {item.notes}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    {order.notes && (
                      <div className="mb-4 p-2 bg-yellow-900/30 border border-yellow-600 rounded">
                        <p className="text-sm text-yellow-400">Order Note: {order.notes}</p>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleUpdateOrderStatus(order.id, 'preparing')}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        <Flame className="w-4 h-4 mr-2" />
                        Start Preparing
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {ordersByStatus.new.length === 0 && (
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-8 text-center text-gray-400">
                    No new orders
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Preparing Orders */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Flame className="w-5 h-5 text-yellow-400" />
              Preparing ({ordersByStatus.preparing.length})
            </h2>
            <div className="space-y-4">
              {ordersByStatus.preparing.map(order => (
                <Card key={order.id} className="bg-gray-800 border-yellow-500 border-2">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-lg">Table {order.table_number || 'N/A'}</p>
                        <p className="text-sm text-gray-400">
                          {order.order_type === 'dine_in' ? 'Dine In' : order.order_type === 'takeaway' ? 'Takeaway' : 'Delivery'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-yellow-400">{getOrderElapsedTime(order)}</p>
                        {isOrderDelayed(order) && (
                          <p className="text-xs text-red-400 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Delayed
                          </p>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      {order.items?.map(item => (
                        <div key={item.id} className="flex items-start gap-2 bg-gray-700 rounded p-2">
                          <span className="font-bold text-yellow-400">{item.quantity}x</span>
                          <div className="flex-1">
                            <p className="font-medium">{item.product_name}</p>
                            {item.notes && (
                              <p className="text-xs text-yellow-400 mt-1">Note: {item.notes}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Timer className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-400">{getItemElapsedTime(item)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {order.notes && (
                      <div className="mb-4 p-2 bg-yellow-900/30 border border-yellow-600 rounded">
                        <p className="text-sm text-yellow-400">Order Note: {order.notes}</p>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleUpdateOrderStatus(order.id, 'ready')}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark Ready
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {ordersByStatus.preparing.length === 0 && (
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-8 text-center text-gray-400">
                    No orders preparing
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Ready Orders */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              Ready ({ordersByStatus.ready.length})
            </h2>
            <div className="space-y-4">
              {ordersByStatus.ready.map(order => (
                <Card key={order.id} className="bg-gray-800 border-green-500 border-2">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-lg">Table {order.table_number || 'N/A'}</p>
                        <p className="text-sm text-gray-400">
                          {order.order_type === 'dine_in' ? 'Dine In' : order.order_type === 'takeaway' ? 'Takeaway' : 'Delivery'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-400">
                          Ready: {order.ready_at ? formatDateTime(order.ready_at) : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      {order.items?.map(item => (
                        <div key={item.id} className="flex items-start gap-2 bg-gray-700 rounded p-2">
                          <span className="font-bold text-green-400">{item.quantity}x</span>
                          <div className="flex-1">
                            <p className="font-medium">{item.product_name}</p>
                            {item.notes && (
                              <p className="text-xs text-yellow-400 mt-1">Note: {item.notes}</p>
                            )}
                          </div>
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        </div>
                      ))}
                    </div>
                    {order.notes && (
                      <div className="mb-4 p-2 bg-yellow-900/30 border border-yellow-600 rounded">
                        <p className="text-sm text-yellow-400">Order Note: {order.notes}</p>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleUpdateOrderStatus(order.id, 'served')}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark Served
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {ordersByStatus.ready.length === 0 && (
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-8 text-center text-gray-400">
                    No orders ready
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
