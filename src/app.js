import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { sequelize } from './config/database.js';
import authRoutes from './routes/authRoutes.js';
import preferencesRoutes from './routes/preferencesRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import favoritesRoutes from './routes/favoritesRoutes.js';
import conversationRoutes from './routes/conversationRoutes.js';

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const app = express();

// middleware
app.use(express.json());
app.use('/uploads', express.static(path.join(rootDir, 'uploads')));

// routes
app.use('/api/auth', authRoutes);
app.use('/api/preferences', preferencesRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/conversations', conversationRoutes);

// test route
app.get('/', (req, res) => res.send('API is running...'));

// connect database
sequelize.authenticate()
  .then(() => console.log('✅ Database connected'))
  .catch(err => console.error('❌ DB connection error:', err));

// start server
const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
