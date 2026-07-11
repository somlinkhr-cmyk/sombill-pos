import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/auth'
import { useAuth } from '../../contexts/AuthContext'
import { Search, Calendar, Filter, Printer, Copy, Play, X, CheckCircle, Clock, AlertCircle, ArrowLeft, Download } from 'lucide-react'
import { formatCurrency } from '../../lib/utils'
import { printReceipt, downloadReceiptPDF, reprintReceipt } from '../../lib/receiptPrinter'
import toast from 'react-hot-toast'

interface Order {
  id: string
  table_id?: string
  customer_id?: string
  waiter_id?: string
  cashier_id: string
  order_type: 'dine_in' | 'takeaway' | 'delivery'
  status: 'new' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled' | 'held'
  subtotal: number
  discount: number
  tax: number
  service_charge: number
  total: number
  payment_method?: string
  payment_status: 'pending' | 'partial' | 'paid' | 'refunded'
  notes?: string
  created_at: string
  updated_at: string
  table?: { number: number }
  customer?: { name: string; phone: string }
  items?: Array<{
    product: { name: string }
    quantity: number
    unit_price: number
  }>
}

export default function Orders() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('today')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  useEffect(() => {
    loadOrders()
  }, [])

  useEffect(() => {
    filterOrders()
  }, [orders, searchQuery, statusFilter, dateFilter])

  async function loadOrders() {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          table:tables(number),
          customer:customers(name, phone),
          items:order_items(
            product:products(name),
            quantity,
            unit_price,
            total_price,
            notes
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setLoading(false)
    }
  }

  function filterOrders() {
    let filtered = [...orders]

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter)
    }

    // Date filter
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (dateFilter === 'today') {
      filtered = filtered.filter(order => new Date(order.created_at) >= today)
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(today)
      weekAgo.setDate(weekAgo.getDate() - 7)
      filtered = filtered.filter(order => new Date(order.created_at) >= weekAgo)
    } else if (dateFilter === 'month') {
      const monthAgo = new Date(today)
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      filtered = filtered.filter(order => new Date(order.created_at) >= monthAgo)
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(order =>
        order.id.toLowerCase().includes(query) ||
        order.customer?.name?.toLowerCase().includes(query) ||
        order.customer?.phone?.toLowerCase().includes(query) ||
        order.table?.number.toString().includes(query)
      )
    }

    setFilteredOrders(filtered)
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800'
      case 'preparing': return 'bg-yellow-100 text-yellow-800'
      case 'ready': return 'bg-green-100 text-green-800'
      case 'served': return 'bg-purple-100 text-purple-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'held': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'new': return <Clock className="w-4 h-4" />
      case 'preparing': return <AlertCircle className="w-4 h-4" />
      case 'ready': return <CheckCircle className="w-4 h-4" />
      case 'completed': return <CheckCircle className="w-4 h-4" />
      case 'cancelled': return <X className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  async function handleResumeOrder(order: Order) {
    // Implement resume order logic - navigate to POS with this order
    console.log('Resume order:', order.id)
  }

  async function handleReprintReceipt(order: Order) {
    try {
      console.log('Reprint receipt called for order:', order.id)
      console.log('Order data:', order)
      
      if (!order.items || order.items.length === 0) {
        toast.error('No items found in this order')
        return
      }

      const receiptData = {
        orderNumber: order.id.slice(0, 8),
        date: new Date(order.created_at),
        cashier: user?.name || 'Cashier',
        table: order.table?.number?.toString(),
        customer: order.customer?.name,
        customerPhone: order.customer?.phone,
        orderType: order.order_type,
        items: order.items?.map(item => ({
          name: item.product?.name || 'Unknown',
          quantity: item.quantity,
          unitPrice: item.unit_price,
          totalPrice: (item as any).total_price || (item.unit_price * item.quantity),
          notes: (item as any).notes
        })) || [],
        subtotal: order.subtotal,
        tax: order.tax,
        serviceCharge: order.service_charge,
        discount: order.discount,
        total: order.total,
        paymentMethod: order.payment_method || 'Cash',
        amountPaid: order.total,
        change: 0,
        restaurantName: 'SomBill Restaurant',
        restaurantAddress: 'Mogadishu, Somalia',
        restaurantPhone: '+252 61 XXX XXXX'
      }
      
      console.log('Receipt data prepared:', receiptData)
      
      printReceipt(receiptData, 'receipt')
      toast.success('Receipt sent to printer')
    } catch (error) {
      console.error('Error reprinting receipt:', error)
      toast.error('Failed to reprint receipt: ' + (error as Error).message)
    }
  }

  async function handleDownloadPDF(order: Order) {
    try {
      console.log('Download PDF called for order:', order.id)
      console.log('Order data:', order)
      
      if (!order.items || order.items.length === 0) {
        toast.error('No items found in this order')
        return
      }

      const receiptData = {
        orderNumber: order.id.slice(0, 8),
        date: new Date(order.created_at),
        cashier: user?.name || 'Cashier',
        table: order.table?.number?.toString(),
        customer: order.customer?.name,
        customerPhone: order.customer?.phone,
        orderType: order.order_type,
        items: order.items?.map(item => ({
          name: item.product?.name || 'Unknown',
          quantity: item.quantity,
          unitPrice: item.unit_price,
          totalPrice: (item as any).total_price || (item.unit_price * item.quantity),
          notes: (item as any).notes
        })) || [],
        subtotal: order.subtotal,
        tax: order.tax,
        serviceCharge: order.service_charge,
        discount: order.discount,
        total: order.total,
        paymentMethod: order.payment_method || 'Cash',
        amountPaid: order.total,
        change: 0,
        restaurantName: 'SomBill Restaurant',
        restaurantAddress: 'Mogadishu, Somalia',
        restaurantPhone: '+252 61 XXX XXXX'
      }
      
      console.log('Receipt data prepared:', receiptData)
      
      // Try jsPDF approach
      try {
        downloadReceiptPDF(receiptData)
        toast.success('PDF download started')
      } catch (pdfError) {
        console.error('jsPDF error:', pdfError)
        // Fallback: create simple text receipt
        const textContent = `
${receiptData.restaurantName}
${receiptData.restaurantAddress}
Tel: ${receiptData.restaurantPhone}
--------------------------------
Order #: ${receiptData.orderNumber}
Date: ${receiptData.date.toLocaleString()}
Cashier: ${receiptData.cashier}
${receiptData.table ? `Table: ${receiptData.table}` : ''}
${receiptData.customer ? `Customer: ${receiptData.customer}` : ''}
Type: ${receiptData.orderType.toUpperCase()}
--------------------------------
${receiptData.items.map(item => 
  `${item.name} x${item.quantity} - $${item.totalPrice.toFixed(2)}`
).join('\n')}
--------------------------------
Total: $${receiptData.total.toFixed(2)}
Payment: ${receiptData.paymentMethod.toUpperCase()}
--------------------------------
Thank you for dining with us!
        `
        
        const blob = new Blob([textContent], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `Receipt_${receiptData.orderNumber}.txt`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        toast.success('Receipt downloaded as text file')
      }
    } catch (error) {
      console.error('Error downloading PDF:', error)
      toast.error('Failed to download PDF: ' + (error as Error).message)
    }
  }

  async function handleDuplicateOrder(order: Order) {
    // Implement duplicate order logic
    console.log('Duplicate order:', order.id)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1976D2]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/cashier')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
              <p className="text-gray-600">View and manage all orders</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1976D2]"
                />
              </div>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1976D2]"
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="served">Served</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="held">Held</option>
            </select>

            {/* Date Filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1976D2]"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>

        {/* Orders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map(order => (
            <div
              key={order.id}
              className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedOrder(order)}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-900">Order #{order.id.slice(0, 8)}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(order.status)}`}>
                  {getStatusIcon(order.status)}
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                {order.table && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Table</span>
                    <span className="font-medium">{order.table.number}</span>
                  </div>
                )}
                {order.customer && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Customer</span>
                    <span className="font-medium">{order.customer.name}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Type</span>
                  <span className="font-medium capitalize">{order.order_type.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Items</span>
                  <span className="font-medium">{order.items?.length || 0}</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-bold">
                    <span className="text-gray-900">Total</span>
                    <span className="text-[#0D47A1]">{formatCurrency(order.total)}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-4 pt-3 border-t">
                {order.status === 'held' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleResumeOrder(order)
                    }}
                    className="flex-1 px-3 py-2 bg-[#1976D2] text-white rounded-lg text-sm hover:bg-[#0D47A1] flex items-center justify-center gap-1"
                  >
                    <Play className="w-4 h-4" />
                    Resume
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleReprintReceipt(order)
                  }}
                  className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 flex items-center justify-center gap-1"
                >
                  <Printer className="w-4 h-4" />
                  Print
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDownloadPDF(order)
                  }}
                  className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 flex items-center justify-center gap-1"
                >
                  <Download className="w-4 h-4" />
                  PDF
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No orders found</p>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Order Details</h2>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Order ID</p>
                    <p className="font-medium">{selectedOrder.id.slice(0, 8)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                      {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date</p>
                    <p className="font-medium">{new Date(selectedOrder.created_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Type</p>
                    <p className="font-medium capitalize">{selectedOrder.order_type.replace('_', ' ')}</p>
                  </div>
                  {selectedOrder.table && (
                    <div>
                      <p className="text-sm text-gray-600">Table</p>
                      <p className="font-medium">{selectedOrder.table.number}</p>
                    </div>
                  )}
                  {selectedOrder.customer && (
                    <div>
                      <p className="text-sm text-gray-600">Customer</p>
                      <p className="font-medium">{selectedOrder.customer.name}</p>
                    </div>
                  )}
                </div>

                {selectedOrder.items && selectedOrder.items.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Items</h3>
                    <div className="space-y-2">
                      {selectedOrder.items.map((item, index) => (
                        <div key={index} className="flex justify-between py-2 border-b">
                          <div>
                            <p className="font-medium">{item.product?.name || 'Unknown'}</p>
                            <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                          </div>
                          <p className="font-medium">{formatCurrency(item.unit_price * item.quantity)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span>{formatCurrency(selectedOrder.subtotal)}</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Discount</span>
                      <span>-{formatCurrency(selectedOrder.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax</span>
                    <span>{formatCurrency(selectedOrder.tax)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Service Charge</span>
                    <span>{formatCurrency(selectedOrder.service_charge)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-[#0D47A1]">{formatCurrency(selectedOrder.total)}</span>
                  </div>
                </div>

                {selectedOrder.notes && (
                  <div>
                    <p className="text-sm text-gray-600">Notes</p>
                    <p className="font-medium">{selectedOrder.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
