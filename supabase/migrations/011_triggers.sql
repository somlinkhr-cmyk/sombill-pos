-- ============================================================================
-- 011: Triggers
-- ============================================================================
-- Automation triggers for updated_at timestamps
--
-- Dependencies: All previous table migrations
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
-- Apply Updated At Triggers
-- ============================================================================

-- Profiles
DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Tenants
DROP TRIGGER IF EXISTS tenants_updated_at ON public.tenants;
CREATE TRIGGER tenants_updated_at
  BEFORE UPDATE ON public.tenants
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

-- Restaurant Settings
DROP TRIGGER IF EXISTS restaurant_settings_updated_at ON public.restaurant_settings;
CREATE TRIGGER restaurant_settings_updated_at
  BEFORE UPDATE ON public.restaurant_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Restaurant Users
DROP TRIGGER IF EXISTS restaurant_users_updated_at ON public.restaurant_users;
CREATE TRIGGER restaurant_users_updated_at
  BEFORE UPDATE ON public.restaurant_users
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

-- Tenant Settings
DROP TRIGGER IF EXISTS tenant_settings_updated_at ON public.tenant_settings;
CREATE TRIGGER tenant_settings_updated_at
  BEFORE UPDATE ON public.tenant_settings
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
