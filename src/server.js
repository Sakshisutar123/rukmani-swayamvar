import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from './config/database.js';
import authRoutes from './routes/authRoutes.js';

dotenv.config();

const app = express();
app.use(express.json());

// Connect DB
connectDB();

// Routes
app.use('/api/auth', authRoutes);

// Test route
app.get('/', (req, res) => res.send('Auth API is running...'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
