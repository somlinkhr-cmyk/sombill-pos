-- ============================================================================
-- 002: Profiles, Roles, and Permissions (RBAC)
-- ============================================================================
-- Role-Based Access Control system for multi-tenant SaaS
--
-- Dependencies: 001_initial_schema.sql
-- Idempotent: Yes (uses CREATE TABLE IF NOT EXISTS)
-- ============================================================================

-- ============================================================================
-- RESTAURANT_USERS TABLE (links users to restaurants with roles)
-- ============================================================================
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

-- ============================================================================
-- ROLES TABLE
-- ============================================================================
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

-- ============================================================================
-- PERMISSIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- ROLE_PERMISSIONS TABLE (many-to-many)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);

-- ============================================================================
-- Verification
-- ============================================================================
-- Verify tables were created
SELECT 
  'restaurant_users' as table_name,
  COUNT(*) as row_count
FROM public.restaurant_users
UNION ALL
SELECT 
  'roles' as table_name,
  COUNT(*) as row_count
FROM public.roles
UNION ALL
SELECT 
  'permissions' as table_name,
  COUNT(*) as row_count
FROM public.permissions
UNION ALL
SELECT 
  'role_permissions' as table_name,
  COUNT(*) as row_count
FROM public.role_permissions;
