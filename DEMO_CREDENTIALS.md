# Demo Credentials
## Development Environment Only

**⚠️ IMPORTANT WARNING: These credentials are for DEVELOPMENT ONLY.**
**DO NOT use these credentials in production. Delete all demo users before deploying to production.**

---

## Demo Users

All demo users share the same password for development convenience:
**Password:** `Demo123!`

### Super Admin
- **Email:** `superadmin@demo.sombill.com`
- **Password:** `Demo123!`
- **Role:** Super Admin
- **Access:** Full system access, all tenants, all restaurants
- **Dashboard:** `/superadmin`
- **Permissions:** All permissions

### Restaurant Owner
- **Email:** `owner@demo.sombill.com`
- **Password:** `Demo123!`
- **Role:** Owner
- **Tenant:** Demo Restaurant Group
- **Restaurant:** Demo Restaurant
- **Dashboard:** `/restaurant/owner`
- **Permissions:** Full access to their restaurant (except tenant management)

### Restaurant Manager
- **Email:** `manager@demo.sombill.com`
- **Password:** `Demo123!`
- **Role:** Manager
- **Tenant:** Demo Restaurant Group
- **Restaurant:** Demo Restaurant
- **Dashboard:** `/restaurant/manager`
- **Permissions:** Operational control, user management, settings, reports

### Cashier
- **Email:** `cashier@demo.sombill.com`
- **Password:** `Demo123!`
- **Role:** Cashier
- **Tenant:** Demo Restaurant Group
- **Restaurant:** Demo Restaurant
- **Dashboard:** `/restaurant/pos`
- **Permissions:** POS operations, view reports

### Waiter
- **Email:** `waiter@demo.sombill.com`
- **Password:** `Demo123!`
- **Role:** Waiter
- **Tenant:** Demo Restaurant Group
- **Restaurant:** Demo Restaurant
- **Dashboard:** `/restaurant/waiter`
- **Permissions:** Order taking, customer service, view reports

### Kitchen Staff
- **Email:** `kitchen@demo.sombill.com`
- **Password:** `Demo123!`
- **Role:** Kitchen Staff
- **Tenant:** Demo Restaurant Group
- **Restaurant:** Demo Restaurant
- **Dashboard:** `/restaurant/kitchen`
- **Permissions:** Kitchen operations, view orders, view reports

### Inventory Manager
- **Email:** `inventory@demo.sombill.com`
- **Password:** `Demo123!`
- **Role:** Inventory Manager
- **Tenant:** Demo Restaurant Group
- **Restaurant:** Demo Restaurant
- **Dashboard:** `/restaurant/inventory`
- **Permissions:** Inventory management, stock levels, view reports

### Accountant
- **Email:** `accountant@demo.sombill.com`
- **Password:** `Demo123!`
- **Role:** Accountant
- **Tenant:** Demo Restaurant Group
- **Restaurant:** Demo Restaurant
- **Dashboard:** `/restaurant/accounting`
- **Permissions:** Financial reports, accounting, view reports

---

## Demo Tenant

- **Name:** Demo Restaurant Group
- **Slug:** `demo-restaurant-group`
- **Status:** Active
- **Subscription:** Professional Plan ($49/month)

---

## Demo Restaurant

- **Name:** Demo Restaurant
- **Slug:** `demo-restaurant`
- **Branch:** Main Branch
- **Address:** 123 Main Street, Demo City, CA 90210
- **Phone:** +1-555-0100
- **Email:** demo@restaurant.com
- **Timezone:** America/Los_Angeles
- **Currency:** USD
- **Status:** Active

---

## Demo Subscription

- **Plan:** Professional
- **Billing Cycle:** Monthly
- **Status:** Active
- **Price:** $49/month
- **Features:** POS, Inventory, Reports, Multi-branch, API access

---

## Setup Instructions

### 1. Run Migrations
```bash
supabase db push
```

### 2. Create Auth Users
Run `supabase/demo_users_auth_setup.sql` in Supabase SQL Editor to create the auth.users records.

### 3. Verify Setup
Run `supabase/verification.sql` in Supabase SQL Editor to verify all components are set up correctly.

---

## Production Deployment Checklist

Before deploying to production:

- [ ] Delete all demo users from `auth.users`
- [ ] Delete all demo profiles from `public.profiles`
- [ ] Delete all demo restaurant_users from `public.restaurant_users`
- [ ] Delete demo tenant from `public.tenants`
- [ ] Delete demo restaurant from `public.restaurants`
- [ ] Delete demo subscription from `public.subscriptions`
- [ ] Delete demo roles from `public.roles` (keep system roles)
- [ ] Delete this credentials file
- [ ] Create real admin users with strong passwords
- [ ] Enable email confirmation for new users
- [ ] Review and update RLS policies
- [ ] Set up proper authentication providers
- [ ] Configure production environment variables

---

## Security Notes

1. **Password Strength:** The demo password `Demo123!` is weak and should never be used in production.
2. **Email Domain:** The `@demo.sombill.com` domain is for development only.
3. **Super Admin:** The super admin account has unrestricted access and should be carefully protected in production.
4. **Data Isolation:** Demo users are all in the same tenant for testing purposes. Production should have proper tenant isolation.
5. **RLS Policies:** Review RLS policies before production to ensure proper data isolation.

---

## Role-Based Dashboard Redirects

After login, users are automatically redirected based on their role:

| Role | Dashboard Path |
|------|----------------|
| Super Admin | `/superadmin` |
| Owner | `/restaurant/owner` |
| Manager | `/restaurant/manager` |
| Cashier | `/restaurant/pos` |
| Waiter | `/restaurant/waiter` |
| Kitchen | `/restaurant/kitchen` |
| Inventory | `/restaurant/inventory` |
| Accountant | `/restaurant/accounting` |

The redirect logic is implemented in the authentication flow and checks the user's assigned role in the `restaurant_users` table.
