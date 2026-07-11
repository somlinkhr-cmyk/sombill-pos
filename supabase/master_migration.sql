-- ============================================================================
-- MASTER MIGRATION SCRIPT
-- ============================================================================
-- This script combines all Phase 1 migrations for manual application
-- Run this in Supabase SQL Editor to apply all migrations at once
-- ============================================================================

-- ============================================================================
-- 001: Initial Schema
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- TENANTS TABLE
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  is_super_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, email)
);

-- RESTAURANTS TABLE
CREATE TABLE IF NOT EXISTS public.restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'US',
  postal_code TEXT,
  timezone TEXT DEFAULT 'UTC',
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, slug)
);

-- RESTAURANT_BRANCHES TABLE
CREATE TABLE IF NOT EXISTS public.restaurant_branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'US',
  postal_code TEXT,
  phone TEXT,
  email TEXT,
  is_main_branch BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(restaurant_id, slug)
);

-- ============================================================================
-- 002: Profiles, Roles, and Permissions
-- ============================================================================

-- RESTAURANT_USERS TABLE
CREATE TABLE IF NOT EXISTS public.restaurant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.restaurant_branches(id) ON DELETE SET NULL,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  is_owner BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(restaurant_id, profile_id)
);

-- ROLES TABLE
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  level INTEGER DEFAULT 0,
  is_system_role BOOLEAN NOT NULL DEFAULT false,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, slug)
);

-- PERMISSIONS TABLE
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ROLE_PERMISSIONS TABLE
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);

-- ============================================================================
-- 003: Subscriptions
-- ============================================================================

-- SUBSCRIPTION_PLANS TABLE
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  monthly_price DECIMAL(10, 2) DEFAULT 0,
  yearly_price DECIMAL(10, 2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  limits JSONB DEFAULT '{}',
  features JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_public BOOLEAN NOT NULL DEFAULT true,
  trial_days INTEGER DEFAULT 14,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'trialing' CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'suspended')),
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  current_period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  current_period_end TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  canceled_at TIMESTAMP WITH TIME ZONE,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id)
);

-- ============================================================================
-- 004: Tenant Settings
-- ============================================================================

-- TENANT_SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.tenant_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value JSONB,
  description TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, key)
);

-- RESTAURANT_SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.restaurant_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value JSONB,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(restaurant_id, key)
);

-- SYSTEM_SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB,
  description TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 005: Audit Logs
-- ============================================================================

-- AUDIT_LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_values JSONB,
  new_values JSONB,
  changed_fields TEXT[],
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 006: Notifications
-- ============================================================================

-- NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  action_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 007: Functions
-- ============================================================================

