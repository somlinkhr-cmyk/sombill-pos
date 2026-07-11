-- ============================================================================
-- 018: Demo Restaurant and Subscription (Development Only)
-- ============================================================================
-- Create demo restaurant with valid subscription for demo tenant
-- This migration only runs in development
--
-- Dependencies: 015_demo_roles.sql, 008_subscriptions.sql
-- Idempotent: Yes (uses INSERT ... ON CONFLICT DO NOTHING)
-- ============================================================================

-- ============================================================================
-- ENVIRONMENT CHECK
-- ============================================================================
-- Only run this migration in development
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.tenants WHERE slug = 'demo-restaurant-group') THEN
    RAISE NOTICE 'Skipping demo restaurant - demo tenant does not exist (production)';
  ELSE
    RAISE NOTICE 'Creating demo restaurant for development environment';
  END IF;
END $$;

-- ============================================================================
-- DEMO RESTAURANT
-- ============================================================================
INSERT INTO public.restaurants (id, tenant_id, name, slug, description, phone, email, address, city, state, country, postal_code, timezone, currency, status)
SELECT 
  gen_random_uuid(),
  t.id,
  'Demo Restaurant',
  'demo-restaurant',
  'A demo restaurant for testing and development purposes',
  '+1-555-0100',
  'demo@restaurant.com',
  '123 Main Street',
  'Demo City',
  'CA',
  'US',
  '90210',
  'America/Los_Angeles',
  'USD',
  'active'
FROM public.tenants t
WHERE t.slug = 'demo-restaurant-group'
ON CONFLICT (tenant_id, slug) DO NOTHING;

-- ============================================================================
-- DEMO RESTAURANT MAIN BRANCH
-- ============================================================================
INSERT INTO public.restaurant_branches (id, restaurant_id, name, slug, address, city, state, country, postal_code, phone, email, is_main_branch, status)
SELECT 
  gen_random_uuid(),
  r.id,
  'Main Branch',
  'main-branch',
  r.address,
  r.city,
  r.state,
  r.country,
  r.postal_code,
  r.phone,
  r.email,
  true,
  'active'
FROM public.restaurants r
JOIN public.tenants t ON r.tenant_id = t.id
WHERE t.slug = 'demo-restaurant-group'
AND r.slug = 'demo-restaurant'
ON CONFLICT (restaurant_id, slug) DO NOTHING;

-- ============================================================================
-- DEMO SUBSCRIPTION (Professional Plan)
-- ============================================================================
INSERT INTO public.subscriptions (
  id,
  tenant_id,
  plan_id,
  status,
  billing_cycle,
  current_period_start,
  current_period_end,
  trial_end,
  cancel_at_period_end,
  metadata
)
SELECT 
  gen_random_uuid(),
  t.id,
  sp.id,
  'active',
  'monthly',
  NOW(),
  NOW() + INTERVAL '1 month',
  NULL,
  false,
  '{"demo": true}'::jsonb
FROM public.tenants t
JOIN public.subscription_plans sp ON sp.slug = 'professional'
WHERE t.slug = 'demo-restaurant-group'
ON CONFLICT (tenant_id) DO NOTHING;

-- ============================================================================
-- RESTAURANT SETTINGS (Demo Configuration)
-- ============================================================================
INSERT INTO public.restaurant_settings (id, restaurant_id, key, value, description)
SELECT 
  gen_random_uuid(),
  r.id,
  'business_hours',
  '{"monday": {"open": "09:00", "close": "22:00"}, "tuesday": {"open": "09:00", "close": "22:00"}, "wednesday": {"open": "09:00", "close": "22:00"}, "thursday": {"open": "09:00", "close": "22:00"}, "friday": {"open": "09:00", "close": "23:00"}, "saturday": {"open": "10:00", "close": "23:00"}, "sunday": {"open": "10:00", "close": "21:00"}}'::jsonb,
  'Business operating hours'
FROM public.restaurants r
JOIN public.tenants t ON r.tenant_id = t.id
WHERE t.slug = 'demo-restaurant-group'
AND r.slug = 'demo-restaurant'
ON CONFLICT (restaurant_id, key) DO NOTHING;

INSERT INTO public.restaurant_settings (id, restaurant_id, key, value, description)
SELECT 
  gen_random_uuid(),
  r.id,
  'tax_rate',
  '0.0875',
  'Default tax rate (8.75%)'
FROM public.restaurants r
JOIN public.tenants t ON r.tenant_id = t.id
WHERE t.slug = 'demo-restaurant-group'
AND r.slug = 'demo-restaurant'
ON CONFLICT (restaurant_id, key) DO NOTHING;

INSERT INTO public.restaurant_settings (id, restaurant_id, key, value, description)
SELECT 
  gen_random_uuid(),
  r.id,
  'service_charge',
  '0.00',
  'Default service charge rate'
FROM public.restaurants r
JOIN public.tenants t ON r.tenant_id = t.id
WHERE t.slug = 'demo-restaurant-group'
AND r.slug = 'demo-restaurant'
ON CONFLICT (restaurant_id, key) DO NOTHING;

-- ============================================================================
-- TENANT SETTINGS (Demo Configuration)
-- ============================================================================
INSERT INTO public.tenant_settings (id, tenant_id, key, value, description, is_public)
SELECT 
  gen_random_uuid(),
  t.id,
  'default_currency',
  'USD',
  'Default currency for the tenant',
  true
FROM public.tenants t
WHERE t.slug = 'demo-restaurant-group'
ON CONFLICT (tenant_id, key) DO NOTHING;

INSERT INTO public.tenant_settings (id, tenant_id, key, value, description, is_public)
SELECT 
  gen_random_uuid(),
  t.id,
  'default_timezone',
  'America/Los_Angeles',
  'Default timezone for the tenant',
  true
FROM public.tenants t
WHERE t.slug = 'demo-restaurant-group'
ON CONFLICT (tenant_id, key) DO NOTHING;

-- ============================================================================
-- Verification
-- ============================================================================
SELECT 
  'Demo restaurant and subscription created successfully' as status,
  (SELECT COUNT(*) FROM public.restaurants WHERE slug = 'demo-restaurant') as restaurant_count,
  (SELECT COUNT(*) FROM public.subscriptions WHERE metadata->>'demo' = 'true') as subscription_count;
