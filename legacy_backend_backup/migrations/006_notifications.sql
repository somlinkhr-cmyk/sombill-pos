-- ============================================================================
-- 006: Notifications
-- ============================================================================
-- User notification system for alerts and updates
--
-- Dependencies: 001_initial_schema.sql
-- Idempotent: Yes (uses CREATE TABLE IF NOT EXISTS)
-- ============================================================================

-- ============================================================================
-- NOTIFICATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  action_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Verification
-- ============================================================================
-- Verify table was created
SELECT 
  'notifications' as table_name,
  COUNT(*) as row_count
FROM public.notifications;
