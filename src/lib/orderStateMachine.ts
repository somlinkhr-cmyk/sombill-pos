import { supabase } from './auth'
import toast from 'react-hot-toast'

export type OrderStatus = 'new' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled' | 'refunded'
export type OrderType = 'dine_in' | 'takeaway' | 'delivery'
export type OrderSource = 'cashier' | 'waiter' | 'customer' | 'manager'

export interface OrderState {
  status: OrderStatus
  previousStatus?: OrderStatus
  timestamp: string
  actor?: string
  notes?: string
}

export interface OrderTransition {
  from: OrderStatus
  to: OrderStatus
  allowed: boolean
  requiresPayment?: boolean
  requiresKitchen?: boolean
  autoTransition?: boolean
}

// Define valid order state transitions
const ORDER_TRANSITIONS: Record<OrderStatus, OrderTransition[]> = {
  new: [
    { from: 'new', to: 'preparing', allowed: true, requiresKitchen: true },
    { from: 'new', to: 'cancelled', allowed: true },
  ],
  preparing: [
    { from: 'preparing', to: 'ready', allowed: true, requiresKitchen: true },
    { from: 'preparing', to: 'cancelled', allowed: true },
  ],
  ready: [
    { from: 'ready', to: 'served', allowed: true },
    { from: 'ready', to: 'cancelled', allowed: true },
  ],
  served: [
    { from: 'served', to: 'completed', allowed: true, requiresPayment: true, autoTransition: true },
  ],
  completed: [
    // Terminal state - no transitions allowed
  ],
  cancelled: [
    // Terminal state - no transitions allowed
  ],
  refunded: [
    // Terminal state - no transitions allowed
  ],
}

// State transition timestamps mapping
const STATUS_TIMESTAMP_FIELDS: Record<OrderStatus, string> = {
  new: 'created_at',
  preparing: 'preparing_started_at',
  ready: 'ready_at',
  served: 'served_at',
  completed: 'completed_at',
  cancelled: 'cancelled_at',
  refunded: 'refunded_at',
}

export class OrderStateMachine {
  private tenantId: string
  private userId: string

  constructor(tenantId: string, userId: string) {
    this.tenantId = tenantId
    this.userId = userId
  }

  /**
   * Check if a transition is valid
   */
  canTransition(currentStatus: OrderStatus, targetStatus: OrderStatus): boolean {
    const transitions = ORDER_TRANSITIONS[currentStatus] || []
    return transitions.some(t => t.to === targetStatus && t.allowed)
  }

  /**
   * Get allowed transitions for current status
   */
  getAllowedTransitions(currentStatus: OrderStatus): OrderStatus[] {
    const transitions = ORDER_TRANSITIONS[currentStatus] || []
    return transitions.filter(t => t.allowed).map(t => t.to)
  }

  /**
   * Validate transition requirements
   */
  async validateTransition(
    orderId: string,
    currentStatus: OrderStatus,
    targetStatus: OrderStatus
  ): Promise<{ valid: boolean; reason?: string }> {
    // Check if transition is allowed
    if (!this.canTransition(currentStatus, targetStatus)) {
      return {
        valid: false,
        reason: `Cannot transition from ${currentStatus} to ${targetStatus}`,
      }
    }

    // Get transition rules
    const transitions = ORDER_TRANSITIONS[currentStatus] || []
    const transition = transitions.find(t => t.to === targetStatus)

    if (!transition) {
      return { valid: false, reason: 'Invalid transition' }
    }

    // Check payment requirement
    if (transition.requiresPayment) {
      const { data: order } = await supabase
        .from('orders')
        .select('payment_status')
        .eq('id', orderId)
        .single()

      if (order?.payment_status !== 'paid') {
        return { valid: false, reason: 'Order must be paid before this transition' }
      }
    }

    // Check kitchen requirement
    if (transition.requiresKitchen) {
      // Could add kitchen staff validation here
      // For now, we'll allow it
    }

    return { valid: true }
  }

