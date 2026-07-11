#!/usr/bin/env tsx
/**
 * Create Demo Roles
 * 
 * This script creates the necessary roles for demo users
 * if they don't exist in the database.
 * 
 * Usage:
 *   npx tsx scripts/create-demo-roles.ts
 * 
 * Environment variables required:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const DEMO_ROLES = [
  { slug: 'super_admin', name: 'Super Admin', description: 'System administrator with full access', tenant_id: null },
  { slug: 'owner', name: 'Owner', description: 'Restaurant owner', tenant_id: null },
  { slug: 'manager', name: 'Manager', description: 'Restaurant manager', tenant_id: null },
  { slug: 'cashier', name: 'Cashier', description: 'Point of sale cashier', tenant_id: null },
  { slug: 'waiter', name: 'Waiter', description: 'Restaurant waiter', tenant_id: null },
  { slug: 'kitchen', name: 'Kitchen', description: 'Kitchen staff', tenant_id: null },
  { slug: 'inventory', name: 'Inventory', description: 'Inventory manager', tenant_id: null },
  { slug: 'accountant', name: 'Accountant', description: 'Accounting staff', tenant_id: null },
];

async function createDemoRoles() {
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

  console.log('=== Creating Demo Roles ===');

  let createdCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const role of DEMO_ROLES) {
    console.log(`\nProcessing ${role.slug}...`);
    
    try {
      // Check if role already exists
      const { data: existingRole, error: checkError } = await supabase
        .from('roles')
        .select('*')
        .eq('slug', role.slug)
        .single();

      if (existingRole) {
        console.log(`  ⏭️  Skipped: Role already exists`);
        skippedCount++;
        continue;
      }

      // Create role
      const { error: insertError } = await supabase
        .from('roles')
        .insert({
          slug: role.slug,
          name: role.name,
          description: role.description,
          tenant_id: role.tenant_id,
        });

      if (insertError) {
        console.log(`  ❌ Error creating role:`, insertError.message);
        errorCount++;
      } else {
        console.log(`  ✅ Role created successfully`);
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

  console.log('\nDemo roles created successfully!');
  console.log('Now run: npx tsx scripts/check-demo-assignments.ts');
}

createDemoRoles().catch(console.error);
