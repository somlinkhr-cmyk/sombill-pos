-- ============================================================================
-- 006: Roles
-- ============================================================================
-- Roles and role_permissions for RBAC system
--
-- Dependencies: 003_tenants.sql
-- Idempotent: Yes (uses CREATE TABLE IF NOT EXISTS)
-- ============================================================================

-- ============================================================================
-- ROLES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
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

-- ============================================================================
-- ROLE_PERMISSIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);

-- ============================================================================
-- Verification
-- ============================================================================
SELECT 
  'roles' as table_name,
  COUNT(*) as row_count
FROM public.roles
UNION ALL
SELECT 
  'role_permissions' as table_name,
  COUNT(*) as row_count
FROM public.role_permissions;
