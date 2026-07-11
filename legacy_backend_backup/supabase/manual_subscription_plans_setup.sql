-- ============================================================================
-- MANUAL SETUP: Subscription Plans Table
-- ============================================================================
-- Run this in Supabase SQL Editor to create the subscription_plans table
-- and insert seed data if migrations haven't been applied.
-- ============================================================================

-- Create subscription_plans table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  monthly_price DECIMAL(10, 2) DEFAULT 0,
  yearly_price DECIMAL(10, 2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  limits JSONB DEFAULT '{}',
  features JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_public BOOLEAN NOT NULL DEFAULT true,
  trial_days INTEGER DEFAULT 14,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert seed data
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

-- Enable RLS on subscription_plans table
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS subscription_plans_select_public ON public.subscription_plans;
CREATE POLICY subscription_plans_select_public ON public.subscription_plans
  FOR SELECT
  USING (is_public = true);

DROP POLICY IF EXISTS subscription_plans_select_all ON public.subscription_plans;
CREATE POLICY subscription_plans_select_all ON public.subscription_plans
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS subscription_plans_super_admin ON public.subscription_plans;
CREATE POLICY subscription_plans_super_admin ON public.subscription_plans
  FOR ALL
  USING (true);

-- Verification
SELECT 
  COUNT(*) as subscription_plans_count,
  'Subscription plans created successfully' as status
FROM public.subscription_plans;
