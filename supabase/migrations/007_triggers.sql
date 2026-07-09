-- ============================================================================
-- 007: Triggers
-- ============================================================================
-- This migration creates all database triggers for the database.
--
-- Dependencies: 003_tables.sql, 006_functions.sql
-- Idempotent: Yes (uses DROP TRIGGER IF EXISTS before CREATE TRIGGER)
-- ============================================================================

-- ============================================================================
-- UPDATED_AT TRIGGER FUNCTION
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
-- AUDIT LOG TRIGGER FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_audit_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    tenant_id,
    restaurant_id,
    user_id,
    action,
    table_name,
    record_id,
    old_values,
    new_values,
    ip_address,
    user_agent
  ) VALUES (
    COALESCE(NEW.tenant_id, OLD.tenant_id),
    COALESCE(NEW.restaurant_id, OLD.restaurant_id),
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('_INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END,
    inet_client_addr(),
    current_setting('request.headers.user-agent', true)
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- ============================================================================
-- ACTIVITY LOG TRIGGER FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_activity_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id UUID;
  v_restaurant_id UUID;
  v_action TEXT;
  v_entity_type TEXT;
BEGIN
  v_action := TG_OP;
  
  IF TG_TABLE_NAME = 'restaurants' THEN
    v_entity_type := 'restaurant';
  ELSIF TG_TABLE_NAME = 'orders' THEN
    v_entity_type := 'order';
  ELSIF TG_TABLE_NAME = 'restaurant_users' THEN
    v_entity_type := 'user';
  ELSE
    v_entity_type := TG_TABLE_NAME;
  END IF;

  IF TG_TABLE_NAME = 'tenants' THEN
    v_tenant_id := COALESCE(NEW.id, OLD.id);
  ELSIF TG_TABLE_NAME = 'restaurants' THEN
    v_tenant_id := COALESCE(NEW.tenant_id, OLD.tenant_id);
    v_restaurant_id := COALESCE(NEW.id, OLD.id);
  ELSIF TG_TABLE_NAME = 'orders' THEN
    v_tenant_id := COALESCE(NEW.tenant_id, OLD.tenant_id);
    v_restaurant_id := COALESCE(NEW.restaurant_id, OLD.restaurant_id);
  ELSIF TG_TABLE_NAME = 'restaurant_users' THEN
    v_tenant_id := COALESCE(NEW.tenant_id, OLD.tenant_id);
    v_restaurant_id := COALESCE(NEW.restaurant_id, OLD.restaurant_id);
  END IF;

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
    auth.uid(),
    v_action,
    v_entity_type,
    COALESCE(NEW.id, OLD.id),
    v_action || ' on ' || TG_TABLE_NAME,
    jsonb_build_object('table', TG_TABLE_NAME)
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- ============================================================================
-- RESTAURANT STATISTICS UPDATE TRIGGER FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_restaurant_statistics()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_branch_id UUID;
BEGIN
  -- Get branch_id from the order
  v_branch_id := NEW.branch_id;

  -- Update or insert daily statistics
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
    NEW.tenant_id,
    NEW.restaurant_id,
    v_branch_id,
    CURRENT_DATE,
    1,
    COALESCE(NEW.total_amount, 0),
    CASE WHEN NEW.customer_id IS NOT NULL THEN 1 ELSE 0 END,
    COALESCE(NEW.total_amount, 0),
    (SELECT COUNT(*) FROM public.order_items WHERE order_id = NEW.id),
    CASE WHEN NEW.customer_id IS NOT NULL THEN 1 ELSE 0 END
  )
  ON CONFLICT (tenant_id, restaurant_id, branch_id, date)
  DO UPDATE SET
    total_orders = restaurant_statistics.total_orders + 1,
    total_revenue = restaurant_statistics.total_revenue + COALESCE(NEW.total_amount, 0),
    total_customers = restaurant_statistics.total_customers + CASE WHEN NEW.customer_id IS NOT NULL THEN 1 ELSE 0 END,
    average_order_value = (restaurant_statistics.total_revenue + COALESCE(NEW.total_amount, 0)) / (restaurant_statistics.total_orders + 1),
    items_sold = restaurant_statistics.items_sold + (SELECT COUNT(*) FROM public.order_items WHERE order_id = NEW.id),
    unique_customers = restaurant_statistics.unique_customers + CASE WHEN NEW.customer_id IS NOT NULL THEN 1 ELSE 0 END,
    updated_at = NOW();

  RETURN NEW;
END;
$$;

-- ============================================================================
-- STORAGE UPDATE TRIGGER FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_storage_on_attachment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Update restaurant storage when attachment is added
    INSERT INTO public.restaurant_storage (
      tenant_id,
      restaurant_id,
      storage_used,
      storage_limit,
      files_count
    ) VALUES (
      NEW.tenant_id,
      NEW.restaurant_id,
      COALESCE(NEW.file_size, 0),
      1073741824, -- 1GB default
      1
    )
    ON CONFLICT (tenant_id, restaurant_id)
    DO UPDATE SET
      storage_used = restaurant_storage.storage_used + COALESCE(NEW.file_size, 0),
      files_count = restaurant_storage.files_count + 1,
      last_calculated_at = NOW();

    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Update restaurant storage when attachment is deleted
    INSERT INTO public.restaurant_storage (
      tenant_id,
      restaurant_id,
      storage_used,
      storage_limit,
      files_count
    ) VALUES (
      OLD.tenant_id,
      OLD.restaurant_id,
      -COALESCE(OLD.file_size, 0),
      1073741824,
      -1
    )
    ON CONFLICT (tenant_id, restaurant_id)
    DO UPDATE SET
      storage_used = restaurant_storage.storage_used - COALESCE(OLD.file_size, 0),
      files_count = restaurant_storage.files_count - 1,
      last_calculated_at = NOW();

    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

-- ============================================================================
-- APPLY UPDATED_AT TRIGGERS
-- ============================================================================

-- Users table
DROP TRIGGER IF EXISTS users_updated_at ON public.users;
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Tenants table
DROP TRIGGER IF EXISTS tenants_updated_at ON public.tenants;
CREATE TRIGGER tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Restaurants table
DROP TRIGGER IF EXISTS restaurants_updated_at ON public.restaurants;
CREATE TRIGGER restaurants_updated_at
  BEFORE UPDATE ON public.restaurants
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Restaurant settings table
DROP TRIGGER IF EXISTS restaurant_settings_updated_at ON public.restaurant_settings;
CREATE TRIGGER restaurant_settings_updated_at
  BEFORE UPDATE ON public.restaurant_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Restaurant branches table
DROP TRIGGER IF EXISTS restaurant_branches_updated_at ON public.restaurant_branches;
CREATE TRIGGER restaurant_branches_updated_at
  BEFORE UPDATE ON public.restaurant_branches
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Subscription plans table
DROP TRIGGER IF EXISTS subscription_plans_updated_at ON public.subscription_plans;
CREATE TRIGGER subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Subscriptions table
DROP TRIGGER IF EXISTS subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Roles table
DROP TRIGGER IF EXISTS roles_updated_at ON public.roles;
CREATE TRIGGER roles_updated_at
  BEFORE UPDATE ON public.roles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Permissions table
DROP TRIGGER IF EXISTS permissions_updated_at ON public.permissions;
CREATE TRIGGER permissions_updated_at
  BEFORE UPDATE ON public.permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Restaurant users table
DROP TRIGGER IF EXISTS restaurant_users_updated_at ON public.restaurant_users;
CREATE TRIGGER restaurant_users_updated_at
  BEFORE UPDATE ON public.restaurant_users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Employees table
DROP TRIGGER IF EXISTS employees_updated_at ON public.employees;
CREATE TRIGGER employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Customers table
DROP TRIGGER IF EXISTS customers_updated_at ON public.customers;
CREATE TRIGGER customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Tables table
DROP TRIGGER IF EXISTS tables_updated_at ON public.tables;
CREATE TRIGGER tables_updated_at
  BEFORE UPDATE ON public.tables
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Menu categories table
DROP TRIGGER IF EXISTS menu_categories_updated_at ON public.menu_categories;
CREATE TRIGGER menu_categories_updated_at
  BEFORE UPDATE ON public.menu_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Products table
DROP TRIGGER IF EXISTS products_updated_at ON public.products;
CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Inventory table
DROP TRIGGER IF EXISTS inventory_updated_at ON public.inventory;
CREATE TRIGGER inventory_updated_at
  BEFORE UPDATE ON public.inventory
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Inventory categories table
DROP TRIGGER IF EXISTS inventory_categories_updated_at ON public.inventory_categories;
CREATE TRIGGER inventory_categories_updated_at
  BEFORE UPDATE ON public.inventory_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Suppliers table
DROP TRIGGER IF EXISTS suppliers_updated_at ON public.suppliers;
CREATE TRIGGER suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Orders table
DROP TRIGGER IF EXISTS orders_updated_at ON public.orders;
CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Order items table
DROP TRIGGER IF EXISTS order_items_updated_at ON public.order_items;
CREATE TRIGGER order_items_updated_at
  BEFORE UPDATE ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Payments table
DROP TRIGGER IF EXISTS payments_updated_at ON public.payments;
CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Payment methods table
DROP TRIGGER IF EXISTS payment_methods_updated_at ON public.payment_methods;
CREATE TRIGGER payment_methods_updated_at
  BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Tax settings table
DROP TRIGGER IF EXISTS tax_settings_updated_at ON public.tax_settings;
CREATE TRIGGER tax_settings_updated_at
  BEFORE UPDATE ON public.tax_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Currencies table
DROP TRIGGER IF EXISTS currencies_updated_at ON public.currencies;
CREATE TRIGGER currencies_updated_at
  BEFORE UPDATE ON public.currencies
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- System settings table
DROP TRIGGER IF EXISTS system_settings_updated_at ON public.system_settings;
CREATE TRIGGER system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- API keys table
DROP TRIGGER IF EXISTS api_keys_updated_at ON public.api_keys;
CREATE TRIGGER api_keys_updated_at
  BEFORE UPDATE ON public.api_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Restaurant storage table
DROP TRIGGER IF EXISTS restaurant_storage_updated_at ON public.restaurant_storage;
CREATE TRIGGER restaurant_storage_updated_at
  BEFORE UPDATE ON public.restaurant_storage
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Restaurant statistics table
DROP TRIGGER IF EXISTS restaurant_statistics_updated_at ON public.restaurant_statistics;
CREATE TRIGGER restaurant_statistics_updated_at
  BEFORE UPDATE ON public.restaurant_statistics
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Support tickets table
DROP TRIGGER IF EXISTS support_tickets_updated_at ON public.support_tickets;
CREATE TRIGGER support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- APPLY AUDIT LOG TRIGGERS
-- ============================================================================

-- Restaurants table
DROP TRIGGER IF EXISTS restaurants_audit_log ON public.restaurants;
CREATE TRIGGER restaurants_audit_log
  AFTER INSERT OR UPDATE OR DELETE ON public.restaurants
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_audit_log();

-- Restaurant users table
DROP TRIGGER IF EXISTS restaurant_users_audit_log ON public.restaurant_users;
CREATE TRIGGER restaurant_users_audit_log
  AFTER INSERT OR UPDATE OR DELETE ON public.restaurant_users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_audit_log();

-- Employees table
DROP TRIGGER IF EXISTS employees_audit_log ON public.employees;
CREATE TRIGGER employees_audit_log
  AFTER INSERT OR UPDATE OR DELETE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_audit_log();

-- Orders table
DROP TRIGGER IF EXISTS orders_audit_log ON public.orders;
CREATE TRIGGER orders_audit_log
  AFTER INSERT OR UPDATE OR DELETE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_audit_log();

-- Products table
DROP TRIGGER IF EXISTS products_audit_log ON public.products;
CREATE TRIGGER products_audit_log
  AFTER INSERT OR UPDATE OR DELETE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_audit_log();

-- ============================================================================
-- APPLY ACTIVITY LOG TRIGGERS
-- ============================================================================

-- Restaurants table
DROP TRIGGER IF EXISTS restaurants_activity_log ON public.restaurants;
CREATE TRIGGER restaurants_activity_log
  AFTER INSERT OR UPDATE OR DELETE ON public.restaurants
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_activity_log();

-- Orders table
DROP TRIGGER IF EXISTS orders_activity_log ON public.orders;
CREATE TRIGGER orders_activity_log
  AFTER INSERT OR UPDATE OR DELETE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_activity_log();

-- Restaurant users table
DROP TRIGGER IF EXISTS restaurant_users_activity_log ON public.restaurant_users;
CREATE TRIGGER restaurant_users_activity_log
  AFTER INSERT OR UPDATE OR DELETE ON public.restaurant_users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_activity_log();

-- ============================================================================
-- APPLY BUSINESS LOGIC TRIGGERS
-- ============================================================================

-- Restaurant statistics update on order completion
DROP TRIGGER IF EXISTS update_statistics_on_order ON public.orders;
CREATE TRIGGER update_statistics_on_order
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION public.update_restaurant_statistics();

-- Storage update on attachment changes
DROP TRIGGER IF EXISTS update_storage_on_attachment ON public.attachments;
CREATE TRIGGER update_storage_on_attachment
  AFTER INSERT OR DELETE ON public.attachments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_storage_on_attachment();

-- ============================================================================
-- Verification
-- ============================================================================
-- Count all created triggers
SELECT 
  COUNT(*) as trigger_count,
  'Triggers created successfully' as status
FROM information_schema.triggers 
WHERE trigger_schema = 'public';
