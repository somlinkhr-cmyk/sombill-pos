-- ============================================================================
-- 019: Demo Users - Restaurant Assignments (Development Only)
-- ============================================================================
-- Create restaurant user assignments for demo users
-- This migration only runs in development
-- 
-- NOTE: This migration assumes profiles exist. Profiles are auto-created
-- when auth users are created via the Supabase Admin API script.
-- Run the create-demo-auth-users.ts script before this migration.
--
-- Dependencies: 018_demo_restaurant.sql, 015_demo_roles.sql
-- Idempotent: Yes (uses INSERT ... ON CONFLICT DO NOTHING)
-- ============================================================================

-- ============================================================================
-- ENVIRONMENT CHECK
-- ============================================================================
-- Only run this migration in development
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.tenants WHERE slug = 'demo-restaurant-group') THEN
    RAISE NOTICE 'Skipping demo users - demo tenant does not exist (production)';
  ELSE
    RAISE NOTICE 'Creating demo user assignments for development environment';
  END IF;
END $$;

-- ============================================================================
-- RESTAURANT USER ASSIGNMENTS
-- ============================================================================
-- These assignments link existing profiles to the demo restaurant with roles
-- Profiles are looked up by email (created via Admin API script)

-- Owner assignment
INSERT INTO public.restaurant_users (id, restaurant_id, profile_id, role_id, status, is_owner)
SELECT 
  gen_random_uuid(),
  r.id,
  p.id,
  role.id,
  'active',
  true
FROM public.restaurants r
JOIN public.tenants t ON r.tenant_id = t.id
JOIN public.profiles p ON p.email = 'owner@demo.sombill.com'
JOIN public.roles role ON role.slug = 'owner' AND role.tenant_id = t.id
WHERE t.slug = 'demo-restaurant-group'
AND r.slug = 'demo-restaurant'
ON CONFLICT (restaurant_id, profile_id) DO NOTHING;

-- Manager assignment
INSERT INTO public.restaurant_users (id, restaurant_id, profile_id, role_id, status, is_owner)
SELECT 
  gen_random_uuid(),
  r.id,
  p.id,
  role.id,
  'active',
  false
FROM public.restaurants r
JOIN public.tenants t ON r.tenant_id = t.id
JOIN public.profiles p ON p.email = 'manager@demo.sombill.com'
JOIN public.roles role ON role.slug = 'manager' AND role.tenant_id = t.id
WHERE t.slug = 'demo-restaurant-group'
AND r.slug = 'demo-restaurant'
ON CONFLICT (restaurant_id, profile_id) DO NOTHING;

-- Cashier assignment
INSERT INTO public.restaurant_users (id, restaurant_id, profile_id, role_id, status, is_owner)
SELECT 
  gen_random_uuid(),
  r.id,
  p.id,
  role.id,
  'active',
  false
FROM public.restaurants r
JOIN public.tenants t ON r.tenant_id = t.id
JOIN public.profiles p ON p.email = 'cashier@demo.sombill.com'
JOIN public.roles role ON role.slug = 'cashier' AND role.tenant_id = t.id
WHERE t.slug = 'demo-restaurant-group'
AND r.slug = 'demo-restaurant'
ON CONFLICT (restaurant_id, profile_id) DO NOTHING;

-- Waiter assignment
INSERT INTO public.restaurant_users (id, restaurant_id, profile_id, role_id, status, is_owner)
SELECT 
  gen_random_uuid(),
  r.id,
  p.id,
  role.id,
  'active',
  false
FROM public.restaurants r
JOIN public.tenants t ON r.tenant_id = t.id
JOIN public.profiles p ON p.email = 'waiter@demo.sombill.com'
JOIN public.roles role ON role.slug = 'waiter' AND role.tenant_id = t.id
WHERE t.slug = 'demo-restaurant-group'
AND r.slug = 'demo-restaurant'
ON CONFLICT (restaurant_id, profile_id) DO NOTHING;

-- Kitchen assignment
INSERT INTO public.restaurant_users (id, restaurant_id, profile_id, role_id, status, is_owner)
SELECT 
  gen_random_uuid(),
  r.id,
  p.id,
  role.id,
  'active',
  false
FROM public.restaurants r
JOIN public.tenants t ON r.tenant_id = t.id
JOIN public.profiles p ON p.email = 'kitchen@demo.sombill.com'
JOIN public.roles role ON role.slug = 'kitchen' AND role.tenant_id = t.id
WHERE t.slug = 'demo-restaurant-group'
AND r.slug = 'demo-restaurant'
ON CONFLICT (restaurant_id, profile_id) DO NOTHING;

-- Inventory assignment
INSERT INTO public.restaurant_users (id, restaurant_id, profile_id, role_id, status, is_owner)
SELECT 
  gen_random_uuid(),
  r.id,
  p.id,
  role.id,
  'active',
  false
FROM public.restaurants r
JOIN public.tenants t ON r.tenant_id = t.id
JOIN public.profiles p ON p.email = 'inventory@demo.sombill.com'
JOIN public.roles role ON role.slug = 'inventory' AND role.tenant_id = t.id
WHERE t.slug = 'demo-restaurant-group'
AND r.slug = 'demo-restaurant'
ON CONFLICT (restaurant_id, profile_id) DO NOTHING;

-- Accountant assignment
INSERT INTO public.restaurant_users (id, restaurant_id, profile_id, role_id, status, is_owner)
SELECT 
  gen_random_uuid(),
  r.id,
  p.id,
  role.id,
  'active',
  false
FROM public.restaurants r
JOIN public.tenants t ON r.tenant_id = t.id
JOIN public.profiles p ON p.email = 'accountant@demo.sombill.com'
JOIN public.roles role ON role.slug = 'accountant' AND role.tenant_id = t.id
WHERE t.slug = 'demo-restaurant-group'
AND r.slug = 'demo-restaurant'
ON CONFLICT (restaurant_id, profile_id) DO NOTHING;

-- ============================================================================
-- Verification
-- ============================================================================
SELECT 
  'Demo restaurant user assignments created successfully' as status,
  (SELECT COUNT(*) FROM public.restaurant_users) as restaurant_user_count;
