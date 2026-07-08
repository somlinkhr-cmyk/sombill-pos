-- SomBill Multi-Tenancy Schema Migration
-- This script adds multi-tenancy support to the existing SomBill POS database
-- Run this in Supabase SQL Editor

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TENANTS TABLE (Restaurant accounts)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE, -- Subdomain for multi-tenant routing
  logo_url TEXT,
  subscription_tier TEXT NOT NULL DEFAULT 'silver' CHECK (subscription_tier IN ('silver', 'gold', 'platinum')),
  subscription_status TEXT NOT NULL DEFAULT 'trialing' CHECK (subscription_status IN ('trialing', 'active', 'past_due', 'canceled')),
  billing_cycle_start DATE NOT NULL DEFAULT CURRENT_DATE,
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- RESTAURANTS TABLE (Restaurant details)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.restaurants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  business_type TEXT,
  logo_url TEXT,
  brand_color TEXT,
  phone TEXT,
  email TEXT,
  country TEXT,
  city TEXT,
  address TEXT,
  currency TEXT DEFAULT 'USD',
  timezone TEXT DEFAULT 'UTC',
  language TEXT DEFAULT 'en',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, slug)
);

-- ============================================================================
-- BRANCHES TABLE (Restaurant locations)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  is_main BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- RESTAURANT SETTINGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.restaurant_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  tax_rate DECIMAL(5, 2) DEFAULT 0,
  service_charge DECIMAL(5, 2) DEFAULT 0,
  timezone TEXT DEFAULT 'UTC',
  currency_symbol TEXT DEFAULT '$',
  currency_position TEXT DEFAULT 'before',
  decimal_places INTEGER DEFAULT 2,
  thousands_separator TEXT DEFAULT ',',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(restaurant_id)
);

-- ============================================================================
-- ROLES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '{}',
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, restaurant_id, slug)
);

-- ============================================================================
-- MENU CATEGORIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.menu_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- SUBSCRIPTION PLANS TABLE (Plan definitions)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE CHECK (name IN ('silver', 'gold', 'platinum')),
  display_name TEXT NOT NULL,
  monthly_price DECIMAL(10, 2) NOT NULL,
  yearly_price DECIMAL(10, 2) NOT NULL,
  -- Module access flags
  allow_cashier BOOLEAN NOT NULL DEFAULT true,
  allow_manager BOOLEAN NOT NULL DEFAULT true,
  allow_waiter BOOLEAN NOT NULL DEFAULT false,
  allow_kitchen_display BOOLEAN NOT NULL DEFAULT false,
  allow_customer_menu BOOLEAN NOT NULL DEFAULT false,
  allow_multi_branch BOOLEAN NOT NULL DEFAULT false,
  -- Usage limits
  max_tables INTEGER NOT NULL DEFAULT 20,
  max_staff_seats INTEGER NOT NULL DEFAULT 5,
  max_menu_items INTEGER NOT NULL DEFAULT 100,
  max_branches INTEGER NOT NULL DEFAULT 1,
  -- Features
  allow_custom_branding BOOLEAN NOT NULL DEFAULT false,
  allow_api_access BOOLEAN NOT NULL DEFAULT false,
  allow_advanced_analytics BOOLEAN NOT NULL DEFAULT false,
  allow_priority_support BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- SUBSCRIPTIONS TABLE (Active subscriptions per tenant)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'trialing' CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'trial')),
  billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'yearly')),
  billing_provider TEXT, -- 'stripe', 'paypal', etc.
  billing_provider_ref TEXT, -- External subscription ID
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  canceled_at TIMESTAMP WITH TIME ZONE,
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  trial_end_date TIMESTAMP WITH TIME ZONE,
  auto_renew BOOLEAN NOT NULL DEFAULT true,
  features JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, billing_provider_ref)
);

-- ============================================================================
-- ADD TENANT_ID TO EXISTING TABLES
-- ============================================================================

-- Add tenant_id to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Add tenant_id to categories table
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Add tenant_id to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Add tenant_id to tables table
ALTER TABLE public.tables ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Add tenant_id to rooms table
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Add tenant_id to customers table
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Add tenant_id to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Add tenant_id to expenses table
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Add tenant_id to expense_categories table
ALTER TABLE public.expense_categories ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Add tenant_id to suppliers table
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Add tenant_id to ingredients table
ALTER TABLE public.ingredients ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Add tenant_id to purchase_orders table
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Add tenant_id to attendance table
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Add tenant_id to settings table
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- ============================================================================
-- ADD BILINGUAL SUPPORT TO PRODUCTS
-- ============================================================================
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS name_so TEXT; -- Somali name
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description_so TEXT; -- Somali description
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS short_description_so TEXT; -- Somali short description

