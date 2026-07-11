-- ============================================================================
-- 001: Initial Schema
-- ============================================================================
-- Core multi-tenant SaaS schema with tenants, users, restaurants, and branches
--
-- Dependencies: None
-- Idempotent: Yes (uses CREATE TABLE IF NOT EXISTS)
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TENANTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PROFILES TABLE (extends auth.users)
-- ============================================================================
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

-- ============================================================================
-- RESTAURANTS TABLE
-- ============================================================================
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

-- ============================================================================
-- RESTAURANT_BRANCHES TABLE
-- ============================================================================
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
-- Verification
-- ============================================================================
-- Verify tables were created
SELECT 
  'tenants' as table_name,
  COUNT(*) as row_count
FROM public.tenants
UNION ALL
SELECT 
  'profiles' as table_name,
  COUNT(*) as row_count
FROM public.profiles
UNION ALL
SELECT 
  'restaurants' as table_name,
  COUNT(*) as row_count
FROM public.restaurants
UNION ALL
SELECT 
  'restaurant_branches' as table_name,
  COUNT(*) as row_count
FROM public.restaurant_branches;
