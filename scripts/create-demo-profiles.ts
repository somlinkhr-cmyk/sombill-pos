#!/usr/bin/env tsx
/**
 * Create Demo Profiles
 * 
 * This script manually creates profiles for demo users
 * since the database trigger may not be set up yet.
 * 
 * Usage:
 *   npx tsx scripts/create-demo-profiles.ts
 * 
 * Environment variables required:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const DEMO_USERS = [
  { email: 'superadmin@demo.sombill.com', full_name: 'Super Admin', is_super_admin: true },
  { email: 'owner@demo.sombill.com', full_name: 'Owner', is_super_admin: false },
  { email: 'manager@demo.sombill.com', full_name: 'Manager', is_super_admin: false },
  { email: 'cashier@demo.sombill.com', full_name: 'Cashier', is_super_admin: false },
  { email: 'waiter@demo.sombill.com', full_name: 'Waiter', is_super_admin: false },
  { email: 'kitchen@demo.sombill.com', full_name: 'Kitchen', is_super_admin: false },
  { email: 'inventory@demo.sombill.com', full_name: 'Inventory', is_super_admin: false },
  { email: 'accountant@demo.sombill.com', full_name: 'Accountant', is_super_admin: false },
];

async function createDemoProfiles() {
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

  console.log('=== Creating Demo Profiles ===');

  let createdCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const demoUser of DEMO_USERS) {
    console.log(`\nProcessing ${demoUser.email}...`);
    
    try {
      // Get the auth user ID
      const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
      
      if (listError) {
        console.error('  ❌ Error listing users:', listError.message);
        errorCount++;
        continue;
      }

      const authUser = users.find(u => u.email === demoUser.email);
      
      if (!authUser) {
        console.log(`  ⏭️  Skipped: Auth user not found for ${demoUser.email}`);
        skippedCount++;
        continue;
      }

      console.log(`  ✅ Auth user found: ${authUser.id}`);

      // Check if profile already exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (existingProfile) {
        console.log(`  ⏭️  Skipped: Profile already exists`);
        skippedCount++;
        continue;
      }

      // Create profile
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: authUser.id,
          email: demoUser.email,
          full_name: demoUser.full_name,
          is_super_admin: demoUser.is_super_admin,
          tenant_id: null,
        });

      if (insertError) {
        console.log(`  ❌ Error creating profile:`, insertError.message);
        errorCount++;
      } else {
        console.log(`  ✅ Profile created successfully`);
        createdCount++;
      }

    } catch (err: any) {
      console.log(`  ❌ Error:`, err.message);
      errorCount++;
    }
  }

  console.log('\n=====================================');
  console.log('Summary:');
  console.log(`✅ Created: ${createdCount}`);
  console.log(`⏭️  Skipped: ${skippedCount}`);
  console.log(`❌ Errors:  ${errorCount}`);
  console.log('=====================================');

  if (errorCount > 0) {
    console.log('\n⚠️  Some errors occurred. Please check the output above.');
    process.exit(1);
  }

  console.log('\nDemo profiles created successfully!');
  console.log('Now run: npx tsx scripts/check-demo-assignments.ts');
}

createDemoProfiles().catch(console.error);
