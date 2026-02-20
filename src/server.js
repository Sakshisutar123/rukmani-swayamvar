import http from 'http';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server as SocketServer } from 'socket.io';
import dotenv from 'dotenv';
import { connectDB } from './config/database.js';
import authRoutes from './routes/authRoutes.js';
import preferencesRoutes from './routes/preferencesRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import favoritesRoutes from './routes/favoritesRoutes.js';
import conversationRoutes from './routes/conversationRoutes.js';
import callsRoutes from './routes/callsRoutes.js';
import { initRealtime } from './services/realtime.js';
import { ensureUploadDirs, UPLOADS_DIR } from './config/uploadPaths.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

// Ensure upload folders exist (uploads, uploads/profiles, uploads/files)
ensureUploadDirs();

const app = express();
const server = http.createServer(app);
const io = new SocketServer(server, {
  cors: { origin: process.env.CORS_ORIGIN || '*', methods: ['GET', 'POST'] }
});
initRealtime(io);
app.use(express.json());

// Serve uploaded photos and files at /uploads/...
app.use('/uploads', express.static(UPLOADS_DIR));

// Logging middleware
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path}`);
  next();
});

// Connect DB
console.log('🔌 Connecting to database...');
connectDB().catch(err => {
  console.error('❌ Fatal: Database connection failed:', err);
  process.exit(1);
});

// Routes
console.log('📍 Registering routes...');
app.use('/api/auth', authRoutes);
app.use('/api/preferences', preferencesRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/calls', callsRoutes);
console.log('✅ Routes registered');

// Test route
app.get('/', (req, res) => res.send('Auth API is running...'));

// 404 handler
app.use((req, res) => {
  console.log(`❌ 404: ${req.method} ${req.path} not found`);
  res.status(404).json({ message: 'Route not found', path: req.path, method: req.method });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({ message: 'Server error', error: err.message });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log('✅ PostgreSQL connected');
  console.log('✅ Socket.io real-time enabled\n');
});
