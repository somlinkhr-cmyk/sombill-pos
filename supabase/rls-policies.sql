-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- Production-ready RLS for multi-tenant restaurant management
-- ============================================================================

-- Helper function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND is_super_admin = true
  );
$$;

-- Helper function to get user's tenant_id
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT tenant_id FROM public.restaurant_users WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Helper function to get user's restaurant_id
CREATE OR REPLACE FUNCTION public.get_user_restaurant_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT restaurant_id FROM public.restaurant_users WHERE user_id = auth.uid() LIMIT 1;
$$;

-- ============================================================================
-- USERS TABLE RLS
-- ============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can manage users" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;

CREATE POLICY "Super admins can manage users"
ON public.users
FOR ALL
USING (public.is_super_admin());

CREATE POLICY "Users can view own profile"
ON public.users
FOR SELECT
USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
ON public.users
FOR UPDATE
USING (id = auth.uid());

-- ============================================================================
-- TENANTS TABLE RLS
-- ============================================================================
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can manage tenants" ON public.tenants;
DROP POLICY IF EXISTS "Users can view own tenant" ON public.tenants;

CREATE POLICY "Super admins can manage tenants"
ON public.tenants
FOR ALL
USING (public.is_super_admin());

CREATE POLICY "Users can view own tenant"
ON public.tenants
FOR SELECT
USING (id = public.get_user_tenant_id());

-- ============================================================================
-- RESTAURANTS TABLE RLS
-- ============================================================================
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can manage restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Users can view own tenant restaurants" ON public.restaurants;

CREATE POLICY "Super admins can manage restaurants"
ON public.restaurants
FOR ALL
USING (public.is_super_admin());

CREATE POLICY "Users can view own tenant restaurants"
ON public.restaurants
FOR SELECT
USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can insert own tenant restaurants"
ON public.restaurants
FOR INSERT
WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can update own tenant restaurants"
ON public.restaurants
FOR UPDATE
USING (tenant_id = public.get_user_tenant_id());

-- ============================================================================
-- RESTAURANT_SETTINGS TABLE RLS
-- ============================================================================
ALTER TABLE public.restaurant_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can manage restaurant settings" ON public.restaurant_settings;
DROP POLICY IF EXISTS "Users can view own restaurant settings" ON public.restaurant_settings;

CREATE POLICY "Super admins can manage restaurant settings"
ON public.restaurant_settings
FOR ALL
USING (public.is_super_admin());

CREATE POLICY "Users can view own restaurant settings"
ON public.restaurant_settings
FOR SELECT
USING (restaurant_id IN (
  SELECT restaurant_id FROM public.restaurant_users WHERE user_id = auth.uid()
));

CREATE POLICY "Users can update own restaurant settings"
ON public.restaurant_settings
FOR UPDATE
USING (restaurant_id IN (
  SELECT restaurant_id FROM public.restaurant_users WHERE user_id = auth.uid()
));

-- ============================================================================
-- RESTAURANT_BRANCHES TABLE RLS
-- ============================================================================
ALTER TABLE public.restaurant_branches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can manage branches" ON public.restaurant_branches;
DROP POLICY IF EXISTS "Users can view own tenant branches" ON public.restaurant_branches;

CREATE POLICY "Super admins can manage branches"
ON public.restaurant_branches
FOR ALL
USING (public.is_super_admin());

CREATE POLICY "Users can view own tenant branches"
ON public.restaurant_branches
FOR SELECT
USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can insert own tenant branches"
ON public.restaurant_branches
FOR INSERT
WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can update own tenant branches"
ON public.restaurant_branches
FOR UPDATE
USING (tenant_id = public.get_user_tenant_id());

-- ============================================================================
-- SUBSCRIPTION_PLANS TABLE RLS
-- ============================================================================
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can manage subscription plans" ON public.subscription_plans;
DROP POLICY IF EXISTS "Authenticated users can view subscription plans" ON public.subscription_plans;

CREATE POLICY "Super admins can manage subscription plans"
ON public.subscription_plans
FOR ALL
USING (public.is_super_admin());

CREATE POLICY "Authenticated users can view subscription plans"
ON public.subscription_plans
FOR SELECT
USING (true);

-- ============================================================================
-- SUBSCRIPTIONS TABLE RLS
-- ============================================================================
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can manage subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can view own tenant subscriptions" ON public.subscriptions;

CREATE POLICY "Super admins can manage subscriptions"
ON public.subscriptions
FOR ALL
USING (public.is_super_admin());

