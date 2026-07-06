-- Simple script to create demo users
-- Run this in Supabase SQL Editor

DO $$
DECLARE
  admin_id UUID;
  manager_id UUID;
  cashier_id UUID;
BEGIN
  -- Check if Admin user exists
  SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@gmail.com';
  
  -- Create Admin user if doesn't exist
  IF admin_id IS NULL THEN
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      'admin@gmail.com',
      crypt('1155', gen_salt('bf')),
      NOW(),
      '{"role": "admin"}',
      NOW(),
      NOW()
    )
    RETURNING id INTO admin_id;
  END IF;
  
  -- Check if Manager user exists
  SELECT id INTO manager_id FROM auth.users WHERE email = 'manager@gmail.com';
  
  -- Create Manager user if doesn't exist
  IF manager_id IS NULL THEN
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      'manager@gmail.com',
      crypt('1133', gen_salt('bf')),
      NOW(),
      '{"role": "manager"}',
      NOW(),
      NOW()
    )
    RETURNING id INTO manager_id;
  END IF;
  
  -- Check if Cashier user exists
  SELECT id INTO cashier_id FROM auth.users WHERE email = 'cashier@gmail.com';
  
  -- Create Cashier user if doesn't exist
  IF cashier_id IS NULL THEN
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      'cashier@gmail.com',
      crypt('1133', gen_salt('bf')),
      NOW(),
      '{"role": "cashier"}',
      NOW(),
      NOW()
    )
    RETURNING id INTO cashier_id;
  END IF;
  
  -- Create corresponding public.users records
  IF admin_id IS NOT NULL THEN
    INSERT INTO public.users (id, email, name, phone, role, salary, shift, is_active)
    VALUES (
      admin_id,
      'admin@gmail.com',
      'Admin',
      '+252 61 234 5677',
      'admin',
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
