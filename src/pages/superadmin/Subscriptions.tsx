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
  Plus,
  Edit,
  Search,
  Filter,
  MoreVertical,
  CheckCircle,
  XCircle,
  Clock,
  Pause,
  Play,
  RefreshCw,
  TrendingUp,
  Building2,
  Calendar,
  DollarSign,
  Settings,
} from 'lucide-react'

interface SubscriptionPlan {
  id: string
  name: string
  slug: string
  description: string
  monthly_price: number
  yearly_price: number
  free_trial_days: number
  max_branches: number
  max_employees: number
  max_cashiers: number
  max_waiters: number
  max_kitchen_screens: number
  max_products: number
  max_menu_categories: number
  max_customers: number
  max_orders_per_month: number
  max_storage_gb: number
  max_api_requests_per_day: number
  max_reports: number
  max_locations: number
  features: Record<string, boolean>
  is_active: boolean
  is_custom: boolean
}

interface Subscription {
  id: string
  tenant_id: string
  restaurant_id: string
  restaurant_name?: string
  plan_id: string
  plan_name?: string
  status: 'active' | 'trial' | 'suspended' | 'cancelled' | 'expired' | 'paused'
  billing_cycle: 'monthly' | 'yearly'
  start_date: string
  end_date: string
  trial_end_date?: string
  auto_renew: boolean
  current_branch_count: number
  current_employee_count: number
  current_cashier_count: number
  current_waiter_count: number
  current_kitchen_screen_count: number
  current_product_count: number
  current_menu_category_count: number
  current_customer_count: number
  current_order_count_month: number
  current_storage_gb: number
  current_api_requests_day: number
  current_report_count: number
  current_location_count: number
  features: Record<string, boolean>
  created_at: string
}

