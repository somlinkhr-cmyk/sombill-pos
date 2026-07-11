#!/usr/bin/env tsx
/**
 * Create Demo Auth Users
 * 
 * This script uses the Supabase Management API to create demo authentication users.
 * The profile trigger (019_profile_trigger.sql) will automatically create profiles
 * when these auth users are created.
 * 
 * Usage:
 *   npm run create-demo-users
 *   OR
 *   tsx scripts/create-demo-auth-users.ts
 * 
 * Environment variables required:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const DEMO_USERS = [
  {
    email: 'superadmin@demo.sombill.com',
    password: 'Demo123!',
    email_confirm: true,
    user_metadata: {
      full_name: 'Super Admin',
      is_super_admin: true,
    },
  },
  {
    email: 'owner@demo.sombill.com',
    password: 'Demo123!',
    email_confirm: true,
    user_metadata: {
      full_name: 'Restaurant Owner',
      is_super_admin: false,
    },
  },
  {
    email: 'manager@demo.sombill.com',
    password: 'Demo123!',
    email_confirm: true,
    user_metadata: {
      full_name: 'Restaurant Manager',
      is_super_admin: false,
    },
  },
  {
    email: 'cashier@demo.sombill.com',
    password: 'Demo123!',
    email_confirm: true,
    user_metadata: {
      full_name: 'Cashier Staff',
      is_super_admin: false,
    },
  },
  {
    email: 'waiter@demo.sombill.com',
    password: 'Demo123!',
    email_confirm: true,
    user_metadata: {
      full_name: 'Waiter Staff',
      is_super_admin: false,
    },
  },
  {
    email: 'kitchen@demo.sombill.com',
    password: 'Demo123!',
    email_confirm: true,
    user_metadata: {
      full_name: 'Kitchen Staff',
      is_super_admin: false,
    },
  },
  {
    email: 'inventory@demo.sombill.com',
    password: 'Demo123!',
    email_confirm: true,
    user_metadata: {
      full_name: 'Inventory Manager',
      is_super_admin: false,
    },
  },
  {
    email: 'accountant@demo.sombill.com',
    password: 'Demo123!',
    email_confirm: true,
    user_metadata: {
      full_name: 'Accountant',
      is_super_admin: false,
    },
  },
];

async function createDemoUsers() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const viteSupabaseUrl = process.env.VITE_SUPABASE_URL;

  console.log('=== Configuration Check ===');
  console.log('VITE_SUPABASE_URL:', viteSupabaseUrl);
  console.log('SUPABASE_URL:', supabaseUrl);
  console.log('SUPABASE_SERVICE_ROLE_KEY (first 15 chars):', serviceRoleKey ? serviceRoleKey.substring(0, 15) + '...' : 'NOT SET');
  console.log('SUPABASE_SERVICE_ROLE_KEY (last 10 chars):', serviceRoleKey ? '...' + serviceRoleKey.substring(serviceRoleKey.length - 10) : 'NOT SET');
  
  // Extract project reference from URL
  const projectRef = supabaseUrl ? supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] : 'UNKNOWN';
  console.log('Project Reference from URL:', projectRef);
  console.log('Expected Project Reference: atkwdsxabezidjzcefls');
  console.log('Project Match:', projectRef === 'atkwdsxabezidjzcefls' ? '✅ YES' : '❌ NO');
  console.log('');

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required');
    console.error('Set them in your .env file or export them before running this script');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log('=== Connectivity Test ===');
  console.log('Calling supabase.auth.admin.listUsers()...');
  
  try {
    const { data, error } = await supabase.auth.admin.listUsers();
    if (error) {
      console.error('❌ Connectivity test FAILED:');
      console.error('Full error:', JSON.stringify(error, null, 2));
      process.exit(1);
    }
    console.log('✅ Connectivity test PASSED');
    console.log('Current users count:', data.users?.length || 0);
    console.log('');
  } catch (err: any) {
    console.error('❌ Connectivity test FAILED with exception:');
    console.error('Error:', err.message);
    console.error('Full error:', JSON.stringify(err, null, 2));
    process.exit(1);
  }

  console.log('Creating demo auth users...');
  console.log('=====================================\n');

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const user of DEMO_USERS) {
    try {
      // Check if user already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', user.email)
        .single();

      if (existingUser && !checkError) {
        console.log(`⏭️  Skipping ${user.email} - already exists`);
        skipCount++;
        continue;
      }

      // Create user via Supabase Auth API
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: user.email_confirm,
        user_metadata: user.user_metadata,
      });

      if (error) {
        if (error.message.includes('already registered')) {
          console.log(`⏭️  Skipping ${user.email} - already registered`);
          skipCount++;
        } else {
          console.error(`❌ Error creating ${user.email}:`, error.message);
          errorCount++;
        }
        continue;
      }

      console.log(`✅ Created ${user.email}`);
      successCount++;

      // Update profile with tenant_id for non-super-admin users
      if (!user.user_metadata.is_super_admin) {
        const { data: tenant } = await supabase
          .from('tenants')
          .select('id')
          .eq('slug', 'demo-restaurant-group')
          .single();

        if (tenant) {
          await supabase
            .from('profiles')
            .update({ tenant_id: tenant.id })
            .eq('id', data.user.id);
          console.log(`   └─ Updated tenant_id for ${user.email}`);
        }
      }

    } catch (error) {
      console.error(`❌ Unexpected error for ${user.email}:`, error);
      errorCount++;
    }
  }

  console.log('\n=====================================');
  console.log('Summary:');
  console.log(`✅ Created: ${successCount}`);
  console.log(`⏭️  Skipped: ${skipCount}`);
  console.log(`❌ Errors:  ${errorCount}`);
  console.log('=====================================\n');

  if (successCount > 0) {
    console.log('Demo auth users created successfully!');
    console.log('You can now run the migrations to assign restaurant roles.');
    console.log('Run: supabase db push');
  } else if (skipCount > 0 && errorCount === 0) {
    console.log('All demo users already exist. No changes needed.');
  } else {
    console.error('Some errors occurred. Please check the output above.');
    process.exit(1);
  }
}

createDemoUsers().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
