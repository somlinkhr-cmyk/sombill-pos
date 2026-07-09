-- ============================================================================
-- 009: RLS Policies
-- ============================================================================
-- This migration creates Row Level Security policies for all tables.
--
-- Dependencies: 008_rls.sql, 006_functions.sql (helper functions must exist)
-- Idempotent: Yes (uses DROP POLICY IF EXISTS before CREATE POLICY)
-- ============================================================================

-- ============================================================================
-- USERS TABLE POLICIES
-- ============================================================================
DROP POLICY IF EXISTS users_select_own ON public.users;
CREATE POLICY users_select_own ON public.users
  FOR SELECT
  USING (id = auth.uid());

DROP POLICY IF EXISTS users_update_own ON public.users;
CREATE POLICY users_update_own ON public.users
  FOR UPDATE
  USING (id = auth.uid());

DROP POLICY IF EXISTS users_super_admin ON public.users;
CREATE POLICY users_super_admin ON public.users
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
  USING (restaurant_id = public.get_user_restaurant_id());

DROP POLICY IF EXISTS restaurants_update_own ON public.restaurants;
CREATE POLICY restaurants_update_own ON public.restaurants
  FOR UPDATE
  USING (restaurant_id = public.get_user_restaurant_id());

DROP POLICY IF EXISTS restaurants_super_admin ON public.restaurants;
CREATE POLICY restaurants_super_admin ON public.restaurants
  FOR ALL
  USING (public.is_super_admin());

-- ============================================================================
-- RESTAURANT_SETTINGS TABLE POLICIES
-- ============================================================================
DROP POLICY IF EXISTS restaurant_settings_select_own ON public.restaurant_settings;
CREATE POLICY restaurant_settings_select_own ON public.restaurant_settings
  FOR SELECT
  USING (restaurant_id = public.get_user_restaurant_id());

DROP POLICY IF EXISTS restaurant_settings_update_own ON public.restaurant_settings;
CREATE POLICY restaurant_settings_update_own ON public.restaurant_settings
  FOR UPDATE
  USING (restaurant_id = public.get_user_restaurant_id());

DROP POLICY IF EXISTS restaurant_settings_super_admin ON public.restaurant_settings;
CREATE POLICY restaurant_settings_super_admin ON public.restaurant_settings
  FOR ALL
  USING (public.is_super_admin());

-- ============================================================================
-- RESTAURANT_BRANCHES TABLE POLICIES
-- ============================================================================
DROP POLICY IF EXISTS restaurant_branches_select_own ON public.restaurant_branches;
CREATE POLICY restaurant_branches_select_own ON public.restaurant_branches
  FOR SELECT
  USING (restaurant_id = public.get_user_restaurant_id());

DROP POLICY IF EXISTS restaurant_branches_update_own ON public.restaurant_branches;
CREATE POLICY restaurant_branches_update_own ON public.restaurant_branches
  FOR UPDATE
  USING (restaurant_id = public.get_user_restaurant_id());

DROP POLICY IF EXISTS restaurant_branches_super_admin ON public.restaurant_branches;
CREATE POLICY restaurant_branches_super_admin ON public.restaurant_branches
  FOR ALL
  USING (public.is_super_admin());

-- ============================================================================
-- SUBSCRIPTION_PLANS TABLE POLICIES
-- ============================================================================
DROP POLICY IF EXISTS subscription_plans_select_public ON public.subscription_plans;
CREATE POLICY subscription_plans_select_public ON public.subscription_plans
  FOR SELECT
  USING (is_public = true);

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
-- ROLES TABLE POLICIES
-- ============================================================================
DROP POLICY IF EXISTS roles_select_own ON public.roles;
CREATE POLICY roles_select_own ON public.roles
  FOR SELECT
  USING (restaurant_id = public.get_user_restaurant_id());

DROP POLICY IF EXISTS roles_update_own ON public.roles;
CREATE POLICY roles_update_own ON public.roles
  FOR UPDATE
  USING (restaurant_id = public.get_user_restaurant_id());

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
    SELECT 1 FROM public.roles 
    WHERE roles.id = role_permissions.role_id 
    AND roles.restaurant_id = public.get_user_restaurant_id()
  ));

DROP POLICY IF EXISTS role_permissions_super_admin ON public.role_permissions;
CREATE POLICY role_permissions_super_admin ON public.role_permissions
  FOR ALL
  USING (public.is_super_admin());

