-- Create Super Admin user
-- This migration creates the initial super admin account
-- Works with existing single-tenant schema

-- Note: The auth user should be created first via Supabase Auth
-- Go to Authentication → Users and create user with:
-- Email: superadmin@gmail.com
-- Password: 1166
-- Auto-confirm: checked

-- After creating the auth user, run this SQL to create the public user record:
-- Replace the UUID with the actual auth user UUID
INSERT INTO users (id, email, name, phone, role, salary, shift, is_super_admin, is_active, created_at, updated_at)
VALUES (
  'ecd9ff59-3366-40b3-bcb0-dac7e61bef2a',
  'superadmin@gmail.com',
  'Super Admin',
  '',
  'manager',
  0,
  'morning',
  true,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  is_super_admin = true,
  is_active = true,
  updated_at = NOW();

-- =====================================================
-- INSERT DEFAULT SUBSCRIPTION PLANS
-- =====================================================
INSERT INTO sa_subscription_plans (name, slug, description, monthly_price, yearly_price, currency, limits, features, is_active) VALUES
('Starter', 'starter', 'Perfect for small restaurants', 29.99, 299.99, 'USD',
 '{"monthly_orders": 1000, "tables": 10, "staff": 5, "menu_items": 100, "branches": 1, "free_trial_days": 14}'::jsonb,
 '{"waiter_dashboard": true, "kitchen_display": true, "nfc_menu": true, "advanced_reports": false, "multi_location": false, "api_access": false}'::jsonb, true),
('Professional', 'professional', 'For growing restaurants', 79.99, 799.99, 'USD',
 '{"monthly_orders": 5000, "tables": 50, "staff": 20, "menu_items": 500, "branches": 3, "free_trial_days": 14}'::jsonb,
 '{"waiter_dashboard": true, "kitchen_display": true, "nfc_menu": true, "advanced_reports": true, "multi_location": false, "api_access": true}'::jsonb, true),
('Enterprise', 'enterprise', 'Full-featured for large chains', 199.99, 1999.99, 'USD',
 '{"monthly_orders": 10000, "tables": 100, "staff": 50, "menu_items": 2000, "branches": 10, "free_trial_days": 30}'::jsonb,
 '{"waiter_dashboard": true, "kitchen_display": true, "nfc_menu": true, "advanced_reports": true, "multi_location": true, "api_access": true}'::jsonb, true)
ON CONFLICT (slug) DO NOTHING;
