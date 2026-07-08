-- ============================================================================
-- MASTER MIGRATION FILE
-- Complete Multi-Tenant Restaurant SaaS Backend Setup
-- 
-- This file runs all SQL migrations in the correct order to set up the complete
-- production-ready backend for the restaurant management system.
--
-- RUN THIS FILE IN SUPABASE SQL EDITOR
-- ============================================================================
-- 
-- EXECUTION ORDER:
-- 1. complete-schema.sql - Creates all tables
-- 2. functions.sql - Creates PostgreSQL functions
-- 3. triggers.sql - Creates triggers for automation
-- 4. indexes.sql - Creates performance indexes
-- 5. rls-policies.sql - Enables Row Level Security
-- 6. seed-data.sql - Inserts default subscription plans and system settings
--
-- ============================================================================

-- Step 1: Create complete schema
\ir supabase/complete-schema.sql

-- Step 2: Create PostgreSQL functions
\ir supabase/functions.sql

-- Step 3: Create triggers
\ir supabase/triggers.sql

-- Step 4: Create indexes
\ir supabase/indexes.sql

-- Step 5: Enable RLS policies
\ir supabase/rls-policies.sql

-- Step 6: Insert seed data
\ir supabase/seed-data.sql

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- 
-- The following components are now set up:
-- 
-- TABLES (30+ tables):
-- - tenants, restaurants, restaurant_settings, restaurant_branches
-- - subscription_plans, subscriptions
-- - roles, permissions, role_permissions
-- - restaurant_users, employees, customers
-- - tables, menu_categories, products
-- - inventory, inventory_categories, suppliers
-- - orders, order_items, payments, payment_methods
-- - tax_settings, currencies
-- - audit_logs, activity_logs, notifications
-- - system_settings, api_keys, user_sessions, login_history
-- - support_tickets, attachments
-- - restaurant_storage, restaurant_statistics, analytics
--
-- FUNCTIONS:
-- - create_restaurant() - Main transaction function
-- - create_tenant() - Create tenant
-- - create_subscription() - Create subscription
-- - create_owner() - Create owner with Supabase Auth
-- - create_default_roles() - Create default roles
-- - create_permissions() - Create permissions
-- - create_menu_categories() - Create menu categories
-- - create_tables() - Create dining tables
-- - create_payment_methods() - Create payment methods
-- - create_inventory_categories() - Create inventory categories
-- - create_restaurant_settings() - Create restaurant settings
-- - activate_subscription() - Activate subscription
-- - suspend_restaurant() - Suspend restaurant
-- - delete_restaurant() - Soft delete restaurant
-- - restore_restaurant() - Restore restaurant
--
-- TRIGGERS:
-- - Automatic updated_at timestamps
-- - Audit logging for all key operations
-- - Activity logging
-- - Restaurant statistics updates
-- - Storage tracking
--
-- INDEXES:
-- - Performance indexes on all foreign keys and frequently queried columns
-- - Composite indexes for multi-tenant queries
--
-- RLS POLICIES:
-- - Row Level Security enabled on all tables
-- - Super admin policies for full access
-- - Tenant-based isolation for data security
-- - User-based access control
--
-- SEED DATA:
-- - 5 subscription plans (Starter, Professional, Business, Enterprise, Custom)
-- - Complete permission definitions
-- - System settings
--
-- ============================================================================
-- NEXT STEPS
-- ============================================================================
--
-- 1. Run this migration in Supabase SQL Editor
-- 2. Test the Restaurant Setup Wizard
-- 3. Verify restaurant creation works end-to-end
--
-- ============================================================================
