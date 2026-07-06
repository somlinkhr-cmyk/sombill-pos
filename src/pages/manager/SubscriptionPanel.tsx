import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { formatCurrency } from '../../lib/utils'
import { Card, CardHeader, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Form } from '../../components/ui/Form'
import toast from 'react-hot-toast'
import {
  CreditCard,
  TrendingUp,
  Users,
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Crown,
  Star,
  Zap,
  ArrowRight,
  Calendar,
  FileText,
  Download,
  Settings,
} from 'lucide-react'

interface UsageStats {
  orders: { current: number; limit: number }
  tables: { current: number; limit: number }
  staff: { current: number; limit: number }
  products: { current: number; limit: number }
}

interface BillingHistory {
  id: string
  invoice_number: string
  amount: number
  status: 'paid' | 'pending' | 'failed'
  billing_date: string
  due_date: string
  pdf_url?: string
}

interface PlanFeature {
  name: string
  included: boolean
  limit?: number
}

export default function SubscriptionPanel() {
  const { user, tenant, subscription, plan, hasModuleAccess } = useAuth()
  const [loading, setLoading] = useState(true)
  const [usageStats, setUsageStats] = useState<UsageStats>({
    orders: { current: 0, limit: 0 },
    tables: { current: 0, limit: 0 },
    staff: { current: 0, limit: 0 },
    products: { current: number, limit: 0 },
  })
  const [billingHistory, setBillingHistory] = useState<BillingHistory[]>([])
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<any>(null)
  const [availablePlans, setAvailablePlans] = useState<any[]>([])

  useEffect(() => {
    loadData()
  }, [tenant, subscription])

  async function loadData() {
    setLoading(true)
    try {
      if (!tenant?.id) return

      // Load usage stats
      const [ordersCount, tablesCount, staffCount, productsCount] = await Promise.all([
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant.id),
        supabase.from('tables').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant.id),
        supabase.from('users').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant.id),
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant.id),
      ])

      setUsageStats({
        orders: { current: ordersCount.count || 0, limit: plan?.limits?.monthly_orders || 0 },
        tables: { current: tablesCount.count || 0, limit: plan?.limits?.tables || 0 },
        staff: { current: staffCount.count || 0, limit: plan?.limits?.staff || 0 },
        products: { current: productsCount.count || 0, limit: plan?.limits?.products || 0 },
      })

      // Load billing history
      const { data: billingData } = await supabase
        .from('billing_invoices')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('billing_date', { ascending: false })
        .limit(10)

      if (billingData) {
        setBillingHistory(billingData)
      }

      // Load available plans
      const { data: plansData } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('monthly_price')

      if (plansData) {
        setAvailablePlans(plansData)
      }
    } catch (error) {
      console.error('Error loading subscription data:', error)
    } finally {
      setLoading(false)
    }
  }

  function getUsagePercentage(current: number, limit: number): number {
    if (limit === 0) return 0
    return Math.min((current / limit) * 100, 100)
  }

  function getUsageColor(percentage: number): string {
    if (percentage >= 90) return 'text-red-600'
    if (percentage >= 70) return 'text-yellow-600'
    return 'text-green-600'
  }

  function getPlanIcon(tier: string) {
    switch (tier) {
      case 'silver':
        return <Star className="w-6 h-6 text-gray-400" />
      case 'gold':
        return <Crown className="w-6 h-6 text-yellow-500" />
      case 'platinum':
        return <Zap className="w-6 h-6 text-purple-500" />
      default:
        return <Package className="w-6 h-6" />
    }
  }

  async function handleUpgradePlan(newPlanId: string) {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          plan_id: newPlanId,
          updated_at: new Date().toISOString(),
        })
        .eq('tenant_id', tenant?.id)

      if (error) throw error

      toast.success('Plan upgrade initiated. You will be redirected to payment.')
      setShowUpgradeModal(false)
      
      // Redirect to payment provider (placeholder)
      // In production, this would redirect to Stripe/PayPal
      window.location.href = `/payment?plan=${newPlanId}`
    } catch (error) {
      console.error('Error upgrading plan:', error)
      toast.error('Failed to upgrade plan')
    }
  }

  async function handleCancelSubscription() {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('tenant_id', tenant?.id)

      if (error) throw error

      toast.success('Subscription cancelled successfully')
      setShowCancelModal(false)
      loadData()
    } catch (error) {
      console.error('Error cancelling subscription:', error)
      toast.error('Failed to cancel subscription')
    }
  }

  function getPlanFeatures(plan: any): PlanFeature[] {
    const features: PlanFeature[] = [
      { name: 'POS System', included: true },
      { name: 'Waiter Dashboard', included: plan?.modules?.waiter_dashboard || false },
      { name: 'Kitchen Display', included: plan?.modules?.kitchen_display || false },
      { name: 'NFC Menu', included: plan?.modules?.nfc_menu || false },
      { name: 'Advanced Reports', included: plan?.modules?.advanced_reports || false },
      { name: 'Multi-location', included: plan?.modules?.multi_location || false },
      { name: 'API Access', included: plan?.modules?.api_access || false },
      { name: 'Monthly Orders', included: true, limit: plan?.limits?.monthly_orders },
      { name: 'Tables', included: true, limit: plan?.limits?.tables },
      { name: 'Staff Members', included: true, limit: plan?.limits?.staff },
      { name: 'Products', included: true, limit: plan?.limits?.products },
    ]
    return features
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getPlanIcon(plan?.tier)}
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {plan?.name || 'No Plan'}
                </h2>
                <p className="text-sm text-gray-500">
                  {subscription?.status === 'active' ? 'Active' : subscription?.status}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-blue-600">
                {formatCurrency(plan?.monthly_price || 0)}
                <span className="text-sm font-normal text-gray-500">/month</span>
              </p>
              <p className="text-sm text-gray-500">
                Renews: {subscription?.renewal_date ? new Date(subscription.renewal_date).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Plan Features</h3>
              <div className="space-y-2">
                {getPlanFeatures(plan).map((feature, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {feature.included ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-gray-400" />
                      )}
                      <span className="text-sm text-gray-700">{feature.name}</span>
                    </div>
                    {feature.limit && (
                      <span className="text-sm text-gray-500">{feature.limit}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <Button
                  onClick={() => setShowUpgradeModal(true)}
                  className="w-full"
                  variant="outline"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Upgrade Plan
                </Button>
                <Button
                  onClick={() => setShowCancelModal(true)}
                  className="w-full"
                  variant="outline"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancel Subscription
                </Button>
                <Button
                  onClick={() => {/* Open billing settings */}}
                  className="w-full"
                  variant="outline"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Billing Settings
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Stats */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Usage Statistics</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(usageStats).map(([key, value]) => (
              <div key={key}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {key}
                  </span>
                  <span className={`text-sm font-semibold ${getUsageColor(getUsagePercentage(value.current, value.limit))}`}>
                    {value.current} / {value.limit === 0 ? '∞' : value.limit}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      getUsagePercentage(value.current, value.limit) >= 90 ? 'bg-red-500' :
                      getUsagePercentage(value.current, value.limit) >= 70 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${getUsagePercentage(value.current, value.limit)}%` }}
                  />
                </div>
                {getUsagePercentage(value.current, value.limit) >= 90 && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Approaching limit
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Billing History</h3>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {billingHistory.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No billing history available</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Invoice</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Due Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {billingHistory.map((invoice) => (
                    <tr key={invoice.id} className="border-b border-gray-100">
                      <td className="py-3 px-4 font-medium">{invoice.invoice_number}</td>
                      <td className="py-3 px-4 text-gray-600">
                        {new Date(invoice.billing_date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {new Date(invoice.due_date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 font-semibold">{formatCurrency(invoice.amount)}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          invoice.status === 'paid' ? 'bg-green-100 text-green-700' :
                          invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Button variant="outline" size="sm">
                          <FileText className="w-4 h-4 mr-2" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upgrade Modal */}
      <Modal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        title="Upgrade Your Plan"
        size="lg"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {availablePlans.map((plan) => (
            <Card
              key={plan.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedPlan?.id === plan.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setSelectedPlan(plan)}
            >
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  {getPlanIcon(plan.tier)}
                  <h3 className="font-bold text-lg">{plan.name}</h3>
                </div>
                <p className="text-3xl font-bold text-blue-600">
                  {formatCurrency(plan.monthly_price)}
                  <span className="text-sm font-normal text-gray-500">/month</span>
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  {getPlanFeatures(plan).map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      {feature.included ? (
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      )}
                      <span className="text-gray-700">{feature.name}</span>
                      {feature.limit && (
                        <span className="text-gray-500 ml-auto">{feature.limit}</span>
                      )}
                    </div>
                  ))}
                </div>
                <Button
                  onClick={() => handleUpgradePlan(plan.id)}
                  disabled={plan.id === subscription?.plan_id}
                  className="w-full"
                >
                  {plan.id === subscription?.plan_id ? 'Current Plan' : 'Upgrade'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </Modal>

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel Subscription"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-900">Warning</p>
                <p className="text-sm text-yellow-800 mt-1">
                  Cancelling your subscription will limit your access to features. Your data will be retained for 30 days before deletion.
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              <strong>What happens when you cancel:</strong>
            </p>
            <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
              <li>Access to premium features will be revoked</li>
              <li>Your data will be retained for 30 days</li>
              <li>You can reactivate anytime within 30 days</li>
              <li>No refunds for partial months</li>
            </ul>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={() => setShowCancelModal(false)}
              variant="outline"
              className="flex-1"
            >
              Keep Subscription
            </Button>
            <Button
              onClick={handleCancelSubscription}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              Cancel Subscription
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
