-- ============================================================================
-- 016: System Role Permissions (Production & Development)
-- ============================================================================
-- Assign permissions to Super Admin system role
--
-- Dependencies: 014_system_roles.sql, 015_role_permissions_seed.sql
-- Idempotent: Yes (uses INSERT ... ON CONFLICT DO NOTHING)
-- ============================================================================

-- ============================================================================
-- SUPER ADMIN - All permissions
-- ============================================================================
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
  r.id,
  p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.slug = 'super_admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================================================
-- Verification
-- ============================================================================
SELECT 
  'System role permissions assigned successfully' as status,
  (SELECT COUNT(*) FROM public.role_permissions rp
   JOIN public.roles r ON r.id = rp.role_id
   WHERE r.slug = 'super_admin') as super_admin_permission_count;