-- ============================================================================
-- RESTAURANT_USERS TABLE POLICIES
-- ============================================================================
DROP POLICY IF EXISTS restaurant_users_select_own ON public.restaurant_users;
CREATE POLICY restaurant_users_select_own ON public.restaurant_users
  FOR SELECT
  USING (restaurant_id = public.get_user_restaurant_id());

DROP POLICY IF EXISTS restaurant_users_update_own ON public.restaurant_users;
CREATE POLICY restaurant_users_update_own ON public.restaurant_users
  FOR UPDATE
  USING (restaurant_id = public.get_user_restaurant_id());

DROP POLICY IF EXISTS restaurant_users_super_admin ON public.restaurant_users;
CREATE POLICY restaurant_users_super_admin ON public.restaurant_users
  FOR ALL
  USING (public.is_super_admin());

-- ============================================================================
-- EMPLOYEES TABLE POLICIES
-- ============================================================================
DROP POLICY IF EXISTS employees_select_own ON public.employees;
CREATE POLICY employees_select_own ON public.employees
  FOR SELECT
  USING (restaurant_id = public.get_user_restaurant_id());

DROP POLICY IF EXISTS employees_update_own ON public.employees;
CREATE POLICY employees_update_own ON public.employees
  FOR UPDATE
  USING (restaurant_id = public.get_user_restaurant_id());

DROP POLICY IF EXISTS employees_super_admin ON public.employees;
CREATE POLICY employees_super_admin ON public.employees
  FOR ALL
  USING (public.is_super_admin());

-- ============================================================================
-- CUSTOMERS TABLE POLICIES
-- ============================================================================
DROP POLICY IF EXISTS customers_select_own ON public.customers;
CREATE POLICY customers_select_own ON public.customers
  FOR SELECT
  USING (restaurant_id = public.get_user_restaurant_id());

DROP POLICY IF EXISTS customers_update_own ON public.customers;
CREATE POLICY customers_update_own ON public.customers
  FOR UPDATE
  USING (restaurant_id = public.get_user_restaurant_id());

DROP POLICY IF EXISTS customers_super_admin ON public.customers;
CREATE POLICY customers_super_admin ON public.customers
  FOR ALL
  USING (public.is_super_admin());

-- ============================================================================
-- TABLES TABLE POLICIES
-- ============================================================================
DROP POLICY IF EXISTS tables_select_own ON public.tables;
CREATE POLICY tables_select_own ON public.tables
  FOR SELECT
  USING (restaurant_id = public.get_user_restaurant_id());

DROP POLICY IF EXISTS tables_update_own ON public.tables;
CREATE POLICY tables_update_own ON public.tables
  FOR UPDATE
  USING (restaurant_id = public.get_user_restaurant_id());

DROP POLICY IF EXISTS tables_super_admin ON public.tables;
CREATE POLICY tables_super_admin ON public.tables
  FOR ALL
  USING (public.is_super_admin());

-- ============================================================================
-- MENU_CATEGORIES TABLE POLICIES
-- ============================================================================
DROP POLICY IF EXISTS menu_categories_select_own ON public.menu_categories;
CREATE POLICY menu_categories_select_own ON public.menu_categories
  FOR SELECT
  USING (restaurant_id = public.get_user_restaurant_id());

DROP POLICY IF EXISTS menu_categories_update_own ON public.menu_categories;
CREATE POLICY menu_categories_update_own ON public.menu_categories
  FOR UPDATE
  USING (restaurant_id = public.get_user_restaurant_id());

DROP POLICY IF EXISTS menu_categories_super_admin ON public.menu_categories;
CREATE POLICY menu_categories_super_admin ON public.menu_categories
  FOR ALL
  USING (public.is_super_admin());

-- ============================================================================
-- PRODUCTS TABLE POLICIES
-- ============================================================================
DROP POLICY IF EXISTS products_select_own ON public.products;
CREATE POLICY products_select_own ON public.products
  FOR SELECT
  USING (restaurant_id = public.get_user_restaurant_id());

DROP POLICY IF EXISTS products_update_own ON public.products;
CREATE POLICY products_update_own ON public.products
  FOR UPDATE
  USING (restaurant_id = public.get_user_restaurant_id());

