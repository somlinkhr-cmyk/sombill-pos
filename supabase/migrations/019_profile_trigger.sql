-- ============================================================================
-- 019: Profile Auto-Creation Trigger
-- ============================================================================
-- Automatically create a profile when a new auth user is created
--
-- Dependencies: 002_auth.sql
-- Idempotent: Yes (uses DROP FUNCTION IF EXISTS, DROP TRIGGER IF EXISTS)
-- ============================================================================

-- ============================================================================
-- Function to create profile on user signup
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, is_super_admin, tenant_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'is_super_admin', 'false')::boolean,
    NULL -- tenant_id will be set later
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Trigger to call function on new user creation
-- ============================================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- Verification
-- ============================================================================
SELECT 
  'Profile trigger created successfully' as status,
  'Profiles will auto-create on user signup' as description;
