-- ============================================================================
-- 008: Row Level Security (RLS) Enablement
-- ============================================================================
-- This migration enables Row Level Security on all tables.
--
-- Dependencies: 003_tables.sql
-- Idempotent: Yes (uses ALTER TABLE ... ENABLE ROW LEVEL SECURITY)
-- ============================================================================

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

-- Users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Tenants table
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Restaurants table
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

-- Restaurant settings table
ALTER TABLE public.restaurant_settings ENABLE ROW LEVEL SECURITY;

-- Restaurant branches table
ALTER TABLE public.restaurant_branches ENABLE ROW LEVEL SECURITY;

-- Subscription plans table
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Subscriptions table
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Roles table
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- Permissions table
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

-- Role permissions table
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Restaurant users table
ALTER TABLE public.restaurant_users ENABLE ROW LEVEL SECURITY;

-- Employees table
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Customers table
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Tables table
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;

-- Menu categories table
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;

-- Products table
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Inventory table
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- Inventory categories table
ALTER TABLE public.inventory_categories ENABLE ROW LEVEL SECURITY;

-- Suppliers table
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- Orders table
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Order items table
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Payments table
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Payment methods table
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- Tax settings table
ALTER TABLE public.tax_settings ENABLE ROW LEVEL SECURITY;

-- Currencies table
ALTER TABLE public.currencies ENABLE ROW LEVEL SECURITY;

-- Audit logs table
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Activity logs table
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Notifications table
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- System settings table
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- API keys table
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- User sessions table
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Login history table
ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;

-- Support tickets table
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Attachments table
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

-- Restaurant storage table
ALTER TABLE public.restaurant_storage ENABLE ROW LEVEL SECURITY;

-- Restaurant statistics table
ALTER TABLE public.restaurant_statistics ENABLE ROW LEVEL SECURITY;

-- Analytics table
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Verification
-- ============================================================================
-- Verify RLS is enabled on all tables
SELECT 
  COUNT(*) as rls_enabled_count,
  'RLS enabled on all tables' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name NOT IN ('spatial_ref_sys')
AND EXISTS (
  SELECT 1 FROM pg_class 
  WHERE relname = information_schema.tables.table_name 
  AND relrowsecurity = true
);
