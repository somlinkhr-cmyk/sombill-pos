-- ============================================================================
-- 009: Row Level Security
-- ============================================================================
-- Enable RLS on all tables for multi-tenant data isolation
--
-- Dependencies: 001_initial_schema.sql through 006_notifications.sql
-- Idempotent: Yes (uses ALTER TABLE ... ENABLE ROW LEVEL SECURITY)
-- ============================================================================

-- ============================================================================
-- Enable RLS on Core Tables
-- ============================================================================

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_branches ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Enable RLS on RBAC Tables
-- ============================================================================

ALTER TABLE public.restaurant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Enable RLS on Subscription Tables
-- ============================================================================

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Enable RLS on Settings Tables
-- ============================================================================

ALTER TABLE public.tenant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Enable RLS on Audit and Notification Tables
-- ============================================================================

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Verification
-- ============================================================================
-- Verify RLS is enabled on all tables
SELECT 
  tablename as table_name,
  relrowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'tenants',
  'profiles',
  'restaurants',
  'restaurant_branches',
  'restaurant_users',
  'roles',
  'permissions',
  'role_permissions',
  'subscription_plans',
  'subscriptions',
  'tenant_settings',
  'restaurant_settings',
  'system_settings',
  'audit_logs',
  'notifications'
)
ORDER BY tablename;
