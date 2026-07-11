-- ============================================================================
-- 013: RLS Policies
-- ============================================================================
-- Row Level Security policies for multi-tenant data isolation
--
-- Dependencies: 009_rls.sql, 010_functions.sql
-- Idempotent: Yes (uses DROP POLICY IF EXISTS)
-- ============================================================================

-- ============================================================================
-- PROFILES TABLE POLICIES
-- ============================================================================

-- Users can view their own profile
DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT
  USING (id = auth.uid());

-- Users can update their own profile
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE
  USING (id = auth.uid());

-- Super admins can do everything
DROP POLICY IF EXISTS profiles_super_admin ON public.profiles;
CREATE POLICY profiles_super_admin ON public.profiles
  FOR ALL
  USING (public.is_super_admin());

-- ============================================================================
-- TENANTS TABLE POLICIES
-- ============================================================================

-- Users can view their own tenant
DROP POLICY IF EXISTS tenants_select_own ON public.tenants;
CREATE POLICY tenants_select_own ON public.tenants
  FOR SELECT
  USING (id = public.get_user_tenant_id());

-- Super admins can do everything
DROP POLICY IF EXISTS tenants_super_admin ON public.tenants;
CREATE POLICY tenants_super_admin ON public.tenants
  FOR ALL
  USING (public.is_super_admin());

-- ============================================================================
-- RESTAURANTS TABLE POLICIES
-- ============================================================================

-- Users can view restaurants in their tenant
DROP POLICY IF EXISTS restaurants_select_tenant ON public.restaurants;
CREATE POLICY restaurants_select_tenant ON public.restaurants
  FOR SELECT
  USING (tenant_id = public.get_user_tenant_id());

-- Users can view their assigned restaurant
DROP POLICY IF EXISTS restaurants_select_own ON public.restaurants;
CREATE POLICY restaurants_select_own ON public.restaurants
  FOR SELECT
  USING (id = public.get_user_restaurant_id());

-- Super admins can do everything
DROP POLICY IF EXISTS restaurants_super_admin ON public.restaurants;
CREATE POLICY restaurants_super_admin ON public.restaurants
  FOR ALL
  USING (public.is_super_admin());

-- ============================================================================
-- RESTAURANT_BRANCHES TABLE POLICIES
-- ============================================================================

-- Users can view branches for their restaurants
DROP POLICY IF EXISTS restaurant_branches_select_restaurant ON public.restaurant_branches;
CREATE POLICY restaurant_branches_select_restaurant ON public.restaurant_branches
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurant_users
      WHERE restaurant_users.restaurant_id = restaurant_branches.restaurant_id
      AND restaurant_users.profile_id = auth.uid()
    )
  );

-- Super admins can do everything
DROP POLICY IF EXISTS restaurant_branches_super_admin ON public.restaurant_branches;
CREATE POLICY restaurant_branches_super_admin ON public.restaurant_branches
  FOR ALL
  USING (public.is_super_admin());

-- ============================================================================
-- RESTAURANT_SETTINGS TABLE POLICIES
-- ============================================================================

-- Users can view settings for their restaurants
DROP POLICY IF EXISTS restaurant_settings_select_restaurant ON public.restaurant_settings;
CREATE POLICY restaurant_settings_select_restaurant ON public.restaurant_settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurant_users
      WHERE restaurant_users.restaurant_id = restaurant_settings.restaurant_id
      AND restaurant_users.profile_id = auth.uid()
    )
  );

-- Super admins can do everything
DROP POLICY IF EXISTS restaurant_settings_super_admin ON public.restaurant_settings;
CREATE POLICY restaurant_settings_super_admin ON public.restaurant_settings
  FOR ALL
  USING (public.is_super_admin());

-- ============================================================================
-- RESTAURANT_USERS TABLE POLICIES
-- ============================================================================

-- Users can view users in their restaurant
DROP POLICY IF EXISTS restaurant_users_select_restaurant ON public.restaurant_users;
CREATE POLICY restaurant_users_select_restaurant ON public.restaurant_users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurant_users ru
      WHERE ru.restaurant_id = restaurant_users.restaurant_id
      AND ru.profile_id = auth.uid()
    )
  );

-- Users can update their own restaurant user record
DROP POLICY IF EXISTS restaurant_users_update_own ON public.restaurant_users;
CREATE POLICY restaurant_users_update_own ON public.restaurant_users
  FOR UPDATE
  USING (profile_id = auth.uid());

