import winston from 'winston';
import { config } from '../config/index.js';

const { combine, timestamp, errors, json, colorize, printf } = winston.format;

// Custom format for development console output
const devFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `${timestamp} [${level}] ${stack || message}${metaStr}`;
});

export const logger = winston.createLogger({
  level: config.logLevel,
  defaultMeta: { service: 'govconnect-api' },
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
  ),
  transports: [
    // Console transport - pretty in dev, JSON in production
    new winston.transports.Console({
      format: config.env === 'production'
        ? combine(json())
        : combine(colorize(), devFormat),
    }),
  ],
});

// Stream for Morgan HTTP logging integration
export const morganStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};
