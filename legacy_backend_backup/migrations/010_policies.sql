-- ============================================================================
-- 010: RLS Policies
-- ============================================================================
-- Row Level Security policies for multi-tenant data isolation
--
-- Dependencies: 009_rls.sql, 007_functions.sql
-- Idempotent: Yes (uses DROP POLICY IF EXISTS before CREATE POLICY)
-- ============================================================================

-- ============================================================================
-- PROFILES TABLE POLICIES
-- ============================================================================
DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT
  USING (id = auth.uid());

DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE
  USING (id = auth.uid());

DROP POLICY IF EXISTS profiles_super_admin ON public.profiles;
CREATE POLICY profiles_super_admin ON public.profiles
  FOR ALL
  USING (public.is_super_admin());

-- ============================================================================
-- TENANTS TABLE POLICIES
-- ============================================================================
DROP POLICY IF EXISTS tenants_select_own ON public.tenants;
CREATE POLICY tenants_select_own ON public.tenants
  FOR SELECT
  USING (id = public.get_user_tenant_id());

DROP POLICY IF EXISTS tenants_update_own ON public.tenants;
CREATE POLICY tenants_update_own ON public.tenants
  FOR UPDATE
  USING (id = public.get_user_tenant_id());

DROP POLICY IF EXISTS tenants_super_admin ON public.tenants;
CREATE POLICY tenants_super_admin ON public.tenants
  FOR ALL
  USING (public.is_super_admin());

-- ============================================================================
-- RESTAURANTS TABLE POLICIES
-- ============================================================================
DROP POLICY IF EXISTS restaurants_select_own ON public.restaurants;
CREATE POLICY restaurants_select_own ON public.restaurants
  FOR SELECT
  USING (tenant_id = public.get_user_tenant_id());

DROP POLICY IF EXISTS restaurants_update_own ON public.restaurants;
CREATE POLICY restaurants_update_own ON public.restaurants
  FOR UPDATE
  USING (tenant_id = public.get_user_tenant_id());

DROP POLICY IF EXISTS restaurants_super_admin ON public.restaurants;
CREATE POLICY restaurants_super_admin ON public.restaurants
  FOR ALL
  USING (public.is_super_admin());

-- ============================================================================
-- RESTAURANT_BRANCHES TABLE POLICIES
-- ============================================================================
DROP POLICY IF EXISTS restaurant_branches_select_own ON public.restaurant_branches;
CREATE POLICY restaurant_branches_select_own ON public.restaurant_branches
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.restaurants r
    WHERE r.id = restaurant_branches.restaurant_id
    AND r.tenant_id = public.get_user_tenant_id()
  ));

DROP POLICY IF EXISTS restaurant_branches_update_own ON public.restaurant_branches;
CREATE POLICY restaurant_branches_update_own ON public.restaurant_branches
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.restaurants r
    WHERE r.id = restaurant_branches.restaurant_id
    AND r.tenant_id = public.get_user_tenant_id()
  ));

DROP POLICY IF EXISTS restaurant_branches_super_admin ON public.restaurant_branches;
CREATE POLICY restaurant_branches_super_admin ON public.restaurant_branches
  FOR ALL
  USING (public.is_super_admin());

-- ============================================================================
-- RESTAURANT_USERS TABLE POLICIES
-- ============================================================================
DROP POLICY IF EXISTS restaurant_users_select_own ON public.restaurant_users;
CREATE POLICY restaurant_users_select_own ON public.restaurant_users
  FOR SELECT
  USING (profile_id = auth.uid() OR public.is_super_admin());

DROP POLICY IF EXISTS restaurant_users_update_own ON public.restaurant_users;
CREATE POLICY restaurant_users_update_own ON public.restaurant_users
  FOR UPDATE
  USING (profile_id = auth.uid() OR public.is_super_admin());

DROP POLICY IF EXISTS restaurant_users_super_admin ON public.restaurant_users;
CREATE POLICY restaurant_users_super_admin ON public.restaurant_users
  FOR ALL
  USING (public.is_super_admin());

-- ============================================================================
-- ROLES TABLE POLICIES
-- ============================================================================
DROP POLICY IF EXISTS roles_select_own ON public.roles;
CREATE POLICY roles_select_own ON public.roles
  FOR SELECT
  USING (tenant_id = public.get_user_tenant_id());

DROP POLICY IF EXISTS roles_update_own ON public.roles;
CREATE POLICY roles_update_own ON public.roles
  FOR UPDATE
  USING (tenant_id = public.get_user_tenant_id());

DROP POLICY IF EXISTS roles_super_admin ON public.roles;
CREATE POLICY roles_super_admin ON public.roles
  FOR ALL
  USING (public.is_super_admin());

-- ============================================================================
-- PERMISSIONS TABLE POLICIES
-- ============================================================================
DROP POLICY IF EXISTS permissions_select_all ON public.permissions;
CREATE POLICY permissions_select_all ON public.permissions
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS permissions_super_admin ON public.permissions;
CREATE POLICY permissions_super_admin ON public.permissions
  FOR ALL
  USING (public.is_super_admin());