CREATE POLICY "Users can view own tenant subscriptions"
ON public.subscriptions
FOR SELECT
USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can insert own tenant subscriptions"
ON public.subscriptions
FOR INSERT
WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can update own tenant subscriptions"
ON public.subscriptions
FOR UPDATE
USING (tenant_id = public.get_user_tenant_id());

-- ============================================================================
-- ROLES TABLE RLS
-- ============================================================================
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can manage roles" ON public.roles;
DROP POLICY IF EXISTS "Users can view own tenant roles" ON public.roles;

CREATE POLICY "Super admins can manage roles"
ON public.roles
FOR ALL
USING (public.is_super_admin());

CREATE POLICY "Users can view own tenant roles"
ON public.roles
FOR SELECT
USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can insert own tenant roles"
ON public.roles
FOR INSERT
WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can update own tenant roles"
ON public.roles
FOR UPDATE
USING (tenant_id = public.get_user_tenant_id());

-- ============================================================================
-- PERMISSIONS TABLE RLS
-- ============================================================================
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can manage permissions" ON public.permissions;
DROP POLICY IF EXISTS "Authenticated users can view permissions" ON public.permissions;

CREATE POLICY "Super admins can manage permissions"
ON public.permissions
FOR ALL
USING (public.is_super_admin());

CREATE POLICY "Authenticated users can view permissions"
ON public.permissions
FOR SELECT
USING (true);

-- ============================================================================
-- ROLE_PERMISSIONS TABLE RLS
-- ============================================================================
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can manage role permissions" ON public.role_permissions;
DROP POLICY IF EXISTS "Users can view own tenant role permissions" ON public.role_permissions;

CREATE POLICY "Super admins can manage role permissions"
ON public.role_permissions
FOR ALL
USING (public.is_super_admin());

CREATE POLICY "Users can view own tenant role permissions"
ON public.role_permissions
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.roles r
  WHERE r.id = role_permissions.role_id
  AND r.tenant_id = public.get_user_tenant_id()
));

CREATE POLICY "Users can insert own tenant role permissions"
ON public.role_permissions
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.roles r
  WHERE r.id = role_permissions.role_id
  AND r.tenant_id = public.get_user_tenant_id()
));

CREATE POLICY "Users can delete own tenant role permissions"
ON public.role_permissions
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.roles r
  WHERE r.id = role_permissions.role_id
  AND r.tenant_id = public.get_user_tenant_id()
));

-- ============================================================================
-- RESTAURANT_USERS TABLE RLS
-- ============================================================================
ALTER TABLE public.restaurant_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can manage restaurant users" ON public.restaurant_users;
DROP POLICY IF EXISTS "Users can view own tenant restaurant users" ON public.restaurant_users;

CREATE POLICY "Super admins can manage restaurant users"
ON public.restaurant_users
FOR ALL
USING (public.is_super_admin());

CREATE POLICY "Users can view own tenant restaurant users"
ON public.restaurant_users
FOR SELECT
USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can insert own tenant restaurant users"
ON public.restaurant_users
FOR INSERT
WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can update own tenant restaurant users"
ON public.restaurant_users
FOR UPDATE
USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can delete own tenant restaurant users"
ON public.restaurant_users
FOR DELETE
USING (tenant_id = public.get_user_tenant_id());

-- ============================================================================
-- EMPLOYEES TABLE RLS
-- ============================================================================
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can manage employees" ON public.employees;
DROP POLICY IF EXISTS "Users can view own tenant employees" ON public.employees;

CREATE POLICY "Super admins can manage employees"
ON public.employees
FOR ALL
USING (public.is_super_admin());

CREATE POLICY "Users can view own tenant employees"
ON public.employees
FOR SELECT
USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can insert own tenant employees"
ON public.employees
FOR INSERT
WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can update own tenant employees"
ON public.employees
FOR UPDATE
USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can delete own tenant employees"
ON public.employees
FOR DELETE
USING (tenant_id = public.get_user_tenant_id());

-- ============================================================================
-- CUSTOMERS TABLE RLS
-- ============================================================================
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can manage customers" ON public.customers;
DROP POLICY IF EXISTS "Users can view own tenant customers" ON public.customers;

CREATE POLICY "Super admins can manage customers"
ON public.customers
FOR ALL
USING (public.is_super_admin());

