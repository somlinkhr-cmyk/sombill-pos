# Multi-Tenancy Isolation and Security Testing Guide

This document outlines the testing procedures to verify that the SomBill POS multi-tenancy implementation properly isolates data between tenants and maintains security.

## Test Environment Setup

### Prerequisites
1. Create at least 2 test tenants in the `tenants` table
2. Create test users for each tenant with different roles (manager, cashier, waiter, kitchen)
3. Ensure each tenant has sample data (products, categories, tables, orders, etc.)

### Test Data Setup SQL

```sql
-- Create test tenant 1
INSERT INTO tenants (id, name, email, phone, address, city, country, status, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Test Restaurant A',
  'restaurant-a@test.com',
  '+1234567890',
  '123 Main St',
  'Test City',
  'Test Country',
  'active',
  NOW(),
  NOW()
);

-- Create test tenant 2
INSERT INTO tenants (id, name, email, phone, address, city, country, status, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'Test Restaurant B',
  'restaurant-b@test.com',
  '+0987654321',
  '456 Oak Ave',
  'Test City',
  'Test Country',
  'active',
  NOW(),
  NOW()
);

-- Create test users for tenant 1
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'manager-a@test.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW()),
  ('11111111-1111-1111-1111-111111111112', 'cashier-a@test.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW());

INSERT INTO public.users (id, email, name, phone, role, salary, shift, is_active, tenant_id, created_at, updated_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'manager-a@test.com', 'Manager A', '+1234567890', 'manager', 5000, 'morning', true, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
  ('11111111-1111-1111-1111-111111111112', 'cashier-a@test.com', 'Cashier A', '+1234567890', 'cashier', 3000, 'morning', true, '00000000-0000-0000-0000-000000000001', NOW(), NOW());

-- Create test users for tenant 2
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES
  ('22222222-2222-2222-2222-222222222221', 'manager-b@test.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222222', 'cashier-b@test.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW());

INSERT INTO public.users (id, email, name, phone, role, salary, shift, is_active, tenant_id, created_at, updated_at)
VALUES
  ('22222222-2222-2222-2222-222222222221', 'manager-b@test.com', 'Manager B', '+0987654321', 'manager', 5000, 'morning', true, '00000000-0000-0000-0000-000000000002', NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222222', 'cashier-b@test.com', 'Cashier B', '+0987654321', 'cashier', 3000, 'morning', true, '00000000-0000-0000-0000-000000000002', NOW(), NOW());

-- Create test categories for tenant 1
INSERT INTO categories (id, name, description, display_order, is_active, tenant_id, created_at, updated_at)
VALUES
  ('cat-001', 'Beverages A', 'Drinks for Restaurant A', 1, true, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
  ('cat-002', 'Food A', 'Food items for Restaurant A', 2, true, '00000000-0000-0000-0000-000000000001', NOW(), NOW());

-- Create test categories for tenant 2
INSERT INTO categories (id, name, description, display_order, is_active, tenant_id, created_at, updated_at)
VALUES
  ('cat-003', 'Beverages B', 'Drinks for Restaurant B', 1, true, '00000000-0000-0000-0000-000000000002', NOW(), NOW()),
  ('cat-004', 'Food B', 'Food items for Restaurant B', 2, true, '00000000-0000-0000-0000-000000000002', NOW(), NOW());

-- Create test products for tenant 1
INSERT INTO products (id, category_id, name, description, cost_price, selling_price, is_available, tenant_id, created_at, updated_at)
VALUES
  ('prod-001', 'cat-001', 'Coffee A', 'Fresh coffee', 2.00, 5.00, true, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
  ('prod-002', 'cat-002', 'Burger A', 'Delicious burger', 5.00, 12.00, true, '00000000-0000-0000-0000-000000000001', NOW(), NOW());

-- Create test products for tenant 2
INSERT INTO products (id, category_id, name, description, cost_price, selling_price, is_available, tenant_id, created_at, updated_at)
VALUES
  ('prod-003', 'cat-003', 'Tea B', 'Fresh tea', 1.50, 4.00, true, '00000000-0000-0000-0000-000000000002', NOW(), NOW()),
  ('prod-004', 'cat-004', 'Pizza B', 'Delicious pizza', 8.00, 18.00, true, '00000000-0000-0000-0000-000000000002', NOW(), NOW());

-- Create test tables for tenant 1
INSERT INTO tables (id, number, capacity, status, position_x, position_y, tenant_id, created_at, updated_at)
VALUES
  ('table-001', 1, 4, 'available', 0, 0, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
  ('table-002', 2, 6, 'available', 100, 0, '00000000-0000-0000-0000-000000000001', NOW(), NOW());

-- Create test tables for tenant 2
INSERT INTO tables (id, number, capacity, status, position_x, position_y, tenant_id, created_at, updated_at)
VALUES
  ('table-003', 1, 4, 'available', 0, 0, '00000000-0000-0000-0000-000000000002', NOW(), NOW()),
  ('table-004', 2, 8, 'available', 100, 0, '00000000-0000-0000-0000-000000000002', NOW(), NOW());
```