-- RLS Helper Functions
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND is_super_admin = true
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT tenant_id FROM public.profiles
    WHERE id = auth.uid()
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_restaurant_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT restaurant_id FROM public.restaurant_users
    WHERE profile_id = auth.uid()
    AND status = 'active'
    LIMIT 1
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.has_permission(permission_slug TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role_id UUID;
BEGIN
  SELECT role_id INTO user_role_id
  FROM public.restaurant_users
  WHERE profile_id = auth.uid()
  AND status = 'active'
  LIMIT 1;
  
  RETURN EXISTS (
    SELECT 1 FROM public.role_permissions rp
    JOIN public.permissions p ON p.id = rp.permission_id
    WHERE rp.role_id = user_role_id
    AND p.slug = permission_slug
  );
END;
$$;

-- Business Logic Functions
CREATE OR REPLACE FUNCTION public.create_tenant(
  p_name TEXT,
  p_slug TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  INSERT INTO public.tenants (name, slug)
  VALUES (p_name, p_slug)
  RETURNING id INTO v_tenant_id;
  
  RETURN v_tenant_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_restaurant(
  p_tenant_id UUID,
  p_name TEXT,
  p_slug TEXT,
  p_description TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_restaurant_id UUID;
BEGIN
  INSERT INTO public.restaurants (tenant_id, name, slug, description)
  VALUES (p_tenant_id, p_name, p_slug, p_description)
  RETURNING id INTO v_restaurant_id;
  
  RETURN v_restaurant_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_subscription(
  p_tenant_id UUID,
  p_plan_id UUID,
  p_billing_cycle TEXT DEFAULT 'monthly'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_subscription_id UUID;
  v_plan RECORD;
  v_trial_end TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT * INTO v_plan
  FROM public.subscription_plans
  WHERE id = p_plan_id;
  
  IF v_plan.trial_days > 0 THEN
    v_trial_end := NOW() + (v_plan.trial_days || ' days')::INTERVAL;
  END IF;
  
  INSERT INTO public.subscriptions (
    tenant_id,
    plan_id,
    billing_cycle,
    trial_end,
    current_period_end
  )
  VALUES (
    p_tenant_id,
    p_plan_id,
    p_billing_cycle,
    v_trial_end,
    COALESCE(v_trial_end, NOW() + INTERVAL '1 month')
  )
  RETURNING id INTO v_subscription_id;
  
  RETURN v_subscription_id;
END;
$$;

-- ============================================================================
-- 008: Triggers
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

-- Apply Updated At Triggers
DROP TRIGGER IF EXISTS tenants_updated_at ON public.tenants;
CREATE TRIGGER tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS restaurants_updated_at ON public.restaurants;
CREATE TRIGGER restaurants_updated_at
  BEFORE UPDATE ON public.restaurants
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS restaurant_branches_updated_at ON public.restaurant_branches;
CREATE TRIGGER restaurant_branches_updated_at
  BEFORE UPDATE ON public.restaurant_branches
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS roles_updated_at ON public.roles;
CREATE TRIGGER roles_updated_at
  BEFORE UPDATE ON public.roles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS subscription_plans_updated_at ON public.subscription_plans;
CREATE TRIGGER subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS restaurant_users_updated_at ON public.restaurant_users;
CREATE TRIGGER restaurant_users_updated_at
  BEFORE UPDATE ON public.restaurant_users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tenant_settings_updated_at ON public.tenant_settings;
CREATE TRIGGER tenant_settings_updated_at
  BEFORE UPDATE ON public.tenant_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS restaurant_settings_updated_at ON public.restaurant_settings;
CREATE TRIGGER restaurant_settings_updated_at
  BEFORE UPDATE ON public.restaurant_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS system_settings_updated_at ON public.system_settings;
CREATE TRIGGER system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 009: RLS
-- ============================================================================

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 010: Policies
-- ============================================================================

-- PROFILES
DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT
  USING (id = auth.uid());

DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE
  USING (id = auth.uid());

DROP POLICY IF EXISTS profiles_super_admin ON public.profiles;
CREATE POLICY profiles_super_admin ON public.profiles
  FOR ALL
  USING (public.is_super_admin());

-- TENANTS
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

-- RESTAURANTS
DROP POLICY IF EXISTS restaurants_select_own ON public.restaurants;
CREATE POLICY restaurants_select_own ON public.restaurants
  FOR SELECT
  USING (tenant_id = public.get_user_tenant_id());

DROP POLICY IF EXISTS restaurants_update_own ON public.restaurants;
CREATE POLICY restaurants_update_own ON public.restaurants
  FOR UPDATE
  USING (tenant_id = public.get_user_tenant_id());

DROP POLICY IF EXISTS restaurants_super_admin ON public.restaurants;
CREATE POLICY restaurants_super_admin ON public.restaurants
  FOR ALL
  USING (public.is_super_admin());

-- RESTAURANT_BRANCHES
DROP POLICY IF EXISTS restaurant_branches_select_own ON public.restaurant_branches;
CREATE POLICY restaurant_branches_select_own ON public.restaurant_branches
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.restaurants r
    WHERE r.id = restaurant_branches.restaurant_id
    AND r.tenant_id = public.get_user_tenant_id()
  ));

DROP POLICY IF EXISTS restaurant_branches_update_own ON public.restaurant_branches;
CREATE POLICY restaurant_branches_update_own ON public.restaurant_branches
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.restaurants r
    WHERE r.id = restaurant_branches.restaurant_id
    AND r.tenant_id = public.get_user_tenant_id()
  ));