CREATE POLICY "Users can view own tenant customers"
ON public.customers
FOR SELECT
USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can insert own tenant customers"
ON public.customers
FOR INSERT
WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can update own tenant customers"
ON public.customers
FOR UPDATE
USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can delete own tenant customers"
ON public.customers
FOR DELETE
USING (tenant_id = public.get_user_tenant_id());

-- ============================================================================
-- TABLES TABLE RLS
-- ============================================================================
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can manage tables" ON public.tables;
DROP POLICY IF EXISTS "Users can view own tenant tables" ON public.tables;

CREATE POLICY "Super admins can manage tables"
ON public.tables
FOR ALL
USING (public.is_super_admin());

CREATE POLICY "Users can view own tenant tables"
ON public.tables
FOR SELECT
USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can insert own tenant tables"
ON public.tables
FOR INSERT
WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can update own tenant tables"
ON public.tables
FOR UPDATE
USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can delete own tenant tables"
ON public.tables
FOR DELETE
USING (tenant_id = public.get_user_tenant_id());

-- ============================================================================
-- MENU_CATEGORIES TABLE RLS
-- ============================================================================
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can manage menu categories" ON public.menu_categories;
DROP POLICY IF EXISTS "Users can view own restaurant menu categories" ON public.menu_categories;

CREATE POLICY "Super admins can manage menu categories"
ON public.menu_categories
FOR ALL
USING (public.is_super_admin());

CREATE POLICY "Users can view own restaurant menu categories"
ON public.menu_categories
FOR SELECT
USING (restaurant_id IN (
  SELECT restaurant_id FROM public.restaurant_users WHERE user_id = auth.uid()
));

CREATE POLICY "Users can insert own restaurant menu categories"
ON public.menu_categories
FOR INSERT
WITH CHECK (restaurant_id IN (
  SELECT restaurant_id FROM public.restaurant_users WHERE user_id = auth.uid()
));

CREATE POLICY "Users can update own restaurant menu categories"
ON public.menu_categories
FOR UPDATE
USING (restaurant_id IN (
  SELECT restaurant_id FROM public.restaurant_users WHERE user_id = auth.uid()
));

CREATE POLICY "Users can delete own restaurant menu categories"
ON public.menu_categories
FOR DELETE
USING (restaurant_id IN (
  SELECT restaurant_id FROM public.restaurant_users WHERE user_id = auth.uid()
));

-- ============================================================================
-- PRODUCTS TABLE RLS
-- ============================================================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can manage products" ON public.products;
DROP POLICY IF EXISTS "Users can view own tenant products" ON public.products;

CREATE POLICY "Super admins can manage products"
ON public.products
FOR ALL
USING (public.is_super_admin());

CREATE POLICY "Users can view own tenant products"
ON public.products
FOR SELECT
USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can insert own tenant products"
ON public.products
FOR INSERT
WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can update own tenant products"
ON public.products
FOR UPDATE
USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can delete own tenant products"
ON public.products
FOR DELETE
USING (tenant_id = public.get_user_tenant_id());

-- ============================================================================
-- INVENTORY TABLE RLS
-- ============================================================================
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can manage inventory" ON public.inventory;
DROP POLICY IF EXISTS "Users can view own tenant inventory" ON public.inventory;

CREATE POLICY "Super admins can manage inventory"
ON public.inventory
FOR ALL
USING (public.is_super_admin());

CREATE POLICY "Users can view own tenant inventory"
ON public.inventory
FOR SELECT
USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can insert own tenant inventory"
ON public.inventory
FOR INSERT
WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can update own tenant inventory"
ON public.inventory
FOR UPDATE
USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can delete own tenant inventory"
ON public.inventory
FOR DELETE
USING (tenant_id = public.get_user_tenant_id());

-- ============================================================================
-- INVENTORY_CATEGORIES TABLE RLS
-- ============================================================================
ALTER TABLE public.inventory_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can manage inventory categories" ON public.inventory_categories;
DROP POLICY IF EXISTS "Users can view own restaurant inventory categories" ON public.inventory_categories;

CREATE POLICY "Super admins can manage inventory categories"
ON public.inventory_categories
FOR ALL
USING (public.is_super_admin());

CREATE POLICY "Users can view own restaurant inventory categories"
ON public.inventory_categories
FOR SELECT
USING (restaurant_id IN (
  SELECT restaurant_id FROM public.restaurant_users WHERE user_id = auth.uid()
));

CREATE POLICY "Users can insert own restaurant inventory categories"
ON public.inventory_categories
FOR INSERT
WITH CHECK (restaurant_id IN (
  SELECT restaurant_id FROM public.restaurant_users WHERE user_id = auth.uid()
));