## Test Cases

### 1. Data Isolation Tests

#### Test 1.1: Product Isolation
**Objective**: Verify that users from Tenant A cannot access products from Tenant B

**Steps**:
1. Login as `manager-a@test.com` (Tenant A)
2. Navigate to Menu page
3. Verify that only products with `tenant_id = '00000000-0000-0000-0000-000000000001'` are displayed
4. Verify that products from Tenant B (Coffee A, Burger A) are NOT displayed
5. Attempt to directly access Tenant B's product by ID - should fail or return 404

**Expected Result**: Only Tenant A's products are visible and accessible

#### Test 1.2: Table Isolation
**Objective**: Verify that users from Tenant A cannot access tables from Tenant B

**Steps**:
1. Login as `cashier-a@test.com` (Tenant A)
2. Navigate to POS page
3. Verify that only tables with `tenant_id = '00000000-0000-0000-0000-000000000001'` are displayed
4. Verify that tables from Tenant B are NOT displayed

**Expected Result**: Only Tenant A's tables are visible

#### Test 1.3: Order Isolation
**Objective**: Verify that orders are isolated by tenant

**Steps**:
1. Login as `cashier-a@test.com` (Tenant A)
2. Create an order for Table 1
3. Logout
4. Login as `manager-b@test.com` (Tenant B)
5. Navigate to Orders page
6. Verify that the order created by Tenant A is NOT visible

**Expected Result**: Orders are isolated by tenant_id

#### Test 1.4: User Isolation
**Objective**: Verify that users can only see users from their own tenant

**Steps**:
1. Login as `manager-a@test.com` (Tenant A)
2. Navigate to Staff page
3. Verify that only users with `tenant_id = '00000000-0000-0000-0000-000000000001'` are displayed
4. Verify that users from Tenant B are NOT displayed

**Expected Result**: Only tenant's own users are visible

#### Test 1.5: Customer Isolation
**Objective**: Verify that customers are isolated by tenant

**Steps**:
1. Login as `manager-a@test.com` (Tenant A)
2. Create a customer "Customer A"
3. Logout
4. Login as `manager-b@test.com` (Tenant B)
5. Navigate to Customers page
6. Verify that "Customer A" is NOT visible

**Expected Result**: Customers are isolated by tenant_id

### 2. Security Tests

#### Test 2.1: Authentication with tenant_id
**Objective**: Verify that user authentication includes tenant_id in the session

**Steps**:
1. Login as `manager-a@test.com`
2. Check the AuthContext or user object
3. Verify that `user.tenant_id` is set to `'00000000-0000-0000-0000-000000000001'`

**Expected Result**: User object contains correct tenant_id

#### Test 2.2: Unauthorized Access Prevention
**Objective**: Verify that users cannot access data from other tenants via direct API calls

**Steps**:
1. Login as `manager-a@test.com`
2. Use browser DevTools to make a direct Supabase call:
   ```javascript
   supabase.from('products').select('*').eq('tenant_id', '00000000-0000-0000-0000-000000000002')
   ```
3. Verify that RLS policies prevent this access

**Expected Result**: Query returns empty or error due to RLS policies

