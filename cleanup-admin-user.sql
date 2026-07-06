-- Cleanup script to remove admin user from auth.users
-- Run this in Supabase SQL Editor before creating admin user in Auth Dashboard

-- Delete admin user from public.users first (to avoid foreign key constraint)
DELETE FROM public.users WHERE email = 'admin@gmail.com';

-- Delete admin user from auth.users
DELETE FROM auth.users WHERE email = 'admin@gmail.com';