CREATE POLICY "Users can update own restaurant inventory categories"
ON public.inventory_categories
FOR UPDATE
USING (restaurant_id IN (
  SELECT restaurant_id FROM public.restaurant_users WHERE user_id = auth.uid()
));

CREATE POLICY "Users can delete own restaurant inventory categories"
ON public.inventory_categories
FOR DELETE
USING (restaurant_id IN (
  SELECT restaurant_id FROM public.restaurant_users WHERE user_id = auth.uid()
));

-- ============================================================================
-- SUPPLIERS TABLE RLS
-- ============================================================================
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can manage suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Users can view own tenant suppliers" ON public.suppliers;

CREATE POLICY "Super admins can manage suppliers"
ON public.suppliers
FOR ALL
USING (public.is_super_admin());

CREATE POLICY "Users can view own tenant suppliers"
ON public.suppliers
FOR SELECT
USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can insert own tenant suppliers"
ON public.suppliers
FOR INSERT
WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can update own tenant suppliers"
ON public.suppliers
FOR UPDATE
USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can delete own tenant suppliers"
ON public.suppliers
FOR DELETE
USING (tenant_id = public.get_user_tenant_id());

-- ============================================================================
-- ORDERS TABLE RLS
-- ============================================================================
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can manage orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view own tenant orders" ON public.orders;

CREATE POLICY "Super admins can manage orders"
ON public.orders
FOR ALL
USING (public.is_super_admin());

CREATE POLICY "Users can view own tenant orders"
ON public.orders
FOR SELECT
USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can insert own tenant orders"
ON public.orders
FOR INSERT
WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can update own tenant orders"
ON public.orders
FOR UPDATE
USING (tenant_id = public.get_user_tenant_id());

-- ============================================================================
-- ORDER_ITEMS TABLE RLS
-- ============================================================================
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can manage order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can view own tenant order items" ON public.order_items;

CREATE POLICY "Super admins can view order items"
ON public.order_items
FOR ALL
USING (public.is_super_admin());

CREATE POLICY "Users can view own tenant order items"
ON public.order_items
FOR SELECT
USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can insert own tenant order items"
ON public.order_items
FOR INSERT
WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can update own tenant order items"
ON public.order_items
FOR UPDATE
USING (tenant_id = public.get_user_tenant_id());

-- ============================================================================
-- PAYMENTS TABLE RLS
-- ============================================================================
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can manage payments" ON public.payments;
DROP POLICY IF EXISTS "Users can view own tenant payments" ON public.payments;

CREATE POLICY "Super admins can manage payments"
ON public.payments
FOR ALL
USING (public.is_super_admin());

CREATE POLICY "Users can view own tenant payments"
ON public.payments
FOR SELECT
USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can insert own tenant payments"
ON public.payments
FOR INSERT
WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can update own tenant payments"
ON public.payments
FOR UPDATE
USING (tenant_id = public.get_user_tenant_id());

-- ============================================================================
-- PAYMENT_METHODS TABLE RLS
-- ============================================================================
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can manage payment methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Users can view own restaurant payment methods" ON public.payment_methods;

CREATE POLICY "Super admins can manage payment methods"
ON public.payment_methods
FOR ALL
USING (public.is_super_admin());

CREATE POLICY "Users can view own restaurant payment methods"
ON public.payment_methods
FOR SELECT
USING (restaurant_id IN (
  SELECT restaurant_id FROM public.restaurant_users WHERE user_id = auth.uid()
));

CREATE POLICY "Users can insert own restaurant payment methods"
ON public.payment_methods
FOR INSERT
WITH CHECK (restaurant_id IN (
  SELECT restaurant_id FROM public.restaurant_users WHERE user_id = auth.uid()
));

CREATE POLICY "Users can update own restaurant payment methods"
ON public.payment_methods
FOR UPDATE
USING (restaurant_id IN (
  SELECT restaurant_id FROM public.restaurant_users WHERE user_id = auth.uid()
));

CREATE POLICY "Users can delete own restaurant payment methods"
ON public.payment_methods
FOR DELETE
USING (restaurant_id IN (
  SELECT restaurant_id FROM public.restaurant_users WHERE user_id = auth.uid()
));

-- ============================================================================
-- TAX_SETTINGS TABLE RLS
-- ============================================================================
ALTER TABLE public.tax_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can manage tax settings" ON public.tax_settings;
DROP POLICY IF EXISTS "Users can view own restaurant tax settings" ON public.tax_settings;

