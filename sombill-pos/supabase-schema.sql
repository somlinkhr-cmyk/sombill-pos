-- SomBill POS Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('manager', 'cashier', 'waiter', 'kitchen')),
  salary DECIMAL(10, 2) NOT NULL DEFAULT 0,
  shift TEXT NOT NULL DEFAULT 'morning',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  product_code TEXT,
  description TEXT,
  short_description TEXT,
  full_description TEXT,
  barcode TEXT UNIQUE,
  sku TEXT UNIQUE,
  cost_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  selling_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5, 4) NOT NULL DEFAULT 0,
  service_charge DECIMAL(5, 4) NOT NULL DEFAULT 0,
  discount_price DECIMAL(10, 2),
  currency TEXT DEFAULT 'USD',
  preparation_time INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  kitchen_printer TEXT,
  -- Inventory fields
  track_inventory BOOLEAN NOT NULL DEFAULT false,
  current_stock INTEGER NOT NULL DEFAULT 0,
  min_stock_level INTEGER NOT NULL DEFAULT 0,
  max_stock_level INTEGER NOT NULL DEFAULT 0,
  reorder_level INTEGER NOT NULL DEFAULT 0,
  unit TEXT DEFAULT 'piece',
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  warehouse_id UUID,
  -- Restaurant options
  available_dine_in BOOLEAN NOT NULL DEFAULT true,
  available_takeaway BOOLEAN NOT NULL DEFAULT true,
  available_delivery BOOLEAN NOT NULL DEFAULT true,
  available_online BOOLEAN NOT NULL DEFAULT true,
  -- Product type
  product_type TEXT DEFAULT 'standard',
  kitchen_section TEXT,
  brand TEXT,
  -- Product status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'out_of_stock', 'hidden')),
  -- Display options
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_best_seller BOOLEAN NOT NULL DEFAULT false,
  is_new_item BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  product_color TEXT,
  product_icon TEXT,
  -- Nutritional information (optional)
  calories INTEGER,
  allergens TEXT,
  ingredients TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product variants
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_modifier DECIMAL(10, 2) NOT NULL DEFAULT 0,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product sizes
CREATE TABLE IF NOT EXISTS public.product_sizes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_modifier DECIMAL(10, 2) NOT NULL DEFAULT 0,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Toppings
CREATE TABLE IF NOT EXISTS public.toppings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rooms
CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tables
CREATE TABLE IF NOT EXISTS public.tables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  number INTEGER NOT NULL UNIQUE,
  room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
  capacity INTEGER NOT NULL DEFAULT 4,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved', 'cleaning')),
  position_x INTEGER NOT NULL DEFAULT 0,
  position_y INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customers
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  email TEXT,
  loyalty_points INTEGER NOT NULL DEFAULT 0,
  total_spending DECIMAL(10, 2) NOT NULL DEFAULT 0,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_id UUID REFERENCES public.tables(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  waiter_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  cashier_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  order_type TEXT NOT NULL DEFAULT 'dine_in' CHECK (order_type IN ('dine_in', 'takeaway', 'delivery')),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'preparing', 'ready', 'served', 'completed', 'cancelled')),
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
  discount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  tax DECIMAL(10, 2) NOT NULL DEFAULT 0,
  service_charge DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  payment_method TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid', 'refunded')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  size_id UUID REFERENCES public.product_sizes(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order item toppings
CREATE TABLE IF NOT EXISTS public.order_item_toppings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_item_id UUID NOT NULL REFERENCES public.order_items(id) ON DELETE CASCADE,
  topping_id UUID NOT NULL REFERENCES public.toppings(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0
);

-- Suppliers
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ingredients
CREATE TABLE IF NOT EXISTS public.ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  unit TEXT NOT NULL,
  current_stock DECIMAL(10, 3) NOT NULL DEFAULT 0,
  min_stock DECIMAL(10, 3) NOT NULL DEFAULT 0,
  cost_per_unit DECIMAL(10, 2) NOT NULL DEFAULT 0,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  barcode TEXT UNIQUE,
  expiry_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product ingredients (recipes)
CREATE TABLE IF NOT EXISTS public.product_ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  quantity DECIMAL(10, 3) NOT NULL DEFAULT 0
);

-- Purchase orders
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ordered', 'received', 'cancelled')),
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Purchase order items
CREATE TABLE IF NOT EXISTS public.purchase_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  quantity DECIMAL(10, 3) NOT NULL DEFAULT 0,
  unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_price DECIMAL(10, 2) NOT NULL DEFAULT 0
);

