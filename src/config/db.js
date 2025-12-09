import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

export const sequelize = new Sequelize('myschoolhub', 'postgres', 'vescript', {
  host: 'localhost',
  dialect: 'postgres',
  logging: false, // optional
});

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected');
    await sequelize.sync(); // auto create tables in dev
  } catch (err) {
    console.error('❌ DB connection error:', err);
    process.exit(1);
  }
};
