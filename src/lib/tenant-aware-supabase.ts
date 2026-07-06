import { supabase } from './supabase'
import { useAuth } from '../contexts/AuthContext'

/**
 * Tenant-aware Supabase client wrapper
 * Automatically filters queries by tenant_id to ensure data isolation
 */

export function getTenantAwareClient() {
  const { user } = useAuth()
  const tenantId = user?.tenant_id

  if (!tenantId) {
    throw new Error('No tenant_id found in user context')
  }

  return {
    from: (table: string) => {
      const query = supabase.from(table)
      
      return {
        select: (columns?: string) => {
          return query.select(columns).eq('tenant_id', tenantId)
        },
        insert: (data: any) => {
          const dataWithTenant = Array.isArray(data) 
            ? data.map(item => ({ ...item, tenant_id: tenantId }))
            : { ...data, tenant_id: tenantId }
          return query.insert(dataWithTenant)
        },
        update: (data: any) => {
          return query.update(data).eq('tenant_id', tenantId)
        },
        delete: () => {
          return query.delete().eq('tenant_id', tenantId)
        },
      }
    }
  }
}

/**
 * Hook to get tenant ID for manual query construction
 */
export function useTenantId(): string {
  const { user } = useAuth()
  if (!user?.tenant_id) {
    throw new Error('No tenant_id found in user context')
  }
  return user.tenant_id
}

/**
 * Add tenant_id filter to existing Supabase query
 * Use this when you need to manually add tenant filtering
 */
export function withTenantFilter(query: any, tenantId: string) {
  return query.eq('tenant_id', tenantId)
}
