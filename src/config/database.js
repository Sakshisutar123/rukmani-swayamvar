import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

// Use DATABASE_URL when set (e.g. Render, Heroku); otherwise use individual DB_* vars
const databaseUrl = process.env.DATABASE_URL;
const sequelize = databaseUrl
  ? new Sequelize(databaseUrl, {
      dialect: 'postgres',
      protocol: 'postgres',
      logging: false,
      dialectOptions: {
        ssl: { require: true, rejectUnauthorized: false }
      }
    })
  : new Sequelize(
      process.env.DB_NAME || 'matrimony',
      process.env.DB_USER || 'postgres',
      process.env.DB_PASSWORD || 'vescript',
      {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: false
      }
    );

export { sequelize };

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected');

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
