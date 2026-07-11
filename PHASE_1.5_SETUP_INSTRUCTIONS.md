# Phase 1.5 Setup Instructions

## Overview
Phase 1.5 implements complete authentication and demo environment with automated setup. No manual SQL execution required.

## Prerequisites

1. **Environment Variables**
   - `SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (from project settings)

2. **Dependencies**
   - Install tsx: `npm install --save-dev tsx`

## Automated Setup

Run the single automated setup command:

```bash
npm run setup-phase-1.5
```

This script will:
1. Apply all database migrations (including RLS policies, roles, demo restaurant)
2. Create demo auth users via Supabase Admin API
3. Assign restaurant roles to users
4. Verify the setup

## Manual Steps (Alternative)

If you prefer to run steps individually:

### Step 1: Apply Migrations
```bash
supabase db push
```

### Step 2: Create Demo Auth Users
```bash
npm run create-demo-users
```

### Step 3: Verify Setup
Run `supabase/verification.sql` in Supabase SQL Editor.

## What Gets Created

### Database Components
- RLS policies for all tables
- 8 roles (Super Admin, Owner, Manager, Cashier, Waiter, Kitchen, Inventory, Accountant)
- Demo tenant (Demo Restaurant Group)
- Demo restaurant with subscription
- Profile auto-creation trigger on auth.users

### Demo Users
- 8 demo auth users with auto-created profiles
- Restaurant role assignments
- Permission assignments based on role

## Demo Credentials

All demo users share the same password:
- **Password:** `Demo123!`

| Role | Email | Dashboard |
|------|-------|-----------|
| Super Admin | superadmin@demo.sombill.com | /superadmin |
| Owner | owner@demo.sombill.com | /restaurant/owner |
| Manager | manager@demo.sombill.com | /restaurant/manager |
| Cashier | cashier@demo.sombill.com | /restaurant/pos |
| Waiter | waiter@demo.sombill.com | /restaurant/waiter |
| Kitchen | kitchen@demo.sombill.com | /restaurant/kitchen |
| Inventory | inventory@demo.sombill.com | /restaurant/inventory |
| Accountant | accountant@demo.sombill.com | /restaurant/accounting |

See `DEMO_CREDENTIALS.md` for full details.

## Architecture

### Profile Auto-Creation
When auth users are created via the Admin API script, a database trigger (019_profile_trigger.sql) automatically creates corresponding profiles in the `public.profiles` table.

### Role-Based Redirects
After login, users are automatically redirected to their role-specific dashboard based on their `restaurant_users` assignment. This is handled by the `RoleBasedRedirect` component.

### RLS Policies
All tables have RLS policies that ensure:
- Users can only access data from their tenant
- Super admins have full access
- Role-based permissions are enforced at database level

## Production Deployment

Before deploying to production:

1. **Delete Demo Data**
   - Delete all demo users from auth.users
   - Delete demo tenant, restaurant, and subscription
   - Delete demo roles (keep system roles if needed)

2. **Update Credentials**
   - Create real admin users with strong passwords
   - Enable email confirmation
   - Configure proper authentication providers

3. **Review Security**
   - Review RLS policies
   - Ensure service role key is not exposed
   - Set up proper environment variables

## Troubleshooting

### Migration Conflicts
If you encounter migration conflicts, the setup script will stop. Check the error message and fix the specific issue before re-running.

### Auth User Creation
If auth user creation fails:
- Verify SUPABASE_SERVICE_ROLE_KEY is correct
- Check that the Supabase project is accessible
- Ensure the profile trigger (019_profile_trigger.sql) has been applied

### Verification Failures
If verification fails:
- Check that all migrations were applied successfully
- Verify auth users were created
- Check restaurant user assignments in the database