-- Expense categories
CREATE TABLE IF NOT EXISTS public.expense_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#6366f1',
  icon TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Expenses
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES public.expense_categories(id) ON DELETE SET NULL,
  category TEXT, -- Fallback for backward compatibility
  amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  description TEXT,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Attendance
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  check_in TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  check_out TIMESTAMP WITH TIME ZONE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Settings
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust for production)
DO $$
BEGIN
  -- Users table policy
  BEGIN
    CREATE POLICY "Enable all access for users" ON public.users FOR ALL USING (true) WITH CHECK (true);
  EXCEPTION WHEN duplicate_object THEN null;
  END;

  -- Categories table policy
  BEGIN
    CREATE POLICY "Enable all access for categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);
  EXCEPTION WHEN duplicate_object THEN null;
  END;

  -- Products table policy
  BEGIN
    CREATE POLICY "Enable all access for products" ON public.products FOR ALL USING (true) WITH CHECK (true);
  EXCEPTION WHEN duplicate_object THEN null;
  END;

  -- Tables table policy
  BEGIN
    CREATE POLICY "Enable all access for tables" ON public.tables FOR ALL USING (true) WITH CHECK (true);
  EXCEPTION WHEN duplicate_object THEN null;
  END;

  -- Orders table policy
  BEGIN
    CREATE POLICY "Enable all access for orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);
  EXCEPTION WHEN duplicate_object THEN null;
  END;

  -- Order items table policy
  BEGIN
    CREATE POLICY "Enable all access for order_items" ON public.order_items FOR ALL USING (true) WITH CHECK (true);
  EXCEPTION WHEN duplicate_object THEN null;
  END;

  -- Customers table policy
  BEGIN
    CREATE POLICY "Enable all access for customers" ON public.customers FOR ALL USING (true) WITH CHECK (true);
  EXCEPTION WHEN duplicate_object THEN null;
  END;

  -- Ingredients table policy
  BEGIN
    CREATE POLICY "Enable all access for ingredients" ON public.ingredients FOR ALL USING (true) WITH CHECK (true);
  EXCEPTION WHEN duplicate_object THEN null;
  END;

  -- Suppliers table policy
  BEGIN
    CREATE POLICY "Enable all access for suppliers" ON public.suppliers FOR ALL USING (true) WITH CHECK (true);
  EXCEPTION WHEN duplicate_object THEN null;
  END;

  -- Expenses table policy
  BEGIN
    CREATE POLICY "Enable all access for expenses" ON public.expenses FOR ALL USING (true) WITH CHECK (true);
  EXCEPTION WHEN duplicate_object THEN null;
  END;

  -- Expense categories table policy
  BEGIN
    CREATE POLICY "Enable all access for expense_categories" ON public.expense_categories FOR ALL USING (true) WITH CHECK (true);
  EXCEPTION WHEN duplicate_object THEN null;
  END;

  -- Attendance table policy
  BEGIN
    CREATE POLICY "Enable all access for attendance" ON public.attendance FOR ALL USING (true) WITH CHECK (true);
  EXCEPTION WHEN duplicate_object THEN null;
  END;

  -- Settings table policy
  BEGIN
    CREATE POLICY "Enable all access for settings" ON public.settings FOR ALL USING (true) WITH CHECK (true);
  EXCEPTION WHEN duplicate_object THEN null;
  END;
END $$;

-- Insert sample expense categories
INSERT INTO public.expense_categories (name, description, color, display_order) VALUES
('Rent', 'Monthly rent and lease payments', '#ef4444', 1),
('Utilities', 'Electricity, water, gas, internet', '#f59e0b', 2),
('Salaries', 'Staff salaries and wages', '#10b981', 3),
('Inventory', 'Food and ingredient purchases', '#3b82f6', 4),
('Equipment', 'Kitchen equipment and tools', '#8b5cf6', 5),
('Maintenance', 'Repairs and maintenance', '#ec4899', 6),
('Marketing', 'Advertising and promotions', '#06b6d4', 7),
('Insurance', 'Business insurance premiums', '#84cc16', 8),
('Transportation', 'Delivery and transportation costs', '#f97316', 9),
('Other', 'Miscellaneous expenses', '#6b7280', 10)
ON CONFLICT (name) DO NOTHING;

