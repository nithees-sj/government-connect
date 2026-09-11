import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '8000', 10),

  // MongoDB
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://govconnect_app:govconnect_app_2024@localhost:27017/govconnect',
  },

  // Redis
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  // JWT
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'govconnect-access-secret-change-in-production',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'govconnect-refresh-secret-change-in-production',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },

  // Mock Departments & Simulation Controller
  departments: {
    a: process.env.DEPT_A_URL || 'http://localhost:9001',
    b: process.env.DEPT_B_URL || 'http://localhost:9002',
    c: process.env.DEPT_C_URL || 'http://localhost:9003',
    simulationUrl: process.env.SIM_URL || (process.env.DEPT_A_URL ? process.env.DEPT_A_URL.replace(/:[0-9]+$/, ':9000') : 'http://localhost:9000'),
  },

  // Logging
  logLevel: process.env.LOG_LEVEL || 'debug',
} as const;
