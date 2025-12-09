import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import { readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

dotenv.config();

import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database connection
const sequelize = new Sequelize(
  process.env.DB_NAME || 'myschoolhub',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'vescript',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres',
    logging: console.log
  }
);

// Create migrations table if it doesn't exist
async function ensureMigrationsTable() {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS "SequelizeMeta" (
      name VARCHAR(255) NOT NULL PRIMARY KEY
    );
  `);
}

// Get executed migrations
async function getExecutedMigrations() {
  const [results] = await sequelize.query(
    'SELECT name FROM "SequelizeMeta" ORDER BY name'
  );
  return results.map(row => row.name);
}

// Run migrations
async function runMigrations() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    await ensureMigrationsTable();

    // Get all migration files
    const migrationFiles = (await readdir(__dirname))
      .filter(file => file.endsWith('.js') && file !== 'migrate.js' && file !== 'run-migrations.mjs')
      .sort();

    const executedMigrations = await getExecutedMigrations();
    const pendingMigrations = migrationFiles.filter(
      file => !executedMigrations.includes(file)
    );

    if (pendingMigrations.length === 0) {
      console.log('✅ All migrations are up to date');
      return;
    }

    console.log(`📦 Found ${pendingMigrations.length} pending migration(s)`);

    for (const file of pendingMigrations) {
      console.log(`\n🔄 Running migration: ${file}`);
      
      const migrationPath = join(__dirname, file);
      // Convert to file URL for ES module import
      const migrationUrl = pathToFileURL(migrationPath).href;
      const migration = await import(migrationUrl);
      
      const queryInterface = sequelize.getQueryInterface();
      
      try {
        if (typeof migration.up === 'function') {
          await migration.up(queryInterface, Sequelize);
        } else {
          throw new Error(`Migration ${file} does not export an 'up' function`);
        }
        
        // Record migration
        await sequelize.query(
          `INSERT INTO "SequelizeMeta" (name) VALUES ('${file}')`
        );
        
        console.log(`✅ Migration ${file} completed`);
      } catch (error) {
        console.error(`❌ Error running migration ${file}:`, error.message);
        throw error;
      }
    }

    console.log('\n✅ All migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run migrations
runMigrations();