-- Insert default settings
INSERT INTO public.settings (key, value, description) VALUES
('restaurant_name', 'SomBill Restaurant', 'Restaurant name'),
('tax_rate', '0.05', 'Default tax rate (5%)'),
('service_charge', '0.10', 'Default service charge (10%)'),
('currency', 'USD', 'Default currency'),
('receipt_header', 'SomBill Restaurant', 'Receipt header'),
('receipt_footer', 'Thank you for dining with us!', 'Receipt footer')
ON CONFLICT (key) DO NOTHING;

-- Insert sample categories
INSERT INTO public.categories (name, description, display_order) VALUES
('Appetizers', 'Starters and appetizers', 1),
('Mains', 'Main course dishes', 2),
('Grills', 'Grilled meats and seafood', 3),
('Drinks', 'Beverages and drinks', 4),
('Desserts', 'Sweet treats and desserts', 5)
ON CONFLICT DO NOTHING;

-- Insert sample products
INSERT INTO public.products (category_id, name, description, selling_price, cost_price) VALUES
((SELECT id FROM public.categories WHERE name = 'Mains' LIMIT 1), 'Grilled Chicken', 'Tender grilled chicken with herbs', 6.50, 3.50),
((SELECT id FROM public.categories WHERE name = 'Mains' LIMIT 1), 'Beef Steak', 'Premium beef steak grilled to perfection', 8.00, 4.50),
((SELECT id FROM public.categories WHERE name = 'Mains' LIMIT 1), 'Fish & Rice', 'Fresh fish served with rice', 7.00, 3.80),
((SELECT id FROM public.categories WHERE name = 'Appetizers' LIMIT 1), 'Sambusa (3pc)', 'Crispy pastry filled with spiced meat', 2.50, 1.00),
((SELECT id FROM public.categories WHERE name = 'Drinks' LIMIT 1), 'Somali Tea', 'Traditional spiced tea', 1.00, 0.20),
((SELECT id FROM public.categories WHERE name = 'Drinks' LIMIT 1), 'Fresh Juice', 'Fresh fruit juice', 2.00, 0.80),
((SELECT id FROM public.categories WHERE name = 'Desserts' LIMIT 1), 'Halwo', 'Traditional Somali sweet', 3.00, 1.20)
ON CONFLICT DO NOTHING;

-- Insert sample tables
INSERT INTO public.tables (number, capacity, status) VALUES
(1, 4, 'available'),
(2, 4, 'available'),
(3, 6, 'available'),
(4, 6, 'available'),
(5, 8, 'available'),
(6, 8, 'available'),
(7, 2, 'available'),
(8, 2, 'available'),
(9, 4, 'available'),
(10, 4, 'available'),
(11, 6, 'available'),
(12, 6, 'available')
ON CONFLICT (number) DO NOTHING;

-- Create initial demo users
-- This creates users in Supabase Auth and the corresponding public.users records
-- Note: You may need to run this in the Supabase SQL Editor with proper permissions
DO $$
DECLARE
  user_id UUID;