DROP POLICY IF EXISTS restaurant_branches_super_admin ON public.restaurant_branches;
CREATE POLICY restaurant_branches_super_admin ON public.restaurant_branches
  FOR ALL
  USING (public.is_super_admin());

-- RESTAURANT_USERS
DROP POLICY IF EXISTS restaurant_users_select_own ON public.restaurant_users;
CREATE POLICY restaurant_users_select_own ON public.restaurant_users
  FOR SELECT
  USING (profile_id = auth.uid() OR public.is_super_admin());

DROP POLICY IF EXISTS restaurant_users_update_own ON public.restaurant_users;
CREATE POLICY restaurant_users_update_own ON public.restaurant_users
  FOR UPDATE
  USING (profile_id = auth.uid() OR public.is_super_admin());

DROP POLICY IF EXISTS restaurant_users_super_admin ON public.restaurant_users;
CREATE POLICY restaurant_users_super_admin ON public.restaurant_users
  FOR ALL
  USING (public.is_super_admin());

-- ROLES
DROP POLICY IF EXISTS roles_select_own ON public.roles;
CREATE POLICY roles_select_own ON public.roles
  FOR SELECT
  USING (tenant_id = public.get_user_tenant_id());

DROP POLICY IF EXISTS roles_update_own ON public.roles;
CREATE POLICY roles_update_own ON public.roles
  FOR UPDATE
  USING (tenant_id = public.get_user_tenant_id());

DROP POLICY IF EXISTS roles_super_admin ON public.roles;
CREATE POLICY roles_super_admin ON public.roles
  FOR ALL
  USING (public.is_super_admin());

-- PERMISSIONS
DROP POLICY IF EXISTS permissions_select_all ON public.permissions;
CREATE POLICY permissions_select_all ON public.permissions
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS permissions_super_admin ON public.permissions;
CREATE POLICY permissions_super_admin ON public.permissions
  FOR ALL
  USING (public.is_super_admin());

-- ROLE_PERMISSIONS
DROP POLICY IF EXISTS role_permissions_select_own ON public.role_permissions;
CREATE POLICY role_permissions_select_own ON public.role_permissions
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.roles r
    WHERE r.id = role_permissions.role_id
    AND r.tenant_id = public.get_user_tenant_id()
  ));

DROP POLICY IF EXISTS role_permissions_super_admin ON public.role_permissions;
CREATE POLICY role_permissions_super_admin ON public.role_permissions
  FOR ALL
  USING (public.is_super_admin());

-- SUBSCRIPTION_PLANS
DROP POLICY IF EXISTS subscription_plans_select_public ON public.subscription_plans;
CREATE POLICY subscription_plans_select_public ON public.subscription_plans
  FOR SELECT
  USING (is_public = true);

DROP POLICY IF EXISTS subscription_plans_select_all ON public.subscription_plans;
CREATE POLICY subscription_plans_select_all ON public.subscription_plans
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS subscription_plans_super_admin ON public.subscription_plans;
CREATE POLICY subscription_plans_super_admin ON public.subscription_plans
  FOR ALL
  USING (public.is_super_admin());

-- SUBSCRIPTIONS
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

-- TENANT_SETTINGS
DROP POLICY IF EXISTS tenant_settings_select_own ON public.tenant_settings;
CREATE POLICY tenant_settings_select_own ON public.tenant_settings
  FOR SELECT
  USING (tenant_id = public.get_user_tenant_id() OR is_public = true);

DROP POLICY IF EXISTS tenant_settings_update_own ON public.tenant_settings;
CREATE POLICY tenant_settings_update_own ON public.tenant_settings
  FOR UPDATE
  USING (tenant_id = public.get_user_tenant_id());

DROP POLICY IF EXISTS tenant_settings_super_admin ON public.tenant_settings;
CREATE POLICY tenant_settings_super_admin ON public.tenant_settings
  FOR ALL
  USING (public.is_super_admin());

