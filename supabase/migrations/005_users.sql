-- ============================================================================
-- 005: Users
-- ============================================================================
-- Restaurant users linking profiles to restaurants with roles
--
-- Dependencies: 002_auth.sql, 004_restaurants.sql
-- Idempotent: Yes (uses CREATE TABLE IF NOT EXISTS)
-- ============================================================================

-- ============================================================================
-- RESTAURANT_USERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.restaurant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.restaurant_branches(id) ON DELETE SET NULL,
  role_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  is_owner BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(restaurant_id, profile_id)
);

-- ============================================================================
-- Verification
-- ============================================================================
SELECT 
  'restaurant_users' as table_name,
  COUNT(*) as row_count
FROM public.restaurant_users;
