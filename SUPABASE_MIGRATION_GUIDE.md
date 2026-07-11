# Supabase Migration Guide - New Project

**Project:** SomBill POS  
**New Project Reference:** mrpxvnouabnghadmvypo  
**New Project URL:** https://mrpxvnouabnghadmvypo.supabase.co  
**Date:** July 11, 2026  
**Status:** Ready for Migration

---

## Overview

This guide provides step-by-step instructions for migrating SomBill POS to the new Supabase project and setting up Phase 1.5 (Authentication & Demo Environment).

---

## Pre-Migration Checklist

- [x] Old Supabase URLs removed from codebase
- [x] Environment variables updated with new project credentials
- [x] Authentication flow simplified to email/password only
- [x] All import statements updated to use `lib/auth`
- [x] Login page refactored for new authentication system

---

## Migration Steps

### Step 1: Apply Database Migrations

Since the Supabase CLI is not available, you'll need to apply migrations manually via the Supabase SQL Editor.

**Navigate to:** Supabase Dashboard > SQL Editor

Run the following SQL files in order:

#### 1. Core Schema Migrations (Required for all environments)

Run these files in the exact order shown:

1. **003_tables.sql** - Core database tables
2. **004_indexes.sql** - Performance indexes
3. **005_audit_logs.sql** - Audit logging table
4. **006_functions.sql** - Database functions
5. **007_triggers.sql** - Database triggers
6. **008_rls.sql** - Enable Row Level Security
7. **009_policies.sql** - RLS policies
8. **011_seed.sql** - System seed data (subscription plans, permissions)

#### 2. Phase 1.5 Migrations (Authentication & RBAC)

Run these files in order:

9. **006_roles.sql** - Roles table (with nullable tenant_id)
10. **014_system_roles.sql** - Super Admin system role
11. **016_system_role_permissions.sql** - Super Admin permissions
12. **019_profile_trigger.sql** - Auto-create profiles on signup

#### 3. Demo Data Migrations (Development Only)

**Skip these for production.** Only run if you want demo data for testing:

13. **015_demo_roles.sql** - Demo restaurant roles
14. **017_demo_role_permissions.sql** - Demo role permissions
15. **018_demo_restaurant.sql** - Demo restaurant & subscription
16. **019_demo_users.sql** - Demo user restaurant assignments

---

### Step 2: Create Demo Auth Users

After applying migrations, create demo authentication users using the Admin API script.

**Prerequisites:**
- Get your Service Role Key from: Supabase Dashboard > Project Settings > API > service_role (secret)
- Add it to your `.env` file as `SUPABASE_SERVICE_ROLE_KEY=your_key_here`

**Run the script:**
```bash
npx tsx scripts/create-demo-auth-users.ts
```

This will create 8 demo users with email `role@demo.sombill.com` and password `Demo123!`

---

### Step 3: Verify Setup

Run the verification suite to ensure everything is working correctly:

```bash
npx tsx scripts/verify-phase-1.5.ts
```

This will check:
- Database schema (tables, RLS, functions, triggers)
- System data (roles, permissions, subscription plans)
- Demo data (if applicable)
- Authentication (profile trigger, auth users)
- RLS isolation
- Dashboard access

All tests should pass before proceeding.

---

## Demo Credentials

After completing the migration, use these credentials to test the application:

| Role | Email | Password | Dashboard |
|------|-------|----------|-----------|
| Super Admin | superadmin@demo.sombill.com | Demo123! | /superadmin |
| Owner | owner@demo.sombill.com | Demo123! | /restaurant/owner |
| Manager | manager@demo.sombill.com | Demo123! | /manager |
| Cashier | cashier@demo.sombill.com | Demo123! | /cashier |
| Waiter | waiter@demo.sombill.com | Demo123! | /waiter |
| Kitchen | kitchen@demo.sombill.com | Demo123! | /kitchen |
| Inventory | inventory@demo.sombill.com | Demo123! | /restaurant/inventory |
| Accountant | accountant@demo.sombill.com | Demo123! | /restaurant/accounting |

---

## Testing Checklist

After migration, test the following:

