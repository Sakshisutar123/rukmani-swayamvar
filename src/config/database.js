import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

// Use DATABASE_URL when set (e.g. production); otherwise use individual DB_* vars
const databaseUrl = process.env.DATABASE_URL;
const sequelize = databaseUrl
  ? new Sequelize(databaseUrl, {
      dialect: 'mysql',
      logging: false,
      dialectOptions: process.env.DB_SSL === 'true' ? { ssl: { rejectUnauthorized: false } } : {}
    })
  : new Sequelize(
      process.env.DB_NAME || 'matrimony',
      process.env.DB_USER || 'root',
      process.env.DB_PASSWORD || '',
      {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
        logging: false
      }
    );

export { sequelize };

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL connected');

    // Force sync to recreate tables with updated schema
    if (process.env.SYNC_DB === 'true' || process.env.NODE_ENV !== 'production') {
      console.log('🔄 Syncing database schema...');
      await sequelize.sync({ force: false, alter: true });
      console.log('✅ Database tables synced');
    }
  } catch (error) {
    console.error('❌ DB connection error:', error.message);
  }
};
