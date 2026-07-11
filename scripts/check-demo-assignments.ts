#!/usr/bin/env tsx
/**
 * Check and Create Demo User Assignments
 * 
 * This script checks if demo users have restaurant_users assignments
 * and creates them if they don't exist.
 * 
 * Usage:
 *   npx tsx scripts/check-demo-assignments.ts
 * 
 * Environment variables required:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const DEMO_ASSIGNMENTS = [
  { email: 'superadmin@demo.sombill.com', role: 'super_admin' },
  { email: 'owner@demo.sombill.com', role: 'owner' },
  { email: 'manager@demo.sombill.com', role: 'manager' },
  { email: 'cashier@demo.sombill.com', role: 'cashier' },
  { email: 'waiter@demo.sombill.com', role: 'waiter' },
  { email: 'kitchen@demo.sombill.com', role: 'kitchen' },
  { email: 'inventory@demo.sombill.com', role: 'inventory' },
  { email: 'accountant@demo.sombill.com', role: 'accountant' },
];

async function checkAndCreateAssignments() {
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

  console.log('=== Checking Database Tables ===');
  
  // Check if profiles table exists
  try {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (profilesError) {
      console.error('❌ Profiles table check FAILED:', profilesError.message);
      console.error('This likely means database migrations have not been applied.');
      console.error('Please apply migrations first using the Supabase SQL Editor.');
      process.exit(1);
    }
    console.log('✅ Profiles table exists');
  } catch (err: any) {
    console.error('❌ Profiles table check FAILED:', err.message);
    process.exit(1);
  }

  // Check if restaurant_users table exists
  try {
    const { data: restaurantUsers, error: restaurantUsersError } = await supabase
      .from('restaurant_users')
      .select('count')
      .limit(1);
    
    if (restaurantUsersError) {
      console.error('❌ Restaurant_users table check FAILED:', restaurantUsersError.message);
      console.error('This likely means database migrations have not been applied.');
      console.error('Please apply migrations first using the Supabase SQL Editor.');
      process.exit(1);
    }
    console.log('✅ Restaurant_users table exists');
  } catch (err: any) {
    console.error('❌ Restaurant_users table check FAILED:', err.message);
    process.exit(1);
  }

  // Check if roles table exists
  try {
    const { data: roles, error: rolesError } = await supabase
      .from('roles')
      .select('count')
      .limit(1);
    
    if (rolesError) {
      console.error('❌ Roles table check FAILED:', rolesError.message);
      console.error('This likely means database migrations have not been applied.');
      console.error('Please apply migrations first using the Supabase SQL Editor.');
      process.exit(1);
    }
    console.log('✅ Roles table exists');
  } catch (err: any) {
    console.error('❌ Roles table check FAILED:', err.message);
    process.exit(1);
  }

  console.log('');
  console.log('=== Checking Demo User Assignments ===');

  let createdCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const assignment of DEMO_ASSIGNMENTS) {
    console.log(`\nChecking ${assignment.email} (${assignment.role})...`);
    
    try {
      // Get the user's profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', assignment.email)
        .single();

      if (profileError || !profile) {
        console.log(`  ⏭️  Skipped: Profile not found for ${assignment.email}`);
        skippedCount++;
        continue;
      }

      console.log(`  ✅ Profile found: ${profile.id}`);

      // Get the role ID
      const { data: role, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('slug', assignment.role)
        .single();

      if (roleError || !role) {
        console.log(`  ❌ Error: Role '${assignment.role}' not found`);
        errorCount++;
        continue;
      }

      console.log(`  ✅ Role found: ${role.id}`);

      // Check if assignment already exists
      const { data: existingAssignment, error: checkError } = await supabase
        .from('restaurant_users')
        .select('*')
        .eq('profile_id', profile.id)
        .eq('role_id', role.id)
        .single();

      if (existingAssignment) {
        console.log(`  ⏭️  Skipped: Assignment already exists`);
        skippedCount++;
        continue;
      }

      // For demo purposes, we'll create a simple assignment without restaurant
      // In production, this would require a valid restaurant_id
      console.log(`  ⚠️  Creating assignment without restaurant (demo mode)...`);
      
      const { error: insertError } = await supabase
        .from('restaurant_users')
        .insert({
          profile_id: profile.id,
          role_id: role.id,
          status: 'active',
          restaurant_id: null, // Will be null for super admin, should be set for others
        });

      if (insertError) {
        console.log(`  ❌ Error creating assignment:`, insertError.message);
        errorCount++;
      } else {
        console.log(`  ✅ Assignment created successfully`);
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

  console.log('\nDemo user assignments check complete!');
}

checkAndCreateAssignments().catch(console.error);