#### Test 2.3: Cross-Tenant Data Modification Prevention
**Objective**: Verify that users cannot modify data from other tenants

**Steps**:
1. Login as `manager-a@test.com`
2. Attempt to update a product from Tenant B:
   ```javascript
   supabase.from('products').update({ name: 'Hacked' }).eq('id', 'prod-003')
   ```
3. Verify that the update fails

**Expected Result**: Update fails due to RLS policies

#### Test 2.4: Subscription Feature Gating
**Objective**: Verify that subscription plans properly gate module access

**Steps**:
1. Set Tenant A's subscription to 'silver' (basic plan)
2. Login as `manager-a@test.com`
3. Attempt to access Waiter Dashboard
4. Verify access is denied with appropriate message
5. Upgrade Tenant A to 'gold' plan
6. Verify Waiter Dashboard is now accessible

**Expected Result**: Module access is properly gated by subscription

### 3. Real-time Subscription Tests

#### Test 3.1: Real-time Order Updates
**Objective**: Verify that real-time subscriptions respect tenant isolation

**Steps**:
1. Login as `manager-a@test.com` in one browser tab
2. Login as `cashier-a@test.com` in another tab
3. Create an order in the cashier tab
4. Verify that the order appears in the manager tab
5. Login as `manager-b@test.com` in a third tab
6. Verify that the order does NOT appear in this tab

**Expected Result**: Real-time updates are tenant-scoped

#### Test 3.2: Real-time Table Updates
**Objective**: Verify that table status updates are tenant-isolated

**Steps**:
1. Login as `waiter-a@test.com` (create this user first)
2. Change table status from 'available' to 'occupied'
3. Login as `manager-b@test.com`
4. Verify that table status change is NOT visible

**Expected Result**: Table updates are tenant-scoped

### 4. SQL Injection Tests

#### Test 4.1: Tenant ID Manipulation
**Objective**: Verify that tenant_id cannot be manipulated to access other tenants' data

**Steps**:
1. Login as `manager-a@test.com`
2. Attempt to modify the tenant_id in a request payload
3. Verify that the server rejects the modification

**Expected Result**: Tenant_id modification is prevented

### 5. Performance Tests

#### Test 5.1: Query Performance with tenant_id
**Objective**: Verify that tenant_id filtering doesn't significantly impact performance

**Steps**:
1. Create 1000 products for Tenant A
2. Create 1000 products for Tenant B
3. Login as `manager-a@test.com`
4. Measure load time for Menu page
5. Verify load time is acceptable (< 2 seconds)

**Expected Result**: Performance remains acceptable with tenant filtering

### 6. Database RLS Policy Verification

#### Test 6.1: Verify RLS Policies are Active
**Objective**: Ensure Row Level Security policies are properly configured

**SQL Query**:
```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'products', 'categories', 'tables', 'orders', 'customers');

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public';
```

**Expected Result**: RLS is enabled on all tenant-scoped tables and policies exist

### 7. Edge Case Tests

#### Test 7.1: User Without tenant_id
**Objective**: Verify system handles users without tenant_id gracefully

**Steps**:
1. Create a user without tenant_id (if possible)
2. Attempt to login
3. Verify appropriate error message

**Expected Result**: System rejects login or assigns default tenant

#### Test 7.2: Deleted Tenant
**Objective**: Verify data handling when a tenant is deleted

**Steps**:
1. Mark a tenant as 'deleted'
2. Attempt to login as a user from that tenant
3. Verify access is denied

**Expected Result**: Deleted tenant users cannot access the system

## Test Automation Script

Create a test script to automate these tests:

