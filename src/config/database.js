import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

export const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  protocol: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected');

    if (process.env.SYNC_DB === 'true' || process.env.NODE_ENV !== 'production') {
      await sequelize.sync({ alter: false });
      console.log('✅ Database tables synced');
    }
  } catch (error) {
    console.error('❌ DB connection error:', error.message);
  }
};