BEGIN
  -- Create Manager user
  SELECT id INTO user_id FROM auth.users WHERE email = 'manager@gmail.com';
  
  IF user_id IS NULL THEN
    INSERT INTO auth.users (
      id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      'manager@gmail.com',
      crypt('1133', gen_salt('bf')),
      NOW(),
      '{"role": "manager"}',
      NOW(),
      NOW()
    )
    RETURNING id INTO user_id;
  END IF;
  
  IF user_id IS NOT NULL THEN
    INSERT INTO public.users (id, email, name, phone, role, salary, shift, is_active)
    VALUES (
      user_id,
      'manager@gmail.com',
      'Manager',
      '+252 61 234 5678',
      'manager',
      1500,
      'morning',
      true
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      phone = EXCLUDED.phone,
      role = EXCLUDED.role,
      salary = EXCLUDED.salary,
      shift = EXCLUDED.shift,
      is_active = EXCLUDED.is_active;
  END IF;

  -- Create Cashier user
  SELECT id INTO user_id FROM auth.users WHERE email = 'cashier@gmail.com';
  
  IF user_id IS NULL THEN
    INSERT INTO auth.users (
      id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      'cashier@gmail.com',
      crypt('1133', gen_salt('bf')),
      NOW(),
      '{"role": "cashier"}',
      NOW(),
      NOW()
    )
    RETURNING id INTO user_id;
  END IF;
  
  IF user_id IS NOT NULL THEN
    INSERT INTO public.users (id, email, name, phone, role, salary, shift, is_active)
    VALUES (
      user_id,
      'cashier@gmail.com',
      'Cashier',
      '+252 61 234 5679',
      'cashier',
      800,
      'morning',
      true
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      phone = EXCLUDED.phone,
      role = EXCLUDED.role,
      salary = EXCLUDED.salary,
      shift = EXCLUDED.shift,
      is_active = EXCLUDED.is_active;
  END IF;
END $$;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DO $$
BEGIN
  BEGIN
    CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  EXCEPTION WHEN duplicate_object THEN null;
  END;

  BEGIN
    CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  EXCEPTION WHEN duplicate_object THEN null;
  END;

  BEGIN
    CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  EXCEPTION WHEN duplicate_object THEN null;
  END;

  BEGIN
    CREATE TRIGGER update_tables_updated_at BEFORE UPDATE ON public.tables
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  EXCEPTION WHEN duplicate_object THEN null;
  END;

  BEGIN
    CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  EXCEPTION WHEN duplicate_object THEN null;
  END;

  BEGIN
    CREATE TRIGGER update_ingredients_updated_at BEFORE UPDATE ON public.ingredients
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  EXCEPTION WHEN duplicate_object THEN null;
  END;

  BEGIN
    CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  EXCEPTION WHEN duplicate_object THEN null;
  END;

  BEGIN
    CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON public.settings
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  EXCEPTION WHEN duplicate_object THEN null;
  END;

  BEGIN
    CREATE TRIGGER update_toppings_updated_at BEFORE UPDATE ON public.toppings
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  EXCEPTION WHEN duplicate_object THEN null;
  END;

  BEGIN
    CREATE TRIGGER update_expense_categories_updated_at BEFORE UPDATE ON public.expense_categories
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  EXCEPTION WHEN duplicate_object THEN null;
  END;
END $$;

-- ============================================
-- PAYMENT AND RECEIPT TABLES
-- ============================================

-- Payment methods configuration
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  code VARCHAR(20) NOT NULL UNIQUE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('cash', 'card', 'mobile', 'qr', 'bank')),
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  api_config JSONB,
  requires_phone BOOLEAN DEFAULT false,
  requires_reference BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment transactions
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  payment_method_id UUID REFERENCES public.payment_methods(id),
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'SOS',
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'processing', 'paid', 'failed', 'cancelled', 'refunded')) DEFAULT 'pending',
  transaction_id VARCHAR(100),
  reference_number VARCHAR(100),
  customer_phone VARCHAR(20),
  customer_name VARCHAR(100),
  payment_time TIMESTAMP WITH TIME ZONE,
  approval_status VARCHAR(20),
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Receipts
CREATE TABLE IF NOT EXISTS public.receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  receipt_number VARCHAR(50) UNIQUE NOT NULL,
  invoice_number VARCHAR(50),
  receipt_type VARCHAR(20) NOT NULL CHECK (receipt_type IN ('sale', 'refund', 'void', 'kot', 'shift_report')) DEFAULT 'sale',
  print_count INTEGER DEFAULT 0,
  printed_at TIMESTAMP WITH TIME ZONE,
  qr_code_data TEXT,
  receipt_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Receipt items
