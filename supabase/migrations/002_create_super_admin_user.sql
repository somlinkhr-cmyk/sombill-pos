-- Create Super Admin user
-- This migration creates the initial super admin account
-- Works with existing single-tenant schema

-- Note: The auth user should be created first via Supabase Auth
-- Go to Authentication → Users and create user with:
-- Email: superadmin@gmail.com
-- Password: 1166
-- Auto-confirm: checked

-- After creating the auth user, run this SQL to create the public user record:
-- Replace the UUID with the actual auth user UUID
INSERT INTO users (id, email, name, phone, role, salary, shift, is_super_admin, is_active, created_at, updated_at)
VALUES (
  'ecd9ff59-3366-40b3-bcb0-dac7e61bef2a',
  'superadmin@gmail.com',
  'Super Admin',
  '',
  'manager',
  0,
  'morning',
  true,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  is_super_admin = true,
  is_active = true,
  updated_at = NOW();