export default function SuperAdminSubscriptions() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null)
  const [showPauseModal, setShowPauseModal] = useState(false)
  const [showResumeModal, setShowResumeModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'plans'>('subscriptions')

  const loadSubscriptions = useCallback(async () => {
    setLoading(true)
    try {
      const { data: subscriptionsData, error } = await supabase
        .from('sa_subscriptions')
        .select('*, sa_subscription_plans(name)')
        .order('created_at', { ascending: false })

      if (error) throw error

      const formattedSubscriptions = (subscriptionsData || []).map((sub: any) => ({
        ...sub,
        restaurant_name: 'Restaurant', // Will need to join with restaurants table
        plan_name: sub.sa_subscription_plans?.name,
      }))

      setSubscriptions(formattedSubscriptions)
    } catch (error) {
      console.error('Error loading subscriptions:', error)
      toast.error('Failed to load subscriptions')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadPlans = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('sa_subscription_plans')
        .select('*')
        .order('monthly_price', { ascending: true })

      if (error) throw error
      setPlans(data || [])
    } catch (error) {
      console.error('Error loading plans:', error)
      toast.error('Failed to load plans')
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'subscriptions') {
      loadSubscriptions()
    } else {
      loadPlans()
    }
  }, [activeTab, loadSubscriptions, loadPlans])

  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter(subscription => {
      const matchesSearch = searchQuery === '' ||
        subscription.restaurant_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        subscription.plan_name?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = statusFilter === 'all' || subscription.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [subscriptions, searchQuery, statusFilter])

  const handlePauseSubscription = async () => {
    if (!selectedSubscription) return

    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'paused' })
        .eq('id', selectedSubscription.id)

      if (error) throw error

      toast.success('Subscription paused successfully')
      setShowPauseModal(false)
      setSelectedSubscription(null)
      loadSubscriptions()
    } catch (error) {
      console.error('Error pausing subscription:', error)
      toast.error('Failed to pause subscription')
    }
  }

  const handleResumeSubscription = async () => {
    if (!selectedSubscription) return

    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'active' })
        .eq('id', selectedSubscription.id)

      if (error) throw error

      toast.success('Subscription resumed successfully')
      setShowResumeModal(false)
      setSelectedSubscription(null)
      loadSubscriptions()
    } catch (error) {
      console.error('Error resuming subscription:', error)
      toast.error('Failed to resume subscription')
    }
  }

  const handleCancelSubscription = async () => {
    if (!selectedSubscription) return

    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ 
          status: 'cancelled',
          cancel_at_period_end: true,
          auto_renew: false
        })
        .eq('id', selectedSubscription.id)

      if (error) throw error

      toast.success('Subscription cancelled successfully')
      setShowCancelModal(false)
      setSelectedSubscription(null)
      loadSubscriptions()
    } catch (error) {
      console.error('Error cancelling subscription:', error)
      toast.error('Failed to cancel subscription')
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      trial: 'bg-blue-100 text-blue-800',
      suspended: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
      expired: 'bg-red-100 text-red-800',
      paused: 'bg-yellow-100 text-yellow-800',
    }
    return styles[status as keyof typeof styles] || styles.active
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4" />
      case 'trial':
        return <Clock className="w-4 h-4" />
      case 'suspended':
      case 'expired':
        return <XCircle className="w-4 h-4" />
      case 'paused':
        return <Pause className="w-4 h-4" />
      case 'cancelled':
        return <XCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const calculateUsagePercentage = (current: number, max: number) => {
    if (max === 0) return 0
    return Math.min((current / max) * 100, 100)
  }

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600'
    if (percentage >= 70) return 'text-yellow-600'
    return 'text-green-600'
  }

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
            <h1 className="text-2xl font-bold text-gray-900">Subscription Management</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={() => {
              if (activeTab === 'subscriptions') loadSubscriptions()
              else loadPlans()
            }}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Link to="/superadmin/plans/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Plan
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
              onClick={() => setActiveTab('subscriptions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'subscriptions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Subscriptions
            </button>
            <button
              onClick={() => setActiveTab('plans')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'plans'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Plans
            </button>
          </nav>
        </div>

        {activeTab === 'subscriptions' ? (
          <>
            {/* Filters */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search subscriptions..."
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
                    <option value="active">Active</option>
                    <option value="trial">Trial</option>
                    <option value="suspended">Suspended</option>
                    <option value="paused">Paused</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total</p>
                      <p className="text-2xl font-bold text-gray-900">{subscriptions.length}</p>
                    </div>
                    <CreditCard className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Active</p>
                      <p className="text-2xl font-bold text-green-600">{subscriptions.filter(s => s.status === 'active').length}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Trial</p>
                      <p className="text-2xl font-bold text-blue-600">{subscriptions.filter(s => s.status === 'trial').length}</p>
                    </div>
                    <Clock className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Monthly Revenue</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(
                          subscriptions
                            .filter(s => s.status === 'active' && s.billing_cycle === 'monthly')
                            .reduce((sum, s) => {
                              const plan = plans.find(p => p.id === s.plan_id)
                              return sum + (plan?.monthly_price || 0)
                            }, 0)
                        )}
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Subscriptions Table */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Subscriptions ({filteredSubscriptions.length})</h3>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Restaurant</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Plan</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Billing</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Period</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Usage</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Auto Renew</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSubscriptions.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center py-8 text-gray-500">
                            No subscriptions found
                          </td>
                        </tr>
                      ) : (
                        filteredSubscriptions.map((subscription) => {
                          const plan = plans.find(p => p.id === subscription.plan_id)
                          const employeeUsage = calculateUsagePercentage(
                            subscription.current_employee_count,
                            plan?.max_employees || 1
                          )
                          
                          return (
                            <tr key={subscription.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 px-4">
                                <div className="flex items-center space-x-3">
                                  <Building2 className="w-5 h-5 text-gray-400" />
                                  <div>
                                    <p className="font-medium text-gray-900">{subscription.restaurant_name || 'N/A'}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div>
                                  <p className="font-medium text-gray-900">{subscription.plan_name || 'N/A'}</p>
                                  <p className="text-sm text-gray-600 capitalize">{subscription.billing_cycle}</p>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(subscription.status)}`}>
                                  {getStatusIcon(subscription.status)}
                                  <span className="ml-1 capitalize">{subscription.status}</span>
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="text-gray-900">
                                  {formatCurrency(plan?.monthly_price || 0)}/{subscription.billing_cycle === 'monthly' ? 'mo' : 'yr'}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <div>
                                  <p className="text-sm text-gray-900">
                                    {new Date(subscription.start_date).toLocaleDateString()}
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    to {new Date(subscription.end_date).toLocaleDateString()}
                                  </p>
                                  {subscription.trial_end_date && (
                                    <p className="text-xs text-blue-600">
                                      Trial ends: {new Date(subscription.trial_end_date).toLocaleDateString()}
                                    </p>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-600">Employees</span>
                                    <span className={getUsageColor(employeeUsage)}>
                                      {subscription.current_employee_count}/{plan?.max_employees || 0}
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                                    <div
                                      className={`h-1.5 rounded-full ${
                                        employeeUsage >= 90 ? 'bg-red-500' :
                                        employeeUsage >= 70 ? 'bg-yellow-500' :
                                        'bg-green-500'
                                      }`}
                                      style={{ width: `${employeeUsage}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                {subscription.auto_renew ? (
                                  <CheckCircle className="w-5 h-5 text-green-600" />
                                ) : (
                                  <XCircle className="w-5 h-5 text-gray-400" />
                                )}
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center space-x-2">
                                  {subscription.status === 'active' && (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setSelectedSubscription(subscription)
                                          setShowPauseModal(true)
                                        }}
                                      >
                                        <Pause className="w-4 h-4 text-yellow-600" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setSelectedSubscription(subscription)
                                          setShowCancelModal(true)
                                        }}
                                      >
                                        <XCircle className="w-4 h-4 text-red-600" />
                                      </Button>
                                    </>
                                  )}
                                  {subscription.status === 'paused' && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedSubscription(subscription)
                                        setShowResumeModal(true)
                                      }}
                                    >
                                      <Play className="w-4 h-4 text-green-600" />
                                    </Button>
                                  )}
                                  <Link to={`/superadmin/subscriptions/${subscription.id}`}>
                                    <Button variant="ghost" size="sm">
                                      <Settings className="w-4 h-4" />
                                    </Button>
                                  </Link>
                                </div>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {plans.map((plan) => (
                <Card key={plan.id} className={!plan.is_active ? 'opacity-50' : ''}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">{plan.name}</h3>
                      {!plan.is_active && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">Inactive</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{plan.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-baseline space-x-2">
                        <span className="text-3xl font-bold text-gray-900">
                          ${plan.monthly_price}
                        </span>
                        <span className="text-gray-600">/month</span>
                      </div>
                      {plan.yearly_price && (
                        <p className="text-sm text-green-600">
                          ${plan.yearly_price}/year (Save {Math.round((1 - plan.yearly_price / (plan.monthly_price * 12)) * 100)}%)
                        </p>
                      )}
                      {plan.free_trial_days > 0 && (
                        <p className="text-sm text-blue-600">
                          {plan.free_trial_days} days free trial
                        </p>
                      )}
                      <div className="border-t pt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Branches</span>
                          <span className="font-medium">{plan.max_branches}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Employees</span>
                          <span className="font-medium">{plan.max_employees}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Products</span>
                          <span className="font-medium">{plan.max_products}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Storage</span>
                          <span className="font-medium">{plan.max_storage_gb} GB</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(plan.features).map(([key, value]) => (
                          value && (
                            <span
                              key={key}
                              className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded"
                            >
                              {key}
                            </span>
                          )
                        ))}
                      </div>
                      <Link to={`/superadmin/plans/${plan.id}`}>
                        <Button className="w-full" variant="outline">
                          <Settings className="w-4 h-4 mr-2" />
                          Manage
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pause Modal */}
      <Modal
        isOpen={showPauseModal}
        onClose={() => {
          setShowPauseModal(false)
          setSelectedSubscription(null)
        }}
        title="Pause Subscription"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to pause the subscription for <strong>{selectedSubscription?.restaurant_name}</strong>?
            The restaurant will lose access to all services until resumed.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowPauseModal(false)
                setSelectedSubscription(null)
              }}
            >
              Cancel
            </Button>
            <Button onClick={handlePauseSubscription}>
              Pause
            </Button>
          </div>
        </div>
      </Modal>

      {/* Resume Modal */}
      <Modal
        isOpen={showResumeModal}
        onClose={() => {
          setShowResumeModal(false)
          setSelectedSubscription(null)
        }}
        title="Resume Subscription"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to resume the subscription for <strong>{selectedSubscription?.restaurant_name}</strong>?
            The restaurant will regain access to all services.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowResumeModal(false)
                setSelectedSubscription(null)
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleResumeSubscription}>
              Resume
            </Button>
          </div>
        </div>
      </Modal>

      {/* Cancel Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => {
          setShowCancelModal(false)
          setSelectedSubscription(null)
        }}
        title="Cancel Subscription"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to cancel the subscription for <strong>{selectedSubscription?.restaurant_name}</strong>?
            The subscription will be cancelled at the end of the current billing period.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowCancelModal(false)
                setSelectedSubscription(null)
              }}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleCancelSubscription}>
              Cancel Subscription
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