CREATE POLICY "Super admins can manage tax settings"
ON public.tax_settings
FOR ALL
USING (public.is_super_admin());

CREATE POLICY "Users can view own restaurant tax settings"
ON public.tax_settings
FOR SELECT
USING (restaurant_id IN (
  SELECT restaurant_id FROM public.restaurant_users WHERE user_id = auth.uid()
));

CREATE POLICY "Users can insert own restaurant tax settings"
ON public.tax_settings
FOR INSERT
WITH CHECK (restaurant_id IN (
  SELECT restaurant_id FROM public.restaurant_users WHERE user_id = auth.uid()
));

CREATE POLICY "Users can update own restaurant tax settings"
ON public.tax_settings
FOR UPDATE
USING (restaurant_id IN (
  SELECT restaurant_id FROM public.restaurant_users WHERE user_id = auth.uid()
));

CREATE POLICY "Users can delete own restaurant tax settings"
ON public.tax_settings
FOR DELETE
USING (restaurant_id IN (
  SELECT restaurant_id FROM public.restaurant_users WHERE user_id = auth.uid()
));

-- ============================================================================
-- CURRENCIES TABLE RLS
-- ============================================================================
ALTER TABLE public.currencies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can manage currencies" ON public.currencies;
DROP POLICY IF EXISTS "Users can view own restaurant currencies" ON public.currencies;

CREATE POLICY "Super admins can manage currencies"
ON public.currencies
FOR ALL
USING (public.is_super_admin());

CREATE POLICY "Users can view own restaurant currencies"
ON public.currencies
FOR SELECT
USING (restaurant_id IN (
  SELECT restaurant_id FROM public.restaurant_users WHERE user_id = auth.uid()
));

CREATE POLICY "Users can insert own restaurant currencies"
ON public.currencies
FOR INSERT
WITH CHECK (restaurant_id IN (
  SELECT restaurant_id FROM public.restaurant_users WHERE user_id = auth.uid()
));

CREATE POLICY "Users can update own restaurant currencies"
ON public.currencies
FOR UPDATE
USING (restaurant_id IN (
  SELECT restaurant_id FROM public.restaurant_users WHERE user_id = auth.uid()
));

CREATE POLICY "Users can delete own restaurant currencies"
ON public.currencies
FOR DELETE
USING (restaurant_id IN (
  SELECT restaurant_id FROM public.restaurant_users WHERE user_id = auth.uid()
));

-- ============================================================================
-- AUDIT_LOGS TABLE RLS
-- ============================================================================
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can manage audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Users can view own tenant audit logs" ON public.audit_logs;

CREATE POLICY "Super admins can manage audit logs"
ON public.audit_logs
FOR ALL
USING (public.is_super_admin());

CREATE POLICY "Users can view own tenant audit logs"
ON public.audit_logs
FOR SELECT
USING (tenant_id = public.get_user_tenant_id());

-- ============================================================================
-- ACTIVITY_LOGS TABLE RLS
-- ============================================================================
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can manage activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Users can view own tenant activity logs" ON public.activity_logs;

CREATE POLICY "Super admins can manage activity logs"
ON public.activity_logs
FOR ALL
USING (public.is_super_admin());

CREATE POLICY "Users can view own tenant activity logs"
ON public.activity_logs
FOR SELECT
USING (tenant_id = public.get_user_tenant_id());

-- ============================================================================
-- NOTIFICATIONS TABLE RLS
-- ============================================================================
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can manage notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;

CREATE POLICY "Super admins can manage notifications"
ON public.notifications
FOR ALL
USING (public.is_super_admin());

CREATE POLICY "Users can view own notifications"
ON public.notifications
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
ON public.notifications
FOR UPDATE
USING (user_id = auth.uid());

-- ============================================================================
-- SYSTEM_SETTINGS TABLE RLS
-- ============================================================================
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can manage system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Authenticated users can view public system settings" ON public.system_settings;

CREATE POLICY "Super admins can manage system settings"
ON public.system_settings
FOR ALL
USING (public.is_super_admin());

CREATE POLICY "Authenticated users can view public system settings"
ON public.system_settings
FOR SELECT
USING (is_public = true);

-- ============================================================================
-- API_KEYS TABLE RLS
-- ============================================================================
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can manage api keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can view own api keys" ON public.api_keys;

CREATE POLICY "Super admins can manage api keys"
ON public.api_keys
FOR ALL
USING (public.is_super_admin());

