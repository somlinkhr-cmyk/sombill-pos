-- ============================================================================
-- 007: Functions
-- ============================================================================
-- Helper functions for RLS, data operations, and business logic
--
-- Dependencies: 001_initial_schema.sql, 002_profiles_roles_permissions.sql
-- Idempotent: Yes (uses CREATE OR REPLACE FUNCTION)
-- ============================================================================

-- ============================================================================
-- RLS Helper Functions
-- ============================================================================

-- Check if current user is a super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND is_super_admin = true
  );
END;
$$;

-- Get current user's tenant ID
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT tenant_id FROM public.profiles
    WHERE id = auth.uid()
  );
END;
$$;

-- Get current user's restaurant ID
CREATE OR REPLACE FUNCTION public.get_user_restaurant_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT restaurant_id FROM public.restaurant_users
    WHERE profile_id = auth.uid()
    AND status = 'active'
    LIMIT 1
  );
END;
$$;

-- Check if user has specific permission
CREATE OR REPLACE FUNCTION public.has_permission(permission_slug TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role_id UUID;
BEGIN
  -- Get user's role
  SELECT role_id INTO user_role_id
  FROM public.restaurant_users
  WHERE profile_id = auth.uid()
  AND status = 'active'
  LIMIT 1;
  
  -- Check if role has permission
  RETURN EXISTS (
    SELECT 1 FROM public.role_permissions rp
    JOIN public.permissions p ON p.id = rp.permission_id
    WHERE rp.role_id = user_role_id
    AND p.slug = permission_slug
  );
END;
$$;

-- ============================================================================
-- Business Logic Functions
-- ============================================================================

-- Create a new tenant
CREATE OR REPLACE FUNCTION public.create_tenant(
  p_name TEXT,
  p_slug TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  INSERT INTO public.tenants (name, slug)
  VALUES (p_name, p_slug)
  RETURNING id INTO v_tenant_id;
  
  RETURN v_tenant_id;
END;
$$;

-- Create a new restaurant
CREATE OR REPLACE FUNCTION public.create_restaurant(
  p_tenant_id UUID,
  p_name TEXT,
  p_slug TEXT,
  p_description TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_restaurant_id UUID;
BEGIN
  INSERT INTO public.restaurants (tenant_id, name, slug, description)
  VALUES (p_tenant_id, p_name, p_slug, p_description)
  RETURNING id INTO v_restaurant_id;
  
  RETURN v_restaurant_id;
END;
$$;

-- Create a new subscription
CREATE OR REPLACE FUNCTION public.create_subscription(
  p_tenant_id UUID,
  p_plan_id UUID,
  p_billing_cycle TEXT DEFAULT 'monthly'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_subscription_id UUID;
  v_plan RECORD;
  v_trial_end TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get plan details
  SELECT * INTO v_plan
  FROM public.subscription_plans
  WHERE id = p_plan_id;
  
  -- Calculate trial end date
  IF v_plan.trial_days > 0 THEN
    v_trial_end := NOW() + (v_plan.trial_days || ' days')::INTERVAL;
  END IF;
  
  -- Create subscription
  INSERT INTO public.subscriptions (
    tenant_id,
    plan_id,
    billing_cycle,
    trial_end,
    current_period_end
  )
  VALUES (
    p_tenant_id,
    p_plan_id,
    p_billing_cycle,
    v_trial_end,
    COALESCE(v_trial_end, NOW() + INTERVAL '1 month')
  )
  RETURNING id INTO v_subscription_id;
  
  RETURN v_subscription_id;
END;
$$;

-- ============================================================================
-- Verification
-- ============================================================================
-- Verify functions were created
SELECT 
  'Functions created successfully' as status,
  COUNT(*) as function_count
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
AND proname IN (
  'is_super_admin',
  'get_user_tenant_id',
  'get_user_restaurant_id',
  'has_permission',
  'create_tenant',
  'create_restaurant',
  'create_subscription'
);