-- ============================================================================
-- ADD ORDER SOURCE AND STATION TRACKING
-- ============================================================================
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'cashier' CHECK (source IN ('cashier', 'waiter', 'customer_menu', 'kitchen'));
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS kitchen_station TEXT CHECK (kitchen_station IN ('grill', 'fry', 'cold', 'drinks', 'general'));

-- Add timestamps for order state transitions
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS preparing_started_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS ready_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS served_at TIMESTAMP WITH TIME ZONE;

-- ============================================================================
-- ADD CALL BELL SUPPORT TO TABLES
-- ============================================================================
ALTER TABLE public.tables ADD COLUMN IF NOT EXISTS call_bell_requested BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.tables ADD COLUMN IF NOT EXISTS call_bell_requested_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.tables ADD COLUMN IF NOT EXISTS call_bell_acknowledged_at TIMESTAMP WITH TIME ZONE;

-- ============================================================================
-- ADD INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON public.users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_categories_tenant_id ON public.categories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_tenant_id ON public.products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tables_tenant_id ON public.tables(tenant_id);
CREATE INDEX IF NOT EXISTS idx_orders_tenant_id ON public.orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_source ON public.orders(source);
CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant_id ON public.subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);

-- ============================================================================
-- CREATE DEFAULT SUBSCRIPTION PLANS
-- ============================================================================
INSERT INTO public.subscription_plans (name, display_name, monthly_price, yearly_price, allow_cashier, allow_manager, allow_waiter, allow_kitchen_display, allow_customer_menu, allow_multi_branch, max_tables, max_staff_seats, max_menu_items, max_branches, allow_custom_branding, allow_api_access, allow_advanced_analytics, allow_priority_support) VALUES
('silver', 'Silver', 49.00, 490.00, true, true, false, false, false, false, 20, 5, 100, 1, false, false, false, false),
('gold', 'Gold', 99.00, 990.00, true, true, true, false, true, false, 50, 15, 300, 1, true, false, true, false),
('platinum', 'Platinum', 199.00, 1990.00, true, true, true, true, true, true, 999, 999, 999, 10, true, true, true, true)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- CREATE DEFAULT TENANT (for existing data migration)
-- ============================================================================
INSERT INTO public.tenants (name, slug, subscription_tier, subscription_status, billing_cycle_start, trial_ends_at)
VALUES ('Default Restaurant', 'default', 'silver', 'active', CURRENT_DATE, NOW() + INTERVAL '30 days')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- MIGRATE EXISTING DATA TO DEFAULT TENANT
-- ============================================================================
DO $$
DECLARE
  default_tenant_id UUID;
BEGIN
  -- Get default tenant ID
  SELECT id INTO default_tenant_id FROM public.tenants WHERE slug = 'default';
  
  -- Update users without tenant_id
  UPDATE public.users SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  
  -- Update categories without tenant_id
  UPDATE public.categories SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  
  -- Update products without tenant_id
  UPDATE public.products SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  
  -- Update tables without tenant_id
  UPDATE public.tables SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  
  -- Update rooms without tenant_id
  UPDATE public.rooms SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  
  -- Update customers without tenant_id
  UPDATE public.customers SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  
  -- Update orders without tenant_id
  UPDATE public.orders SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  
  -- Update expenses without tenant_id
  UPDATE public.expenses SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  
  -- Update expense_categories without tenant_id
  UPDATE public.expense_categories SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  
  -- Update suppliers without tenant_id
  UPDATE public.suppliers SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  
  -- Update ingredients without tenant_id
  UPDATE public.ingredients SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  
  -- Update purchase_orders without tenant_id
  UPDATE public.purchase_orders SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  
  -- Update attendance without tenant_id
  UPDATE public.attendance SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  
  -- Update settings without tenant_id
  UPDATE public.settings SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  
  -- Create subscription for default tenant
  INSERT INTO public.subscriptions (tenant_id, plan_id, status, current_period_start, current_period_end)
  SELECT 
    default_tenant_id,
    (SELECT id FROM public.subscription_plans WHERE name = 'silver'),
    'active',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '1 month'
  ON CONFLICT (tenant_id, billing_provider_ref) DO NOTHING;
END $$;