DROP POLICY IF EXISTS products_super_admin ON public.products;
CREATE POLICY products_super_admin ON public.products
  FOR ALL
  USING (public.is_super_admin());

-- ============================================================================
-- INVENTORY TABLE POLICIES
-- ============================================================================
DROP POLICY IF EXISTS inventory_select_own ON public.inventory;
CREATE POLICY inventory_select_own ON public.inventory
  FOR SELECT
  USING (restaurant_id = public.get_user_restaurant_id());

DROP POLICY IF EXISTS inventory_update_own ON public.inventory;
CREATE POLICY inventory_update_own ON public.inventory
  FOR UPDATE
  USING (restaurant_id = public.get_user_restaurant_id());

DROP POLICY IF EXISTS inventory_super_admin ON public.inventory;
CREATE POLICY inventory_super_admin ON public.inventory
  FOR ALL
  USING (public.is_super_admin());

-- ============================================================================
-- INVENTORY_CATEGORIES TABLE POLICIES
-- ============================================================================
DROP POLICY IF EXISTS inventory_categories_select_own ON public.inventory_categories;
CREATE POLICY inventory_categories_select_own ON public.inventory_categories
  FOR SELECT
  USING (restaurant_id = public.get_user_restaurant_id());

DROP POLICY IF EXISTS inventory_categories_update_own ON public.inventory_categories;
CREATE POLICY inventory_categories_update_own ON public.inventory_categories
  FOR UPDATE
  USING (restaurant_id = public.get_user_restaurant_id());

DROP POLICY IF EXISTS inventory_categories_super_admin ON public.inventory_categories;
CREATE POLICY inventory_categories_super_admin ON public.inventory_categories
  FOR ALL
  USING (public.is_super_admin());

-- ============================================================================
-- SUPPLIERS TABLE POLICIES
-- ============================================================================
DROP POLICY IF EXISTS suppliers_select_own ON public.suppliers;
CREATE POLICY suppliers_select_own ON public.suppliers
  FOR SELECT
  USING (restaurant_id = public.get_user_restaurant_id());

DROP POLICY IF EXISTS suppliers_update_own ON public.suppliers;
CREATE POLICY suppliers_update_own ON public.suppliers
  FOR UPDATE
  USING (restaurant_id = public.get_user_restaurant_id());

DROP POLICY IF EXISTS suppliers_super_admin ON public.suppliers;
CREATE POLICY suppliers_super_admin ON public.suppliers
  FOR ALL
  USING (public.is_super_admin());

-- ============================================================================
-- ORDERS TABLE POLICIES
-- ============================================================================
DROP POLICY IF EXISTS orders_select_own ON public.orders;
CREATE POLICY orders_select_own ON public.orders
  FOR SELECT
  USING (restaurant_id = public.get_user_restaurant_id());

DROP POLICY IF EXISTS orders_update_own ON public.orders;
CREATE POLICY orders_update_own ON public.orders
  FOR UPDATE
  USING (restaurant_id = public.get_user_restaurant_id());

DROP POLICY IF EXISTS orders_super_admin ON public.orders;
CREATE POLICY orders_super_admin ON public.orders
  FOR ALL
  USING (public.is_super_admin());

-- ============================================================================
-- ORDER_ITEMS TABLE POLICIES
-- ============================================================================
DROP POLICY IF EXISTS order_items_select_own ON public.order_items;
CREATE POLICY order_items_select_own ON public.order_items
  FOR SELECT
  USING (restaurant_id = public.get_user_restaurant_id());

DROP POLICY IF EXISTS order_items_update_own ON public.order_items;
CREATE POLICY order_items_update_own ON public.order_items
  FOR UPDATE
  USING (restaurant_id = public.get_user_restaurant_id());

DROP POLICY IF EXISTS order_items_super_admin ON public.order_items;
CREATE POLICY order_items_super_admin ON public.order_items
  FOR ALL
  USING (public.is_super_admin());

-- ============================================================================
-- PAYMENTS TABLE POLICIES
-- ============================================================================
DROP POLICY IF EXISTS payments_select_own ON public.payments;
CREATE POLICY payments_select_own ON public.payments
  FOR SELECT
  USING (restaurant_id = public.get_user_restaurant_id());

DROP POLICY IF EXISTS payments_update_own ON public.payments;
CREATE POLICY payments_update_own ON public.payments
  FOR UPDATE
  USING (restaurant_id = public.get_user_restaurant_id());