-- ============================================================================
-- ROLE_PERMISSIONS TABLE POLICIES
-- ============================================================================
DROP POLICY IF EXISTS role_permissions_select_own ON public.role_permissions;
CREATE POLICY role_permissions_select_own ON public.role_permissions
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.roles r
    WHERE r.id = role_permissions.role_id
    AND r.tenant_id = public.get_user_tenant_id()
  ));

DROP POLICY IF EXISTS role_permissions_super_admin ON public.role_permissions;
CREATE POLICY role_permissions_super_admin ON public.role_permissions
  FOR ALL
  USING (public.is_super_admin());

-- ============================================================================
-- SUBSCRIPTION_PLANS TABLE POLICIES
-- ============================================================================
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
  USING (public.is_super_admin());

-- ============================================================================
-- SUBSCRIPTIONS TABLE POLICIES
-- ============================================================================
DROP POLICY IF EXISTS subscriptions_select_own ON public.subscriptions;
CREATE POLICY subscriptions_select_own ON public.subscriptions
  FOR SELECT
  USING (tenant_id = public.get_user_tenant_id());

DROP POLICY IF EXISTS subscriptions_update_own ON public.subscriptions;
CREATE POLICY subscriptions_update_own ON public.subscriptions
  FOR UPDATE
  USING (tenant_id = public.get_user_tenant_id());

DROP POLICY IF EXISTS subscriptions_super_admin ON public.subscriptions;
CREATE POLICY subscriptions_super_admin ON public.subscriptions
  FOR ALL
  USING (public.is_super_admin());

-- ============================================================================
-- TENANT_SETTINGS TABLE POLICIES
-- ============================================================================
DROP POLICY IF EXISTS tenant_settings_select_own ON public.tenant_settings;
CREATE POLICY tenant_settings_select_own ON public.tenant_settings
  FOR SELECT
  USING (tenant_id = public.get_user_tenant_id() OR is_public = true);

DROP POLICY IF EXISTS tenant_settings_update_own ON public.tenant_settings;
CREATE POLICY tenant_settings_update_own ON public.tenant_settings
  FOR UPDATE
  USING (tenant_id = public.get_user_tenant_id());

DROP POLICY IF EXISTS tenant_settings_super_admin ON public.tenant_settings;
CREATE POLICY tenant_settings_super_admin ON public.tenant_settings
  FOR ALL
  USING (public.is_super_admin());

-- ============================================================================
-- RESTAURANT_SETTINGS TABLE POLICIES
-- ============================================================================
DROP POLICY IF EXISTS restaurant_settings_select_own ON public.restaurant_settings;
CREATE POLICY restaurant_settings_select_own ON public.restaurant_settings
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.restaurants r
    WHERE r.id = restaurant_settings.restaurant_id
    AND r.tenant_id = public.get_user_tenant_id()
  ));

DROP POLICY IF EXISTS restaurant_settings_update_own ON public.restaurant_settings;
CREATE POLICY restaurant_settings_update_own ON public.restaurant_settings
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.restaurants r
    WHERE r.id = restaurant_settings.restaurant_id
    AND r.tenant_id = public.get_user_tenant_id()
  ));

DROP POLICY IF EXISTS restaurant_settings_super_admin ON public.restaurant_settings;
CREATE POLICY restaurant_settings_super_admin ON public.restaurant_settings
  FOR ALL
  USING (public.is_super_admin());

-- ============================================================================
-- SYSTEM_SETTINGS TABLE POLICIES
-- ============================================================================
DROP POLICY IF EXISTS system_settings_select_public ON public.system_settings;
CREATE POLICY system_settings_select_public ON public.system_settings
  FOR SELECT
  USING (is_public = true);

DROP POLICY IF EXISTS system_settings_super_admin ON public.system_settings;
CREATE POLICY system_settings_super_admin ON public.system_settings
  FOR ALL
  USING (public.is_super_admin());

-- ============================================================================
-- AUDIT_LOGS TABLE POLICIES
-- ============================================================================
DROP POLICY IF EXISTS audit_logs_select_own ON public.audit_logs;
CREATE POLICY audit_logs_select_own ON public.audit_logs
  FOR SELECT
  USING (tenant_id = public.get_user_tenant_id());

DROP POLICY IF EXISTS audit_logs_super_admin ON public.audit_logs;
CREATE POLICY audit_logs_super_admin ON public.audit_logs
  FOR ALL
  USING (public.is_super_admin());

-- ============================================================================
-- NOTIFICATIONS TABLE POLICIES
-- ============================================================================
DROP POLICY IF EXISTS notifications_select_own ON public.notifications;
CREATE POLICY notifications_select_own ON public.notifications
  FOR SELECT
  USING (profile_id = auth.uid());

DROP POLICY IF EXISTS notifications_update_own ON public.notifications;
CREATE POLICY notifications_update_own ON public.notifications
  FOR UPDATE
  USING (profile_id = auth.uid());

DROP POLICY IF EXISTS notifications_super_admin ON public.notifications;
CREATE POLICY notifications_super_admin ON public.notifications
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
