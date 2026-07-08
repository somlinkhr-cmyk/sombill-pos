-- Create Super Admin user
-- This migration creates the initial super admin account
-- Works with existing single-tenant schema

-- Note: The auth user should be created first via Supabase Auth
-- Go to Authentication → Users and create user with:
-- Email: Superadmin@gmail.com
-- Password: 1166
-- Auto-confirm: checked

-- After creating the auth user, get the user ID and update the users table:
-- UPDATE users SET is_super_admin = true WHERE email = 'Superadmin@gmail.com';