-- ============================================================================
-- MAKE TENANT_ID NOT NULL (after migration)
-- ============================================================================
ALTER TABLE public.users ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.categories ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.products ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.tables ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.rooms ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.customers ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.orders ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.expenses ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.expense_categories ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.suppliers ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.ingredients ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.purchase_orders ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.attendance ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.settings ALTER COLUMN tenant_id SET NOT NULL;

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on tenants table
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Super admins can manage tenants" ON public.tenants;
DROP POLICY IF EXISTS "Users can view tenants" ON public.tenants;

-- Allow super admins to manage tenants
CREATE POLICY "Super admins can manage tenants"
ON public.tenants
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.is_super_admin = true
  )
);

-- Enable RLS on subscription_plans table
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Super admins can manage subscription plans" ON public.subscription_plans;
DROP POLICY IF EXISTS "Authenticated users can view subscription plans" ON public.subscription_plans;

-- Allow super admins to manage subscription plans
CREATE POLICY "Super admins can manage subscription plans"
ON public.subscription_plans
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.is_super_admin = true
  )
);

-- Allow authenticated users to view subscription plans
CREATE POLICY "Authenticated users can view subscription plans"
ON public.subscription_plans
FOR SELECT
USING (true);

-- Enable RLS on subscriptions table
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Super admins can manage subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can view own tenant subscriptions" ON public.subscriptions;

-- Allow super admins to manage all subscriptions
CREATE POLICY "Super admins can manage subscriptions"
ON public.subscriptions
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.is_super_admin = true
  )
);

-- Allow users to view their own tenant's subscriptions
CREATE POLICY "Users can view own tenant subscriptions"
ON public.subscriptions
FOR SELECT
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.users WHERE id = auth.uid()
  )
);

-- ============================================================================
-- RLS POLICIES FOR RESTAURANTS TABLE
-- ============================================================================
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Super admins can manage restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Users can view own tenant restaurants" ON public.restaurants;

CREATE POLICY "Super admins can manage restaurants"
ON public.restaurants
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.is_super_admin = true
  )
);

CREATE POLICY "Users can view own tenant restaurants"
ON public.restaurants
FOR SELECT
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.users WHERE id = auth.uid()
  )
);

-- ============================================================================
-- RLS POLICIES FOR BRANCHES TABLE
-- ============================================================================
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Super admins can manage branches" ON public.branches;
DROP POLICY IF EXISTS "Users can view own tenant branches" ON public.branches;

CREATE POLICY "Super admins can manage branches"
ON public.branches
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.is_super_admin = true
  )
);

CREATE POLICY "Users can view own tenant branches"
ON public.branches
FOR SELECT
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.users WHERE id = auth.uid()
  )
);

-- ============================================================================
-- RLS POLICIES FOR RESTAURANT SETTINGS TABLE
-- ============================================================================
ALTER TABLE public.restaurant_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Super admins can manage restaurant settings" ON public.restaurant_settings;
DROP POLICY IF EXISTS "Users can view own restaurant settings" ON public.restaurant_settings;

CREATE POLICY "Super admins can manage restaurant settings"
ON public.restaurant_settings
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.is_super_admin = true
  )
);

CREATE POLICY "Users can view own restaurant settings"
ON public.restaurant_settings
FOR SELECT
USING (
  restaurant_id IN (
    SELECT restaurant_id FROM public.users WHERE id = auth.uid()
  )
);

-- ============================================================================
-- RLS POLICIES FOR ROLES TABLE
-- ============================================================================
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Super admins can manage roles" ON public.roles;
DROP POLICY IF EXISTS "Users can view own tenant roles" ON public.roles;

CREATE POLICY "Super admins can manage roles"
ON public.roles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.is_super_admin = true
  )
);

CREATE POLICY "Users can view own tenant roles"
ON public.roles
FOR SELECT
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.users WHERE id = auth.uid()
  )
);

-- ============================================================================
-- RLS POLICIES FOR MENU CATEGORIES TABLE
-- ============================================================================
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Super admins can manage menu categories" ON public.menu_categories;
DROP POLICY IF EXISTS "Users can view own restaurant menu categories" ON public.menu_categories;

CREATE POLICY "Super admins can manage menu categories"
ON public.menu_categories
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.is_super_admin = true
  )
);

CREATE POLICY "Users can view own restaurant menu categories"
ON public.menu_categories
FOR SELECT
USING (
  restaurant_id IN (
    SELECT restaurant_id FROM public.users WHERE id = auth.uid()
  )
);
