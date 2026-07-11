#!/usr/bin/env tsx
/**
 * Fix Restaurant Users Table - Make restaurant_id Nullable
 * 
 * This script alters the restaurant_users table to allow NULL restaurant_id
 * for system users like Super Admin.
 * 
 * Usage:
 *   npx tsx scripts/fix-restaurant-users-nullable.ts
 * 
 * Environment variables required:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

async function fixRestaurantUsersTable() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('=== Configuration Check ===');
  console.log('SUPABASE_URL:', supabaseUrl);
  console.log('');

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log('=== Altering restaurant_users table to allow NULL restaurant_id ===');
  console.log('');
  console.log('⚠️  Please run this SQL manually in Supabase SQL Editor:');
  console.log('ALTER TABLE public.restaurant_users ALTER COLUMN restaurant_id DROP NOT NULL;');
  console.log('');
  console.log('After running the SQL, execute: npx tsx scripts/check-demo-assignments.ts');
}

fixRestaurantUsersTable().catch(console.error);
