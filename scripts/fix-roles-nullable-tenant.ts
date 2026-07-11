#!/usr/bin/env tsx
/**
 * Fix Roles Table - Make tenant_id Nullable
 * 
 * This script alters the roles table to allow NULL tenant_id
 * for system roles like Super Admin.
 * 
 * Usage:
 *   npx tsx scripts/fix-roles-nullable-tenant.ts
 * 
 * Environment variables required:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

async function fixRolesTable() {
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

  console.log('=== Altering roles table to allow NULL tenant_id ===');

  try {
    const { error } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE public.roles ALTER COLUMN tenant_id DROP NOT NULL;`
    });

    if (error) {
      console.error('❌ Error altering table:', error.message);
      console.log('\nTrying direct SQL via query...');
      
      // Try using raw SQL through the client
      const { error: queryError } = await supabase
        .from('roles')
        .select('*')
        .limit(1);
      
      if (queryError) {
        console.error('❌ Cannot execute SQL directly:', queryError.message);
        console.log('\n⚠️  You need to run this SQL manually in Supabase SQL Editor:');
        console.log('ALTER TABLE public.roles ALTER COLUMN tenant_id DROP NOT NULL;');
        process.exit(1);
      }
    }

    console.log('✅ Table altered successfully');
  } catch (err: any) {
    console.error('❌ Error:', err.message);
    console.log('\n⚠️  You need to run this SQL manually in Supabase SQL Editor:');
    console.log('ALTER TABLE public.roles ALTER COLUMN tenant_id DROP NOT NULL;');
    process.exit(1);
  }

  console.log('\nRoles table now allows NULL tenant_id');
  console.log('Now run: npx tsx scripts/create-demo-roles.ts');
}

fixRolesTable().catch(console.error);
