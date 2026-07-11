-- ============================================================================
-- 011: Indexes
-- ============================================================================
-- Performance indexes for optimized query performance
--
-- Dependencies: All previous migrations
-- Idempotent: Yes (uses CREATE INDEX IF NOT EXISTS)
-- ============================================================================

-- ============================================================================
-- TENANTS TABLE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON public.tenants(status);

-- ============================================================================
-- PROFILES TABLE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON public.profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_is_super_admin ON public.profiles(is_super_admin);

-- ============================================================================
-- RESTAURANTS TABLE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_restaurants_tenant_id ON public.restaurants(tenant_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_slug ON public.restaurants(slug);
CREATE INDEX IF NOT EXISTS idx_restaurants_status ON public.restaurants(status);

-- ============================================================================
-- RESTAURANT_BRANCHES TABLE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_restaurant_branches_restaurant_id ON public.restaurant_branches(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_branches_slug ON public.restaurant_branches(slug);
CREATE INDEX IF NOT EXISTS idx_restaurant_branches_status ON public.restaurant_branches(status);
CREATE INDEX IF NOT EXISTS idx_restaurant_branches_is_main_branch ON public.restaurant_branches(is_main_branch);

-- ============================================================================
-- RESTAURANT_USERS TABLE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_restaurant_users_restaurant_id ON public.restaurant_users(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_users_profile_id ON public.restaurant_users(profile_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_users_role_id ON public.restaurant_users(role_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_users_status ON public.restaurant_users(status);
CREATE INDEX IF NOT EXISTS idx_restaurant_users_branch_id ON public.restaurant_users(branch_id);

-- ============================================================================
-- ROLES TABLE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_roles_tenant_id ON public.roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_roles_slug ON public.roles(slug);
CREATE INDEX IF NOT EXISTS idx_roles_is_system_role ON public.roles(is_system_role);
CREATE INDEX IF NOT EXISTS idx_roles_is_default ON public.roles(is_default);

-- ============================================================================
-- PERMISSIONS TABLE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_permissions_slug ON public.permissions(slug);
CREATE INDEX IF NOT EXISTS idx_permissions_resource ON public.permissions(resource);
CREATE INDEX IF NOT EXISTS idx_permissions_action ON public.permissions(action);

-- ============================================================================
-- ROLE_PERMISSIONS TABLE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON public.role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON public.role_permissions(permission_id);

-- ============================================================================
-- SUBSCRIPTION_PLANS TABLE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_subscription_plans_slug ON public.subscription_plans(slug);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_is_active ON public.subscription_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_is_public ON public.subscription_plans(is_public);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_sort_order ON public.subscription_plans(sort_order);

-- ============================================================================
-- SUBSCRIPTIONS TABLE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant_id ON public.subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON public.subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON public.subscriptions(stripe_subscription_id);

-- ============================================================================
-- TENANT_SETTINGS TABLE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_tenant_settings_tenant_id ON public.tenant_settings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_settings_key ON public.tenant_settings(key);
CREATE INDEX IF NOT EXISTS idx_tenant_settings_is_public ON public.tenant_settings(is_public);

-- ============================================================================
-- RESTAURANT_SETTINGS TABLE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_restaurant_settings_restaurant_id ON public.restaurant_settings(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_settings_key ON public.restaurant_settings(key);

-- ============================================================================
-- SYSTEM_SETTINGS TABLE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON public.system_settings(key);
CREATE INDEX IF NOT EXISTS idx_system_settings_is_public ON public.system_settings(is_public);

-- ============================================================================
-- AUDIT_LOGS TABLE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON public.audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_restaurant_id ON public.audit_logs(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_profile_id ON public.audit_logs(profile_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id ON public.audit_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- ============================================================================
-- NOTIFICATIONS TABLE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_notifications_tenant_id ON public.notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_restaurant_id ON public.notifications(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_profile_id ON public.notifications(profile_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

-- ============================================================================
-- Verification
-- ============================================================================
-- Verify indexes were created
SELECT 
  'Indexes created successfully' as status,
  COUNT(*) as index_count
FROM pg_indexes
WHERE schemaname = 'public';