-- RESTAURANT_SETTINGS
DROP POLICY IF EXISTS restaurant_settings_select_own ON public.restaurant_settings;
CREATE POLICY restaurant_settings_select_own ON public.restaurant_settings
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.restaurants r
    WHERE r.id = restaurant_settings.restaurant_id
    AND r.tenant_id = public.get_user_tenant_id()
  ));

DROP POLICY IF EXISTS restaurant_settings_update_own ON public.restaurant_settings;
CREATE POLICY restaurant_settings_update_own ON public.restaurant_settings
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.restaurants r
    WHERE r.id = restaurant_settings.restaurant_id
    AND r.tenant_id = public.get_user_tenant_id()
  ));

DROP POLICY IF EXISTS restaurant_settings_super_admin ON public.restaurant_settings;
CREATE POLICY restaurant_settings_super_admin ON public.restaurant_settings
  FOR ALL
  USING (public.is_super_admin());

-- SYSTEM_SETTINGS
DROP POLICY IF EXISTS system_settings_select_public ON public.system_settings;
CREATE POLICY system_settings_select_public ON public.system_settings
  FOR SELECT
  USING (is_public = true);

DROP POLICY IF EXISTS system_settings_super_admin ON public.system_settings;
CREATE POLICY system_settings_super_admin ON public.system_settings
  FOR ALL
  USING (public.is_super_admin());

-- AUDIT_LOGS
DROP POLICY IF EXISTS audit_logs_select_own ON public.audit_logs;
CREATE POLICY audit_logs_select_own ON public.audit_logs
  FOR SELECT
  USING (tenant_id = public.get_user_tenant_id());

DROP POLICY IF EXISTS audit_logs_super_admin ON public.audit_logs;
CREATE POLICY audit_logs_super_admin ON public.audit_logs
  FOR ALL
  USING (public.is_super_admin());

-- NOTIFICATIONS
DROP POLICY IF EXISTS notifications_select_own ON public.notifications;
CREATE POLICY notifications_select_own ON public.notifications
  FOR SELECT
  USING (profile_id = auth.uid());

DROP POLICY IF EXISTS notifications_update_own ON public.notifications;
CREATE POLICY notifications_update_own ON public.notifications
  FOR UPDATE
  USING (profile_id = auth.uid());

DROP POLICY IF EXISTS notifications_super_admin ON public.notifications;
CREATE POLICY notifications_super_admin ON public.notifications
  FOR ALL
  USING (public.is_super_admin());

