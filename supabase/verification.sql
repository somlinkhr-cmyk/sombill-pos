-- ============================================================================
-- Phase 1 Verification Script
-- ============================================================================
-- Run this in Supabase SQL Editor to verify all Phase 1 components
-- ============================================================================

-- ============================================================================
-- 1. Verify Tables
-- ============================================================================
SELECT 'TABLES' as component, COUNT(*) as count
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
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
);

-- ============================================================================
-- 2. Verify RLS Enabled
-- ============================================================================
SELECT 'RLS_ENABLED' as component, COUNT(*) as count
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
AND c.relrowsecurity = true
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
);

-- ============================================================================
-- 3. Verify Functions
-- ============================================================================
SELECT 'FUNCTIONS' as component, COUNT(*) as count
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
AND proname IN (
  'is_super_admin',
  'get_user_tenant_id',
  'get_user_restaurant_id',
  'has_permission',
  'create_tenant',
  'create_restaurant',
  'create_subscription',
  'handle_updated_at'
);

-- ============================================================================
-- 4. Verify Triggers
-- ============================================================================
SELECT 'TRIGGERS' as component, COUNT(*) as count
FROM pg_trigger
WHERE tgname LIKE '%_updated_at';

-- ============================================================================
-- 5. Verify Foreign Keys
-- ============================================================================
SELECT 'FOREIGN_KEYS' as component, COUNT(*) as count
FROM pg_constraint
WHERE contype = 'f'
AND connamespace = 'public'::regnamespace;

-- ============================================================================
-- 6. Verify Seed Data - Subscription Plans
-- ============================================================================
SELECT 'SUBSCRIPTION_PLANS' as component, COUNT(*) as count
FROM public.subscription_plans;

-- ============================================================================
-- 7. Verify Seed Data - Permissions
-- ============================================================================
SELECT 'PERMISSIONS' as component, COUNT(*) as count
FROM public.permissions;

-- ============================================================================
-- 8. Verify Extensions
-- ============================================================================
SELECT 'EXTENSIONS' as component, COUNT(*) as count
FROM pg_extension
WHERE extname = 'uuid-ossp';

-- ============================================================================
-- Detailed Table List
-- ============================================================================
SELECT 
  c.relname as table_name,
  c.relrowsecurity as rls_enabled
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
AND c.relkind = 'r'
ORDER BY c.relname;

-- ============================================================================
-- Detailed Function List
-- ============================================================================
SELECT 
  proname as function_name
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
ORDER BY proname;
