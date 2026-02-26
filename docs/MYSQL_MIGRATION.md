# Migrating from PostgreSQL to MySQL

This project is configured to use **MySQL** instead of PostgreSQL. Follow the steps below for a new MySQL setup or to migrate existing data.

---

## 1. Install MySQL

- **Windows:** [MySQL Installer](https://dev.mysql.com/downloads/installer/) or use XAMPP/WAMP.
- **macOS:** `brew install mysql` then `brew services start mysql`.
- **Linux:** `sudo apt install mysql-server` (Ubuntu/Debian) or equivalent.

On your **server**, use your host’s managed MySQL (e.g. AWS RDS, DigitalOcean Managed DB, cPanel MySQL) or install MySQL and create a database and user.

---

## 2. Create database and user (local or server)

### Connect to MySQL first

You must be connected to a running MySQL server. If you see **"ERROR: Not connected"**, connect first.

**Option A – MySQL Shell (mysqlsh):**

1. Connect (will prompt for root password if needed):
   ```text
   \connect root@localhost
   ```
   Or with port and password prompt: `\connect root@localhost:3306`
2. Switch to SQL mode: `\sql`
3. Run the SQL below.

**Option B – Classic mysql client (often easier):**

Open a new terminal and run:

```bash
mysql -u root -p
```

Enter your MySQL root password. Then run the SQL below at the `mysql>` prompt.

### Create database and user

Run the following (one at a time or all together). **If you get "No database selected", run `USE matrimony;` first** (after creating the database below).

```sql
CREATE DATABASE matrimony CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'matrimony_user'@'localhost' IDENTIFIED BY 'vescript';
GRANT ALL PRIVILEGES ON matrimony.* TO 'matrimony_user'@'localhost';
FLUSH PRIVILEGES;
```

For a **remote** server user (replace `your_server_ip` with the app server IP or `%` for any host):

```sql
CREATE USER 'matrimony_user'@'%' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON matrimony.* TO 'matrimony_user'@'%';
FLUSH PRIVILEGES;
```

---

## 3. Environment variables

Update `.env`:

```env
# MySQL
DB_HOST=localhost
DB_PORT=3306
DB_NAME=matrimony
DB_USER=matrimony_user
DB_PASSWORD=your_password
```

For **production** you can use a single URL:

```env
DATABASE_URL=mysql://matrimony_user:your_password@your-mysql-host:3306/matrimony
```

If your MySQL provider requires SSL, add:

```env
DB_SSL=true
```

---

## 4. Install dependencies and run the app

```bash
npm install
npm start
```

On first run, with `SYNC_DB` or in non-production, Sequelize will **sync** (create/alter) tables. No need to run PostgreSQL migrations manually; the app uses the same models for MySQL.

Optional: run Sequelize migrations (if you use them):

```bash
npx sequelize-cli db:migrate
```

---

## 5. Migrating existing data from PostgreSQL

You cannot import a PostgreSQL dump directly into MySQL. Use one of these approaches.

### Option A: Fresh start (no data migration)

1. Set up MySQL and `.env` as above.
2. Start the app so tables are created (sync or migrations).
3. Re-create users and data via your app or admin tools.

### Option B: Export from PostgreSQL, then import into MySQL

1. **Export from PostgreSQL** (schema is re-created by the app, so data-only is often enough):

   ```bash
   pg_dump -h localhost -U postgres -d matrimony --data-only --column-inserts -f matrimony_data.sql
   ```

2. **Convert and import:**  
   `matrimony_data.sql` will use PostgreSQL syntax (e.g. `INSERT ... DEFAULT`, types). You can:
   - Manually edit the SQL to be MySQL-compatible (column names, quotes, types), or
   - Use a script to export to CSV from PostgreSQL and then load into MySQL:

   **From PostgreSQL to CSV (example for `users`):**
   ```bash
   psql -h localhost -U postgres -d matrimony -c "\COPY (SELECT * FROM users) TO 'users.csv' WITH CSV HEADER"
   ```

   **Into MySQL (after tables exist):**
   ```sql
   LOAD DATA LOCAL INFILE 'users.csv' INTO TABLE users FIELDS TERMINATED BY ',' ENCLOSED BY '"' LINES TERMINATED BY '\n' IGNORE 1 ROWS;
   ```
   (Adjust columns and file path as needed; UUIDs and ENUMs must match your MySQL schema.)

### Option C: Use a migration tool

- **[pgloader](https://pgloader.io/)** can migrate from PostgreSQL to MySQL (install and run on a machine that can reach both databases). Example:

  ```bash
  pgloader postgresql://postgres:vescript@localhost/matrimony mysql://matrimony_user:your_password@localhost/matrimony
  ```

  You may need to create MySQL tables first (e.g. run the app once with sync) so pgloader can map tables and types.

---

## 6. Summary of code changes made for MySQL

| Area | Change |
|------|--------|
| **Package** | Replaced `pg` and `pg-hstore` with `mysql2`. |
| **Config** | `src/config/database.js` and `database.config.cjs` use `dialect: 'mysql'`, port `3306`, and MySQL-compatible options. |
| **Queries** | `Op.iLike` replaced with `Op.like` (case-insensitive with default MySQL collation). |
| **Raw SQL** | `information_schema` queries use `table_schema = DATABASE()` for MySQL. |
| **.env** | Defaults updated to `DB_PORT=3306`, `DB_USER=root` (or your user). |

---

## 7. Server deployment checklist

- [ ] MySQL server installed or managed MySQL instance created.
- [ ] Database `matrimony` and app user created with correct privileges.
- [ ] `.env` or server env has `DB_*` or `DATABASE_URL` (and optionally `DB_SSL=true`).
- [ ] `npm install` and `npm start` (or your process manager) run without DB errors.
- [ ] If you migrated data, verify login and critical flows against the new MySQL database.
