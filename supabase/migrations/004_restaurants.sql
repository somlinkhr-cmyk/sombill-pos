-- ============================================================================
-- 004: Restaurants
-- ============================================================================
-- Restaurants and restaurant branches tables
--
-- Dependencies: 001_extensions.sql, 003_tenants.sql
-- Idempotent: Yes (uses CREATE TABLE IF NOT EXISTS)
-- ============================================================================

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
-- RESTAURANT_SETTINGS TABLE
-- ============================================================================
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

-- ============================================================================
-- Verification
-- ============================================================================
SELECT 
  'restaurants' as table_name,
  COUNT(*) as row_count
FROM public.restaurants
UNION ALL
SELECT 
  'restaurant_branches' as table_name,
  COUNT(*) as row_count
FROM public.restaurant_branches
UNION ALL
SELECT 
  'restaurant_settings' as table_name,
  COUNT(*) as row_count
FROM public.restaurant_settings;
