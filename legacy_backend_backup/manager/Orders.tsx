import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { formatCurrency, formatDateTime } from '../../lib/utils'
import { Card, CardHeader, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { DataGrid } from '../../components/ui/DataGrid'
import { Form } from '../../components/ui/Form'
import { Modal } from '../../components/ui/Modal'
import toast from 'react-hot-toast'
import {
  Plus,
  Search,
  Filter,
  Printer,
  RefreshCw,
  X,
  Check,
  Clock,
  Pause,
  Play,
  Split,
  Merge,
  User,
  Table as TableIcon,
  Edit,
  Trash2,
  Eye,
  DollarSign,
  Receipt,
  Calendar,
  Download,
} from 'lucide-react'

interface Order {
  id: string
  table_number?: string
  customer_id?: string
  waiter_id?: string
  total: number
  status: 'new' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled' | 'refunded'
  payment_status: 'pending' | 'paid' | 'refunded'
  payment_method?: 'cash' | 'card' | 'mobile'
  created_at: string
  updated_at: string
  notes?: string
}

export default function Orders() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('today')
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'create'>('view')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [formLoading, setFormLoading] = useState(false)

  useEffect(() => {
    loadOrders()
    setupRealtimeSubscriptions()
  }, [searchQuery, statusFilter, dateFilter])

  async function loadOrders() {
    try {
      setLoading(true)
      
      let query = supabase
        .from('orders')
        .select('*, tables(number), customers(name)')
        .eq('tenant_id', user?.tenant_id)
        .order('created_at', { ascending: false })

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      if (searchQuery) {
        query = query.ilike('id', `%${searchQuery}%`)
      }

      const { data, error } = await query

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error('Error loading orders:', error)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  function setupRealtimeSubscriptions() {
    // Disabled for now - causing subscription errors
    // TODO: Fix realtime subscriptions with proper channel management
    return () => {}
  }

  async function handleUpdateStatus(orderId: string, newStatus: Order['status']) {
    try {
      console.log('Updating order status:', orderId, 'to:', newStatus)
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      console.log('Order status updated successfully')
      loadOrders()
      toast.success(`Order status updated to ${newStatus}`)
    } catch (error) {
      console.error('Error updating order status:', error)
      toast.error(`Failed to update order status: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async function handleCancelOrder(orderId: string) {
    try {
      console.log('Cancelling order:', orderId)
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId)

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      console.log('Order cancelled successfully')
      loadOrders()
      toast.success('Order cancelled successfully')
    } catch (error) {
      console.error('Error cancelling order:', error)
      toast.error(`Failed to cancel order: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async function handleRefundOrder(orderId: string) {
    try {
      console.log('Refunding order:', orderId)
      const { error } = await supabase
        .from('orders')
        .update({ status: 'refunded', payment_status: 'refunded' })
        .eq('id', orderId)

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      console.log('Order refunded successfully')
      loadOrders()
      toast.success('Order refunded successfully')
    } catch (error) {
      console.error('Error refunding order:', error)
      toast.error(`Failed to refund order: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async function handleDeleteOrder(orderId: string) {
    try {
      console.log('Deleting order:', orderId)
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId)

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      console.log('Order deleted successfully')
      loadOrders()
      toast.success('Order deleted successfully')
    } catch (error) {
      console.error('Error deleting order:', error)
      toast.error(`Failed to delete order: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  function handleViewOrder(order: Order) {
    setSelectedOrder(order)
    setModalMode('view')
    setFormData(order as any)
    setShowModal(true)
  }

  function handleEditOrder(order: Order) {
    setSelectedOrder(order)
    setModalMode('edit')
    setFormData(order as any)
    setShowModal(true)
  }

  function handleCreateOrder() {
    setSelectedOrder(null)
    setModalMode('create')
    setFormData({})
    setShowModal(true)
  }

  function handlePrintReceipt(order: Order) {
    setSelectedOrder(order)
    setShowReceiptModal(true)
  }

  function handleHoldOrder(orderId: string) {
    handleUpdateStatus(orderId, 'new')
  }

  function handleResumeOrder(orderId: string) {
    handleUpdateStatus(orderId, 'preparing')
  }

  function getStatusColor(status: Order['status']) {
    const colors = {
      new: 'bg-blue-100 text-blue-700',
      preparing: 'bg-yellow-100 text-yellow-700',
      ready: 'bg-green-100 text-green-700',
      served: 'bg-purple-100 text-purple-700',
      completed: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
      refunded: 'bg-gray-100 text-gray-700',
    }
    return colors[status]
  }

  function getPaymentStatusColor(status: Order['payment_status']) {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-700',
      paid: 'bg-green-100 text-green-700',
      refunded: 'bg-gray-100 text-gray-700',
    }
    return colors[status]
  }

  const columns = [
    {
      key: 'id',
      header: 'Order ID',
      render: (order: Order) => <span className="font-mono">{order.id}</span>,
    },
    {
      key: 'table_number',
      header: 'Table',
      render: (order: Order) => (
        <span className="flex items-center gap-2">
          <TableIcon className="w-4 h-4" />
          {order.table_number || 'N/A'}
        </span>
      ),
    },
    {
      key: 'total',
      header: 'Amount',
      render: (order: Order) => <span className="font-semibold">{formatCurrency(order.total)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (order: Order) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
          {order.status}
        </span>
      ),
    },
    {
      key: 'payment_status',
      header: 'Payment',
      render: (order: Order) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(order.payment_status)}`}>
          {order.payment_status}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Time',
      render: (order: Order) => formatDateTime(order.created_at),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (order: Order) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            buttonSize="sm"
            onClick={() => handleViewOrder(order)}
            title="View"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            buttonSize="sm"
            onClick={() => handleEditOrder(order)}
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            buttonSize="sm"
            onClick={() => handlePrintReceipt(order)}
            title="Print Receipt"
          >
            <Printer className="w-4 h-4" />
          </Button>
          {order.status === 'new' && (
            <Button
              variant="ghost"
              buttonSize="sm"
              onClick={() => handleResumeOrder(order.id)}
              title="Resume"
            >
              <Play className="w-4 h-4" />
            </Button>
          )}
          {order.status !== 'cancelled' && order.status !== 'refunded' && (
            <Button
              variant="ghost"
              buttonSize="sm"
              onClick={() => handleCancelOrder(order.id)}
              title="Cancel"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
          {order.payment_status === 'paid' && (
            <Button
              variant="ghost"
              buttonSize="sm"
              onClick={() => handleRefundOrder(order.id)}
              title="Refund"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            buttonSize="sm"
            onClick={() => handleDeleteOrder(order.id)}
            title="Delete"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-600 mt-1">Manage restaurant orders</p>
      </div>

      {/* Filters and Actions */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="served">Served</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </select>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all">All Time</option>
            </select>

            <Button onClick={handleCreateOrder}>
              <Plus className="w-4 h-4 mr-2" />
              New Order
            </Button>

            <Button variant="outline" onClick={() => loadOrders()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <DataGrid
        data={orders}
        columns={columns}
        loading={loading}
      />

      {/* Bulk Actions */}
      {selectedOrders.length > 0 && (
        <Card className="mt-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {selectedOrders.length} order(s) selected
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" buttonSize="sm">
                  <Split className="w-4 h-4 mr-2" />
                  Split Bill
                </Button>
                <Button variant="outline" buttonSize="sm">
                  <Merge className="w-4 h-4 mr-2" />
                  Merge Bills
                </Button>
                <Button variant="outline" buttonSize="sm">
                  <Printer className="w-4 h-4 mr-2" />
                  Print All
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Order Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={modalMode === 'create' ? 'Create Order' : modalMode === 'edit' ? 'Edit Order' : 'Order Details'}
          size="lg"
        >
          <div className="space-y-4">
            {selectedOrder && modalMode === 'view' && (
              <div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Order ID</label>
                    <p className="text-lg font-semibold">{selectedOrder.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Table</label>
                    <p className="text-lg font-semibold">{selectedOrder.table_number || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Total</label>
                    <p className="text-lg font-semibold">{formatCurrency(selectedOrder.total)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <p className="text-lg font-semibold">{selectedOrder.status}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Payment Status</label>
                    <p className="text-lg font-semibold">{selectedOrder.payment_status}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Payment Method</label>
                    <p className="text-lg font-semibold">{selectedOrder.payment_method || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Created At</label>
                    <p className="text-lg font-semibold">{formatDateTime(selectedOrder.created_at)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Updated At</label>
                    <p className="text-lg font-semibold">{formatDateTime(selectedOrder.updated_at)}</p>
                  </div>
                </div>
                {selectedOrder.notes && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Notes</label>
                    <p className="text-gray-900 mt-1">{selectedOrder.notes}</p>
                  </div>
                )}
              </div>
            )}

            {(modalMode === 'create' || modalMode === 'edit') && (
              <Form
                data={formData}
                onChange={(name, value) => setFormData(prev => ({ ...prev, [name]: value }))}
                onSubmit={async () => {
                  try {
                    setFormLoading(true)
                    if (modalMode === 'create') {
                      console.log('Creating order with data:', formData)
                      const { error, data: result } = await supabase.from('orders').insert({
                        table_id: formData.table_number,
                        customer_id: formData.customer_id,
                        waiter_id: formData.waiter_id,
                        subtotal: parseFloat(formData.total),
                        total: parseFloat(formData.total),
                        status: 'new',
                        payment_status: 'pending',
                        payment_method: formData.payment_method,
                        notes: formData.notes,
                        tenant_id: user?.tenant_id,
                        source: 'manager',
                      }).select()
                      if (error) {
                        console.error('Supabase error:', error)
                        throw error
                      }
                      console.log('Order created successfully:', result)
                      toast.success('Order created successfully')
                    } else {
                      console.log('Updating order with id:', selectedOrder!.id, 'data:', formData)
                      const { error, data: result } = await supabase
                        .from('orders')
                        .update({
                          table_id: formData.table_number,
                          customer_id: formData.customer_id,
                          waiter_id: formData.waiter_id,
                          subtotal: parseFloat(formData.total),
                          total: parseFloat(formData.total),
                          status: formData.status,
                          payment_method: formData.payment_method,
                          notes: formData.notes,
                        })
                        .eq('id', selectedOrder!.id)
                        .select()
                      if (error) {
                        console.error('Supabase error:', error)
                        throw error
                      }
                      console.log('Order updated successfully:', result)
                      toast.success('Order updated successfully')
                    }
                    setShowModal(false)
                    loadOrders()
                  } catch (error) {
                    console.error('Error saving order:', error)
                    toast.error(`Failed to save order: ${error instanceof Error ? error.message : 'Unknown error'}`)
                  } finally {
                    setFormLoading(false)
                  }
                }}
                loading={formLoading}
                fields={[
                  {
                    name: 'table_number',
                    label: 'Table Number',
                    type: 'text',
                    required: true,
                  },
                  {
                    name: 'customer_id',
                    label: 'Customer ID',
                    type: 'text',
                  },
                  {
                    name: 'waiter_id',
                    label: 'Waiter ID',
                    type: 'text',
                  },
                  {
                    name: 'total',
                    label: 'Total Amount',
                    type: 'number',
                    required: true,
                  },
                  {
                    name: 'status',
                    label: 'Status',
                    type: 'select',
                    options: [
                      { value: 'new', label: 'New' },
                      { value: 'preparing', label: 'Preparing' },
                      { value: 'ready', label: 'Ready' },
                      { value: 'served', label: 'Served' },
                      { value: 'completed', label: 'Completed' },
                    ],
                  },
                  {
                    name: 'payment_method',
                    label: 'Payment Method',
                    type: 'select',
                    options: [
                      { value: 'cash', label: 'Cash' },
                      { value: 'card', label: 'Card' },
                      { value: 'mobile', label: 'Mobile' },
                    ],
                  },
                  {
                    name: 'notes',
                    label: 'Notes',
                    type: 'textarea',
                  },
                ]}
              />
            )}
          </div>
        </Modal>
      )}

      {/* Receipt Modal */}
      {showReceiptModal && selectedOrder && (
        <Modal
          isOpen={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
          title="Receipt"
          size="md"
        >
          <div className="space-y-4">
            <div className="text-center border-b pb-4">
              <h2 className="text-xl font-bold">SomBill Restaurant</h2>
              <p className="text-gray-600">Receipt</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Order ID:</span>
                <span className="font-semibold">{selectedOrder.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Table:</span>
                <span className="font-semibold">{selectedOrder.table_number || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="font-semibold">{formatDateTime(selectedOrder.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Method:</span>
                <span className="font-semibold">{selectedOrder.payment_method || 'N/A'}</span>
              </div>
            </div>
            <div className="border-t pt-4">
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>{formatCurrency(selectedOrder.total)}</span>
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button className="flex-1" onClick={() => window.print()}>
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              <Button variant="outline" className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
