#!/usr/bin/env tsx
/**
 * Phase 1.5 Setup Script
 * 
 * This script automates the complete Phase 1.5 setup:
 * 1. Applies database migrations
 * 2. Creates demo auth users via Supabase Admin API
 * 3. Verifies the setup
 * 
 * Usage:
 *   npm run setup-phase-1.5
 *   OR
 *   tsx scripts/setup-phase-1.5.ts
 * 
 * Environment variables required:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { execSync } from 'child_process';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

function runCommand(command: string, description: string): boolean {
  try {
    console.log(`\n${description}...`);
    console.log(`Running: ${command}`);
    const output = execSync(command, { encoding: 'utf-8', stdio: 'inherit' });
    console.log(`✅ ${description} completed`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed`);
    return false;
  }
}

async function verifySetup() {
  console.log('\n=====================================');
  console.log('Verifying Phase 1.5 Setup');
  console.log('=====================================\n');

  const checks = [
    {
      name: 'Demo Tenant',
      check: async () => {
        const { data } = await supabase
          .from('tenants')
          .select('id')
          .eq('slug', 'demo-restaurant-group')
          .single();
        return !!data;
      },
    },
    {
      name: 'Demo Restaurant',
      check: async () => {
        const { data } = await supabase
          .from('restaurants')
          .select('id')
          .eq('slug', 'demo-restaurant')
          .single();
        return !!data;
      },
    },
    {
      name: 'Demo Subscription',
      check: async () => {
        const { data } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('metadata->>demo', 'true')
          .single();
        return !!data;
      },
    },
    {
      name: 'Roles (8 total)',
      check: async () => {
        const { count } = await supabase
          .from('roles')
          .select('*', { count: 'exact', head: true });
        return count === 8;
      },
    },
    {
      name: 'Demo Auth Users (8 total)',
      check: async () => {
        const { count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .like('email', '%@demo.sombill.com');
        return count === 8;
      },
    },
    {
      name: 'Restaurant User Assignments (7 total)',
      check: async () => {
        const { count } = await supabase
          .from('restaurant_users')
          .select('*', { count: 'exact', head: true });
        return count === 7;
      },
    },
    {
      name: 'RLS Policies',
      check: async () => {
        const { count } = await supabase
          .from('pg_policies')
          .select('*', { count: 'exact', head: true })
          .eq('schemaname', 'public');
        return count > 0;
      },
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const check of checks) {
    try {
      const result = await check.check();
      if (result) {
        console.log(`✅ ${check.name}`);
        passed++;
      } else {
        console.log(`❌ ${check.name} - check failed`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${check.name} - error: ${error}`);
      failed++;
    }
  }

  console.log('\n=====================================');
  console.log(`Verification: ${passed} passed, ${failed} failed`);
  console.log('=====================================\n');

  return failed === 0;
}

async function main() {
  console.log('=====================================');
  console.log('Phase 1.5 Setup - Authentication & Demo Environment');
  console.log('=====================================');

  const steps = [
    {
      command: 'supabase db push',
      description: 'Applying database migrations',
    },
    {
      command: 'tsx scripts/create-demo-auth-users.ts',
      description: 'Creating demo auth users (development only)',
    },
  ];

  let allPassed = true;

  for (const step of steps) {
    const success = runCommand(step.command, step.description);
    if (!success) {
      allPassed = false;
      console.error(`\n❌ Setup failed at: ${step.description}`);
      console.error('Please fix the error and run the script again.');
      process.exit(1);
    }
  }

  // Run comprehensive verification
  console.log('\n=====================================');
  console.log('Running Comprehensive Verification');
  console.log('=====================================\n');
  
  const verificationSuccess = runCommand('tsx scripts/verify-phase-1.5.ts', 'Running verification suite');
  
  if (!verificationSuccess) {
    console.error('\n❌ Verification failed. Setup cannot proceed.');
    console.error('Please fix the verification errors and run the script again.');
    process.exit(1);
  }

  console.log('\n=====================================');
  console.log('✅ Phase 1.5 Setup completed successfully!');
  console.log('=====================================\n');
  console.log('Demo credentials (development only):');
  console.log('  Email: role@demo.sombill.com (e.g., owner@demo.sombill.com)');
  console.log('  Password: Demo123!');
  console.log('\nSee DEMO_CREDENTIALS.md for full details.');
  console.log('=====================================\n');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
