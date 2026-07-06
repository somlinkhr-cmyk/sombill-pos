import { SubscriptionPlan, SubscriptionStatus } from '../types'

export interface ModuleAccessConfig {
  module: string
  requiredTier?: 'silver' | 'gold' | 'platinum'
  fallback?: React.ReactNode
}

export function checkModuleAccess(plan: SubscriptionPlan | null, module: string): boolean {
  if (!plan) return false
  
  const moduleAccess: Record<string, keyof SubscriptionPlan> = {
    'cashier': 'allow_cashier',
    'manager': 'allow_manager',
    'waiter': 'allow_waiter',
    'kitchen_display': 'allow_kitchen_display',
    'customer_menu': 'allow_customer_menu',
    'multi_branch': 'allow_multi_branch',
  }
  
  const accessKey = moduleAccess[module]
  if (!accessKey) return false
  
  const value = plan[accessKey]
  return typeof value === 'boolean' ? value : false
}

export function checkUsageLimit(plan: SubscriptionPlan | null, resource: string, current: number): boolean {
  if (!plan) return false
  
  const limits: Record<string, keyof SubscriptionPlan> = {
    'tables': 'max_tables',
    'staff_seats': 'max_staff_seats',
    'menu_items': 'max_menu_items',
    'branches': 'max_branches',
  }
  
  const limitKey = limits[resource]
  if (!limitKey) return true
  
  const limit = plan[limitKey] as number
  return current < limit
}

export function getSubscriptionStatusColor(status: SubscriptionStatus): string {
  const colors: Record<SubscriptionStatus, string> = {
    trialing: 'text-blue-600 bg-blue-50',
    active: 'text-green-600 bg-green-50',
    past_due: 'text-red-600 bg-red-50',
    canceled: 'text-gray-600 bg-gray-50',
  }
  return colors[status] || colors.active
}

export function getSubscriptionStatusLabel(status: SubscriptionStatus): string {
  const labels: Record<SubscriptionStatus, string> = {
    trialing: 'Trial',
    active: 'Active',
    past_due: 'Past Due',
    canceled: 'Canceled',
  }
  return labels[status] || 'Unknown'
}

export function getTierDisplayName(tier: string): string {
  const names: Record<string, string> = {
    silver: 'Silver',
    gold: 'Gold',
    platinum: 'Platinum',
  }
  return names[tier] || tier
}
