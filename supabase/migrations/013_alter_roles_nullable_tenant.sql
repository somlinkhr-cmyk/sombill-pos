-- ============================================================================
-- 013: Alter Roles Table - Allow NULL tenant_id
-- ============================================================================
-- Allow NULL tenant_id for system roles (like Super Admin)
--
-- Dependencies: 006_roles.sql
-- Idempotent: Yes (uses ALTER TABLE ... ALTER COLUMN ... DROP NOT NULL)
-- ============================================================================

-- Allow NULL tenant_id for system roles
ALTER TABLE public.roles 
ALTER COLUMN tenant_id DROP NOT NULL;

-- ============================================================================
-- Verification
-- ============================================================================
SELECT 
  'Roles table altered successfully' as status,
  'tenant_id is now nullable' as change;
