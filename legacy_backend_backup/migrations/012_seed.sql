-- ============================================================================
-- 012: Seed Data
-- ============================================================================
-- Initial seed data for subscription plans, permissions, and system settings
--
-- Dependencies: All previous migrations
-- Idempotent: Yes (uses INSERT ... ON CONFLICT DO NOTHING)
-- ============================================================================

-- ============================================================================
-- SUBSCRIPTION PLANS
-- ============================================================================
INSERT INTO public.subscription_plans (
  id,
  name,
  slug,
  description,
  monthly_price,
  yearly_price,
  currency,
  limits,
  features,
  is_active,
  is_public,
  trial_days,
  sort_order
) VALUES
  (
    gen_random_uuid(),
    'Starter',
    'starter',
    'Perfect for small restaurants getting started',
    0,
    0,
    'USD',
    '{"branches": 1, "users": 5, "tables": 20, "products": 100, "storage_mb": 1000}',
    '{"pos": true, "inventory": true, "reports": true, "multi_branch": false, "api_access": false}',
    true,
    true,
    14,
    1
  ),
  (
    gen_random_uuid(),
    'Professional',
    'professional',
    'For growing restaurants with multiple branches',
    49,
    490,
    'USD',
    '{"branches": 5, "users": 25, "tables": 100, "products": 500, "storage_mb": 5000}',
    '{"pos": true, "inventory": true, "reports": true, "multi_branch": true, "api_access": true}',
    true,
    true,
    14,
    2
  ),
  (
    gen_random_uuid(),
    'Business',
    'business',
    'For restaurant chains with advanced needs',
    149,
    1490,
    'USD',
    '{"branches": 20, "users": 100, "tables": 500, "products": 2000, "storage_mb": 20000}',
    '{"pos": true, "inventory": true, "reports": true, "multi_branch": true, "api_access": true, "analytics": true}',
    true,
    true,
    14,
    3
  ),
  (
    gen_random_uuid(),
    'Enterprise',
    'enterprise',
    'Custom solution for large restaurant groups',
    499,
    4990,
    'USD',
    '{"branches": -1, "users": -1, "tables": -1, "products": -1, "storage_mb": -1}',
    '{"pos": true, "inventory": true, "reports": true, "multi_branch": true, "api_access": true, "analytics": true, "custom_integrations": true}',
    true,
    true,
    30,
    4
  )
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- PERMISSIONS
-- ============================================================================
INSERT INTO public.permissions (id, name, slug, description, resource, action) VALUES
  -- Tenant Management
  (gen_random_uuid(), 'View Tenants', 'tenants.view', 'View tenant information', 'tenants', 'view'),
  (gen_random_uuid(), 'Create Tenants', 'tenants.create', 'Create new tenants', 'tenants', 'create'),
  (gen_random_uuid(), 'Update Tenants', 'tenants.update', 'Update tenant information', 'tenants', 'update'),
  (gen_random_uuid(), 'Delete Tenants', 'tenants.delete', 'Delete tenants', 'tenants', 'delete'),
  
  -- Restaurant Management
  (gen_random_uuid(), 'View Restaurants', 'restaurants.view', 'View restaurant information', 'restaurants', 'view'),
  (gen_random_uuid(), 'Create Restaurants', 'restaurants.create', 'Create new restaurants', 'restaurants', 'create'),
  (gen_random_uuid(), 'Update Restaurants', 'restaurants.update', 'Update restaurant information', 'restaurants', 'update'),
  (gen_random_uuid(), 'Delete Restaurants', 'restaurants.delete', 'Delete restaurants', 'restaurants', 'delete'),
  
  -- Branch Management
  (gen_random_uuid(), 'View Branches', 'branches.view', 'View branch information', 'branches', 'view'),
  (gen_random_uuid(), 'Create Branches', 'branches.create', 'Create new branches', 'branches', 'create'),
  (gen_random_uuid(), 'Update Branches', 'branches.update', 'Update branch information', 'branches', 'update'),
  (gen_random_uuid(), 'Delete Branches', 'branches.delete', 'Delete branches', 'branches', 'delete'),
  
  -- User Management
  (gen_random_uuid(), 'View Users', 'users.view', 'View user information', 'users', 'view'),
  (gen_random_uuid(), 'Create Users', 'users.create', 'Create new users', 'users', 'create'),
  (gen_random_uuid(), 'Update Users', 'users.update', 'Update user information', 'users', 'update'),
  (gen_random_uuid(), 'Delete Users', 'users.delete', 'Delete users', 'users', 'delete'),
  
  -- Role Management
  (gen_random_uuid(), 'View Roles', 'roles.view', 'View role information', 'roles', 'view'),
  (gen_random_uuid(), 'Create Roles', 'roles.create', 'Create new roles', 'roles', 'create'),
  (gen_random_uuid(), 'Update Roles', 'roles.update', 'Update role information', 'roles', 'update'),
  (gen_random_uuid(), 'Delete Roles', 'roles.delete', 'Delete roles', 'roles', 'delete'),
  
  -- Subscription Management
  (gen_random_uuid(), 'View Subscriptions', 'subscriptions.view', 'View subscription information', 'subscriptions', 'view'),
  (gen_random_uuid(), 'Create Subscriptions', 'subscriptions.create', 'Create new subscriptions', 'subscriptions', 'create'),
  (gen_random_uuid(), 'Update Subscriptions', 'subscriptions.update', 'Update subscription information', 'subscriptions', 'update'),
  (gen_random_uuid(), 'Cancel Subscriptions', 'subscriptions.cancel', 'Cancel subscriptions', 'subscriptions', 'cancel'),
  
  -- Settings Management
  (gen_random_uuid(), 'View Settings', 'settings.view', 'View settings', 'settings', 'view'),
  (gen_random_uuid(), 'Update Settings', 'settings.update', 'Update settings', 'settings', 'update'),
  
  -- Reports
  (gen_random_uuid(), 'View Reports', 'reports.view', 'View reports', 'reports', 'view'),
  (gen_random_uuid(), 'Export Reports', 'reports.export', 'Export reports', 'reports', 'export'),
  
  -- Audit Logs
  (gen_random_uuid(), 'View Audit Logs', 'audit_logs.view', 'View audit logs', 'audit_logs', 'view')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- SYSTEM SETTINGS
