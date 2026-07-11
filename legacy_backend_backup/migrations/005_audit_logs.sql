-- ============================================================================
-- 005: Audit Logs
-- ============================================================================
-- Comprehensive audit trail for all data changes
--
-- Dependencies: 001_initial_schema.sql
-- Idempotent: Yes (uses CREATE TABLE IF NOT EXISTS)
-- ============================================================================

-- ============================================================================
-- AUDIT_LOGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_values JSONB,
  new_values JSONB,
  changed_fields TEXT[],
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Verification
-- ============================================================================
-- Verify table was created
SELECT 
  'audit_logs' as table_name,
  COUNT(*) as row_count
FROM public.audit_logs;
