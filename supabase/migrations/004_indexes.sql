-- ============================================================================
-- 004: Indexes
-- ============================================================================
-- This migration creates performance indexes for all tables.
--
-- Dependencies: 003_tables.sql
-- Idempotent: Yes (uses CREATE INDEX IF NOT EXISTS)
-- ============================================================================

-- ============================================================================
-- USERS TABLE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_super_admin ON public.users(is_super_admin);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at DESC);

-- ============================================================================
-- TENANTS TABLE INDEXES
-- ============================================================================
-- Add status column if it doesn't exist (for backward compatibility with existing Supabase tables)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tenants' 
    AND column_name = 'status'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.tenants ADD COLUMN status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted'));
    RAISE NOTICE 'Added status column to tenants table';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON public.tenants(status);
CREATE INDEX IF NOT EXISTS idx_tenants_subscription_status ON public.tenants(subscription_status);
CREATE INDEX IF NOT EXISTS idx_tenants_subscription_tier ON public.tenants(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_tenants_created_at ON public.tenants(created_at DESC);

-- ============================================================================
-- RESTAURANTS TABLE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_restaurants_tenant_id ON public.restaurants(tenant_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_slug ON public.restaurants(slug);
CREATE INDEX IF NOT EXISTS idx_restaurants_status ON public.restaurants(status);
CREATE INDEX IF NOT EXISTS idx_restaurants_tenant_slug ON public.restaurants(tenant_id, slug);
CREATE INDEX IF NOT EXISTS idx_restaurants_created_at ON public.restaurants(created_at DESC);

-- ============================================================================
-- RESTAURANT_SETTINGS TABLE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_restaurant_settings_restaurant_id ON public.restaurant_settings(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_settings_tenant_id ON public.restaurant_settings(tenant_id);

-- ============================================================================
-- RESTAURANT_BRANCHES TABLE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_restaurant_branches_tenant_id ON public.restaurant_branches(tenant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_branches_restaurant_id ON public.restaurant_branches(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_branches_code ON public.restaurant_branches(code);
CREATE INDEX IF NOT EXISTS idx_restaurant_branches_status ON public.restaurant_branches(status);
CREATE INDEX IF NOT EXISTS idx_restaurant_branches_is_main ON public.restaurant_branches(is_main);

-- ============================================================================
-- SUBSCRIPTION_PLANS TABLE INDEXES
-- ============================================================================
-- Add missing columns if they don't exist (for backward compatibility with existing Supabase tables)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscription_plans' 
    AND column_name = 'slug'
    AND table_schema = 'public'
  ) THEN
    -- Add column as nullable first
    ALTER TABLE public.subscription_plans ADD COLUMN slug TEXT;
    -- Update existing rows with a default slug based on name
    UPDATE public.subscription_plans SET slug = lower(regexp_replace(name, '[^a-zA-Z0-9]', '-', 'g')) WHERE slug IS NULL;
    -- Now make it NOT NULL and add UNIQUE constraint
    ALTER TABLE public.subscription_plans ALTER COLUMN slug SET NOT NULL;
    ALTER TABLE public.subscription_plans ADD CONSTRAINT subscription_plans_slug_key UNIQUE (slug);
    RAISE NOTICE 'Added slug column to subscription_plans table';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_subscription_plans_slug ON public.subscription_plans(slug);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_is_active ON public.subscription_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_sort_order ON public.subscription_plans(sort_order);

-- ============================================================================
-- SUBSCRIPTIONS TABLE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant_id ON public.subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_restaurant_id ON public.subscriptions(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON public.subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_current_period_end ON public.subscriptions(current_period_end);
CREATE INDEX IF NOT EXISTS idx_subscriptions_trial_end_date ON public.subscriptions(trial_end_date);

-- ============================================================================
-- ROLES TABLE INDEXES
-- ============================================================================
-- Add missing columns if they don't exist (for backward compatibility with existing Supabase tables)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'roles' 
    AND column_name = 'slug'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.roles ADD COLUMN slug TEXT NOT NULL;
    RAISE NOTICE 'Added slug column to roles table';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'roles' 
    AND column_name = 'level'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.roles ADD COLUMN level INTEGER DEFAULT 0;
    RAISE NOTICE 'Added level column to roles table';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'roles' 
    AND column_name = 'is_system'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.roles ADD COLUMN is_system BOOLEAN NOT NULL DEFAULT false;
    RAISE NOTICE 'Added is_system column to roles table';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_roles_tenant_id ON public.roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_roles_restaurant_id ON public.roles(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_roles_slug ON public.roles(slug);
CREATE INDEX IF NOT EXISTS idx_roles_level ON public.roles(level);
CREATE INDEX IF NOT EXISTS idx_roles_is_system ON public.roles(is_system);

-- ============================================================================
-- PERMISSIONS TABLE INDEXES
-- ============================================================================
-- Add missing columns if they don't exist (for backward compatibility with existing Supabase tables)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'permissions' 
    AND column_name = 'slug'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.permissions ADD COLUMN slug TEXT NOT NULL UNIQUE;
    RAISE NOTICE 'Added slug column to permissions table';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'permissions' 
    AND column_name = 'module'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.permissions ADD COLUMN module TEXT NOT NULL;
    RAISE NOTICE 'Added module column to permissions table';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'permissions' 
    AND column_name = 'action'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.permissions ADD COLUMN action TEXT NOT NULL;
    RAISE NOTICE 'Added action column to permissions table';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_permissions_slug ON public.permissions(slug);
CREATE INDEX IF NOT EXISTS idx_permissions_module ON public.permissions(module);
CREATE INDEX IF NOT EXISTS idx_permissions_action ON public.permissions(action);

-- ============================================================================
-- ROLE_PERMISSIONS TABLE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON public.role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON public.role_permissions(permission_id);

-- ============================================================================
-- RESTAURANT_USERS TABLE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_restaurant_users_tenant_id ON public.restaurant_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_users_restaurant_id ON public.restaurant_users(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_users_branch_id ON public.restaurant_users(branch_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_users_user_id ON public.restaurant_users(user_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_users_role_id ON public.restaurant_users(role_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_users_email ON public.restaurant_users(email);
CREATE INDEX IF NOT EXISTS idx_restaurant_users_status ON public.restaurant_users(status);
CREATE INDEX IF NOT EXISTS idx_restaurant_users_is_owner ON public.restaurant_users(is_owner);
CREATE INDEX IF NOT EXISTS idx_restaurant_users_tenant_user ON public.restaurant_users(tenant_id, user_id);

-- ============================================================================
-- EMPLOYEES TABLE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_employees_tenant_id ON public.employees(tenant_id);
CREATE INDEX IF NOT EXISTS idx_employees_restaurant_id ON public.employees(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_employees_branch_id ON public.employees(branch_id);
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON public.employees(user_id);
CREATE INDEX IF NOT EXISTS idx_employees_role_id ON public.employees(role_id);
CREATE INDEX IF NOT EXISTS idx_employees_employee_code ON public.employees(employee_code);
CREATE INDEX IF NOT EXISTS idx_employees_email ON public.employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_status ON public.employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_employment_type ON public.employees(employment_type);

-- ============================================================================
-- CUSTOMERS TABLE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_customers_tenant_id ON public.customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customers_restaurant_id ON public.customers(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_customers_customer_code ON public.customers(customer_code);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_loyalty_tier ON public.customers(loyalty_tier);
CREATE INDEX IF NOT EXISTS idx_customers_last_visit_at ON public.customers(last_visit_at DESC);

-- ============================================================================
-- TABLES TABLE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_tables_tenant_id ON public.tables(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tables_restaurant_id ON public.tables(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_tables_branch_id ON public.tables(branch_id);
CREATE INDEX IF NOT EXISTS idx_tables_table_number ON public.tables(table_number);
CREATE INDEX IF NOT EXISTS idx_tables_status ON public.tables(status);
CREATE INDEX IF NOT EXISTS idx_tables_restaurant_branch_table ON public.tables(restaurant_id, branch_id, table_number);

-- ============================================================================
-- MENU_CATEGORIES TABLE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_menu_categories_tenant_id ON public.menu_categories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_menu_categories_restaurant_id ON public.menu_categories(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_categories_slug ON public.menu_categories(slug);
CREATE INDEX IF NOT EXISTS idx_menu_categories_parent_id ON public.menu_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_menu_categories_sort_order ON public.menu_categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_menu_categories_is_active ON public.menu_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_menu_categories_restaurant_slug ON public.menu_categories(restaurant_id, slug);

-- ============================================================================
-- PRODUCTS TABLE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_products_tenant_id ON public.products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_restaurant_id ON public.products(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_product_code ON public.products(product_code);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_is_available ON public.products(is_available);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON public.products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_restaurant_slug ON public.products(restaurant_id, slug);

-- ============================================================================
-- INVENTORY TABLE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_inventory_tenant_id ON public.inventory(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_restaurant_id ON public.inventory(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_branch_id ON public.inventory(branch_id);
CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON public.inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_item_code ON public.inventory(item_code);
CREATE INDEX IF NOT EXISTS idx_inventory_category_id ON public.inventory(category_id);
CREATE INDEX IF NOT EXISTS idx_inventory_supplier_id ON public.inventory(supplier_id);
CREATE INDEX IF NOT EXISTS idx_inventory_status ON public.inventory(status);
CREATE INDEX IF NOT EXISTS idx_inventory_expiry_date ON public.inventory(expiry_date);

-- ============================================================================
-- INVENTORY_CATEGORIES TABLE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_inventory_categories_tenant_id ON public.inventory_categories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_categories_restaurant_id ON public.inventory_categories(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_categories_slug ON public.inventory_categories(slug);
CREATE INDEX IF NOT EXISTS idx_inventory_categories_parent_id ON public.inventory_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_inventory_categories_sort_order ON public.inventory_categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_inventory_categories_restaurant_slug ON public.inventory_categories(restaurant_id, slug);

-- ============================================================================
-- SUPPLIERS TABLE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_suppliers_tenant_id ON public.suppliers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_restaurant_id ON public.suppliers(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_supplier_code ON public.suppliers(supplier_code);
CREATE INDEX IF NOT EXISTS idx_suppliers_email ON public.suppliers(email);
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON public.suppliers(status);

-- ============================================================================
-- ORDERS TABLE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_orders_tenant_id ON public.orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id ON public.orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_branch_id ON public.orders(branch_id);
CREATE INDEX IF NOT EXISTS idx_orders_table_id ON public.orders(table_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_order_type ON public.orders(order_type);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_branch_number ON public.orders(restaurant_id, branch_id, order_number);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_status_date ON public.orders(restaurant_id, status, created_at DESC);

-- ============================================================================
-- ORDER_ITEMS TABLE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_order_items_tenant_id ON public.order_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_order_items_restaurant_id ON public.order_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_status ON public.order_items(status);

-- ============================================================================
-- PAYMENTS TABLE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_payments_tenant_id ON public.payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_restaurant_id ON public.payments(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_method_id ON public.payments(payment_method_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_number ON public.payments(payment_number);
CREATE INDEX IF NOT EXISTS idx_payments_payment_type ON public.payments(payment_type);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_restaurant_number ON public.payments(restaurant_id, payment_number);

-- ============================================================================
-- PAYMENT_METHODS TABLE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_payment_methods_tenant_id ON public.payment_methods(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_restaurant_id ON public.payment_methods(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_type ON public.payment_methods(type);
CREATE INDEX IF NOT EXISTS idx_payment_methods_is_active ON public.payment_methods(is_active);
CREATE INDEX IF NOT EXISTS idx_payment_methods_is_default ON public.payment_methods(is_default);
CREATE INDEX IF NOT EXISTS idx_payment_methods_sort_order ON public.payment_methods(sort_order);

-- ============================================================================
-- TAX_SETTINGS TABLE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_tax_settings_tenant_id ON public.tax_settings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tax_settings_restaurant_id ON public.tax_settings(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_tax_settings_is_active ON public.tax_settings(is_active);

-- ============================================================================
-- CURRENCIES TABLE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_currencies_tenant_id ON public.currencies(tenant_id);
CREATE INDEX IF NOT EXISTS idx_currencies_restaurant_id ON public.currencies(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_currencies_code ON public.currencies(code);
CREATE INDEX IF NOT EXISTS idx_currencies_is_default ON public.currencies(is_default);
CREATE INDEX IF NOT EXISTS idx_currencies_is_active ON public.currencies(is_active);

-- ============================================================================
-- AUDIT_LOGS TABLE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON public.audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_restaurant_id ON public.audit_logs(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_created ON public.audit_logs(tenant_id, created_at DESC);

-- ============================================================================
-- ACTIVITY_LOGS TABLE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_activity_logs_tenant_id ON public.activity_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_restaurant_id ON public.activity_logs(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON public.activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_type ON public.activity_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_tenant_created ON public.activity_logs(tenant_id, created_at DESC);

-- ============================================================================
-- NOTIFICATIONS TABLE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_notifications_tenant_id ON public.notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_restaurant_id ON public.notifications(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created ON public.notifications(user_id, is_read, created_at DESC);

-- ============================================================================
-- SYSTEM_SETTINGS TABLE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON public.system_settings(key);
CREATE INDEX IF NOT EXISTS idx_system_settings_is_public ON public.system_settings(is_public);

-- ============================================================================
-- API_KEYS TABLE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_api_keys_tenant_id ON public.api_keys(tenant_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_restaurant_id ON public.api_keys(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON public.api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON public.api_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_api_keys_expires_at ON public.api_keys(expires_at);

-- ============================================================================
-- USER_SESSIONS TABLE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_tenant_id ON public.user_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_restaurant_id ON public.user_sessions(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_started_at ON public.user_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity_at ON public.user_sessions(last_activity_at DESC);

-- ============================================================================
-- LOGIN_HISTORY TABLE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_login_history_user_id ON public.login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_tenant_id ON public.login_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_login_history_restaurant_id ON public.login_history(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_login_history_status ON public.login_history(status);
CREATE INDEX IF NOT EXISTS idx_login_history_created_at ON public.login_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_history_user_created ON public.login_history(user_id, created_at DESC);

-- ============================================================================
-- SUPPORT_TICKETS TABLE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_support_tickets_tenant_id ON public.support_tickets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_restaurant_id ON public.support_tickets(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_ticket_number ON public.support_tickets(ticket_number);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON public.support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to ON public.support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON public.support_tickets(created_at DESC);

-- ============================================================================
-- ATTACHMENTS TABLE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_attachments_tenant_id ON public.attachments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_attachments_restaurant_id ON public.attachments(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_attachments_entity_type ON public.attachments(entity_type);
CREATE INDEX IF NOT EXISTS idx_attachments_entity_id ON public.attachments(entity_id);
CREATE INDEX IF NOT EXISTS idx_attachments_uploaded_by ON public.attachments(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_attachments_created_at ON public.attachments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_attachments_entity_type_id ON public.attachments(entity_type, entity_id);

-- ============================================================================
-- RESTAURANT_STORAGE TABLE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_restaurant_storage_tenant_id ON public.restaurant_storage(tenant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_storage_restaurant_id ON public.restaurant_storage(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_storage_tenant_restaurant ON public.restaurant_storage(tenant_id, restaurant_id);

-- ============================================================================
-- RESTAURANT_STATISTICS TABLE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_restaurant_statistics_tenant_id ON public.restaurant_statistics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_statistics_restaurant_id ON public.restaurant_statistics(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_statistics_branch_id ON public.restaurant_statistics(branch_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_statistics_date ON public.restaurant_statistics(date);
CREATE INDEX IF NOT EXISTS idx_restaurant_statistics_restaurant_date ON public.restaurant_statistics(restaurant_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_restaurant_statistics_tenant_date ON public.restaurant_statistics(tenant_id, date DESC);

-- ============================================================================
-- ANALYTICS TABLE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_analytics_tenant_id ON public.analytics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_analytics_restaurant_id ON public.analytics(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON public.analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event_name ON public.analytics(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_session_id ON public.analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON public.analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_tenant_created ON public.analytics(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_event_created ON public.analytics(event_name, created_at DESC);

-- ============================================================================
-- Verification
-- ============================================================================
-- Count all created indexes
SELECT 
  COUNT(*) as index_count,
  'Indexes created successfully' as status
FROM pg_indexes 
WHERE schemaname = 'public';
