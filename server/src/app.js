import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { config } from './config/env.js';
import { store } from './db/store.js';

import authRoutes from './routes/authRoutes.js';
import subjectRoutes from './routes/subjectRoutes.js';
import noteRoutes from './routes/noteRoutes.js';
import questionRoutes from './routes/questionRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import homeworkRoutes from './routes/homeworkRoutes.js';
import doubtRoutes from './routes/doubtRoutes.js';
import progressRoutes from './routes/progressRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import newsRoutes from './routes/newsRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import motivationRoutes from './routes/motivationRoutes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// Middlewares
app.use(cors({
  origin: (origin, callback) => {
    // Allow local development and standard frontend ports
    callback(null, true);
  },
  credentials: true
}));

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Static uploads serving with proper content headers for inline PDF reading & downloads
app.use('/uploads', express.static(config.uploadDir, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.pdf')) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline');
    }
  }
}));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    product: 'StudySathi',
    version: '1.0.0',
    mode: 'Academic Editorial'
  });
});

// Mount modular API routes
app.use('/api/auth', authRoutes);
app.use('/api', subjectRoutes);
app.use('/api', noteRoutes);
app.use('/api', questionRoutes);
app.use('/api', quizRoutes);
app.use('/api', homeworkRoutes);
app.use('/api', doubtRoutes);
app.use('/api', progressRoutes);
app.use('/api', uploadRoutes);
app.use('/api', newsRoutes);
app.use('/api', documentRoutes);
app.use('/api', motivationRoutes);

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: `API route not found: ${req.originalUrl}` });
});

// Serve frontend static build in production (e.g. Render single web service)
const clientDist = path.join(__dirname, '../../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error'
  });
});

// Boot server
async function startServer() {
  try {
    await store.init();
    app.listen(config.port, () => {
      console.log(`\n========================================`);
      console.log(`🌿 StudySathi API Server is running!`);
      console.log(`📡 URL: http://localhost:${config.port}`);
      console.log(`🎓 Target: ICSE Class 8 Personal Tuition`);
      console.log(`🔑 Demo Tutor: tutor@studysathi.com (pass: admin123)`);
      console.log(`🎒 Demo Student: student@studysathi.com (pass: student123)`);
      console.log(`========================================\n`);
    });
  } catch (error) {
    console.error('Fatal initialization error:', error);
    process.exit(1);
  }
}

startServer();

export default app;
