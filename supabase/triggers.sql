-- ============================================================================
-- TRIGGERS FOR AUTOMATED FUNCTIONS
-- Production-ready triggers for audit logging, timestamps, and data integrity
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
-- USERS TABLE UPDATED_AT TRIGGER
-- ============================================================================
DROP TRIGGER IF EXISTS users_updated_at ON public.users;
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- AUDIT LOG TRIGGER FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_audit_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id UUID;
  v_restaurant_id UUID;
BEGIN
  -- Get tenant_id and restaurant_id from the record if available
  IF TG_TABLE_NAME = 'tenants' THEN
    v_tenant_id := COALESCE(NEW.id, OLD.id);
  ELSIF TG_TABLE_NAME = 'restaurants' THEN
    v_tenant_id := COALESCE(NEW.tenant_id, OLD.tenant_id);
    v_restaurant_id := COALESCE(NEW.id, OLD.id);
  ELSIF TG_TABLE_NAME = 'restaurant_branches' THEN
    v_tenant_id := COALESCE(NEW.tenant_id, OLD.tenant_id);
    v_restaurant_id := COALESCE(NEW.restaurant_id, OLD.restaurant_id);
  ELSIF TG_TABLE_NAME = 'restaurant_users' THEN
    v_tenant_id := COALESCE(NEW.tenant_id, OLD.tenant_id);
    v_restaurant_id := COALESCE(NEW.restaurant_id, OLD.restaurant_id);
  ELSIF TG_TABLE_NAME = 'employees' THEN
    v_tenant_id := COALESCE(NEW.tenant_id, OLD.tenant_id);
    v_restaurant_id := COALESCE(NEW.restaurant_id, OLD.restaurant_id);
  ELSIF TG_TABLE_NAME = 'customers' THEN
    v_tenant_id := COALESCE(NEW.tenant_id, OLD.tenant_id);
    v_restaurant_id := COALESCE(NEW.restaurant_id, OLD.restaurant_id);
  ELSIF TG_TABLE_NAME = 'orders' THEN
    v_tenant_id := COALESCE(NEW.tenant_id, OLD.tenant_id);
    v_restaurant_id := COALESCE(NEW.restaurant_id, OLD.restaurant_id);
  ELSIF TG_TABLE_NAME = 'products' THEN
    v_tenant_id := COALESCE(NEW.tenant_id, OLD.tenant_id);
    v_restaurant_id := COALESCE(NEW.restaurant_id, OLD.restaurant_id);
  ELSIF TG_TABLE_NAME = 'menu_categories' THEN
    v_tenant_id := COALESCE(NEW.tenant_id, OLD.tenant_id);
    v_restaurant_id := COALESCE(NEW.restaurant_id, OLD.restaurant_id);
  ELSIF TG_TABLE_NAME = 'inventory' THEN
    v_tenant_id := COALESCE(NEW.tenant_id, OLD.tenant_id);
    v_restaurant_id := COALESCE(NEW.restaurant_id, OLD.restaurant_id);
  ELSIF TG_TABLE_NAME = 'suppliers' THEN
    v_tenant_id := COALESCE(NEW.tenant_id, OLD.tenant_id);
    v_restaurant_id := COALESCE(NEW.restaurant_id, OLD.restaurant_id);
  ELSIF TG_TABLE_NAME = 'roles' THEN
    v_tenant_id := COALESCE(NEW.tenant_id, OLD.tenant_id);
    v_restaurant_id := COALESCE(NEW.restaurant_id, OLD.restaurant_id);
  END IF;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (
      tenant_id,
      restaurant_id,
      user_id,
      action,
      table_name,
      record_id,
      new_values,
      ip_address,
      user_agent
    ) VALUES (
      v_tenant_id,
      v_restaurant_id,
      auth.uid(),
      'INSERT',
      TG_TABLE_NAME,
      NEW.id,
      to_jsonb(NEW),
      NULL,
      NULL
    );
  ELSIF TG_OP = 'UPDATE' THEN
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
      v_tenant_id,
      v_restaurant_id,
      auth.uid(),
      'UPDATE',
      TG_TABLE_NAME,
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW),
      NULL,
      NULL
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (
      tenant_id,
      restaurant_id,
      user_id,
      action,
      table_name,
      record_id,
      old_values,
      ip_address,
      user_agent
    ) VALUES (
      v_tenant_id,
      v_restaurant_id,
      auth.uid(),
      'DELETE',
      TG_TABLE_NAME,
      OLD.id,
      to_jsonb(OLD),
      NULL,
      NULL
    );
  END IF;

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
  -- Set action based on operation
  v_action := TG_OP;
  
  -- Set entity type based on table name
  IF TG_TABLE_NAME = 'restaurants' THEN
    v_entity_type := 'restaurant';
  ELSIF TG_TABLE_NAME = 'orders' THEN
    v_entity_type := 'order';
  ELSIF TG_TABLE_NAME = 'restaurant_users' THEN
    v_entity_type := 'user';
  ELSE
    v_entity_type := TG_TABLE_NAME;
  END IF;
  
  -- Get tenant_id and restaurant_id from the record if available
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
BEGIN
  -- Update daily statistics when an order is completed
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.status = 'completed' AND OLD.status != 'completed') THEN
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
      NEW.branch_id,
      CURRENT_DATE,
      1,
      COALESCE(NEW.total_amount, 0),
      CASE WHEN NEW.customer_id IS NOT NULL THEN 1 ELSE 0 END,
      COALESCE(NEW.total_amount, 0),
      0,
      CASE WHEN NEW.customer_id IS NOT NULL THEN 1 ELSE 0 END
    )
    ON CONFLICT (tenant_id, restaurant_id, branch_id, date) DO UPDATE SET
      total_orders = restaurant_statistics.total_orders + 1,
      total_revenue = restaurant_statistics.total_revenue + COALESCE(NEW.total_amount, 0),
      total_customers = restaurant_statistics.total_customers + CASE WHEN NEW.customer_id IS NOT NULL THEN 1 ELSE 0 END,
      average_order_value = (restaurant_statistics.total_revenue + COALESCE(NEW.total_amount, 0)) / NULLIF(restaurant_statistics.total_orders + 1, 0),
      unique_customers = restaurant_statistics.unique_customers + CASE WHEN NEW.customer_id IS NOT NULL THEN 1 ELSE 0 END,
      updated_at = NOW();
  END IF;

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
    UPDATE public.restaurant_storage
    SET 
      storage_used = storage_used + NEW.file_size,
      files_count = files_count + 1,
      updated_at = NOW()
    WHERE restaurant_id = NEW.restaurant_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.restaurant_storage
    SET 
      storage_used = storage_used - OLD.file_size,
      files_count = files_count - 1,
      updated_at = NOW()
    WHERE restaurant_id = OLD.restaurant_id;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- ============================================================================
