-- ============================================================================
-- SEED DATA FOR SUBSCRIPTION PLANS
-- Production-ready subscription plans for multi-tenant restaurant SaaS
-- ============================================================================

-- Insert default subscription plans
INSERT INTO public.subscription_plans (
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
-- Starter Plan
(
  'Starter',
  'starter',
  'Perfect for small restaurants and cafes getting started',
  29.99,
  299.99,
  'USD',
  '{
    "users": 3,
    "branches": 1,
    "products": 100,
    "orders_per_month": 500,
    "storage_gb": 1,
    "reports": "basic",
    "kitchen_display": false,
    "qr_menu": true,
    "reservations": false,
    "crm": false,
    "analytics": "basic",
    "payroll": false,
    "ai_assistant": false
  }'::jsonb,
  '{
    "pos": true,
    "menu_management": true,
    "inventory_tracking": true,
    "basic_reports": true,
    "qr_menu": true,
    "customer_management": true,
    "payment_processing": true,
    "email_support": true
  }'::jsonb,
  true,
  true,
  14,
  1
),

-- Professional Plan
(
  'Professional',
  'professional',
  'Ideal for growing restaurants with multiple locations',
  99.99,
  999.99,
  'USD',
  '{
    "users": 10,
    "branches": 3,
    "products": 500,
    "orders_per_month": 2000,
    "storage_gb": 5,
    "reports": "advanced",
    "kitchen_display": true,
    "qr_menu": true,
    "reservations": true,
    "crm": true,
    "analytics": "advanced",
    "payroll": false,
    "ai_assistant": false
  }'::jsonb,
  '{
    "pos": true,
    "menu_management": true,
    "inventory_tracking": true,
    "advanced_reports": true,
    "qr_menu": true,
    "customer_management": true,
    "payment_processing": true,
    "kitchen_display_system": true,
    "table_management": true,
    "reservations": true,
    "crm": true,
    "loyalty_program": true,
    "multi_branch": true,
    "priority_support": true,
    "phone_support": true
  }'::jsonb,
  true,
  true,
  14,
  2
),

-- Business Plan
(
  'Business',
  'business',
  'For restaurant chains and large establishments',
  249.99,
  2499.99,
  'USD',
  '{
    "users": 25,
    "branches": 10,
    "products": 2000,
    "orders_per_month": 10000,
    "storage_gb": 20,
    "reports": "enterprise",
    "kitchen_display": true,
    "qr_menu": true,
    "reservations": true,
    "crm": true,
    "analytics": "enterprise",
    "payroll": true,
    "ai_assistant": false
  }'::jsonb,
  '{
    "pos": true,
    "menu_management": true,
    "inventory_tracking": true,
    "enterprise_reports": true,
    "qr_menu": true,
    "customer_management": true,
    "payment_processing": true,
    "kitchen_display_system": true,
    "table_management": true,
    "reservations": true,
    "crm": true,
    "loyalty_program": true,
    "multi_branch": true,
    "payroll_management": true,
    "employee_management": true,
    "advanced_analytics": true,
    "api_access": true,
    "custom_integrations": true,
    "24_7_support": true,
    "dedicated_account_manager": true
  }'::jsonb,
  true,
  true,
  14,
  3
),

-- Enterprise Plan
(
  'Enterprise',
  'enterprise',
  'Complete solution for large restaurant groups and franchises',
  499.99,
  4999.99,
  'USD',
  '{
    "users": 100,
    "branches": 50,
    "products": 10000,
    "orders_per_month": 50000,
    "storage_gb": 100,
    "reports": "enterprise",
    "kitchen_display": true,
    "qr_menu": true,
    "reservations": true,
    "crm": true,
    "analytics": "enterprise",
    "payroll": true,
    "ai_assistant": true
  }'::jsonb,
  '{
    "pos": true,
    "menu_management": true,
    "inventory_tracking": true,
    "enterprise_reports": true,
    "qr_menu": true,
    "customer_management": true,
    "payment_processing": true,
    "kitchen_display_system": true,
    "table_management": true,
    "reservations": true,
    "crm": true,
    "loyalty_program": true,
    "multi_branch": true,
    "payroll_management": true,
    "employee_management": true,
    "advanced_analytics": true,
    "ai_assistant": true,
    "predictive_analytics": true,
    "api_access": true,
    "custom_integrations": true,
    "white_label": true,
    "custom_domain": true,
    "sso": true,
    "24_7_support": true,
    "dedicated_account_manager": true,
    "onsite_training": true,
    "sla_guarantee": true
  }'::jsonb,
  true,
  true,
  14,
  4
),