-- Super admins can do everything
DROP POLICY IF EXISTS restaurant_users_super_admin ON public.restaurant_users;
CREATE POLICY restaurant_users_super_admin ON public.restaurant_users
  FOR ALL
  USING (public.is_super_admin());

-- ============================================================================
-- ROLES TABLE POLICIES
-- ============================================================================

-- Users can view roles in their tenant
DROP POLICY IF EXISTS roles_select_tenant ON public.roles;
CREATE POLICY roles_select_tenant ON public.roles
  FOR SELECT
  USING (tenant_id = public.get_user_tenant_id());

-- Super admins can do everything
DROP POLICY IF EXISTS roles_super_admin ON public.roles;
CREATE POLICY roles_super_admin ON public.roles
  FOR ALL
  USING (public.is_super_admin());

-- ============================================================================
-- PERMISSIONS TABLE POLICIES
-- ============================================================================

-- All authenticated users can view permissions
DROP POLICY IF EXISTS permissions_select_all ON public.permissions;
CREATE POLICY permissions_select_all ON public.permissions
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Super admins can do everything
DROP POLICY IF EXISTS permissions_super_admin ON public.permissions;
CREATE POLICY permissions_super_admin ON public.permissions
  FOR ALL
  USING (public.is_super_admin());

-- ============================================================================
-- ROLE_PERMISSIONS TABLE POLICIES
-- ============================================================================

-- Users can view role permissions in their tenant
DROP POLICY IF EXISTS role_permissions_select_tenant ON public.role_permissions;
CREATE POLICY role_permissions_select_tenant ON public.role_permissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.roles
      WHERE roles.id = role_permissions.role_id
      AND roles.tenant_id = public.get_user_tenant_id()
    )
  );

-- Super admins can do everything
DROP POLICY IF EXISTS role_permissions_super_admin ON public.role_permissions;
CREATE POLICY role_permissions_super_admin ON public.role_permissions
  FOR ALL
  USING (public.is_super_admin());

-- ============================================================================
-- SUBSCRIPTION_PLANS TABLE POLICIES
-- ============================================================================

-- All authenticated users can view public subscription plans
DROP POLICY IF EXISTS subscription_plans_select_public ON public.subscription_plans;
CREATE POLICY subscription_plans_select_public ON public.subscription_plans
  FOR SELECT
  USING (is_public = true);

-- All authenticated users can view all plans
DROP POLICY IF EXISTS subscription_plans_select_all ON public.subscription_plans;
CREATE POLICY subscription_plans_select_all ON public.subscription_plans
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Super admins can do everything
DROP POLICY IF EXISTS subscription_plans_super_admin ON public.subscription_plans;
CREATE POLICY subscription_plans_super_admin ON public.subscription_plans
  FOR ALL
  USING (public.is_super_admin());

-- ============================================================================
-- SUBSCRIPTIONS TABLE POLICIES
-- ============================================================================

-- Users can view their own tenant's subscription
DROP POLICY IF EXISTS subscriptions_select_own ON public.subscriptions;
CREATE POLICY subscriptions_select_own ON public.subscriptions
  FOR SELECT
  USING (tenant_id = public.get_user_tenant_id());

-- Super admins can do everything
DROP POLICY IF EXISTS subscriptions_super_admin ON public.subscriptions;
CREATE POLICY subscriptions_super_admin ON public.subscriptions
  FOR ALL
  USING (public.is_super_admin());

-- ============================================================================
-- TENANT_SETTINGS TABLE POLICIES
-- ============================================================================

-- Users can view their own tenant's settings
DROP POLICY IF EXISTS tenant_settings_select_own ON public.tenant_settings;
CREATE POLICY tenant_settings_select_own ON public.tenant_settings
  FOR SELECT
  USING (tenant_id = public.get_user_tenant_id());

-- Users can view public settings for any tenant
DROP POLICY IF EXISTS tenant_settings_select_public ON public.tenant_settings;
CREATE POLICY tenant_settings_select_public ON public.tenant_settings
  FOR SELECT
  USING (is_public = true);

-- Super admins can do everything
DROP POLICY IF EXISTS tenant_settings_super_admin ON public.tenant_settings;
CREATE POLICY tenant_settings_super_admin ON public.tenant_settings
  FOR ALL
  USING (public.is_super_admin());

-- ============================================================================
-- Verification
-- ============================================================================
-- Verify policies were created
SELECT 
  'Policies created successfully' as status,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public';