-- LOGIN HISTORY TRIGGER FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_login_history(p_status TEXT)
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.login_history (
    user_id,
    tenant_id,
    restaurant_id,
    ip_address,
    user_agent,
    login_method,
    status,
    failure_reason
  ) VALUES (
    NEW.user_id,
    NEW.tenant_id,
    NEW.restaurant_id,
    NEW.ip_address,
    NEW.user_agent,
    'password',
    p_status,
    CASE WHEN p_status = 'failed' THEN 'Invalid credentials' ELSE NULL END
  );

  IF p_status = 'success' THEN
    UPDATE public.restaurant_users
    SET last_login_at = NOW()
    WHERE user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================================================
-- APPLY UPDATED_AT TRIGGERS TO ALL TABLES
-- ============================================================================

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

-- Restaurant Settings
DROP TRIGGER IF EXISTS restaurant_settings_updated_at ON public.restaurant_settings;
CREATE TRIGGER restaurant_settings_updated_at
  BEFORE UPDATE ON public.restaurant_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Restaurant Branches
DROP TRIGGER IF EXISTS restaurant_branches_updated_at ON public.restaurant_branches;
CREATE TRIGGER restaurant_branches_updated_at
  BEFORE UPDATE ON public.restaurant_branches
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

-- Roles
DROP TRIGGER IF EXISTS roles_updated_at ON public.roles;
CREATE TRIGGER roles_updated_at
  BEFORE UPDATE ON public.roles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Restaurant Users
DROP TRIGGER IF EXISTS restaurant_users_updated_at ON public.restaurant_users;
CREATE TRIGGER restaurant_users_updated_at
  BEFORE UPDATE ON public.restaurant_users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Employees
DROP TRIGGER IF EXISTS employees_updated_at ON public.employees;
CREATE TRIGGER employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Customers
DROP TRIGGER IF EXISTS customers_updated_at ON public.customers;
CREATE TRIGGER customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Tables
DROP TRIGGER IF EXISTS tables_updated_at ON public.tables;
CREATE TRIGGER tables_updated_at
  BEFORE UPDATE ON public.tables
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Menu Categories
DROP TRIGGER IF EXISTS menu_categories_updated_at ON public.menu_categories;
CREATE TRIGGER menu_categories_updated_at
  BEFORE UPDATE ON public.menu_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Products
