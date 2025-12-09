import express from 'express';
import dotenv from 'dotenv';
import { sequelize } from './config/db.js';
import authRoutes from './routes/authRoutes.js';

dotenv.config();
const app = express();

// middleware
app.use(express.json());

// routes
app.use('/api/auth', authRoutes);

// test route
app.get('/', (req, res) => res.send('API is running...'));

// connect database
sequelize.authenticate()
  .then(() => console.log('✅ Database connected'))
  .catch(err => console.error('❌ DB connection error:', err));

// start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