DROP POLICY IF EXISTS payments_super_admin ON public.payments;
CREATE POLICY payments_super_admin ON public.payments
  FOR ALL
  USING (public.is_super_admin());

-- ============================================================================
-- PAYMENT_METHODS TABLE POLICIES
-- ============================================================================
DROP POLICY IF EXISTS payment_methods_select_own ON public.payment_methods;
CREATE POLICY payment_methods_select_own ON public.payment_methods
  FOR SELECT
  USING (restaurant_id = public.get_user_restaurant_id());

DROP POLICY IF EXISTS payment_methods_update_own ON public.payment_methods;
CREATE POLICY payment_methods_update_own ON public.payment_methods
  FOR UPDATE
  USING (restaurant_id = public.get_user_restaurant_id());

DROP POLICY IF EXISTS payment_methods_super_admin ON public.payment_methods;
CREATE POLICY payment_methods_super_admin ON public.payment_methods
  FOR ALL
  USING (public.is_super_admin());

-- ============================================================================
-- TAX_SETTINGS TABLE POLICIES
-- ============================================================================
DROP POLICY IF EXISTS tax_settings_select_own ON public.tax_settings;
CREATE POLICY tax_settings_select_own ON public.tax_settings
  FOR SELECT
  USING (restaurant_id = public.get_user_restaurant_id());

DROP POLICY IF EXISTS tax_settings_update_own ON public.tax_settings;
CREATE POLICY tax_settings_update_own ON public.tax_settings
  FOR UPDATE
  USING (restaurant_id = public.get_user_restaurant_id());

DROP POLICY IF EXISTS tax_settings_super_admin ON public.tax_settings;
CREATE POLICY tax_settings_super_admin ON public.tax_settings
  FOR ALL
  USING (public.is_super_admin());

-- ============================================================================
-- CURRENCIES TABLE POLICIES
-- ============================================================================
DROP POLICY IF EXISTS currencies_select_own ON public.currencies;
CREATE POLICY currencies_select_own ON public.currencies
  FOR SELECT
  USING (restaurant_id = public.get_user_restaurant_id());

DROP POLICY IF EXISTS currencies_update_own ON public.currencies;
CREATE POLICY currencies_update_own ON public.currencies
  FOR UPDATE
  USING (restaurant_id = public.get_user_restaurant_id());

DROP POLICY IF EXISTS currencies_super_admin ON public.currencies;
CREATE POLICY currencies_super_admin ON public.currencies
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
-- ACTIVITY_LOGS TABLE POLICIES
-- ============================================================================
DROP POLICY IF EXISTS activity_logs_select_own ON public.activity_logs;
CREATE POLICY activity_logs_select_own ON public.activity_logs
  FOR SELECT
  USING (tenant_id = public.get_user_tenant_id());

DROP POLICY IF EXISTS activity_logs_super_admin ON public.activity_logs;
CREATE POLICY activity_logs_super_admin ON public.activity_logs
  FOR ALL
  USING (public.is_super_admin());

-- ============================================================================
-- NOTIFICATIONS TABLE POLICIES
-- ============================================================================
DROP POLICY IF EXISTS notifications_select_own ON public.notifications;
CREATE POLICY notifications_select_own ON public.notifications
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS notifications_update_own ON public.notifications;
CREATE POLICY notifications_update_own ON public.notifications
  FOR UPDATE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS notifications_super_admin ON public.notifications;
CREATE POLICY notifications_super_admin ON public.notifications
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
-- API_KEYS TABLE POLICIES
-- ============================================================================
DROP POLICY IF EXISTS api_keys_select_own ON public.api_keys;
CREATE POLICY api_keys_select_own ON public.api_keys
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS api_keys_update_own ON public.api_keys;
CREATE POLICY api_keys_update_own ON public.api_keys
  FOR UPDATE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS api_keys_super_admin ON public.api_keys;
CREATE POLICY api_keys_super_admin ON public.api_keys
  FOR ALL
  USING (public.is_super_admin());

-- ============================================================================
-- USER_SESSIONS TABLE POLICIES
-- ============================================================================
DROP POLICY IF EXISTS user_sessions_select_own ON public.user_sessions;
CREATE POLICY user_sessions_select_own ON public.user_sessions
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS user_sessions_super_admin ON public.user_sessions;
CREATE POLICY user_sessions_super_admin ON public.user_sessions
  FOR ALL
  USING (public.is_super_admin());

