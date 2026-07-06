-- Cleanup script to remove admin user from auth.users
-- Run this in Supabase SQL Editor before creating admin user in Auth Dashboard

DELETE FROM public.users WHERE email = 'admin@gmail.com';
DELETE FROM auth.users WHERE email = 'admin@gmail.com';
