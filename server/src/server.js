import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { logger } from './utils/logger.js';
import { globalErrorHandler } from './middleware/error.js';
import { apiLimiter } from './middleware/rateLimiter.js';

// Import routes
import authRoutes from './modules/auth/auth.routes.js';
import jobRoutes from './modules/jobs/job.routes.js';
import applicationRoutes from './modules/applications/applications.routes.js';
import interviewRoutes from './modules/interviews/interviews.routes.js';
import employeeRoutes from './modules/employees/employees.routes.js';
import reportsRouter from './modules/reports/reports.routes.js';
import adminsRouter from './modules/admins/admins.routes.js';
import logsRouter from './modules/logs/logs.routes.js';
import requestRoutes from './modules/requests/requests.routes.js';
import uploadRouter from './modules/upload/upload.routes.js';
import announcementsRouter from './modules/announcements/announcements.routes.js';
import notificationRoutes from './modules/notifications/notification.routes.js';
import trainingRoutes from './modules/training/training.routes.js';
import preEmploymentRoutes from './modules/preEmployment/preEmployment.routes.js';
import { startTrainingExpiryJob } from './jobs/trainingExpiryJob.js';

dotenv.config();

const app = express();

// Connect to MongoDB
connectDB()
  .then(() => {
    logger.info('MongoDB connected successfully');
    startTrainingExpiryJob();
  })
  .catch((err) => {
    logger.error(`Failed to connect to MongoDB: ${err.message}`);
    process.exit(1);
  });

// Middleware
app.use(helmet());

// CORS configuration - allow multiple localhost ports during development
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.FRONTEND_URL]
  : [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://localhost:5176',
      'http://localhost:5177',
      'http://localhost:5178',
      'http://localhost:3000',
      'http://localhost:5000',
    ];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg) } }));
app.use(apiLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/announcements', announcementsRouter);
app.use('/api/notifications', notificationRoutes);
app.use('/api/training', trainingRoutes);
app.use('/api/reports', reportsRouter);
app.use('/api/admins', adminsRouter);
app.use('/api/logs', logsRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/requests', requestRoutes);
app.use('/api/pre-employment', preEmploymentRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler (must be last)
app.use(globalErrorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

export default app;
