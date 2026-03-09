import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { logger } from './utils/logger.js';

dotenv.config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg) } }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Routes (to be added)
app.use('/api/auth', (req, res) => res.json({ message: 'Auth routes - coming soon' }));
app.use('/api/jobs', (req, res) => res.json({ message: 'Jobs routes - coming soon' }));
app.use('/api/applications', (req, res) => res.json({ message: 'Applications routes - coming soon' }));

// Error handler
app.use((err, req, res, next) => {
  logger.error(err.message);
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ error: message });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

export default app;