DROP TRIGGER IF EXISTS products_updated_at ON public.products;
CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Inventory
DROP TRIGGER IF EXISTS inventory_updated_at ON public.inventory;
CREATE TRIGGER inventory_updated_at
  BEFORE UPDATE ON public.inventory
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Inventory Categories
DROP TRIGGER IF EXISTS inventory_categories_updated_at ON public.inventory_categories;
CREATE TRIGGER inventory_categories_updated_at
  BEFORE UPDATE ON public.inventory_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Suppliers
DROP TRIGGER IF EXISTS suppliers_updated_at ON public.suppliers;
CREATE TRIGGER suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Orders
DROP TRIGGER IF EXISTS orders_updated_at ON public.orders;
CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Order Items
DROP TRIGGER IF EXISTS order_items_updated_at ON public.order_items;
CREATE TRIGGER order_items_updated_at
  BEFORE UPDATE ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Payments
DROP TRIGGER IF EXISTS payments_updated_at ON public.payments;
CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Payment Methods
DROP TRIGGER IF EXISTS payment_methods_updated_at ON public.payment_methods;
CREATE TRIGGER payment_methods_updated_at
  BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Tax Settings
DROP TRIGGER IF EXISTS tax_settings_updated_at ON public.tax_settings;
CREATE TRIGGER tax_settings_updated_at
  BEFORE UPDATE ON public.tax_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Currencies
DROP TRIGGER IF EXISTS currencies_updated_at ON public.currencies;
CREATE TRIGGER currencies_updated_at
  BEFORE UPDATE ON public.currencies
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- System Settings
DROP TRIGGER IF EXISTS system_settings_updated_at ON public.system_settings;
CREATE TRIGGER system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Support Tickets
DROP TRIGGER IF EXISTS support_tickets_updated_at ON public.support_tickets;
CREATE TRIGGER support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Restaurant Storage
DROP TRIGGER IF EXISTS restaurant_storage_updated_at ON public.restaurant_storage;
CREATE TRIGGER restaurant_storage_updated_at
  BEFORE UPDATE ON public.restaurant_storage
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Restaurant Statistics
DROP TRIGGER IF EXISTS restaurant_statistics_updated_at ON public.restaurant_statistics;
CREATE TRIGGER restaurant_statistics_updated_at
  BEFORE UPDATE ON public.restaurant_statistics
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- APPLY AUDIT LOG TRIGGERS TO KEY TABLES
-- ============================================================================

-- Restaurants
DROP TRIGGER IF EXISTS restaurants_audit_log ON public.restaurants;
CREATE TRIGGER restaurants_audit_log
  AFTER INSERT OR UPDATE OR DELETE ON public.restaurants
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_audit_log();

-- Restaurant Users
DROP TRIGGER IF EXISTS restaurant_users_audit_log ON public.restaurant_users;
CREATE TRIGGER restaurant_users_audit_log
  AFTER INSERT OR UPDATE OR DELETE ON public.restaurant_users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_audit_log();

-- Employees
DROP TRIGGER IF EXISTS employees_audit_log ON public.employees;
CREATE TRIGGER employees_audit_log
  AFTER INSERT OR UPDATE OR DELETE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_audit_log();

-- Orders
DROP TRIGGER IF EXISTS orders_audit_log ON public.orders;
CREATE TRIGGER orders_audit_log
  AFTER INSERT OR UPDATE OR DELETE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_audit_log();

-- Products
DROP TRIGGER IF EXISTS products_audit_log ON public.products;
CREATE TRIGGER products_audit_log
  AFTER INSERT OR UPDATE OR DELETE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_audit_log();

-- ============================================================================
-- APPLY ACTIVITY LOG TRIGGERS TO KEY TABLES
-- ============================================================================

-- Restaurants
DROP TRIGGER IF EXISTS restaurants_activity_log ON public.restaurants;
CREATE TRIGGER restaurants_activity_log
  AFTER INSERT OR UPDATE ON public.restaurants
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_activity_log();

-- Orders
DROP TRIGGER IF EXISTS orders_activity_log ON public.orders;
CREATE TRIGGER orders_activity_log
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_activity_log();

-- Restaurant Users
DROP TRIGGER IF EXISTS restaurant_users_activity_log ON public.restaurant_users;
CREATE TRIGGER restaurant_users_activity_log
  AFTER INSERT OR UPDATE OR DELETE ON public.restaurant_users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_activity_log();

-- ============================================================================
-- APPLY BUSINESS LOGIC TRIGGERS
-- ============================================================================

-- Restaurant Statistics Update on Orders
DROP TRIGGER IF EXISTS orders_statistics_update ON public.orders;
CREATE TRIGGER orders_statistics_update
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_restaurant_statistics();

-- Storage Update on Attachments
DROP TRIGGER IF EXISTS attachments_storage_update ON public.attachments;
CREATE TRIGGER attachments_storage_update
  AFTER INSERT OR DELETE ON public.attachments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_storage_on_attachment();