```typescript
// tests/multi-tenancy.test.ts
import { describe, test, expect } from '@jest/globals'
import { supabase } from '../src/lib/supabase'

describe('Multi-Tenancy Isolation', () => {
  const tenantAId = '00000000-0000-0000-0000-000000000001'
  const tenantBId = '00000000-0000-0000-0000-000000000002'

  test('Products are isolated by tenant', async () => {
    // Login as Tenant A user
    const { data: { user } } = await supabase.auth.signInWithPassword({
      email: 'manager-a@test.com',
      password: 'password123',
    })

    // Fetch products
    const { data: products } = await supabase
      .from('products')
      .select('*')

    // Verify all products belong to Tenant A
    products?.forEach(product => {
      expect(product.tenant_id).toBe(tenantAId)
    })

    // Verify Tenant B products are not present
    const tenantBProducts = products?.filter(p => p.tenant_id === tenantBId)
    expect(tenantBProducts?.length).toBe(0)

    await supabase.auth.signOut()
  })

  test('Users cannot access other tenant data via direct query', async () => {
    // Login as Tenant A user
    await supabase.auth.signInWithPassword({
      email: 'manager-a@test.com',
      password: 'password123',
    })

    // Attempt to query Tenant B data
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .eq('tenant_id', tenantBId)

    // Should return empty due to RLS
    expect(products?.length).toBe(0)

    await supabase.auth.signOut()
  })

  test('Orders are isolated by tenant', async () => {
    // Create order for Tenant A
    await supabase.auth.signInWithPassword({
      email: 'cashier-a@test.com',
      password: 'password123',
    })

    const { data: order } = await supabase.from('orders').insert({
      table_id: 'table-001',
      cashier_id: '11111111-1111-1111-1111-111111111112',
      order_type: 'dine_in',
      status: 'new',
      subtotal: 10,
      total: 10,
      payment_status: 'pending',
      tenant_id: tenantAId,
      source: 'cashier',
    }).select().single()

    await supabase.auth.signOut()

    // Login as Tenant B user
    await supabase.auth.signInWithPassword({
      email: 'manager-b@test.com',
      password: 'password123',
    })

    // Attempt to fetch Tenant A's order
    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order.id)

    // Should return empty
    expect(orders?.length).toBe(0)

    await supabase.auth.signOut()
  })
})
```

## Security Checklist

- [ ] All tenant-scoped tables have `tenant_id` column
- [ ] RLS is enabled on all tenant-scoped tables
- [ ] RLS policies filter by `tenant_id`
- [ ] All SELECT queries include `.eq('tenant_id', user?.tenant_id)`
- [ ] All INSERT operations include `tenant_id: user?.tenant_id`
- [ ] All UPDATE operations filter by `tenant_id`
- [ ] All DELETE operations filter by `tenant_id`
- [ ] AuthContext includes tenant_id in user object
- [ ] Subscription middleware properly gates module access
- [ ] Real-time subscriptions filter by tenant_id
- [ ] API endpoints validate tenant_id from session
- [ ] Cross-tenant data access is prevented
- [ ] Tenant deletion cascades or handles data appropriately

## Test Results Template

| Test Case | Status | Notes | Date Tested |
|-----------|--------|-------|-------------|
| Product Isolation | ☐ Pass ☐ Fail | | |
| Table Isolation | ☐ Pass ☐ Fail | | |
| Order Isolation | ☐ Pass ☐ Fail | | |
| User Isolation | ☐ Pass ☐ Fail | | |
| Customer Isolation | ☐ Pass ☐ Fail | | |
| Auth with tenant_id | ☐ Pass ☐ Fail | | |
| Unauthorized Access Prevention | ☐ Pass ☐ Fail | | |
| Cross-Tenant Modification Prevention | ☐ Pass ☐ Fail | | |
| Subscription Feature Gating | ☐ Pass ☐ Fail | | |
| Real-time Order Updates | ☐ Pass ☐ Fail | | |
| Real-time Table Updates | ☐ Pass ☐ Fail | | |
| Tenant ID Manipulation | ☐ Pass ☐ Fail | | |
| Query Performance | ☐ Pass ☐ Fail | | |
| RLS Policies Active | ☐ Pass ☐ Fail | | |
| User Without tenant_id | ☐ Pass ☐ Fail | | |
| Deleted Tenant Handling | ☐ Pass ☐ Fail | | |

## Conclusion

After completing all tests, verify that:
1. All data isolation tests pass
2. All security tests pass
3. Performance is acceptable
4. Edge cases are handled gracefully
5. RLS policies are properly configured

If any tests fail, document the issue and implement fixes before proceeding to production.
