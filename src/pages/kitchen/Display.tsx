import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/auth'
import { formatTime } from '../../lib/utils'
import { Card, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import {
  Clock,
  CheckCircle,
  AlertCircle,
  LogOut,
  ChefHat,
  Bell,
} from 'lucide-react'
import { Order, OrderStatus } from '../../types'

export default function KitchenDisplay() {
  const { user, logout } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOrders()
    setupRealtimeSubscription()
  }, [])

  async function loadOrders() {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(*, product:products(*)),
          table:tables(*)
        `)
        .in('status', ['new', 'preparing', 'ready'])
        .order('created_at', { ascending: true })

      if (error) throw error
      if (data) setOrders(data)
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setLoading(false)
    }
  }

  function setupRealtimeSubscription() {
    const subscription = supabase
      .channel(`kitchen-orders-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          if (payload.new && 'status' in payload.new && ['new', 'preparing', 'ready'].includes(payload.new.status as string)) {
            loadOrders()
          } else if (payload.old && 'status' in payload.old && ['new', 'preparing', 'ready'].includes(payload.old.status as string)) {
            loadOrders()
          }
        }
      )
      .subscribe()

    return () => subscription.unsubscribe()
  }

  async function updateOrderStatus(orderId: string, status: OrderStatus) {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId)

      if (error) throw error
      loadOrders()
    } catch (error) {
      console.error('Error updating order status:', error)
    }
  }

  const statusColors: Record<OrderStatus, string> = {
    new: 'bg-blue-100 text-blue-700 border-blue-300',
    preparing: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    ready: 'bg-green-100 text-green-700 border-green-300',
    served: 'bg-gray-100 text-gray-700 border-gray-300',
    completed: 'bg-gray-100 text-gray-700 border-gray-300',
    cancelled: 'bg-red-100 text-red-700 border-red-300',
  }

  const groupedOrders = {
    new: orders.filter(o => o.status === 'new'),
    preparing: orders.filter(o => o.status === 'preparing'),
    ready: orders.filter(o => o.status === 'ready'),
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-700"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
            <ChefHat className="w-6 h-6 text-primary-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kitchen Display System</h1>
            <p className="text-sm text-gray-600">Kitchen: {user?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-primary-50 px-4 py-2 rounded-lg">
            <Bell className="w-5 h-5 text-primary-700" />
            <span className="font-semibold text-primary-700">{orders.length} Active Orders</span>
          </div>
          <Button variant="ghost" onClick={logout}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Orders Grid */}
      <main className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* New Orders */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">New Orders ({groupedOrders.new.length})</h2>
            </div>
            <div className="space-y-4">
              {groupedOrders.new.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  statusColor={statusColors.new}
                  onUpdateStatus={(status) => updateOrderStatus(order.id, status)}
                  availableActions={['preparing']}
                />
              ))}
              {groupedOrders.new.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <p>No new orders</p>
                </div>
              )}
            </div>
          </div>

          {/* Preparing Orders */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-yellow-600" />
              <h2 className="text-lg font-semibold text-gray-900">Preparing ({groupedOrders.preparing.length})</h2>
            </div>
            <div className="space-y-4">
              {groupedOrders.preparing.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  statusColor={statusColors.preparing}
                  onUpdateStatus={(status) => updateOrderStatus(order.id, status)}
                  availableActions={['ready']}
                />
              ))}
              {groupedOrders.preparing.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <p>No orders preparing</p>
                </div>
              )}
            </div>
          </div>

          {/* Ready Orders */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-900">Ready ({groupedOrders.ready.length})</h2>
            </div>
            <div className="space-y-4">
              {groupedOrders.ready.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  statusColor={statusColors.ready}
                  onUpdateStatus={(status) => updateOrderStatus(order.id, status)}
                  availableActions={['served']}
                />
              ))}
              {groupedOrders.ready.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <p>No orders ready</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function OrderCard({ order, statusColor, onUpdateStatus, availableActions }: any) {
  return (
    <Card className="border-2">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-gray-900">#{order.id.slice(-6)}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusColor}`}>
                {order.status}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              {order.table ? `Table ${order.table.number}` : 'Takeaway'}
            </p>
            <p className="text-xs text-gray-500 mt-1">{formatTime(order.created_at)}</p>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          {order.items?.map((item: any) => (
            <div key={item.id} className="flex justify-between items-start text-sm">
              <div className="flex-1">
                <span className="font-medium text-gray-900">{item.quantity}x</span>
                <span className="ml-2 text-gray-700">{item.product?.name}</span>
                {item.notes && (
                  <p className="text-xs text-gray-500 mt-1 ml-6">Note: {item.notes}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {availableActions.map((action: string) => (
          <Button
            key={action}
            onClick={() => onUpdateStatus(action)}
            className="w-full text-sm"
          >
            Mark as {action}
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}
