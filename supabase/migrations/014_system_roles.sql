-- ============================================================================
-- 014: System Roles (Production & Development)
-- ============================================================================
-- Create system roles that exist in all environments
--
-- Dependencies: 006_roles.sql
-- Idempotent: Yes (uses INSERT ... ON CONFLICT DO NOTHING)
-- ============================================================================

-- ============================================================================
-- SYSTEM ROLE: Super Admin
-- ============================================================================
-- Super Admin role is special - it has NULL tenant_id and is_system_role is true
INSERT INTO public.roles (id, tenant_id, name, slug, description, level, is_system_role, is_default)
VALUES (
  gen_random_uuid(),
  NULL,
  'Super Admin',
  'super_admin',
  'Full system access with all permissions',
  100,
  true,
  false
)
ON CONFLICT (tenant_id, slug) DO NOTHING;

-- ============================================================================
-- Verification
-- ============================================================================
SELECT 
  'System roles seeded successfully' as status,
  (SELECT COUNT(*) FROM public.roles WHERE is_system_role = true) as system_role_count;
