-- ============================================================================
-- 011: Seed Data
-- ============================================================================
-- This migration inserts initial seed data for the database.
--
-- Dependencies: 003_tables.sql, 006_functions.sql (create_permissions function)
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
    '00000000-0000-0000-0000-000000000001',
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
    '00000000-0000-0000-0000-000000000002',
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
    '00000000-0000-0000-0000-000000000003',
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
    '00000000-0000-0000-0000-000000000004',
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
-- SYSTEM SETTINGS
-- ============================================================================
INSERT INTO public.system_settings (key, value, description, type, is_public) VALUES
  ('app_name', 'SomBill POS', 'Application name', 'string', true),
  ('app_version', '1.0.0', 'Application version', 'string', true),
  ('default_currency', 'USD', 'Default currency code', 'string', true),
  ('default_timezone', 'UTC', 'Default timezone', 'string', true),
  ('default_language', 'en', 'Default language code', 'string', true),
  ('maintenance_mode', 'false', 'Maintenance mode flag', 'boolean', true),
  ('registration_enabled', 'true', 'Allow new user registration', 'boolean', true),
  ('trial_days', '14', 'Default trial period in days', 'number', false),
  ('max_file_size_mb', '10', 'Maximum file upload size in MB', 'number', false),
  ('session_timeout_minutes', '60', 'User session timeout in minutes', 'number', false)
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- PERMISSIONS
-- ============================================================================
-- Call the create_permissions function to seed permissions
SELECT public.create_permissions();

-- ============================================================================
-- Verification
-- ============================================================================
-- Verify subscription plans
SELECT 
  COUNT(*) as subscription_plans_count,
  'Subscription plans seeded successfully' as status
FROM public.subscription_plans;

-- Verify system settings
SELECT 
  COUNT(*) as system_settings_count,
  'System settings seeded successfully' as status
FROM public.system_settings;

-- Verify permissions
SELECT 
  COUNT(*) as permissions_count,
  'Permissions seeded successfully' as status
FROM public.permissions;
