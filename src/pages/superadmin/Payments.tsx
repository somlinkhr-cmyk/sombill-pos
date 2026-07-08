import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { formatCurrency } from '../../lib/utils'
import { Card, CardHeader, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import toast from 'react-hot-toast'
import {
  CreditCard,
  DollarSign,
  Search,
  Filter,
  RefreshCw,
  Building2,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Download,
  Eye,
  MoreVertical,
  Settings,
  Plus,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
} from 'lucide-react'

interface Payment {
  id: string
  tenant_id: string
  restaurant_id: string
  restaurant_name?: string
  subscription_id?: string
  subscription_plan_name?: string
  amount: number
  currency: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled'
  payment_method: string
  gateway: string
  gateway_transaction_id?: string
  invoice_id?: string
  description?: string
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

interface PaymentGateway {
  id: string
  name: string
  slug: string
  type: 'stripe' | 'paypal' | 'flutterwave' | 'paystack' | 'custom'
  is_active: boolean
  config: Record<string, any>
  supported_currencies: string[]
  fees: {
    percentage: number
    fixed: number
  }
  created_at: string
}

export default function SuperAdminPayments() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [payments, setPayments] = useState<Payment[]>([])
  const [gateways, setGateways] = useState<PaymentGateway[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [gatewayFilter, setGatewayFilter] = useState<string>('all')
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [showRefundModal, setShowRefundModal] = useState(false)
  const [showRetryModal, setShowRetryModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'transactions' | 'gateways' | 'invoices'>('transactions')

  const loadPayments = useCallback(async () => {
    setLoading(true)
    try {
      const { data: paymentsData, error } = await supabase
        .from('sa_payments')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      const formattedPayments = (paymentsData || []).map((p: any) => ({
        ...p,
        restaurant_name: 'Restaurant',
        subscription_plan_name: 'Plan',
      }))

      setPayments(formattedPayments)
    } catch (error) {
      console.error('Error loading payments:', error)
      toast.error('Failed to load payments')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadGateways = useCallback(async () => {
    try {
      // For now, return mock data since payment_gateways table doesn't exist in new schema
      setGateways([
        { id: '1', name: 'Stripe', slug: 'stripe', type: 'stripe', is_active: true, supported_currencies: ['USD', 'EUR'], fees: { percentage: 2.9, fixed: 0.30 }, config: {}, created_at: new Date().toISOString() },
        { id: '2', name: 'PayPal', slug: 'paypal', type: 'paypal', is_active: true, supported_currencies: ['USD', 'EUR'], fees: { percentage: 3.4, fixed: 0.30 }, config: {}, created_at: new Date().toISOString() },
        { id: '3', name: 'Cash', slug: 'cash', type: 'custom', is_active: true, supported_currencies: ['USD'], fees: { percentage: 0, fixed: 0 }, config: {}, created_at: new Date().toISOString() },
      ])
    } catch (error) {
      console.error('Error loading gateways:', error)
      toast.error('Failed to load payment gateways')
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'transactions') {
      loadPayments()
    } else if (activeTab === 'gateways') {
      loadGateways()
    }
  }, [activeTab, loadPayments, loadGateways])

  const filteredPayments = useMemo(() => {
    return payments.filter(payment => {
      const matchesSearch = searchQuery === '' ||
        payment.restaurant_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.gateway_transaction_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.invoice_id?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = statusFilter === 'all' || payment.status === statusFilter

      const matchesGateway = gatewayFilter === 'all' || payment.gateway === gatewayFilter

      return matchesSearch && matchesStatus && matchesGateway
    })
  }, [payments, searchQuery, statusFilter, gatewayFilter])

  const handleRefundPayment = async () => {
    if (!selectedPayment) return

    try {
      const { error } = await supabase
        .from('payments')
        .update({ status: 'refunded' })
        .eq('id', selectedPayment.id)

      if (error) throw error

      toast.success('Payment refunded successfully')
      setShowRefundModal(false)
      setSelectedPayment(null)
      loadPayments()
    } catch (error) {
      console.error('Error refunding payment:', error)
      toast.error('Failed to refund payment')
    }
  }

  const handleRetryPayment = async () => {
    if (!selectedPayment) return

    try {
      // This would typically call a backend function to retry the payment
      const { error } = await supabase
        .from('payments')
        .update({ status: 'processing' })
        .eq('id', selectedPayment.id)

      if (error) throw error

      toast.success('Payment retry initiated')
      setShowRetryModal(false)
      setSelectedPayment(null)
      loadPayments()
    } catch (error) {
      console.error('Error retrying payment:', error)
      toast.error('Failed to retry payment')
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-gray-100 text-gray-800',
    }
    return styles[status as keyof typeof styles] || styles.pending
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-3 h-3" />
      case 'failed':
        return <XCircle className="w-3 h-3" />
      case 'pending':
      case 'processing':
        return <Clock className="w-3 h-3" />
      case 'refunded':
        return <ArrowDownRight className="w-3 h-3" />
      default:
        return <Clock className="w-3 h-3" />
    }
  }

  const totalRevenue = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0)

  const failedPayments = payments.filter(p => p.status === 'failed').length
  const pendingPayments = payments.filter(p => p.status === 'pending' || p.status === 'processing').length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/superadmin" className="text-gray-600 hover:text-gray-900">
              <Button variant="ghost" size="sm">← Back</Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Payment Management</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={() => {
              if (activeTab === 'transactions') loadPayments()
              else if (activeTab === 'gateways') loadGateways()
            }}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Link to="/superadmin/payments/gateways/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Gateway
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('transactions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'transactions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Transactions
            </button>
            <button
              onClick={() => setActiveTab('gateways')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'gateways'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Payment Gateways
            </button>
            <button
              onClick={() => setActiveTab('invoices')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'invoices'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Invoices
            </button>
          </nav>
        </div>

        {activeTab === 'transactions' ? (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Revenue</p>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Completed</p>
                      <p className="text-2xl font-bold text-green-600">{payments.filter(p => p.status === 'completed').length}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Pending</p>
                      <p className="text-2xl font-bold text-yellow-600">{pendingPayments}</p>
                    </div>
                    <Clock className="w-8 h-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Failed</p>
                      <p className="text-2xl font-bold text-red-600">{failedPayments}</p>
                    </div>
                    <XCircle className="w-8 h-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search transactions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                  </select>
                  <select
                    value={gatewayFilter}
                    onChange={(e) => setGatewayFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Gateways</option>
                    <option value="stripe">Stripe</option>
                    <option value="paypal">PayPal</option>
                    <option value="flutterwave">Flutterwave</option>
                    <option value="paystack">Paystack</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Transactions Table */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Transactions ({filteredPayments.length})</h3>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Transaction ID</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Restaurant</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Plan</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Amount</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Gateway</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPayments.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center py-8 text-gray-500">
                            No transactions found
                          </td>
                        </tr>
                      ) : (
                        filteredPayments.map((payment) => (
                          <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-2">
                                <CreditCard className="w-4 h-4 text-gray-400" />
                                <span className="font-mono text-sm text-gray-900">
                                  {payment.gateway_transaction_id || payment.id.slice(0, 8)}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center">
                                <Building2 className="w-4 h-4 text-gray-400 mr-1" />
                                <span className="text-gray-900">{payment.restaurant_name || 'N/A'}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-gray-900">{payment.subscription_plan_name || 'N/A'}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-mono text-gray-900">{formatCurrency(payment.amount)}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-gray-900 capitalize">{payment.gateway}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(payment.status)}`}>
                                {getStatusIcon(payment.status)}
                                <span className="ml-1 capitalize">{payment.status}</span>
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <p className="text-sm text-gray-900">
                                {new Date(payment.created_at).toLocaleDateString()}
                              </p>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-2">
                                <Button variant="ghost" size="sm">
                                  <Eye className="w-4 h-4" />
                                </Button>
                                {payment.status === 'completed' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedPayment(payment)
                                      setShowRefundModal(true)
                                    }}
                                  >
                                    <ArrowDownRight className="w-4 h-4 text-yellow-600" />
                                  </Button>
                                )}
                                {payment.status === 'failed' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedPayment(payment)
                                      setShowRetryModal(true)
                                    }}
                                  >
                                    <RefreshCw className="w-4 h-4 text-blue-600" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        ) : activeTab === 'gateways' ? (
          <>
            {/* Gateways Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gateways.map((gateway) => (
                <Card key={gateway.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CreditCard className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-semibold">{gateway.name}</h3>
                      </div>
                      {gateway.is_active ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 capitalize">{gateway.type}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Fee</span>
                        <span className="font-medium">{gateway.fees.percentage}% + {formatCurrency(gateway.fees.fixed)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Currencies</span>
                        <span className="font-medium">{gateway.supported_currencies.join(', ')}</span>
                      </div>
                    </div>
                    <div className="mt-4 flex space-x-2">
                      <Link to={`/superadmin/payments/gateways/${gateway.id}`}>
                        <Button className="w-full" variant="outline" size="sm">
                          <Settings className="w-4 h-4 mr-2" />
                          Configure
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Invoices</h3>
                <p className="text-gray-600 mb-4">Invoice management coming soon</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Refund Modal */}
      <Modal
        isOpen={showRefundModal}
        onClose={() => {
          setShowRefundModal(false)
          setSelectedPayment(null)
        }}
        title="Refund Payment"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to refund <strong>{formatCurrency(selectedPayment?.amount || 0)}</strong>?
            This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowRefundModal(false)
                setSelectedPayment(null)
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleRefundPayment}>
              Refund
            </Button>
          </div>
        </div>
      </Modal>

      {/* Retry Modal */}
      <Modal
        isOpen={showRetryModal}
        onClose={() => {
          setShowRetryModal(false)
          setSelectedPayment(null)
        }}
        title="Retry Payment"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to retry the payment of <strong>{formatCurrency(selectedPayment?.amount || 0)}</strong>?
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowRetryModal(false)
                setSelectedPayment(null)
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleRetryPayment}>
              Retry
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
