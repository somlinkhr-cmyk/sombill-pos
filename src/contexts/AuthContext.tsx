import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, UserRole, Tenant, Subscription, SubscriptionPlan } from '../types'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

interface AuthContextType {
  user: User | null
  tenant: Tenant | null
  subscription: Subscription | null
  plan: SubscriptionPlan | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  hasPermission: (permission: string) => boolean
  hasModuleAccess: (module: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const PERMISSIONS: Record<UserRole, string[]> = {
  manager: [
    'dashboard.view',
    'orders.view',
    'orders.create',
    'orders.edit',
    'orders.delete',
    'orders.refund',
    'menu.view',
    'menu.create',
    'menu.edit',
    'menu.delete',
    'inventory.view',
    'inventory.create',
    'inventory.edit',
    'inventory.delete',
    'tables.view',
    'tables.create',
    'tables.edit',
    'tables.delete',
    'staff.view',
    'staff.create',
    'staff.edit',
    'staff.delete',
    'customers.view',
    'customers.create',
    'customers.edit',
    'customers.delete',
    'reports.view',
    'reports.export',
    'expenses.view',
    'expenses.create',
    'expenses.edit',
    'expenses.delete',
    'settings.view',
    'settings.edit',
  ],
  cashier: [
    'pos.view',
    'orders.create',
    'orders.edit',
    'tables.view',
    'customers.view',
    'customers.create',
  ],
  waiter: [
    'tables.view',
    'tables.edit',
    'orders.create',
    'orders.edit',
    'customers.view',
  ],
  kitchen: [
    'kds.view',
    'orders.edit',
  ],
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await loadUserProfile(session.user.id)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setTenant(null)
          setSubscription(null)
          setPlan(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function checkAuth() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        await loadUserProfile(session.user.id)
      } else {
        setLoading(false)
      }
    } catch (error) {
      console.error('Auth check error:', error)
      setLoading(false)
    }
  }

  async function loadUserProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      if (data && data.is_active) {
        setUser(data)
        
        // Load tenant data
        if (data.tenant_id) {
          await loadTenantData(data.tenant_id)
        }
      } else {
        await supabase.auth.signOut()
        toast.error('Account is inactive')
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
      await supabase.auth.signOut()
    } finally {
      setLoading(false)
    }
  }

  async function loadTenantData(tenantId: string) {
    try {
      // Load tenant
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', tenantId)
        .single()

      if (tenantError) throw tenantError
      setTenant(tenantData)

      // Load subscription
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('*, subscription_plans(*)')
        .eq('tenant_id', tenantId)
        .eq('status', 'active')
        .single()

      if (!subscriptionError && subscriptionData) {
        setSubscription(subscriptionData)
        setPlan(subscriptionData.subscription_plans as any)
      }
    } catch (error) {
      console.error('Error loading tenant data:', error)
    }
  }

  async function login(email: string, password: string) {
    try {
      setLoading(true)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        await loadUserProfile(data.user.id)
        toast.success('Login successful')
      }
    } catch (error: any) {
      toast.error(error.message || 'Login failed')
      throw error
    } finally {
      setLoading(false)
    }
  }

  async function logout() {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setTenant(null)
      setSubscription(null)
      setPlan(null)
      toast.success('Logged out successfully')
    } catch (error) {
      toast.error('Logout failed')
    }
  }

  function hasPermission(permission: string): boolean {
    if (!user) return false
    const userPermissions = PERMISSIONS[user.role] || []
    return userPermissions.includes(permission)
  }

  function hasModuleAccess(module: string): boolean {
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
    return accessKey ? (plan as any)[accessKey] : false
  }

  return (
    <AuthContext.Provider value={{ user, tenant, subscription, plan, loading, login, logout, hasPermission, hasModuleAccess }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