-- ============================================================================
-- LOGIN_HISTORY TABLE POLICIES
-- ============================================================================
DROP POLICY IF EXISTS login_history_select_own ON public.login_history;
CREATE POLICY login_history_select_own ON public.login_history
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS login_history_super_admin ON public.login_history;
CREATE POLICY login_history_super_admin ON public.login_history
  FOR ALL
  USING (public.is_super_admin());

-- ============================================================================
-- SUPPORT_TICKETS TABLE POLICIES
-- ============================================================================
DROP POLICY IF EXISTS support_tickets_select_own ON public.support_tickets;
CREATE POLICY support_tickets_select_own ON public.support_tickets
  FOR SELECT
  USING (tenant_id = public.get_user_tenant_id());

DROP POLICY IF EXISTS support_tickets_update_own ON public.support_tickets;
CREATE POLICY support_tickets_update_own ON public.support_tickets
  FOR UPDATE
  USING (tenant_id = public.get_user_tenant_id());

DROP POLICY IF EXISTS support_tickets_super_admin ON public.support_tickets;
CREATE POLICY support_tickets_super_admin ON public.support_tickets
  FOR ALL
  USING (public.is_super_admin());

-- ============================================================================
-- ATTACHMENTS TABLE POLICIES
-- ============================================================================
DROP POLICY IF EXISTS attachments_select_own ON public.attachments;
CREATE POLICY attachments_select_own ON public.attachments
  FOR SELECT
  USING (tenant_id = public.get_user_tenant_id());

DROP POLICY IF EXISTS attachments_update_own ON public.attachments;
CREATE POLICY attachments_update_own ON public.attachments
  FOR UPDATE
  USING (tenant_id = public.get_user_tenant_id());

DROP POLICY IF EXISTS attachments_super_admin ON public.attachments;
CREATE POLICY attachments_super_admin ON public.attachments
  FOR ALL
  USING (public.is_super_admin());

-- ============================================================================
-- RESTAURANT_STORAGE TABLE POLICIES
-- ============================================================================
DROP POLICY IF EXISTS restaurant_storage_select_own ON public.restaurant_storage;
CREATE POLICY restaurant_storage_select_own ON public.restaurant_storage
  FOR SELECT
  USING (restaurant_id = public.get_user_restaurant_id());

DROP POLICY IF EXISTS restaurant_storage_update_own ON public.restaurant_storage;
CREATE POLICY restaurant_storage_update_own ON public.restaurant_storage
  FOR UPDATE
  USING (restaurant_id = public.get_user_restaurant_id());

DROP POLICY IF EXISTS restaurant_storage_super_admin ON public.restaurant_storage;
CREATE POLICY restaurant_storage_super_admin ON public.restaurant_storage
  FOR ALL
  USING (public.is_super_admin());

-- ============================================================================
-- RESTAURANT_STATISTICS TABLE POLICIES
-- ============================================================================
DROP POLICY IF EXISTS restaurant_statistics_select_own ON public.restaurant_statistics;
CREATE POLICY restaurant_statistics_select_own ON public.restaurant_statistics
  FOR SELECT
  USING (restaurant_id = public.get_user_restaurant_id());

DROP POLICY IF EXISTS restaurant_statistics_super_admin ON public.restaurant_statistics;
CREATE POLICY restaurant_statistics_super_admin ON public.restaurant_statistics
  FOR ALL
  USING (public.is_super_admin());

-- ============================================================================
-- ANALYTICS TABLE POLICIES
-- ============================================================================
DROP POLICY IF EXISTS analytics_select_own ON public.analytics;
CREATE POLICY analytics_select_own ON public.analytics
  FOR SELECT
  USING (tenant_id = public.get_user_tenant_id());

DROP POLICY IF EXISTS analytics_super_admin ON public.analytics;
CREATE POLICY analytics_super_admin ON public.analytics
  FOR ALL
  USING (public.is_super_admin());

-- ============================================================================
-- Verification
-- ============================================================================
-- Count all created policies
SELECT 
  COUNT(*) as policy_count,
  'RLS policies created successfully' as status
FROM pg_policies 
WHERE schemaname = 'public';
