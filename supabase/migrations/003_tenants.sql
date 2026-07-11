-- ============================================================================
-- 003: Tenants
-- ============================================================================
-- Multi-tenant SaaS core table
--
-- Dependencies: 001_extensions.sql, 002_auth.sql
-- Idempotent: Yes (uses CREATE TABLE IF NOT EXISTS)
-- ============================================================================

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
-- Verification
-- ============================================================================
SELECT 
  'tenants' as table_name,
  COUNT(*) as row_count
FROM public.tenants
UNION ALL
SELECT 
  'tenant_settings' as table_name,
  COUNT(*) as row_count
FROM public.tenant_settings;
