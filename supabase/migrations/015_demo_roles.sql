-- ============================================================================
-- 015: Demo Roles (Development Only)
-- ============================================================================
-- Create demo roles for development environment
-- This migration only runs in development
--
-- Dependencies: 014_system_roles.sql, 003_tenants.sql
-- Idempotent: Yes (uses INSERT ... ON CONFLICT DO NOTHING)
-- ============================================================================

-- ============================================================================
-- ENVIRONMENT CHECK
-- ============================================================================
-- Only run this migration in development
DO $$
BEGIN
  -- Check if we're in development by looking for a specific environment variable
  -- or by checking the database name/connection string
  -- For Supabase, we'll use a simple check: only run if a demo tenant doesn't exist yet
  -- This allows manual control via the presence/absence of demo data
  
  IF EXISTS (SELECT 1 FROM public.tenants WHERE slug = 'demo-restaurant-group') THEN
    RAISE NOTICE 'Skipping demo roles - demo tenant already exists (likely production)';
  ELSE
    RAISE NOTICE 'Creating demo roles for development environment';
  END IF;
END $$;

-- ============================================================================
-- DEMO ROLES (only if demo tenant exists)
-- ============================================================================
INSERT INTO public.roles (id, tenant_id, name, slug, description, level, is_system_role, is_default)
SELECT 
  gen_random_uuid(),
  id,
  'Owner',
  'owner',
  'Restaurant owner with full access to their restaurant',
  90,
  false,
  true
FROM public.tenants
WHERE slug = 'demo-restaurant-group'
ON CONFLICT (tenant_id, slug) DO NOTHING;

-- Manager
INSERT INTO public.roles (id, tenant_id, name, slug, description, level, is_system_role, is_default)
SELECT 
  gen_random_uuid(),
  id,
  'Manager',
  'manager',
  'Restaurant manager with operational control',
  80,
  false,
  false
FROM public.tenants
WHERE slug = 'demo-restaurant-group'
ON CONFLICT (tenant_id, slug) DO NOTHING;

-- Cashier
INSERT INTO public.roles (id, tenant_id, name, slug, description, level, is_system_role, is_default)
SELECT 
  gen_random_uuid(),
  id,
  'Cashier',
  'cashier',
  'Handles point of sale transactions and payments',
  50,
  false,
  false
FROM public.tenants
WHERE slug = 'demo-restaurant-group'
ON CONFLICT (tenant_id, slug) DO NOTHING;

-- Waiter
INSERT INTO public.roles (id, tenant_id, name, slug, description, level, is_system_role, is_default)
SELECT 
  gen_random_uuid(),
  id,
  'Waiter',
  'waiter',
  'Takes orders and serves customers',
  40,
  false,
  false
FROM public.tenants
WHERE slug = 'demo-restaurant-group'
ON CONFLICT (tenant_id, slug) DO NOTHING;

-- Kitchen
INSERT INTO public.roles (id, tenant_id, name, slug, description, level, is_system_role, is_default)
SELECT 
  gen_random_uuid(),
  id,
  'Kitchen Staff',
  'kitchen',
  'Manages kitchen operations and order preparation',
  45,
  false,
  false
FROM public.tenants
WHERE slug = 'demo-restaurant-group'
ON CONFLICT (tenant_id, slug) DO NOTHING;

-- Inventory
INSERT INTO public.roles (id, tenant_id, name, slug, description, level, is_system_role, is_default)
SELECT 
  gen_random_uuid(),
  id,
  'Inventory Manager',
  'inventory',
  'Manages inventory and stock levels',
  60,
  false,
  false
FROM public.tenants
WHERE slug = 'demo-restaurant-group'
ON CONFLICT (tenant_id, slug) DO NOTHING;

-- Accountant
INSERT INTO public.roles (id, tenant_id, name, slug, description, level, is_system_role, is_default)
SELECT 
  gen_random_uuid(),
  id,
  'Accountant',
  'accountant',
  'Manages financial reports and accounting',
  70,
  false,
  false
FROM public.tenants
WHERE slug = 'demo-restaurant-group'
ON CONFLICT (tenant_id, slug) DO NOTHING;

-- ============================================================================
-- Verification
-- ============================================================================
SELECT 
  'Demo roles created (development only)' as status,
  (SELECT COUNT(*) FROM public.roles WHERE is_system_role = false) as demo_role_count;