CREATE TABLE IF NOT EXISTS public.receipt_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID REFERENCES public.receipts(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  product_name VARCHAR(200) NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  total_price DECIMAL(10, 2) NOT NULL,
  modifiers JSONB,
  extras JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Kitchen tickets
CREATE TABLE IF NOT EXISTS public.kitchen_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  ticket_number VARCHAR(50) UNIQUE NOT NULL,
  table_id UUID REFERENCES public.tables(id),
  table_number INTEGER,
  waiter_id UUID REFERENCES public.users(id),
  waiter_name VARCHAR(100),
  kitchen_section VARCHAR(50),
  status VARCHAR(20) NOT NULL CHECK (status IN ('new', 'preparing', 'ready', 'served', 'cancelled')) DEFAULT 'new',
  priority VARCHAR(20) CHECK (priority IN ('normal', 'urgent', 'vip')) DEFAULT 'normal',
  notes TEXT,
  print_count INTEGER DEFAULT 0,
  printed_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  ready_at TIMESTAMP WITH TIME ZONE,
  served_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Kitchen ticket items
CREATE TABLE IF NOT EXISTS public.kitchen_ticket_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kitchen_ticket_id UUID REFERENCES public.kitchen_tickets(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  product_name VARCHAR(200) NOT NULL,
  quantity INTEGER NOT NULL,
  modifiers JSONB,
  extras JSONB,
  special_instructions TEXT,
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'preparing', 'ready', 'cancelled')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create triggers for new tables
DO $$
BEGIN
  BEGIN
    CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON public.payment_methods
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  EXCEPTION WHEN duplicate_object THEN null;
  END;

  BEGIN
    CREATE TRIGGER update_payment_transactions_updated_at BEFORE UPDATE ON public.payment_transactions
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  EXCEPTION WHEN duplicate_object THEN null;
  END;

  BEGIN
    CREATE TRIGGER update_receipts_updated_at BEFORE UPDATE ON public.receipts
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  EXCEPTION WHEN duplicate_object THEN null;
  END;

  BEGIN
    CREATE TRIGGER update_kitchen_tickets_updated_at BEFORE UPDATE ON public.kitchen_tickets
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  EXCEPTION WHEN duplicate_object THEN null;
  END;
END $$;

-- Enable RLS for payment and receipt tables
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipt_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kitchen_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kitchen_ticket_items ENABLE ROW LEVEL SECURITY;

-- Create policies for payment and receipt tables
DO $$
BEGIN
  -- Payment methods table policy
  BEGIN
    CREATE POLICY "Enable all access for payment_methods" ON public.payment_methods FOR ALL USING (true) WITH CHECK (true);
  EXCEPTION WHEN duplicate_object THEN null;
  END;

  -- Payment transactions table policy
  BEGIN
    CREATE POLICY "Enable all access for payment_transactions" ON public.payment_transactions FOR ALL USING (true) WITH CHECK (true);
  EXCEPTION WHEN duplicate_object THEN null;
  END;

  -- Receipts table policy
  BEGIN
    CREATE POLICY "Enable all access for receipts" ON public.receipts FOR ALL USING (true) WITH CHECK (true);
  EXCEPTION WHEN duplicate_object THEN null;
  END;

  -- Receipt items table policy
  BEGIN
    CREATE POLICY "Enable all access for receipt_items" ON public.receipt_items FOR ALL USING (true) WITH CHECK (true);
  EXCEPTION WHEN duplicate_object THEN null;
  END;

  -- Kitchen tickets table policy
  BEGIN
    CREATE POLICY "Enable all access for kitchen_tickets" ON public.kitchen_tickets FOR ALL USING (true) WITH CHECK (true);
  EXCEPTION WHEN duplicate_object THEN null;
  END;

  -- Kitchen ticket items table policy
  BEGIN
    CREATE POLICY "Enable all access for kitchen_ticket_items" ON public.kitchen_ticket_items FOR ALL USING (true) WITH CHECK (true);
  EXCEPTION WHEN duplicate_object THEN null;
  END;
END $$;

-- Insert default payment methods
INSERT INTO public.payment_methods (name, code, type, is_active, display_order) VALUES
  ('Cash', 'cash', 'cash', true, 1),
  ('Visa', 'visa', 'card', true, 2),
  ('Mastercard', 'mastercard', 'card', true, 3),
  ('Zaad Service', 'zaad', 'mobile', true, 4),
  ('eDahab', 'edahab', 'mobile', true, 5),
  ('Sahal', 'sahal', 'mobile', true, 6),
  ('Premier Wallet', 'premier', 'mobile', true, 7),
  ('Bank Transfer', 'bank', 'bank', true, 8),
  ('QR Payment', 'qr', 'qr', true, 9)
ON CONFLICT (code) DO NOTHING;

-- Enable realtime for payment and receipt tables
-- Note: These may fail if the publication doesn't exist or tables are already added
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE payment_transactions;
    EXCEPTION WHEN duplicate_object THEN null;
    END;
    
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE receipts;
    EXCEPTION WHEN duplicate_object THEN null;
    END;
    
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE kitchen_tickets;
    EXCEPTION WHEN duplicate_object THEN null;
    END;
    
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE payment_methods;
    EXCEPTION WHEN duplicate_object THEN null;
    END;
  END IF;
END $$;

-- Create storage bucket for product images
-- Note: This requires storage extension to be enabled
-- Run this in Supabase Dashboard → Storage → Create Bucket manually if this fails
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for product images bucket
DO $$
BEGIN
  -- Allow public read access to product images
  BEGIN
    CREATE POLICY "Public read access for product-images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'product-images');
  EXCEPTION WHEN duplicate_object THEN null;
  END;

  -- Allow authenticated users to upload images
  BEGIN
    CREATE POLICY "Authenticated upload for product-images"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');
  EXCEPTION WHEN duplicate_object THEN null;
  END;

  -- Allow authenticated users to delete images
  BEGIN
    CREATE POLICY "Authenticated delete for product-images"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');
  EXCEPTION WHEN duplicate_object THEN null;
  END;
END $$;