### Authentication
- [ ] Login with Super Admin credentials
- [ ] Login with each demo role
- [ ] Logout functionality
- [ ] Session persistence (refresh page)
- [ ] Invalid credentials show error

### Role-Based Access
- [ ] Super Admin can access /superadmin
- [ ] Manager can access /manager
- [ ] Cashier can access /cashier
- [ ] Waiter can access /waiter
- [ ] Kitchen can access /kitchen
- [ ] Users are redirected to correct dashboard based on role

### Data Isolation
- [ ] Users can only see their tenant's data
- [ ] RLS policies are enforced
- [ ] Cross-tenant access is blocked

---

## Production Deployment

For production deployment:

1. **Skip demo data migrations** (steps 13-16 above)
2. **Only run system migrations** (steps 1-12)
3. **Do not create demo users**
4. **Create your own Super Admin user** via Supabase Dashboard > Authentication
5. **Set up your own tenant and restaurant** via the Super Admin dashboard

---

## Troubleshooting

### Migration Errors

If a migration fails:
1. Check the error message in the SQL Editor
2. Ensure previous migrations were applied in order
3. Check for duplicate data (use `ON CONFLICT DO NOTHING` in migrations)
4. Verify the Supabase project is the correct one (mrpxvnouabnghadmvypo)

### Authentication Errors

If login fails:
1. Verify the user exists in auth.users
2. Check the profile was auto-created in public.profiles
3. Verify the user has a restaurant_users assignment
4. Check the role assignment is correct
5. Ensure email is confirmed (demo users are auto-confirmed)

### Import Errors

If you see import errors for `lib/supabase`:
1. All imports have been updated to `lib/auth`
2. Restart the dev server: `npm run dev`
3. Clear browser cache

---

## Files Modified

### Configuration
- `.env` - Updated with new Supabase URL and keys
- `src/lib/auth.ts` - Removed hardcoded fallback URL, added validation

### Authentication
- `src/contexts/AuthContext.tsx` - Created new auth context with signIn function
- `src/pages/LoginPage.tsx` - Simplified to email/password only, removed old flow

### Import Updates (16 files)
- All page files updated from `lib/supabase` to `lib/auth`:
  - `src/pages/customer/NFCMenu.tsx`
  - `src/pages/cashier/*.tsx` (6 files)
  - `src/pages/kitchen/*.tsx` (6 files)
  - `src/pages/waiter/*.tsx` (2 files)

### Scripts
- `scripts/create-demo-auth-users.ts` - Updated to require SUPABASE_URL
- `scripts/setup-phase-1.5.ts` - Updated to require SUPABASE_URL
- `scripts/verify-phase-1.5.ts` - Updated to require SUPABASE_URL

---

## Verification Report Template

After completing migration, fill out this report:

```
Migration Date: ___________
Migrated By: ___________
New Project URL: https://mrpxvnouabnghadmvypo.supabase.co

Migrations Applied:
[ ] Core schema (003-011)
[ ] Phase 1.5 system (006, 014, 016, 019)
[ ] Phase 1.5 demo (015, 017, 018, 019) - if applicable

Demo Users Created:
[ ] Super Admin
[ ] Owner
[ ] Manager
[ ] Cashier
[ ] Waiter
[ ] Kitchen
[ ] Inventory
[ ] Accountant

Verification Tests:
[ ] All 16 verification tests passed

Authentication Tests:
[ ] Login works for all roles
[ ] Logout works
[ ] Session persistence works
[ ] Role-based redirects work

Data Isolation Tests:
[ ] RLS policies enforced
[ ] Tenant isolation working

Notes:
_______________________________________________________
_______________________________________________________
_______________________________________________________
```

---

## Next Steps

1. Apply migrations manually via Supabase SQL Editor
2. Add SUPABASE_SERVICE_ROLE_KEY to .env
3. Run demo user creation script
4. Run verification suite
5. Test login for each role
6. Complete verification report

---

## Support

If you encounter issues:
1. Check the Supabase Dashboard logs
2. Review the migration error messages
3. Verify environment variables are set correctly
4. Ensure you're using the correct Supabase project (mrpxvnouabnghadmvypo)

---

**Migration Status:** Ready to execute
**Last Updated:** July 11, 2026
