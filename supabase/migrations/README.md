# SomBill POS Database Migrations

This directory contains the complete database migration history for the SomBill Enterprise POS system.

## Migration Order

Run migrations in the following order on a brand-new Supabase project:

1. **001_extensions.sql** - Enable PostgreSQL extensions (uuid-ossp, pgcrypto)
2. **002_enums.sql** - Define enum types (placeholder - using TEXT with CHECK constraints)
3. **003_tables.sql** - Create all 30 database tables
4. **004_indexes.sql** - Create performance indexes
5. **005_constraints.sql** - Additional constraints (placeholder - constraints in table definitions)
6. **006_functions.sql** - Create all PostgreSQL functions
7. **007_triggers.sql** - Create all database triggers
8. **008_rls.sql** - Enable Row Level Security on all tables
9. **009_policies.sql** - Create RLS policies for all tables
10. **010_storage.sql** - Create Supabase Storage buckets and policies
11. **011_seed.sql** - Insert initial seed data

## How to Deploy

### Option 1: Supabase SQL Editor (Manual)

1. Open your Supabase project's SQL Editor
2. Run each migration file in order (001 through 011)
3. Wait for each migration to complete successfully before running the next
4. Verify the output shows success messages

### Option 2: Supabase CLI (Automated)

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Run migrations
supabase db push
```

## Migration Dependencies

- **001_extensions.sql**: No dependencies
- **002_enums.sql**: No dependencies
- **003_tables.sql**: Depends on 001_extensions.sql (for uuid_generate_v4)
- **004_indexes.sql**: Depends on 003_tables.sql
- **005_constraints.sql**: Depends on 003_tables.sql
- **006_functions.sql**: Depends on 003_tables.sql
- **007_triggers.sql**: Depends on 003_tables.sql, 006_functions.sql
- **008_rls.sql**: Depends on 003_tables.sql
- **009_policies.sql**: Depends on 008_rls.sql, 006_functions.sql
- **010_storage.sql**: Depends on 003_tables.sql
- **011_seed.sql**: Depends on 003_tables.sql, 006_functions.sql

## Idempotency

All migrations are idempotent and can be safely re-run:

- Tables use `CREATE TABLE IF NOT EXISTS`
- Indexes use `CREATE INDEX IF NOT EXISTS`
- Triggers use `DROP TRIGGER IF EXISTS` before `CREATE TRIGGER`
- Policies use `DROP POLICY IF EXISTS` before `CREATE POLICY`
- Seed data uses `INSERT ... ON CONFLICT DO NOTHING`

## Key Changes from Previous Schema

### Fixed Issues

1. **Removed problematic trigger function**: The `handle_login_history(p_status TEXT)` function with declared parameters has been removed. Trigger functions cannot have declared parameters in PostgreSQL.

2. **Deprecated direct Auth user creation**: The `create_owner` function now raises an error if called. User creation should be done via Supabase Auth SDK on the frontend.

3. **Split into small migrations**: Previous monolithic files have been split into 11 small, focused migrations for better maintainability and testing.

### Schema Overview

- **30 tables**: Users, Tenants, Restaurants, Subscriptions, Roles, Permissions, Orders, Inventory, etc.
- **150+ indexes**: Performance optimization for all tables
- **29 triggers**: Updated_at, audit logs, activity logs, business logic
- **100+ RLS policies**: Multi-tenant data isolation
- **15 functions**: RLS helpers, restaurant creation, standalone operations
- **4 storage buckets**: Restaurant logos, product images, attachments, profile pictures

## Verification

Each migration includes a verification query at the end that confirms successful execution:

- Extensions: Shows installed extensions
- Tables: Counts created tables
- Indexes: Counts created indexes
- Functions: Counts created functions
- Triggers: Counts created triggers
- Policies: Counts created policies
- Storage: Shows created buckets
- Seed: Counts seeded records

## Troubleshooting

### Error: "relation does not exist"

Ensure migrations are run in the correct order. Each migration depends on previous migrations.

### Error: "function does not exist"

Ensure 006_functions.sql is run before 007_triggers.sql and 009_policies.sql.

### Error: "trigger functions cannot have declared arguments"

This has been fixed in the new migration structure. The problematic function has been removed.

### Error: "schema does not exist"

The `public` schema should exist by default in Supabase. If not, create it first:
```sql
CREATE SCHEMA public;
```

## Rollback

To rollback the database, you can either:

1. Drop and recreate the Supabase project (recommended for testing)
2. Manually drop objects in reverse order (not recommended)

For production, consider using a proper migration tool like Supabase Migrations or Flyway for rollback support.

## Support

For issues or questions, refer to the main project documentation or contact the development team.
