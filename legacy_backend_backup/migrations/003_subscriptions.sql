-- ============================================================================
-- 003: Subscriptions
-- ============================================================================
-- Subscription plans and tenant subscriptions for SaaS billing
--
-- Dependencies: 001_initial_schema.sql
-- Idempotent: Yes (uses CREATE TABLE IF NOT EXISTS)
-- ============================================================================

-- ============================================================================
-- SUBSCRIPTION_PLANS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- ============================================================================
-- SUBSCRIPTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'trialing' CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'suspended')),
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  current_period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  current_period_end TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  canceled_at TIMESTAMP WITH TIME ZONE,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id)
);

-- ============================================================================
-- Verification
-- ============================================================================
-- Verify tables were created
SELECT 
  'subscription_plans' as table_name,
  COUNT(*) as row_count
FROM public.subscription_plans
UNION ALL
SELECT 
  'subscriptions' as table_name,
  COUNT(*) as row_count
FROM public.subscriptions;
