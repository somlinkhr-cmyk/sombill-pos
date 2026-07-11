-- ============================================================================
-- 007: Permissions
-- ============================================================================
-- Permissions table for RBAC system
--
-- Dependencies: None
-- Idempotent: Yes (uses CREATE TABLE IF NOT EXISTS)
-- ============================================================================

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
-- Verification
-- ============================================================================
SELECT 
  'permissions' as table_name,
  COUNT(*) as row_count
FROM public.permissions;