CREATE POLICY "Users can view own api keys"
ON public.api_keys
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own api keys"
ON public.api_keys
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own api keys"
ON public.api_keys
FOR DELETE
USING (user_id = auth.uid());

-- ============================================================================
-- USER_SESSIONS TABLE RLS
-- ============================================================================
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can manage user sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can view own sessions" ON public.user_sessions;

CREATE POLICY "Super admins can manage user sessions"
ON public.user_sessions
FOR ALL
USING (public.is_super_admin());

CREATE POLICY "Users can view own sessions"
ON public.user_sessions
FOR SELECT
USING (user_id = auth.uid());

-- ============================================================================
-- LOGIN_HISTORY TABLE RLS
-- ============================================================================
ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can manage login history" ON public.login_history;
DROP POLICY IF EXISTS "Users can view own login history" ON public.login_history;

CREATE POLICY "Super admins can manage login history"
ON public.login_history
FOR ALL
USING (public.is_super_admin());

CREATE POLICY "Users can view own login history"
ON public.login_history
FOR SELECT
USING (user_id = auth.uid());

-- ============================================================================
-- SUPPORT_TICKETS TABLE RLS
-- ============================================================================
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can manage support tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can view own tenant support tickets" ON public.support_tickets;

CREATE POLICY "Super admins can manage support tickets"
ON public.support_tickets
FOR ALL
USING (public.is_super_admin());

CREATE POLICY "Users can view own tenant support tickets"
ON public.support_tickets
FOR SELECT
USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can insert own tenant support tickets"
ON public.support_tickets
FOR INSERT
WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can update own tenant support tickets"
ON public.support_tickets
FOR UPDATE
USING (tenant_id = public.get_user_tenant_id());

-- ============================================================================
-- ATTACHMENTS TABLE RLS
-- ============================================================================
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can manage attachments" ON public.attachments;
DROP POLICY IF EXISTS "Users can view own tenant attachments" ON public.attachments;

CREATE POLICY "Super admins can manage attachments"
ON public.attachments
FOR ALL
USING (public.is_super_admin());

CREATE POLICY "Users can view own tenant attachments"
ON public.attachments
FOR SELECT
USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can insert own tenant attachments"
ON public.attachments
FOR INSERT
WITH CHECK (tenant_id = public.get_user_tenant_id());

-- ============================================================================
-- RESTAURANT_STORAGE TABLE RLS
-- ============================================================================
ALTER TABLE public.restaurant_storage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can manage restaurant storage" ON public.restaurant_storage;
DROP POLICY IF EXISTS "Users can view own restaurant storage" ON public.restaurant_storage;

CREATE POLICY "Super admins can manage restaurant storage"
ON public.restaurant_storage
FOR ALL
USING (public.is_super_admin());

CREATE POLICY "Users can view own restaurant storage"
ON public.restaurant_storage
FOR SELECT
USING (restaurant_id IN (
  SELECT restaurant_id FROM public.restaurant_users WHERE user_id = auth.uid()
));

CREATE POLICY "Users can update own restaurant storage"
ON public.restaurant_storage
FOR UPDATE
USING (restaurant_id IN (
  SELECT restaurant_id FROM public.restaurant_users WHERE user_id = auth.uid()
));

-- ============================================================================
-- RESTAURANT_STATISTICS TABLE RLS
-- ============================================================================
ALTER TABLE public.restaurant_statistics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can manage restaurant statistics" ON public.restaurant_statistics;
DROP POLICY IF EXISTS "Users can view own restaurant statistics" ON public.restaurant_statistics;

CREATE POLICY "Super admins can manage restaurant statistics"
ON public.restaurant_statistics
FOR ALL
USING (public.is_super_admin());

CREATE POLICY "Users can view own restaurant statistics"
ON public.restaurant_statistics
FOR SELECT
USING (tenant_id = public.get_user_tenant_id());

-- ============================================================================
-- ANALYTICS TABLE RLS
-- ============================================================================
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can manage analytics" ON public.analytics;
DROP POLICY IF EXISTS "Users can view own tenant analytics" ON public.analytics;

CREATE POLICY "Super admins can manage analytics"
ON public.analytics
FOR ALL
USING (public.is_super_admin());

CREATE POLICY "Users can view own tenant analytics"
ON public.analytics
FOR SELECT
USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can insert own tenant analytics"
ON public.analytics
FOR INSERT
WITH CHECK (tenant_id = public.get_user_tenant_id());
