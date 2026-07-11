-- ============================================================================
-- 004: Tenant Settings
-- ============================================================================
-- Tenant configuration and system settings
--
-- Dependencies: 001_initial_schema.sql
-- Idempotent: Yes (uses CREATE TABLE IF NOT EXISTS)
-- ============================================================================

-- ============================================================================
-- TENANT_SETTINGS TABLE
-- ============================================================================
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
-- SYSTEM_SETTINGS TABLE
-- ============================================================================
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
-- Verification
-- ============================================================================
-- Verify tables were created
SELECT 
  'tenant_settings' as table_name,
  COUNT(*) as row_count
FROM public.tenant_settings
UNION ALL
SELECT 
  'restaurant_settings' as table_name,
  COUNT(*) as row_count
FROM public.restaurant_settings
UNION ALL
SELECT 
  'system_settings' as table_name,
  COUNT(*) as row_count
FROM public.system_settings;
