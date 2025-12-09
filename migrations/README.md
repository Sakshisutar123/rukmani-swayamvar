# Database Migrations

This folder contains database migration files for the My School Hub backend.

## Migration Files

### Sequelize Migrations (JavaScript)
- `20240101000000-create-users-table.js` - Creates the initial users table
- `20240101000001-update-users-table-remove-role.js` - Removes role column and adds new columns

### SQL Migrations (for pgAdmin)
- `update-users-table.sql` - SQL script to update existing table
- `verify-users-table.sql` - SQL script to verify table structure

## Running Migrations

### Option 1: Using Migration Runner (Recommended)
```bash
node migrations/migrate.js
```

### Option 2: Using Sequelize CLI (if installed)
```bash
npx sequelize-cli db:migrate
```

### Option 3: Manual SQL (pgAdmin)
1. Open pgAdmin
2. Connect to your database
3. Open Query Tool
4. Run `migrations/update-users-table.sql`

## Migration Status

Check which migrations have been executed:
```sql
SELECT * FROM "SequelizeMeta" ORDER BY name;
```

## Rollback Migrations

To rollback the last migration:
```bash
npx sequelize-cli db:migrate:undo
```

Or manually:
```sql
DELETE FROM "SequelizeMeta" WHERE name = 'migration-file-name.js';
-- Then manually reverse the changes
```

## Table Structure

The users table should have these columns:
- `id` (uuid, primary key)
- `uniqueId` (string, unique, not null)
- `fullName` (string, not null)
- `email` (string)
- `phone` (string)
- `passwordHash` (string)
- `otp` (string)
- `otpExpiry` (timestamp)
- `isRegistered` (boolean, default false)
- `registration_type` (string)
- `qualification` (string)
- `college_name` (string)
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

## Notes

- Migrations are executed in alphabetical order
- Each migration file should export `up` and `down` functions
- The `SequelizeMeta` table tracks executed migrations
- Always backup your database before running migrations in production

