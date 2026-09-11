import express from 'express';
import './models/index.js';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { config } from './config/index.js';
import { morganStream } from './utils/logger.js';
import { notFoundHandler, globalErrorHandler } from './middleware/errorHandler.js';

// Route imports
import { healthRouter } from './routes/health.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { applicationRouter } from './routes/application.routes.js';
import { workflowRouter } from './routes/workflow.routes.js';
import { consentRouter } from './routes/consent.routes.js';
import { documentRouter } from './routes/document.routes.js';
import { notificationRouter } from './routes/notification.routes.js';
import { departmentRouter } from './routes/department.routes.js';
import { adminRouter } from './routes/admin.routes.js';
import { aiRouter } from './routes/ai.routes.js';

const app = express();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Security Middleware ────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: false, // For Swagger UI compatibility
  }),
);

app.use(
  cors({
    origin: config.cors.origin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID'],
  }),
);

// ─── Body Parsing ───────────────────────────────────────
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(cookieParser());

// ─── HTTP Logging ───────────────────────────────────────
app.use(morgan('short', { stream: morganStream }));

// ─── API Documentation (Swagger UI) ─────────────────────
try {
  const swaggerPath = path.resolve(__dirname, './docs/openapi.json');
  if (fs.existsSync(swaggerPath)) {
    const swaggerDocument = JSON.parse(fs.readFileSync(swaggerPath, 'utf8'));
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  }
} catch (err) {
  console.warn('Swagger documentation could not be loaded:', err);
}

// ─── Versioned API Routes (/api/v1) ─────────────────────
const v1Router = express.Router();
v1Router.use('/health', healthRouter);
v1Router.use('/auth', authRouter);
v1Router.use('/applications', applicationRouter);
v1Router.use('/workflows', workflowRouter);
v1Router.use('/consents', consentRouter);
v1Router.use('/documents', documentRouter);
v1Router.use('/notifications', notificationRouter);
v1Router.use('/departments', departmentRouter);
v1Router.use('/admin', adminRouter);
v1Router.use('/ai', aiRouter);

app.use('/api/v1', v1Router);

// ─── Backward Compatibility Fallback (/api/...) ─────────
app.use('/api', v1Router);
app.use('/health', healthRouter);

// ─── Error Handling ─────────────────────────────────────
app.use(notFoundHandler);
app.use(globalErrorHandler);

export { app };
