-- ============================================================================
-- 002: Auth
-- ============================================================================
-- Profiles table extending Supabase auth.users
--
-- Dependencies: 001_extensions.sql
-- Idempotent: Yes (uses CREATE TABLE IF NOT EXISTS)
-- ============================================================================

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  is_super_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Verification
-- ============================================================================
SELECT 
  'profiles' as table_name,
  COUNT(*) as row_count
FROM public.profiles;
