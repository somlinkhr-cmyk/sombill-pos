-- ============================================================================
-- 009: RLS
-- ============================================================================
-- Enable Row Level Security on all tables for multi-tenant data isolation
--
-- Dependencies: All previous table migrations
-- Idempotent: Yes (uses ALTER TABLE ... ENABLE ROW LEVEL SECURITY)
-- ============================================================================

-- ============================================================================
-- Enable RLS on Core Tables
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_settings ENABLE ROW LEVEL SECURITY;

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

-- ============================================================================
-- Verification
-- ============================================================================
-- Verify RLS is enabled on all tables
SELECT 
  c.relname as table_name,
  c.relrowsecurity as rls_enabled
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
AND c.relname IN (
  'profiles',
  'tenants',
  'restaurants',
  'restaurant_branches',
  'restaurant_settings',
  'restaurant_users',
  'roles',
  'permissions',
  'role_permissions',
  'subscription_plans',
  'subscriptions',
  'tenant_settings'
)
ORDER BY c.relname;