-- Custom Plan
(
  'Custom',
  'custom',
  'Tailored solution for your specific business needs',
  NULL,
  NULL,
  'USD',
  '{
    "users": null,
    "branches": null,
    "products": null,
    "orders_per_month": null,
    "storage_gb": null,
    "reports": "custom",
    "kitchen_display": true,
    "qr_menu": true,
    "reservations": true,
    "crm": true,
    "analytics": "custom",
    "payroll": true,
    "ai_assistant": true
  }'::jsonb,
  '{
    "pos": true,
    "menu_management": true,
    "inventory_tracking": true,
    "custom_reports": true,
    "qr_menu": true,
    "customer_management": true,
    "payment_processing": true,
    "kitchen_display_system": true,
    "table_management": true,
    "reservations": true,
    "crm": true,
    "loyalty_program": true,
    "multi_branch": true,
    "payroll_management": true,
    "employee_management": true,
    "custom_analytics": true,
    "ai_assistant": true,
    "predictive_analytics": true,
    "api_access": true,
    "custom_integrations": true,
    "white_label": true,
    "custom_domain": true,
    "sso": true,
    "24_7_support": true,
    "dedicated_account_manager": true,
    "onsite_training": true,
    "sla_guarantee": true,
    "custom_development": true
  }'::jsonb,
  true,
  false,
  30,
  5
)
ON CONFLICT (slug) DO NOTHING;

-- Initialize permissions
SELECT public.create_permissions();

-- ============================================================================
-- SYSTEM SETTINGS SEED DATA
-- ============================================================================
INSERT INTO public.system_settings (key, value, description, type, is_public) VALUES
('app_name', 'SomBill POS', 'Application name', 'string', true),
('app_version', '1.0.0', 'Application version', 'string', true),
('default_currency', 'USD', 'Default currency code', 'string', true),
('default_timezone', 'UTC', 'Default timezone', 'string', true),
('default_language', 'en', 'Default language', 'string', true),
('max_file_size', '10485760', 'Maximum file upload size in bytes (10MB)', 'number', false),
('allowed_file_types', '["jpg","jpeg","png","gif","pdf","doc","docx"]', 'Allowed file types for upload', 'json', false),
('session_timeout', '3600', 'Session timeout in seconds (1 hour)', 'number', false),
('max_login_attempts', '5', 'Maximum login attempts before lockout', 'number', false),
('lockout_duration', '900', 'Account lockout duration in seconds (15 minutes)', 'number', false),
('password_min_length', '8', 'Minimum password length', 'number', false),
('password_require_uppercase', 'true', 'Require uppercase in password', 'boolean', false),
('password_require_lowercase', 'true', 'Require lowercase in password', 'boolean', false),
('password_require_numbers', 'true', 'Require numbers in password', 'boolean', false),
('password_require_special', 'true', 'Require special characters in password', 'boolean', false),
('maintenance_mode', 'false', 'Maintenance mode flag', 'boolean', true),
('registration_enabled', 'false', 'Allow public registration', 'boolean', true),
('trial_days_default', '14', 'Default trial period in days', 'number', false),
('storage_limit_default', '1073741824', 'Default storage limit in bytes (1GB)', 'number', false)
ON CONFLICT (key) DO NOTHING;
