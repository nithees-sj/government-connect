import { app } from './app.js';
import { config } from './config/index.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { getRedisClient, disconnectRedis } from './config/redis.js';
import { ConnectorRegistry } from './services/connectors/ConnectorRegistry.js';
import { QueueManager } from './queues/queueManager.js';
import { startWorkflowWorker } from './queues/workers/workflowWorker.js';
import { startNotificationWorker } from './queues/workers/notificationWorker.js';
import { startAuditWorker } from './queues/workers/auditWorker.js';
import { logger } from './utils/logger.js';

async function startServer(): Promise<void> {
  try {
    // Connect to MongoDB
    logger.info('🔌 Connecting to MongoDB...');
    await connectDatabase();

    // Connect to Redis
    logger.info('🔌 Connecting to Redis...');
    getRedisClient();

    // Initialize Connectors
    logger.info('🔌 Initializing Department Connector Registry...');
    ConnectorRegistry.initialize();

    // Initialize BullMQ Queues and Workers
    logger.info('🚀 Initializing BullMQ Queues & Background Workers...');
    QueueManager.initialize();
    startWorkflowWorker();
    startNotificationWorker();
    startAuditWorker();

    // Start Express server
    const server = app.listen(config.port, () => {
      logger.info(`🚀 GovConnect API running on http://localhost:${config.port}`);
      logger.info(`📊 Health check: http://localhost:${config.port}/api/v1/health`);
      logger.info(`📚 Swagger Docs: http://localhost:${config.port}/api-docs`);
      logger.info(`🌍 Environment: ${config.env}`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`\n${signal} received. Starting graceful shutdown...`);

      server.close(async () => {
        logger.info('HTTP server closed');
        await QueueManager.closeAll();
        await disconnectDatabase();
        await disconnectRedis();
        logger.info('All connections closed. Exiting.');
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('unhandledRejection', (reason: unknown) => {
      logger.error('Unhandled Rejection:', reason);
    });

    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
