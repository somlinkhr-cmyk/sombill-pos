-- ============================================================================
-- POSTGRESQL FUNCTIONS FOR RESTAURANT CREATION
-- Production-ready functions for multi-tenant restaurant management
-- ============================================================================

-- ============================================================================
-- HELPER FUNCTIONS FOR RLS
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
-- CREATE RESTAURANT - Main Transaction Function
-- ============================================================================
CREATE OR REPLACE FUNCTION public.create_restaurant(
  p_restaurant_name TEXT,
  p_restaurant_slug TEXT,
  p_business_type TEXT,
  p_phone TEXT,
  p_email TEXT,
  p_country TEXT,
  p_city TEXT,
  p_address TEXT,
  p_currency TEXT DEFAULT 'USD',
  p_timezone TEXT DEFAULT 'UTC',
  p_language TEXT DEFAULT 'en',
  p_plan_id UUID,
  p_billing_cycle TEXT DEFAULT 'monthly',
  p_owner_first_name TEXT,
  p_owner_last_name TEXT,
  p_owner_email TEXT,
  p_owner_phone TEXT,
  p_owner_password TEXT,
  p_created_by UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id UUID;
  v_restaurant_id UUID;
  v_branch_id UUID;
  v_subscription_id UUID;
  v_owner_user_id UUID;
  v_restaurant_user_id UUID;
  v_admin_role_id UUID;
  v_manager_role_id UUID;
  v_cashier_role_id UUID;
  v_waiter_role_id UUID;
  v_kitchen_role_id UUID;
  v_inventory_role_id UUID;
  v_result JSONB;
BEGIN
  -- Start transaction
  -- Create tenant
  INSERT INTO public.tenants (
    name,
    slug,
    subscription_tier,
    subscription_status,
    billing_cycle_start,
    trial_ends_at,
    status
  ) VALUES (
    p_restaurant_name,
    p_restaurant_slug,
    'starter',
    'trialing',
    CURRENT_DATE,
    NOW() + INTERVAL '14 days',
    'active'
  ) RETURNING id INTO v_tenant_id;

  -- Create restaurant
  INSERT INTO public.restaurants (
    tenant_id,
    name,
    slug,
    business_type,
    phone,
    email,
    country,
    city,
    address,
    currency,
    timezone,
    language,
    status,
    created_by
  ) VALUES (
    v_tenant_id,
    p_restaurant_name,
    p_restaurant_slug,
    p_business_type,
    p_phone,
    p_email,
    p_country,
    p_city,
    p_address,
    p_currency,
    p_timezone,
    p_language,
    'active',
    p_created_by
  ) RETURNING id INTO v_restaurant_id;

  -- Create main branch
  INSERT INTO public.restaurant_branches (
    tenant_id,
    restaurant_id,
    name,
    code,
    address,
    phone,
    email,
    city,
    country,
    is_main,
    status,
    created_by
  ) VALUES (
    v_tenant_id,
    v_restaurant_id,
    'Main Branch',
    'MAIN',
    p_address,
    p_phone,
    p_email,
    p_city,
    p_country,
    true,
    'active',
    p_created_by
  ) RETURNING id INTO v_branch_id;

  -- Create subscription
  INSERT INTO public.subscriptions (
    tenant_id,
    restaurant_id,
    plan_id,
    status,
    billing_cycle,
    current_period_start,
    current_period_end,
    start_date,
    end_date,
    trial_start,
    trial_end,
    trial_end_date,
    auto_renew
  ) VALUES (
    v_tenant_id,
    v_restaurant_id,
    p_plan_id,
    'trial',
    p_billing_cycle,
    NOW(),
    NOW() + INTERVAL '1 month',
    NOW(),
    NOW() + INTERVAL '1 month',
    NOW(),
    NOW() + INTERVAL '14 days',
    NOW() + INTERVAL '14 days',
    true
  ) RETURNING id INTO v_subscription_id;

  -- Create Supabase Auth user for owner
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  ) VALUES (
    uuid_generate_v4(),
    p_owner_email,
    crypt(p_owner_password, gen_salt('bf')),
    NOW(),
    '{"provider":"email","provider_id":"' || p_owner_email || '"}',
    '{"full_name":"' || p_owner_first_name || ' ' || p_owner_last_name || '"}',
    NOW(),
    NOW()
  ) RETURNING id INTO v_owner_user_id;

  -- Create restaurant user record for owner
  INSERT INTO public.restaurant_users (
    tenant_id,
    restaurant_id,
    branch_id,
    user_id,
    role_id,
    first_name,
    last_name,
    email,
    phone,
    status,
    is_owner,
    created_by
  ) VALUES (
    v_tenant_id,
    v_restaurant_id,
    v_branch_id,
    v_owner_user_id,
    NULL, -- Will be set after role creation
    p_owner_first_name,
    p_owner_last_name,
    p_owner_email,
    p_owner_phone,
    'active',
    true,
    p_created_by
  ) RETURNING id INTO v_restaurant_user_id;

  -- Create default roles
  -- Admin Role
  INSERT INTO public.roles (
    tenant_id,
    restaurant_id,
    name,
    slug,
    description,
    is_system,
    level,
    created_by
  ) VALUES (
    v_tenant_id,
    v_restaurant_id,
    'Admin',
    'admin',
    'Full access to all restaurant operations',
    true,
    100,
    p_created_by
  ) RETURNING id INTO v_admin_role_id;

  -- Manager Role
  INSERT INTO public.roles (
    tenant_id,
    restaurant_id,
    name,
    slug,
    description,
    is_system,
    level,
    created_by
  ) VALUES (
    v_tenant_id,
    v_restaurant_id,
    'Manager',
    'manager',
    'Manage restaurant operations and staff',
    true,
    80,
    p_created_by
  ) RETURNING id INTO v_manager_role_id;

  -- Cashier Role
  INSERT INTO public.roles (
    tenant_id,
    restaurant_id,
    name,
    slug,
    description,
    is_system,
    level,
    created_by
  ) VALUES (
    v_tenant_id,
    v_restaurant_id,
    'Cashier',
    'cashier',
    'Process orders and payments',
    true,
    50,
    p_created_by
  ) RETURNING id INTO v_cashier_role_id;

  -- Waiter Role
  INSERT INTO public.roles (
    tenant_id,
    restaurant_id,
    name,
    slug,
    description,
    is_system,
    level,
    created_by
  ) VALUES (
    v_tenant_id,
    v_restaurant_id,
    'Waiter',
    'waiter',
    'Take orders and serve customers',
    true,
    40,
    p_created_by
  ) RETURNING id INTO v_waiter_role_id;

  -- Kitchen Role
  INSERT INTO public.roles (
    tenant_id,
    restaurant_id,
    name,
    slug,
    description,
    is_system,
    level,
    created_by
  ) VALUES (
    v_tenant_id,
    v_restaurant_id,
    'Kitchen',
    'kitchen',
    'Prepare food and manage kitchen operations',
    true,
    30,
    p_created_by
  ) RETURNING id INTO v_kitchen_role_id;

  -- Inventory Role
  INSERT INTO public.roles (
    tenant_id,
    restaurant_id,
    name,
    slug,
    description,
    is_system,
    level,
    created_by
  ) VALUES (
    v_tenant_id,
    v_restaurant_id,
    'Inventory',
    'inventory',
    'Manage inventory and supplies',
    true,
    35,
    p_created_by
  ) RETURNING id INTO v_inventory_role_id;

  -- Update owner with admin role
  UPDATE public.restaurant_users
  SET role_id = v_admin_role_id
  WHERE id = v_restaurant_user_id;

  -- Create restaurant settings
  INSERT INTO public.restaurant_settings (
    restaurant_id,
    tenant_id,
    tax_rate,
    service_charge,
    timezone,
    currency_symbol,
    currency_position,
    decimal_places,
    thousands_separator,
    qr_menu_enabled,
    created_by
  ) VALUES (
    v_restaurant_id,
    v_tenant_id,
    0,
    0,
    p_timezone,
    CASE p_currency
      WHEN 'USD' THEN '$'
      WHEN 'EUR' THEN '€'
      WHEN 'GBP' THEN '£'
      WHEN 'SOS' THEN 'S'
      ELSE '$'
    END,
    'before',
    2,
    ',',
    true,
    p_created_by
  );

  -- Create restaurant storage record
  INSERT INTO public.restaurant_storage (
    tenant_id,
    restaurant_id,
    storage_used,
    storage_limit,
    files_count
  ) VALUES (
    v_tenant_id,
    v_restaurant_id,
    0,
    1073741824, -- 1GB default
    0
  );

  -- Create restaurant statistics record
  INSERT INTO public.restaurant_statistics (
    tenant_id,
    restaurant_id,
    branch_id,
    date,
    total_orders,
    total_revenue,
    total_customers,
    average_order_value,
    items_sold,
    unique_customers
  ) VALUES (
    v_tenant_id,
    v_restaurant_id,
    v_branch_id,
    CURRENT_DATE,
    0,
    0,
    0,
    0,
    0,
    0
  );

  -- Create default currency
  INSERT INTO public.currencies (
    tenant_id,
    restaurant_id,
    code,
    name,
    symbol,
    exchange_rate,
    is_default,
    is_active,
    created_by
  ) VALUES (
    v_tenant_id,
    v_restaurant_id,
    p_currency,
    CASE p_currency
      WHEN 'USD' THEN 'US Dollar'
      WHEN 'EUR' THEN 'Euro'
      WHEN 'GBP' THEN 'British Pound'
      WHEN 'SOS' THEN 'Somali Shilling'
      ELSE 'US Dollar'
    END,
    CASE p_currency
      WHEN 'USD' THEN '$'
      WHEN 'EUR' THEN '€'
      WHEN 'GBP' THEN '£'
      WHEN 'SOS' THEN 'S'
      ELSE '$'
    END,
    1,
    true,
    true,
    p_created_by
  );

  -- Create default payment methods
  INSERT INTO public.payment_methods (tenant_id, restaurant_id, name, type, is_active, is_default, sort_order, created_by) VALUES
    (v_tenant_id, v_restaurant_id, 'Cash', 'cash', true, true, 1, p_created_by),
    (v_tenant_id, v_restaurant_id, 'Card', 'card', true, false, 2, p_created_by),
    (v_tenant_id, v_restaurant_id, 'Zaad', 'mobile', true, false, 3, p_created_by),
    (v_tenant_id, v_restaurant_id, 'eDahab', 'mobile', true, false, 4, p_created_by),
    (v_tenant_id, v_restaurant_id, 'Premier Wallet', 'mobile', true, false, 5, p_created_by),
    (v_tenant_id, v_restaurant_id, 'Bank Transfer', 'bank_transfer', true, false, 6, p_created_by);

  -- Create default menu categories
  INSERT INTO public.menu_categories (tenant_id, restaurant_id, name, slug, sort_order, is_active, created_by) VALUES
    (v_tenant_id, v_restaurant_id, 'Breakfast', 'breakfast', 1, true, p_created_by),
    (v_tenant_id, v_restaurant_id, 'Lunch', 'lunch', 2, true, p_created_by),
    (v_tenant_id, v_restaurant_id, 'Dinner', 'dinner', 3, true, p_created_by),
    (v_tenant_id, v_restaurant_id, 'Desserts', 'desserts', 4, true, p_created_by),
    (v_tenant_id, v_restaurant_id, 'Drinks', 'drinks', 5, true, p_created_by),
    (v_tenant_id, v_restaurant_id, 'Coffee', 'coffee', 6, true, p_created_by),
    (v_tenant_id, v_restaurant_id, 'Tea', 'tea', 7, true, p_created_by),
    (v_tenant_id, v_restaurant_id, 'Fast Food', 'fast-food', 8, true, p_created_by),
    (v_tenant_id, v_restaurant_id, 'Pizza', 'pizza', 9, true, p_created_by),
    (v_tenant_id, v_restaurant_id, 'Burger', 'burger', 10, true, p_created_by),
    (v_tenant_id, v_restaurant_id, 'Chicken', 'chicken', 11, true, p_created_by),
    (v_tenant_id, v_restaurant_id, 'Seafood', 'seafood', 12, true, p_created_by),
    (v_tenant_id, v_restaurant_id, 'Traditional', 'traditional', 13, true, p_created_by);

  -- Create default inventory categories
  INSERT INTO public.inventory_categories (tenant_id, restaurant_id, name, slug, sort_order, is_active, created_by) VALUES
    (v_tenant_id, v_restaurant_id, 'Food Items', 'food-items', 1, true, p_created_by),
    (v_tenant_id, v_restaurant_id, 'Beverages', 'beverages', 2, true, p_created_by),
    (v_tenant_id, v_restaurant_id, 'Ingredients', 'ingredients', 3, true, p_created_by),
    (v_tenant_id, v_restaurant_id, 'Packaging', 'packaging', 4, true, p_created_by),
    (v_tenant_id, v_restaurant_id, 'Cleaning Supplies', 'cleaning-supplies', 5, true, p_created_by);

  -- Create default dining tables (20 tables)
  FOR i IN 1..20 LOOP
    INSERT INTO public.tables (
      tenant_id,
      restaurant_id,
      branch_id,
      table_number,
      name,
      capacity,
      status,
      created_by
    ) VALUES (
      v_tenant_id,
      v_restaurant_id,
      v_branch_id,
      i::TEXT,
      'Table ' || i::TEXT,
      4,
      'available',
      p_created_by
    );
  END LOOP;

  -- Create activity log
  INSERT INTO public.activity_logs (
    tenant_id,
    restaurant_id,
    user_id,
    action,
    entity_type,
    entity_id,
    description,
    metadata
  ) VALUES (
    v_tenant_id,
    v_restaurant_id,
    p_created_by,
    'restaurant_created',
    'restaurant',
    v_restaurant_id,
    'Restaurant created with all default settings',
    jsonb_build_object(
      'restaurant_name', p_restaurant_name,
      'owner_email', p_owner_email
    )
  );

  -- Build result
  v_result := jsonb_build_object(
    'success', true,
    'tenant_id', v_tenant_id,
    'restaurant_id', v_restaurant_id,
    'branch_id', v_branch_id,
    'subscription_id', v_subscription_id,
    'owner_user_id', v_owner_user_id,
    'restaurant_user_id', v_restaurant_user_id,
    'admin_role_id', v_admin_role_id,
    'message', 'Restaurant created successfully'
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    -- Rollback is automatic in PostgreSQL
    RAISE EXCEPTION 'Error creating restaurant: %', SQLERRM;
END;
$$;

-- ============================================================================
-- CREATE TENANT - Standalone Function
-- ============================================================================
CREATE OR REPLACE FUNCTION public.create_tenant(
  p_name TEXT,
  p_slug TEXT,
  p_subscription_tier TEXT DEFAULT 'starter',
  p_created_by UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  INSERT INTO public.tenants (
    name,
    slug,
    subscription_tier,
    subscription_status,
    billing_cycle_start,
    trial_ends_at,
    status,
    created_by
  ) VALUES (
    p_name,
    p_slug,
    p_subscription_tier,
    'trialing',
    CURRENT_DATE,
    NOW() + INTERVAL '14 days',
    'active',
    p_created_by
  ) RETURNING id INTO v_tenant_id;

  RETURN v_tenant_id;
END;
$$;

-- ============================================================================
-- CREATE SUBSCRIPTION - Standalone Function
-- ============================================================================
CREATE OR REPLACE FUNCTION public.create_subscription(
  p_tenant_id UUID,
  p_restaurant_id UUID,
  p_plan_id UUID,
  p_billing_cycle TEXT DEFAULT 'monthly',
  p_trial_days INTEGER DEFAULT 14
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_subscription_id UUID;
BEGIN
  INSERT INTO public.subscriptions (
    tenant_id,
    restaurant_id,
    plan_id,
    status,
    billing_cycle,
    current_period_start,
    current_period_end,
    start_date,
    end_date,
    trial_start,
    trial_end,
    trial_end_date,
    auto_renew
  ) VALUES (
    p_tenant_id,
    p_restaurant_id,
    p_plan_id,
    'trial',
    p_billing_cycle,
    NOW(),
    NOW() + INTERVAL '1 month',
    NOW(),
    NOW() + INTERVAL '1 month',
    NOW(),
    NOW() + (p_trial_days || ' days')::INTERVAL,
    NOW() + (p_trial_days || ' days')::INTERVAL,
    true
  ) RETURNING id INTO v_subscription_id;

  RETURN v_subscription_id;
END;
$$;

-- ============================================================================
-- CREATE OWNER - Standalone Function
-- ============================================================================
CREATE OR REPLACE FUNCTION public.create_owner(
  p_tenant_id UUID,
  p_restaurant_id UUID,
  p_branch_id UUID,
  p_first_name TEXT,
  p_last_name TEXT,
  p_email TEXT,
  p_phone TEXT,
  p_password TEXT,
  p_created_by UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_restaurant_user_id UUID;
  v_result JSONB;
BEGIN
  -- Create Supabase Auth user
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  ) VALUES (
    uuid_generate_v4(),
    p_email,
    crypt(p_password, gen_salt('bf')),
    NOW(),
    '{"provider":"email","provider_id":"' || p_email || '"}',
    '{"full_name":"' || p_first_name || ' ' || p_last_name || '"}',
    NOW(),
    NOW()
  ) RETURNING id INTO v_user_id;

  -- Create restaurant user record
  INSERT INTO public.restaurant_users (
    tenant_id,
    restaurant_id,
    branch_id,
    user_id,
    first_name,
    last_name,
    email,
    phone,
    status,
    is_owner,
    created_by
  ) VALUES (
    p_tenant_id,
    p_restaurant_id,
    p_branch_id,
    v_user_id,
    p_first_name,
    p_last_name,
    p_email,
    p_phone,
    'active',
    true,
    p_created_by
  ) RETURNING id INTO v_restaurant_user_id;

  v_result := jsonb_build_object(
    'user_id', v_user_id,
    'restaurant_user_id', v_restaurant_user_id,
    'success', true
  );

  RETURN v_result;
END;
$$;

-- ============================================================================
-- CREATE DEFAULT ROLES - Standalone Function
-- ============================================================================
CREATE OR REPLACE FUNCTION public.create_default_roles(
  p_tenant_id UUID,
  p_restaurant_id UUID,
  p_created_by UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_role_id UUID;
  v_manager_role_id UUID;
  v_cashier_role_id UUID;
  v_waiter_role_id UUID;
  v_kitchen_role_id UUID;
  v_inventory_role_id UUID;
  v_result JSONB;
BEGIN
  -- Admin Role
  INSERT INTO public.roles (
    tenant_id,
    restaurant_id,
    name,
    slug,
    description,
    is_system,
    level,
    created_by
  ) VALUES (
    p_tenant_id,
    p_restaurant_id,
    'Admin',
    'admin',
    'Full access to all restaurant operations',
    true,
    100,
    p_created_by
  ) RETURNING id INTO v_admin_role_id;

  -- Manager Role
  INSERT INTO public.roles (
    tenant_id,
    restaurant_id,
    name,
    slug,
    description,
    is_system,
    level,
    created_by
  ) VALUES (
    p_tenant_id,
    p_restaurant_id,
    'Manager',
    'manager',
    'Manage restaurant operations and staff',
    true,
    80,
    p_created_by
  ) RETURNING id INTO v_manager_role_id;

  -- Cashier Role
  INSERT INTO public.roles (
    tenant_id,
    restaurant_id,
    name,
    slug,
    description,
    is_system,
    level,
    created_by
  ) VALUES (
    p_tenant_id,
    p_restaurant_id,
    'Cashier',
    'cashier',
    'Process orders and payments',
    true,
    50,
    p_created_by
  ) RETURNING id INTO v_cashier_role_id;

  -- Waiter Role
  INSERT INTO public.roles (
    tenant_id,
    restaurant_id,
    name,
    slug,
    description,
    is_system,
    level,
    created_by
  ) VALUES (
    p_tenant_id,
    p_restaurant_id,
    'Waiter',
    'waiter',
    'Take orders and serve customers',
    true,
    40,
    p_created_by
  ) RETURNING id INTO v_waiter_role_id;

  -- Kitchen Role
  INSERT INTO public.roles (
    tenant_id,
    restaurant_id,
    name,
    slug,
    description,
    is_system,
    level,
    created_by
  ) VALUES (
    p_tenant_id,
    p_restaurant_id,
    'Kitchen',
    'kitchen',
    'Prepare food and manage kitchen operations',
    true,
    30,
    p_created_by
  ) RETURNING id INTO v_kitchen_role_id;

  -- Inventory Role
  INSERT INTO public.roles (
    tenant_id,
    restaurant_id,
    name,
    slug,
    description,
    is_system,
    level,
    created_by
  ) VALUES (
    p_tenant_id,
    p_restaurant_id,
    'Inventory',
    'inventory',
    'Manage inventory and supplies',
    true,
    35,
    p_created_by
  ) RETURNING id INTO v_inventory_role_id;

  v_result := jsonb_build_object(
    'admin_role_id', v_admin_role_id,
    'manager_role_id', v_manager_role_id,
    'cashier_role_id', v_cashier_role_id,
    'waiter_role_id', v_waiter_role_id,
    'kitchen_role_id', v_kitchen_role_id,
    'inventory_role_id', v_inventory_role_id,
    'success', true
  );

  RETURN v_result;
END;
$$;

-- ============================================================================
-- CREATE PERMISSIONS - Standalone Function
-- ============================================================================
CREATE OR REPLACE FUNCTION public.create_permissions()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.permissions (name, slug, description, module, action) VALUES
  -- Dashboard
  ('View Dashboard', 'view_dashboard', 'Access to dashboard', 'dashboard', 'read'),
  
  -- Restaurants
  ('View Restaurants', 'view_restaurants', 'View restaurant list', 'restaurants', 'read'),
  ('Create Restaurant', 'create_restaurant', 'Create new restaurant', 'restaurants', 'create'),
  ('Edit Restaurant', 'edit_restaurant', 'Edit restaurant details', 'restaurants', 'update'),
  ('Delete Restaurant', 'delete_restaurant', 'Delete restaurant', 'restaurants', 'delete'),
  
  -- Orders
  ('View Orders', 'view_orders', 'View order list', 'orders', 'read'),
  ('Create Order', 'create_order', 'Create new order', 'orders', 'create'),
  ('Edit Order', 'edit_order', 'Edit order details', 'orders', 'update'),
  ('Delete Order', 'delete_order', 'Delete order', 'orders', 'delete'),
  ('Process Payment', 'process_payment', 'Process order payments', 'orders', 'payment'),
  
  -- Menu
  ('View Menu', 'view_menu', 'View menu items', 'menu', 'read'),
  ('Create Menu Item', 'create_menu_item', 'Create menu item', 'menu', 'create'),
  ('Edit Menu Item', 'edit_menu_item', 'Edit menu item', 'menu', 'update'),
  ('Delete Menu Item', 'delete_menu_item', 'Delete menu item', 'menu', 'delete'),
  
  -- Inventory
  ('View Inventory', 'view_inventory', 'View inventory', 'inventory', 'read'),
  ('Manage Inventory', 'manage_inventory', 'Manage inventory items', 'inventory', 'update'),
  
  -- Customers
  ('View Customers', 'view_customers', 'View customer list', 'customers', 'read'),
  ('Create Customer', 'create_customer', 'Create customer', 'customers', 'create'),
  ('Edit Customer', 'edit_customer', 'Edit customer', 'customers', 'update'),
  ('Delete Customer', 'delete_customer', 'Delete customer', 'customers', 'delete'),
  
  -- Reports
  ('View Reports', 'view_reports', 'View reports', 'reports', 'read'),
  ('Export Reports', 'export_reports', 'Export reports', 'reports', 'export'),
  
  -- Settings
  ('View Settings', 'view_settings', 'View settings', 'settings', 'read'),
  ('Edit Settings', 'edit_settings', 'Edit settings', 'settings', 'update'),
  
  -- Users
  ('View Users', 'view_users', 'View user list', 'users', 'read'),
  ('Create User', 'create_user', 'Create user', 'users', 'create'),
  ('Edit User', 'edit_user', 'Edit user', 'users', 'update'),
  ('Delete User', 'delete_user', 'Delete user', 'users', 'delete'),
  
  -- Roles
  ('View Roles', 'view_roles', 'View roles', 'roles', 'read'),
  ('Create Role', 'create_role', 'Create role', 'roles', 'create'),
  ('Edit Role', 'edit_role', 'Edit role', 'roles', 'update'),
  ('Delete Role', 'delete_role', 'Delete role', 'roles', 'delete')
  ON CONFLICT (slug) DO NOTHING;
END;
$$;

-- ============================================================================
-- CREATE MENU CATEGORIES - Standalone Function
-- ============================================================================
CREATE OR REPLACE FUNCTION public.create_menu_categories(
  p_tenant_id UUID,
  p_restaurant_id UUID,
  p_created_by UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.menu_categories (tenant_id, restaurant_id, name, slug, sort_order, is_active, created_by) VALUES
    (p_tenant_id, p_restaurant_id, 'Breakfast', 'breakfast', 1, true, p_created_by),
    (p_tenant_id, p_restaurant_id, 'Lunch', 'lunch', 2, true, p_created_by),
    (p_tenant_id, p_restaurant_id, 'Dinner', 'dinner', 3, true, p_created_by),
    (p_tenant_id, p_restaurant_id, 'Desserts', 'desserts', 4, true, p_created_by),
    (p_tenant_id, p_restaurant_id, 'Drinks', 'drinks', 5, true, p_created_by),
    (p_tenant_id, p_restaurant_id, 'Coffee', 'coffee', 6, true, p_created_by),
    (p_tenant_id, p_restaurant_id, 'Tea', 'tea', 7, true, p_created_by),
    (p_tenant_id, p_restaurant_id, 'Fast Food', 'fast-food', 8, true, p_created_by),
    (p_tenant_id, p_restaurant_id, 'Pizza', 'pizza', 9, true, p_created_by),
    (p_tenant_id, p_restaurant_id, 'Burger', 'burger', 10, true, p_created_by),
    (p_tenant_id, p_restaurant_id, 'Chicken', 'chicken', 11, true, p_created_by),
    (p_tenant_id, p_restaurant_id, 'Seafood', 'seafood', 12, true, p_created_by),
    (p_tenant_id, p_restaurant_id, 'Traditional', 'traditional', 13, true, p_created_by)
  ON CONFLICT (tenant_id, restaurant_id, slug) DO NOTHING;
END;
$$;

-- ============================================================================
-- CREATE TABLES - Standalone Function
-- ============================================================================
CREATE OR REPLACE FUNCTION public.create_tables(
  p_tenant_id UUID,
  p_restaurant_id UUID,
  p_branch_id UUID,
  p_table_count INTEGER DEFAULT 20,
  p_created_by UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  FOR i IN 1..p_table_count LOOP
    INSERT INTO public.tables (
      tenant_id,
      restaurant_id,
      branch_id,
      table_number,
      name,
      capacity,
      status,
      created_by
    ) VALUES (
      p_tenant_id,
      p_restaurant_id,
      p_branch_id,
      i::TEXT,
      'Table ' || i::TEXT,
      4,
      'available',
      p_created_by
    ) ON CONFLICT (tenant_id, restaurant_id, branch_id, table_number) DO NOTHING;
  END LOOP;
END;
$$;

-- ============================================================================
-- CREATE PAYMENT METHODS - Standalone Function
-- ============================================================================
CREATE OR REPLACE FUNCTION public.create_payment_methods(
  p_tenant_id UUID,
  p_restaurant_id UUID,
  p_created_by UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.payment_methods (tenant_id, restaurant_id, name, type, is_active, is_default, sort_order, created_by) VALUES
    (p_tenant_id, p_restaurant_id, 'Cash', 'cash', true, true, 1, p_created_by),
    (p_tenant_id, p_restaurant_id, 'Card', 'card', true, false, 2, p_created_by),
    (p_tenant_id, p_restaurant_id, 'Zaad', 'mobile', true, false, 3, p_created_by),
    (p_tenant_id, p_restaurant_id, 'eDahab', 'mobile', true, false, 4, p_created_by),
    (p_tenant_id, p_restaurant_id, 'Premier Wallet', 'mobile', true, false, 5, p_created_by),
    (p_tenant_id, p_restaurant_id, 'Bank Transfer', 'bank_transfer', true, false, 6, p_created_by)
  ON CONFLICT DO NOTHING;
END;
$$;

-- ============================================================================
-- CREATE INVENTORY CATEGORIES - Standalone Function
-- ============================================================================
CREATE OR REPLACE FUNCTION public.create_inventory_categories(
  p_tenant_id UUID,
  p_restaurant_id UUID,
  p_created_by UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.inventory_categories (tenant_id, restaurant_id, name, slug, sort_order, is_active, created_by) VALUES
    (p_tenant_id, p_restaurant_id, 'Food Items', 'food-items', 1, true, p_created_by),
    (p_tenant_id, p_restaurant_id, 'Beverages', 'beverages', 2, true, p_created_by),
    (p_tenant_id, p_restaurant_id, 'Ingredients', 'ingredients', 3, true, p_created_by),
    (p_tenant_id, p_restaurant_id, 'Packaging', 'packaging', 4, true, p_created_by),
    (p_tenant_id, p_restaurant_id, 'Cleaning Supplies', 'cleaning-supplies', 5, true, p_created_by)
  ON CONFLICT (tenant_id, restaurant_id, slug) DO NOTHING;
END;
$$;

-- ============================================================================
-- CREATE RESTAURANT SETTINGS - Standalone Function
-- ============================================================================
CREATE OR REPLACE FUNCTION public.create_restaurant_settings(
  p_restaurant_id UUID,
  p_tenant_id UUID,
  p_timezone TEXT DEFAULT 'UTC',
  p_currency TEXT DEFAULT 'USD',
  p_created_by UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.restaurant_settings (
    restaurant_id,
    tenant_id,
    tax_rate,
    service_charge,
    timezone,
    currency_symbol,
    currency_position,
    decimal_places,
    thousands_separator,
    qr_menu_enabled,
    created_by
  ) VALUES (
    p_restaurant_id,
    p_tenant_id,
    0,
    0,
    p_timezone,
    CASE p_currency
      WHEN 'USD' THEN '$'
      WHEN 'EUR' THEN '€'
      WHEN 'GBP' THEN '£'
      WHEN 'SOS' THEN 'S'
      ELSE '$'
    END,
    'before',
    2,
    ',',
    true,
    p_created_by
  ) ON CONFLICT (restaurant_id) DO NOTHING;
END;
$$;

-- ============================================================================
-- ACTIVATE SUBSCRIPTION - Standalone Function
-- ============================================================================
CREATE OR REPLACE FUNCTION public.activate_subscription(
  p_subscription_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.subscriptions
  SET 
    status = 'active',
    current_period_start = NOW(),
    current_period_end = NOW() + INTERVAL '1 month',
    updated_at = NOW()
  WHERE id = p_subscription_id;

  RETURN true;
END;
$$;

-- ============================================================================
-- SUSPEND RESTAURANT - Standalone Function
-- ============================================================================
CREATE OR REPLACE FUNCTION public.suspend_restaurant(
  p_restaurant_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.restaurants
  SET 
    status = 'suspended',
    updated_at = NOW()
  WHERE id = p_restaurant_id;

  UPDATE public.subscriptions
  SET 
    status = 'suspended',
    updated_at = NOW()
  WHERE restaurant_id = p_restaurant_id;

  RETURN true;
END;
$$;

-- ============================================================================
-- DELETE RESTAURANT (Soft Delete) - Standalone Function
-- ============================================================================
CREATE OR REPLACE FUNCTION public.delete_restaurant(
  p_restaurant_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.restaurants
  SET 
    status = 'deleted',
    deleted_at = NOW(),
    updated_at = NOW()
  WHERE id = p_restaurant_id;

  UPDATE public.tenants
  SET 
    status = 'deleted',
    deleted_at = NOW(),
    updated_at = NOW()
  WHERE id = (SELECT tenant_id FROM public.restaurants WHERE id = p_restaurant_id);

  RETURN true;
END;
$$;

-- ============================================================================
-- RESTORE RESTAURANT - Standalone Function
-- ============================================================================
CREATE OR REPLACE FUNCTION public.restore_restaurant(
  p_restaurant_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.restaurants
  SET 
    status = 'active',
    deleted_at = NULL,
    updated_at = NOW()
  WHERE id = p_restaurant_id;

  UPDATE public.tenants
  SET 
    status = 'active',
    deleted_at = NULL,
    updated_at = NOW()
  WHERE id = (SELECT tenant_id FROM public.restaurants WHERE id = p_restaurant_id);

  RETURN true;
END;
$$;
