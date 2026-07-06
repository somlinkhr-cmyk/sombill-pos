-- Simple script to create demo users in public.users table
-- IMPORTANT: First create users in Supabase Auth Dashboard, then run this script
-- 
-- STEPS:
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Click "Add user" and create these users:
--    - Email: admin@gmail.com, Password: 1155
--    - Email: manager@gmail.com, Password: 1133
--    - Email: cashier@gmail.com, Password: 1133
-- 3. Run this SQL script to create corresponding public.users records

DO $$
DECLARE
  admin_id UUID;
  manager_id UUID;
  cashier_id UUID;
BEGIN
  -- Get Admin user ID from auth.users
  SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@gmail.com';
  
  -- Get Manager user ID from auth.users
  SELECT id INTO manager_id FROM auth.users WHERE email = 'manager@gmail.com';
  
  -- Get Cashier user ID from auth.users
  SELECT id INTO cashier_id FROM auth.users WHERE email = 'cashier@gmail.com';
  
  -- Create corresponding public.users records
  IF admin_id IS NOT NULL THEN
    INSERT INTO public.users (id, email, name, phone, role, salary, shift, is_active)
    VALUES (
      admin_id,
      'admin@gmail.com',
      'Admin',
      '+252 61 234 5677',
      'manager',
      2000,
      'morning',
      true
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      phone = EXCLUDED.phone,
      role = EXCLUDED.role,
      salary = EXCLUDED.salary,
      shift = EXCLUDED.shift,
      is_active = EXCLUDED.is_active;
  END IF;
  
  IF manager_id IS NOT NULL THEN
    INSERT INTO public.users (id, email, name, phone, role, salary, shift, is_active)
    VALUES (
      manager_id,
      'manager@gmail.com',
      'Manager',
      '+252 61 234 5678',
      'manager',
      1500,
      'morning',
      true
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      phone = EXCLUDED.phone,
      role = EXCLUDED.role,
      salary = EXCLUDED.salary,
      shift = EXCLUDED.shift,
      is_active = EXCLUDED.is_active;
  END IF;
  
  IF cashier_id IS NOT NULL THEN
    INSERT INTO public.users (id, email, name, phone, role, salary, shift, is_active)
    VALUES (
      cashier_id,
      'cashier@gmail.com',
      'Cashier',
      '+252 61 234 5679',
      'cashier',
      800,
      'morning',
      true
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      phone = EXCLUDED.phone,
      role = EXCLUDED.role,
      salary = EXCLUDED.salary,
      shift = EXCLUDED.shift,
      is_active = EXCLUDED.is_active;
  END IF;
END $$;
