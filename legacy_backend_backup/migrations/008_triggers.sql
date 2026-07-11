-- ============================================================================
-- 008: Triggers
-- ============================================================================
-- Automation triggers for updated_at timestamps and audit logging
--
-- Dependencies: 001_initial_schema.sql, 005_audit_logs.sql, 007_functions.sql
-- Idempotent: Yes (uses CREATE OR REPLACE FUNCTION and DROP TRIGGER IF EXISTS)
-- ============================================================================

-- ============================================================================
-- Updated At Trigger Function
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- Audit Log Trigger Function
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_audit_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id UUID;
  v_restaurant_id UUID;
  v_profile_id UUID;
BEGIN
  -- Get tenant and restaurant context from the record if available
  IF TG_TABLE_NAME = 'tenants' THEN
    v_tenant_id := NEW.id;
  ELSIF TG_TABLE_NAME = 'restaurants' THEN
    v_tenant_id := NEW.tenant_id;
    v_restaurant_id := NEW.id;
  ELSIF TG_TABLE_NAME = 'restaurant_branches' THEN
    v_restaurant_id := NEW.restaurant_id;
  ELSIF TG_TABLE_NAME = 'profiles' THEN
    v_tenant_id := NEW.tenant_id;
  ELSIF TG_TABLE_NAME = 'restaurant_users' THEN
    v_restaurant_id := NEW.restaurant_id;
    v_profile_id := NEW.profile_id;
  END IF;
  
  -- Get current user profile
  SELECT id INTO v_profile_id FROM public.profiles WHERE id = auth.uid();
  
  -- Insert audit log
  INSERT INTO public.audit_logs (
    tenant_id,
    restaurant_id,
    profile_id,
    table_name,
    record_id,
    action,
    old_values,
    new_values
  ) VALUES (
    v_tenant_id,
    v_restaurant_id,
    v_profile_id,
    TG_TABLE_NAME,
    NEW.id,
    TG_OP,
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- ============================================================================
-- Apply Updated At Triggers
-- ============================================================================

-- Tenants
DROP TRIGGER IF EXISTS tenants_updated_at ON public.tenants;
CREATE TRIGGER tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Profiles
DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Restaurants
DROP TRIGGER IF EXISTS restaurants_updated_at ON public.restaurants;
CREATE TRIGGER restaurants_updated_at
  BEFORE UPDATE ON public.restaurants
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Restaurant Branches
DROP TRIGGER IF EXISTS restaurant_branches_updated_at ON public.restaurant_branches;
CREATE TRIGGER restaurant_branches_updated_at
  BEFORE UPDATE ON public.restaurant_branches
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Roles
DROP TRIGGER IF EXISTS roles_updated_at ON public.roles;
CREATE TRIGGER roles_updated_at
  BEFORE UPDATE ON public.roles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Subscription Plans
DROP TRIGGER IF EXISTS subscription_plans_updated_at ON public.subscription_plans;
CREATE TRIGGER subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Subscriptions
DROP TRIGGER IF EXISTS subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Restaurant Users
DROP TRIGGER IF EXISTS restaurant_users_updated_at ON public.restaurant_users;
CREATE TRIGGER restaurant_users_updated_at
  BEFORE UPDATE ON public.restaurant_users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Tenant Settings
DROP TRIGGER IF EXISTS tenant_settings_updated_at ON public.tenant_settings;
CREATE TRIGGER tenant_settings_updated_at
  BEFORE UPDATE ON public.tenant_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Restaurant Settings
DROP TRIGGER IF EXISTS restaurant_settings_updated_at ON public.restaurant_settings;
CREATE TRIGGER restaurant_settings_updated_at
  BEFORE UPDATE ON public.restaurant_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- System Settings
DROP TRIGGER IF EXISTS system_settings_updated_at ON public.system_settings;
CREATE TRIGGER system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- Verification
-- ============================================================================
-- Verify triggers were created
SELECT 
  'Triggers created successfully' as status,
  COUNT(*) as trigger_count
FROM pg_trigger
WHERE tgname LIKE '%_updated_at';