-- ============================================================================
-- 011: Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON public.tenants(status);
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON public.profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_is_super_admin ON public.profiles(is_super_admin);
CREATE INDEX IF NOT EXISTS idx_restaurants_tenant_id ON public.restaurants(tenant_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_slug ON public.restaurants(slug);
CREATE INDEX IF NOT EXISTS idx_restaurants_status ON public.restaurants(status);
CREATE INDEX IF NOT EXISTS idx_restaurant_branches_restaurant_id ON public.restaurant_branches(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_branches_slug ON public.restaurant_branches(slug);
CREATE INDEX IF NOT EXISTS idx_restaurant_branches_status ON public.restaurant_branches(status);
CREATE INDEX IF NOT EXISTS idx_restaurant_branches_is_main_branch ON public.restaurant_branches(is_main_branch);
CREATE INDEX IF NOT EXISTS idx_restaurant_users_restaurant_id ON public.restaurant_users(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_users_profile_id ON public.restaurant_users(profile_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_users_role_id ON public.restaurant_users(role_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_users_status ON public.restaurant_users(status);
CREATE INDEX IF NOT EXISTS idx_restaurant_users_branch_id ON public.restaurant_users(branch_id);
CREATE INDEX IF NOT EXISTS idx_roles_tenant_id ON public.roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_roles_slug ON public.roles(slug);
CREATE INDEX IF NOT EXISTS idx_roles_is_system_role ON public.roles(is_system_role);
CREATE INDEX IF NOT EXISTS idx_roles_is_default ON public.roles(is_default);
CREATE INDEX IF NOT EXISTS idx_permissions_slug ON public.permissions(slug);
CREATE INDEX IF NOT EXISTS idx_permissions_resource ON public.permissions(resource);
CREATE INDEX IF NOT EXISTS idx_permissions_action ON public.permissions(action);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON public.role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON public.role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_slug ON public.subscription_plans(slug);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_is_active ON public.subscription_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_is_public ON public.subscription_plans(is_public);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_sort_order ON public.subscription_plans(sort_order);
CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant_id ON public.subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON public.subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON public.subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_tenant_settings_tenant_id ON public.tenant_settings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_settings_key ON public.tenant_settings(key);
CREATE INDEX IF NOT EXISTS idx_tenant_settings_is_public ON public.tenant_settings(is_public);
CREATE INDEX IF NOT EXISTS idx_restaurant_settings_restaurant_id ON public.restaurant_settings(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_settings_key ON public.restaurant_settings(key);
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON public.system_settings(key);
CREATE INDEX IF NOT EXISTS idx_system_settings_is_public ON public.system_settings(is_public);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON public.audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_restaurant_id ON public.audit_logs(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_profile_id ON public.audit_logs(profile_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id ON public.audit_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_tenant_id ON public.notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_restaurant_id ON public.notifications(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_profile_id ON public.notifications(profile_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

-- ============================================================================
-- 012: Seed Data
-- ============================================================================

-- SUBSCRIPTION PLANS
INSERT INTO public.subscription_plans (
  id,
  name,
  slug,
  description,
  monthly_price,
  yearly_price,
  currency,
  limits,
  features,
  is_active,
  is_public,
  trial_days,
  sort_order
) VALUES
  (
    gen_random_uuid(),
    'Starter',
    'starter',
    'Perfect for small restaurants getting started',
    0,
    0,
    'USD',
    '{"branches": 1, "users": 5, "tables": 20, "products": 100, "storage_mb": 1000}',
    '{"pos": true, "inventory": true, "reports": true, "multi_branch": false, "api_access": false}',
    true,
    true,
    14,
    1
  ),
  (
    gen_random_uuid(),
    'Professional',
    'professional',
    'For growing restaurants with multiple branches',
    49,
    490,
    'USD',
    '{"branches": 5, "users": 25, "tables": 100, "products": 500, "storage_mb": 5000}',
    '{"pos": true, "inventory": true, "reports": true, "multi_branch": true, "api_access": true}',
    true,
    true,
    14,
    2
  ),
  (
    gen_random_uuid(),
    'Business',
    'business',
    'For restaurant chains with advanced needs',
    149,
    1490,
    'USD',
    '{"branches": 20, "users": 100, "tables": 500, "products": 2000, "storage_mb": 20000}',
    '{"pos": true, "inventory": true, "reports": true, "multi_branch": true, "api_access": true, "analytics": true}',
    true,
    true,
    14,
    3
  ),
  (
    gen_random_uuid(),
    'Enterprise',
    'enterprise',
    'Custom solution for large restaurant groups',
    499,
    4990,
    'USD',
    '{"branches": -1, "users": -1, "tables": -1, "products": -1, "storage_mb": -1}',
    '{"pos": true, "inventory": true, "reports": true, "multi_branch": true, "api_access": true, "analytics": true, "custom_integrations": true}',
    true,
    true,
    30,
    4
  )
ON CONFLICT (slug) DO NOTHING;

-- PERMISSIONS
INSERT INTO public.permissions (id, name, slug, description, resource, action) VALUES
  (gen_random_uuid(), 'View Tenants', 'tenants.view', 'View tenant information', 'tenants', 'view'),
  (gen_random_uuid(), 'Create Tenants', 'tenants.create', 'Create new tenants', 'tenants', 'create'),
  (gen_random_uuid(), 'Update Tenants', 'tenants.update', 'Update tenant information', 'tenants', 'update'),
  (gen_random_uuid(), 'Delete Tenants', 'tenants.delete', 'Delete tenants', 'tenants', 'delete'),
  (gen_random_uuid(), 'View Restaurants', 'restaurants.view', 'View restaurant information', 'restaurants', 'view'),
  (gen_random_uuid(), 'Create Restaurants', 'restaurants.create', 'Create new restaurants', 'restaurants', 'create'),
  (gen_random_uuid(), 'Update Restaurants', 'restaurants.update', 'Update restaurant information', 'restaurants', 'update'),
  (gen_random_uuid(), 'Delete Restaurants', 'restaurants.delete', 'Delete restaurants', 'restaurants', 'delete'),
  (gen_random_uuid(), 'View Branches', 'branches.view', 'View branch information', 'branches', 'view'),
  (gen_random_uuid(), 'Create Branches', 'branches.create', 'Create new branches', 'branches', 'create'),
  (gen_random_uuid(), 'Update Branches', 'branches.update', 'Update branch information', 'branches', 'update'),
  (gen_random_uuid(), 'Delete Branches', 'branches.delete', 'Delete branches', 'branches', 'delete'),
  (gen_random_uuid(), 'View Users', 'users.view', 'View user information', 'users', 'view'),
  (gen_random_uuid(), 'Create Users', 'users.create', 'Create new users', 'users', 'create'),
  (gen_random_uuid(), 'Update Users', 'users.update', 'Update user information', 'users', 'update'),
  (gen_random_uuid(), 'Delete Users', 'users.delete', 'Delete users', 'users', 'delete'),
  (gen_random_uuid(), 'View Roles', 'roles.view', 'View role information', 'roles', 'view'),
  (gen_random_uuid(), 'Create Roles', 'roles.create', 'Create new roles', 'roles', 'create'),
  (gen_random_uuid(), 'Update Roles', 'roles.update', 'Update role information', 'roles', 'update'),
  (gen_random_uuid(), 'Delete Roles', 'roles.delete', 'Delete roles', 'roles', 'delete'),
  (gen_random_uuid(), 'View Subscriptions', 'subscriptions.view', 'View subscription information', 'subscriptions', 'view'),
  (gen_random_uuid(), 'Create Subscriptions', 'subscriptions.create', 'Create new subscriptions', 'subscriptions', 'create'),
  (gen_random_uuid(), 'Update Subscriptions', 'subscriptions.update', 'Update subscription information', 'subscriptions', 'update'),
  (gen_random_uuid(), 'Cancel Subscriptions', 'subscriptions.cancel', 'Cancel subscriptions', 'subscriptions', 'cancel'),
  (gen_random_uuid(), 'View Settings', 'settings.view', 'View settings', 'settings', 'view'),
  (gen_random_uuid(), 'Update Settings', 'settings.update', 'Update settings', 'settings', 'update'),
  (gen_random_uuid(), 'View Reports', 'reports.view', 'View reports', 'reports', 'view'),
  (gen_random_uuid(), 'Export Reports', 'reports.export', 'Export reports', 'reports', 'export'),
  (gen_random_uuid(), 'View Audit Logs', 'audit_logs.view', 'View audit logs', 'audit_logs', 'view')
ON CONFLICT (slug) DO NOTHING;

-- SYSTEM SETTINGS
INSERT INTO public.system_settings (id, key, value, description, is_public) VALUES
  (gen_random_uuid(), 'app_name', '"SomBill POS"', 'Application name', true),
  (gen_random_uuid(), 'app_version', '"1.0.0"', 'Application version', true),
  (gen_random_uuid(), 'default_currency', '"USD"', 'Default currency code', true),
  (gen_random_uuid(), 'default_timezone', '"UTC"', 'Default timezone', true),
  (gen_random_uuid(), 'default_language', '"en"', 'Default language code', true),
  (gen_random_uuid(), 'maintenance_mode', 'false', 'Maintenance mode flag', true),
  (gen_random_uuid(), 'registration_enabled', 'true', 'Allow new user registration', true),
  (gen_random_uuid(), 'trial_days', '14', 'Default trial period in days', false),
  (gen_random_uuid(), 'max_file_size_mb', '10', 'Maximum file upload size in MB', false),
  (gen_random_uuid(), 'session_timeout_minutes', '60', 'User session timeout in minutes', false)
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT 'Master migration completed successfully' as status;
