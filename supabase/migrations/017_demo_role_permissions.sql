-- ============================================================================
-- 017: Demo Role Permissions (Development Only)
-- ============================================================================
-- Assign permissions to demo roles
-- This migration only runs in development
--
-- Dependencies: 015_demo_roles.sql, 007_permissions.sql
-- Idempotent: Yes (uses INSERT ... ON CONFLICT DO NOTHING)
-- ============================================================================

-- ============================================================================
-- ENVIRONMENT CHECK
-- ============================================================================
-- Only run this migration in development
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.tenants WHERE slug = 'demo-restaurant-group') THEN
    RAISE NOTICE 'Skipping demo role permissions - demo tenant does not exist (production)';
  ELSE
    RAISE NOTICE 'Creating demo role permissions for development environment';
  END IF;
END $$;

-- ============================================================================
-- OWNER - All tenant-level permissions (except tenant management)
-- ============================================================================
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
  r.id,
  p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.slug = 'owner'
AND r.tenant_id IS NOT NULL
AND p.slug NOT IN (
  'tenants.view',
  'tenants.create',
  'tenants.update',
  'tenants.delete'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================================================
-- MANAGER - Most operational permissions
-- ============================================================================
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
  r.id,
  p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.slug = 'manager'
AND r.tenant_id IS NOT NULL
AND p.slug IN (
  -- Restaurant Management
  'restaurants.view',
  'restaurants.update',
  -- Branch Management
  'branches.view',
  'branches.create',
  'branches.update',
  -- User Management
  'users.view',
  'users.create',
  'users.update',
  -- Role Management
  'roles.view',
  -- Subscription Management
  'subscriptions.view',
  -- Settings Management
  'settings.view',
  'settings.update',
  -- Reports
  'reports.view',
  'reports.export'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================================================
-- ACCOUNTANT - Financial and reporting permissions
-- ============================================================================
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
  r.id,
  p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.slug = 'accountant'
AND r.tenant_id IS NOT NULL
AND p.slug IN (
  -- Restaurant Management
  'restaurants.view',
  -- Settings Management
  'settings.view',
  -- Reports
  'reports.view',
  'reports.export'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================================================
-- INVENTORY - Inventory management permissions
-- ============================================================================
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
  r.id,
  p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.slug = 'inventory'
AND r.tenant_id IS NOT NULL
AND p.slug IN (
  -- Restaurant Management
  'restaurants.view',
  -- Settings Management
  'settings.view',
  'settings.update',
  -- Reports
  'reports.view'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================================================
-- CASHIER - POS and transaction permissions
-- ============================================================================
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
  r.id,
  p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.slug = 'cashier'
AND r.tenant_id IS NOT NULL
AND p.slug IN (
  -- Restaurant Management
  'restaurants.view',
  -- Settings Management
  'settings.view',
  -- Reports
  'reports.view'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================================================
-- WAITER - Order taking and customer service permissions
-- ============================================================================
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
  r.id,
  p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.slug = 'waiter'
AND r.tenant_id IS NOT NULL
AND p.slug IN (
  -- Restaurant Management
  'restaurants.view',
  -- Settings Management
  'settings.view',
  -- Reports
  'reports.view'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================================================
-- KITCHEN - Order preparation permissions
-- ============================================================================
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
  r.id,
  p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.slug = 'kitchen'
AND r.tenant_id IS NOT NULL
AND p.slug IN (
  -- Restaurant Management
  'restaurants.view',
  -- Settings Management
  'settings.view',
  -- Reports
  'reports.view'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================================================
-- Verification
-- ============================================================================
-- Show permission count per role
SELECT 
  r.name as role_name,
  r.slug as role_slug,
  COUNT(rp.permission_id) as permission_count
FROM public.roles r
LEFT JOIN public.role_permissions rp ON r.id = rp.role_id
WHERE r.tenant_id IS NOT NULL
GROUP BY r.id, r.name, r.slug
ORDER BY r.level DESC;