  /**
   * Execute state transition
   */
  async transitionOrder(
    orderId: string,
    targetStatus: OrderStatus,
    options?: {
      actor?: string
      notes?: string
      skipValidation?: boolean
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get current order status
      const { data: order } = await supabase
        .from('orders')
        .select('status, payment_status')
        .eq('id', orderId)
        .eq('tenant_id', this.tenantId)
        .single()

      if (!order) {
        return { success: false, error: 'Order not found' }
      }

      const currentStatus = order.status as OrderStatus

      // Validate transition unless skipped
      if (!options?.skipValidation) {
        const validation = await this.validateTransition(orderId, currentStatus, targetStatus)
        if (!validation.valid) {
          return { success: false, error: validation.reason }
        }
      }

      // Prepare update data
      const updateData: any = {
        status: targetStatus,
        updated_at: new Date().toISOString(),
      }

      // Add timestamp field for the new status
      const timestampField = STATUS_TIMESTAMP_FIELDS[targetStatus]
      if (timestampField) {
        updateData[timestampField] = new Date().toISOString()
      }

      // Add notes if provided
      if (options?.notes) {
        updateData.notes = options.notes
      }

      // Execute transition
      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)
        .eq('tenant_id', this.tenantId)

      if (error) {
        return { success: false, error: error.message }
      }

      // Log state transition
      await this.logStateTransition(orderId, currentStatus, targetStatus, options?.actor, options?.notes)

      // Send notification based on transition
      await this.sendTransitionNotification(orderId, currentStatus, targetStatus)

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  /**
   * Log state transition to audit trail
   */
  private async logStateTransition(
    orderId: string,
    fromStatus: OrderStatus,
    toStatus: OrderStatus,
    actor?: string,
    notes?: string
  ): Promise<void> {
    try {
      await supabase.from('order_state_history').insert({
        order_id: orderId,
        from_status: fromStatus,
        to_status: toStatus,
        actor_id: actor || this.userId,
        tenant_id: this.tenantId,
        notes,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Failed to log state transition:', error)
    }
  }

  /**
   * Send notification based on transition
   */
  private async sendTransitionNotification(
    orderId: string,
    fromStatus: OrderStatus,
    toStatus: OrderStatus
  ): Promise<void> {
    try {
      let notificationType: string = ''
      let title: string = ''
      let message: string = ''

      // Define notification rules based on transitions
      switch (toStatus) {
        case 'preparing':
          notificationType = 'kitchen_new_order'
          title = 'Order Started'
          message = `Order #${orderId.slice(0, 8)} is now being prepared`
          break
        case 'ready':
          notificationType = 'waiter_order_ready'
          title = 'Order Ready'
          message = `Order #${orderId.slice(0, 8)} is ready to be served`
          break
        case 'served':
          notificationType = 'order_served'
          title = 'Order Served'
          message = `Order #${orderId.slice(0, 8)} has been served`
          break
        case 'completed':
          notificationType = 'order_completed'
          title = 'Order Completed'
          message = `Order #${orderId.slice(0, 8)} has been completed`
          break
        case 'cancelled':
          notificationType = 'order_cancelled'
          title = 'Order Cancelled'
          message = `Order #${orderId.slice(0, 8)} has been cancelled`
          break
        default:
          return
      }

      // Get order details for notification
      const { data: order } = await supabase
        .from('orders')
        .select('*, tables(number), customers(name)')
        .eq('id', orderId)
        .single()

      if (order) {
        await supabase.from('notifications').insert({
          type: notificationType,
          title,
          message: `${message} - Table ${(order as any).tables?.number || 'N/A'}`,
          tenant_id: this.tenantId,
          data: {
            order_id: orderId,
            table: (order as any).tables?.number,
            customer: (order as any).customers?.name,
          },
          is_read: false,
          created_at: new Date().toISOString(),
        })
      }
    } catch (error) {
      console.error('Failed to send transition notification:', error)
    }
  }

  /**
   * Auto-transition served orders to completed when paid
   */
  async autoTransitionCompleted(orderId: string): Promise<void> {
    try {
      const { data: order } = await supabase
        .from('orders')
        .select('status, payment_status')
        .eq('id', orderId)
        .eq('tenant_id', this.tenantId)
        .single()

      if (order?.status === 'served' && order.payment_status === 'paid') {
        await this.transitionOrder(orderId, 'completed', { skipValidation: true })
      }
    } catch (error) {
      console.error('Failed to auto-transition order:', error)
    }
  }

  /**
   * Cancel order with validation
   */
  async cancelOrder(orderId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: order } = await supabase
        .from('orders')
        .select('status, created_at')
        .eq('id', orderId)
        .eq('tenant_id', this.tenantId)
        .single()

      if (!order) {
        return { success: false, error: 'Order not found' }
      }

      // Check if order can be cancelled (only new or preparing orders)
      if (order.status !== 'new' && order.status !== 'preparing') {
        return { success: false, error: 'Order cannot be cancelled in current state' }
      }

      // Check if order is too old (more than 30 minutes)
      const orderAge = Date.now() - new Date(order.created_at).getTime()
      if (orderAge > 30 * 60 * 1000) {
        return { success: false, error: 'Order is too old to cancel' }
      }

      return await this.transitionOrder(orderId, 'cancelled', {
        notes: reason || 'Order cancelled',
      })
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  /**
   * Get order state history
   */
  async getStateHistory(orderId: string): Promise<OrderState[]> {
    try {
      const { data } = await supabase
        .from('order_state_history')
        .select('*')
        .eq('order_id', orderId)
        .eq('tenant_id', this.tenantId)
        .order('timestamp', { ascending: true })

      return (data || []).map((h: any) => ({
        status: h.to_status,
        previousStatus: h.from_status,
        timestamp: h.timestamp,
        actor: h.actor_id,
        notes: h.notes,
      }))
    } catch (error) {
      console.error('Failed to get state history:', error)
      return []
    }
  }

  /**
   * Get order statistics by status
   */
  async getStatusStats(): Promise<Record<OrderStatus, number>> {
    try {
      const { data } = await supabase
        .from('orders')
        .select('status')
        .eq('tenant_id', this.tenantId)
        .gte('created_at', new Date().toISOString().split('T')[0])

      const stats: Record<OrderStatus, number> = {
        new: 0,
        preparing: 0,
        ready: 0,
        served: 0,
        completed: 0,
        cancelled: 0,
        refunded: 0,
      }

      data?.forEach((order: any) => {
        const status = order.status as OrderStatus
        if (stats[status] !== undefined) {
          stats[status]++
        }
      })

      return stats
    } catch (error) {
      console.error('Failed to get status stats:', error)
      return {
        new: 0,
        preparing: 0,
        ready: 0,
        served: 0,
        completed: 0,
        cancelled: 0,
        refunded: 0,
      }
    }
  }

  /**
   * Setup real-time subscription for order changes
   */
  subscribeToOrderChanges(
    orderId: string,
    callback: (order: any) => void
  ): () => void {
    const subscription = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            callback(payload.new)
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }

  /**
   * Setup real-time subscription for all tenant orders
   */
  subscribeToAllOrders(
    callback: (order: any, eventType: string) => void
  ): () => void {
    const subscription = supabase
      .channel('all-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `tenant_id=eq.${this.tenantId}`,
        },
        (payload) => {
          callback(payload.new, payload.eventType)
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }
}

/**
 * Hook to use order state machine in React components
 */
export function useOrderStateMachine(tenantId: string, userId: string) {
  const machine = new OrderStateMachine(tenantId, userId)

  return {
    canTransition: machine.canTransition.bind(machine),
    getAllowedTransitions: machine.getAllowedTransitions.bind(machine),
    transitionOrder: machine.transitionOrder.bind(machine),
    cancelOrder: machine.cancelOrder.bind(machine),
    getStateHistory: machine.getStateHistory.bind(machine),
    getStatusStats: machine.getStatusStats.bind(machine),
    subscribeToOrderChanges: machine.subscribeToOrderChanges.bind(machine),
    subscribeToAllOrders: machine.subscribeToAllOrders.bind(machine),
    autoTransitionCompleted: machine.autoTransitionCompleted.bind(machine),
  }
}
