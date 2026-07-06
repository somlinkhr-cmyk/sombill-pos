import { supabase } from './supabase'
import toast from 'react-hot-toast'

// Stripe configuration (these would come from environment variables in production)
const STRIPE_CONFIG = {
  publishableKey: (typeof window !== 'undefined' && (window as any).__STRIPE_PUBLISHABLE_KEY__) || '',
  secretKey: (typeof window !== 'undefined' && (window as any).__STRIPE_SECRET_KEY__) || '',
  webhookSecret: (typeof window !== 'undefined' && (window as any).__STRIPE_WEBHOOK_SECRET__) || '',
}

export interface CheckoutSession {
  id: string
  url: string
  customer_email?: string
}

export interface SubscriptionUpdate {
  subscriptionId: string
  status: string
  planId: string
  currentPeriodEnd?: string
  cancelAtPeriodEnd?: boolean
}

/**
 * Stripe Payment Service for handling subscription payments
 */
export class StripePaymentService {
  private tenantId: string

  constructor(tenantId: string) {
    this.tenantId = tenantId
  }

  /**
   * Create a Stripe checkout session for plan upgrade/new subscription
   */
  async createCheckoutSession(
    planId: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<{ success: boolean; sessionUrl?: string; error?: string }> {
    try {
      // Get plan details
      const { data: plan } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', planId)
        .single()

      if (!plan) {
        return { success: false, error: 'Plan not found' }
      }

      // Get tenant info
      const { data: tenant } = await supabase
        .from('tenants')
        .select('name, email')
        .eq('id', this.tenantId)
        .single()

      if (!tenant) {
        return { success: false, error: 'Tenant not found' }
      }

      // In production, this would call your backend API which creates a Stripe checkout session
      // For now, we'll simulate the response
      const mockSessionUrl = `${successUrl}?session_id=mock_${Date.now()}&plan=${planId}`

      // Log the checkout session creation
      await supabase.from('payment_sessions').insert({
        tenant_id: this.tenantId,
        plan_id: planId,
        amount: plan.monthly_price,
        currency: 'USD',
        status: 'created',
        success_url: successUrl,
        cancel_url: cancelUrl,
        created_at: new Date().toISOString(),
      })

      return { success: true, sessionUrl: mockSessionUrl }
    } catch (error: any) {
      console.error('Error creating checkout session:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Create a customer portal session for managing subscription
   */
  async createCustomerPortalSession(
    returnUrl: string
  ): Promise<{ success: boolean; portalUrl?: string; error?: string }> {
    try {
      // In production, this would call your backend API to create a Stripe customer portal session
      const mockPortalUrl = `${returnUrl}?portal=true`

      return { success: true, portalUrl: mockPortalUrl }
    } catch (error: any) {
      console.error('Error creating customer portal session:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Handle Stripe webhook events
   * This would typically be called from your backend API endpoint
   */
  async handleWebhookEvent(
    eventType: string,
    eventData: any
  ): Promise<{ success: boolean; error?: string }> {
    try {
      switch (eventType) {
        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(eventData)
          break
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(eventData)
          break
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(eventData)
          break
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(eventData)
          break
        case 'invoice.payment_succeeded':
          await this.handleInvoicePaymentSucceeded(eventData)
          break
        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(eventData)
          break
        default:
          console.log(`Unhandled event type: ${eventType}`)
      }

      return { success: true }
    } catch (error: any) {
      console.error('Error handling webhook event:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Handle checkout session completed event
   */
  private async handleCheckoutCompleted(eventData: any): Promise<void> {
    const { plan_id, tenant_id } = eventData.metadata || {}

    if (!plan_id || !tenant_id) {
      console.error('Missing metadata in checkout session')
      return
    }

    // Update subscription status
    await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        plan_id: plan_id,
        updated_at: new Date().toISOString(),
      })
      .eq('tenant_id', tenant_id)

    // Log payment
    await supabase.from('billing_invoices').insert({
      tenant_id,
      invoice_number: `INV-${Date.now()}`,
      amount: eventData.amount_total / 100,
      status: 'paid',
      billing_date: new Date().toISOString(),
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      payment_method: 'stripe',
      stripe_invoice_id: eventData.invoice,
      created_at: new Date().toISOString(),
    })
  }

  /**
   * Handle subscription created event
   */
  private async handleSubscriptionCreated(eventData: any): Promise<void> {
    const { tenant_id, plan_id } = eventData.metadata || {}

    if (!tenant_id || !plan_id) {
      console.error('Missing metadata in subscription')
      return
    }

    await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        stripe_subscription_id: eventData.id,
        current_period_end: new Date(eventData.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('tenant_id', tenant_id)
  }

  /**
   * Handle subscription updated event
   */
  private async handleSubscriptionUpdated(eventData: any): Promise<void> {
    const subscriptionId = eventData.id

    // Find tenant by stripe subscription ID
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('tenant_id')
      .eq('stripe_subscription_id', subscriptionId)
      .single()

    if (!subscription) {
      console.error('Subscription not found')
      return
    }

    await supabase
      .from('subscriptions')
      .update({
        status: eventData.status === 'active' ? 'active' : eventData.status,
        current_period_end: new Date(eventData.current_period_end * 1000).toISOString(),
        cancel_at_period_end: eventData.cancel_at_period_end,
        updated_at: new Date().toISOString(),
      })
      .eq('tenant_id', subscription.tenant_id)
  }

  /**
   * Handle subscription deleted event
   */
  private async handleSubscriptionDeleted(eventData: any): Promise<void> {
    const subscriptionId = eventData.id

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('tenant_id')
      .eq('stripe_subscription_id', subscriptionId)
      .single()

    if (!subscription) {
      console.error('Subscription not found')
      return
    }

    await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('tenant_id', subscription.tenant_id)
  }

  /**
   * Handle invoice payment succeeded event
   */
  private async handleInvoicePaymentSucceeded(eventData: any): Promise<void> {
    const subscriptionId = eventData.subscription

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('tenant_id, plan_id')
      .eq('stripe_subscription_id', subscriptionId)
      .single()

    if (!subscription) {
      console.error('Subscription not found')
      return
    }

    // Create invoice record
    await supabase.from('billing_invoices').insert({
      tenant_id: subscription.tenant_id,
      invoice_number: eventData.number || `INV-${Date.now()}`,
      amount: eventData.amount_paid / 100,
      status: 'paid',
      billing_date: new Date(eventData.created * 1000).toISOString(),
      due_date: new Date(eventData.due_date * 1000).toISOString(),
      payment_method: 'stripe',
      stripe_invoice_id: eventData.id,
      pdf_url: eventData.invoice_pdf,
      created_at: new Date().toISOString(),
    })

    // Update subscription renewal date
    await supabase
      .from('subscriptions')
      .update({
        renewal_date: new Date(eventData.period_end * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('tenant_id', subscription.tenant_id)
  }

  /**
   * Handle invoice payment failed event
   */
  private async handleInvoicePaymentFailed(eventData: any): Promise<void> {
    const subscriptionId = eventData.subscription

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('tenant_id')
      .eq('stripe_subscription_id', subscriptionId)
      .single()

    if (!subscription) {
      console.error('Subscription not found')
      return
    }

    // Create failed invoice record
    await supabase.from('billing_invoices').insert({
      tenant_id: subscription.tenant_id,
      invoice_number: eventData.number || `INV-${Date.now()}`,
      amount: eventData.amount_due / 100,
      status: 'failed',
      billing_date: new Date(eventData.created * 1000).toISOString(),
      due_date: new Date(eventData.due_date * 1000).toISOString(),
      payment_method: 'stripe',
      stripe_invoice_id: eventData.id,
      created_at: new Date().toISOString(),
    })

    // Update subscription status to past_due
    await supabase
      .from('subscriptions')
      .update({
        status: 'past_due',
        updated_at: new Date().toISOString(),
      })
      .eq('tenant_id', subscription.tenant_id)

    // Send notification to tenant
    await supabase.from('notifications').insert({
      type: 'payment_failed',
      title: 'Payment Failed',
      message: `Your subscription payment has failed. Please update your payment method.`,
      tenant_id: subscription.tenant_id,
      is_read: false,
      created_at: new Date().toISOString(),
    })
  }

  /**
   * Get billing history for tenant
   */
  async getBillingHistory(): Promise<any[]> {
    try {
      const { data } = await supabase
        .from('billing_invoices')
        .select('*')
        .eq('tenant_id', this.tenantId)
        .order('billing_date', { ascending: false })

      return data || []
    } catch (error) {
      console.error('Error fetching billing history:', error)
      return []
    }
  }

  /**
   * Get upcoming invoice
   */
  async getUpcomingInvoice(): Promise<{ amount: number; date: string } | null> {
    try {
      // In production, this would call Stripe API to get upcoming invoice
      // For now, return mock data
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('renewal_date, plan_id')
        .eq('tenant_id', this.tenantId)
        .single()

      if (!subscription || !subscription.renewal_date) {
        return null
      }

      const { data: plan } = await supabase
        .from('subscription_plans')
        .select('monthly_price')
        .eq('id', subscription.plan_id)
        .single()

      return {
        amount: plan?.monthly_price || 0,
        date: subscription.renewal_date,
      }
    } catch (error) {
      console.error('Error fetching upcoming invoice:', error)
      return null
    }
  }
}

/**
 * React hook for using Stripe payment service
 */
export function useStripePayment(tenantId: string) {
  const service = new StripePaymentService(tenantId)

  return {
    createCheckoutSession: service.createCheckoutSession.bind(service),
    createCustomerPortalSession: service.createCustomerPortalSession.bind(service),
    getBillingHistory: service.getBillingHistory.bind(service),
    getUpcomingInvoice: service.getUpcomingInvoice.bind(service),
  }
}

/**
 * Initialize Stripe with publishable key (for client-side use)
 */
export function initStripe() {
  if (typeof window !== 'undefined' && STRIPE_CONFIG.publishableKey) {
    // In production, you would initialize Stripe here
    // const stripe = require('@stripe/stripe-js')
    // return stripe.loadStripe(STRIPE_CONFIG.publishableKey)
    console.log('Stripe would be initialized here with:', STRIPE_CONFIG.publishableKey)
  }
  return null
}