-- ============================================================================
INSERT INTO public.system_settings (id, key, value, description, is_public) VALUES
  (gen_random_uuid(), 'app_name', '"SomBill POS"', 'Application name', true),
  (gen_random_uuid(), 'app_version', '"1.0.0"', 'Application version', true),
  (gen_random_uuid(), 'default_currency', '"USD"', 'Default currency code', true),
  (gen_random_uuid(), 'default_timezone', '"UTC"', 'Default timezone', true),
  (gen_random_uuid(), 'default_language', '"en"', 'Default language code', true),
  (gen_random_uuid(), 'maintenance_mode', 'false', 'Maintenance mode flag', true),
  (gen_random_uuid(), 'registration_enabled', 'true', 'Allow new user registration', true),
  (gen_random_uuid(), 'trial_days', '14', 'Default trial period in days', false),
  (gen_random_uuid(), 'max_file_size_mb', '10', 'Maximum file upload size in MB', false),
  (gen_random_uuid(), 'session_timeout_minutes', '60', 'User session timeout in minutes', false)
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- Verification
-- ============================================================================
-- Verify subscription plans
SELECT 
  COUNT(*) as subscription_plans_count,
  'Subscription plans seeded successfully' as status
FROM public.subscription_plans;

-- Verify permissions
SELECT 
  COUNT(*) as permissions_count,
  'Permissions seeded successfully' as status
FROM public.permissions;

-- Verify system settings
SELECT 
  COUNT(*) as system_settings_count,
  'System settings seeded successfully' as status
FROM public.system_settings;
