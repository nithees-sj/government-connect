import { Worker, Job } from 'bullmq';
import { getBullMQRedisClient } from '../../config/redis.js';
import { QUEUE_NAMES, type NotificationJobData } from '../queueManager.js';
import { NotificationService } from '../../services/notification.service.js';
import { NotificationType } from '@govconnect/shared-types';
import { logger } from '../../utils/logger.js';

let notificationWorker: Worker | null = null;

export function startNotificationWorker(): Worker | null {
  try {
    const connection = getBullMQRedisClient();

    notificationWorker = new Worker<NotificationJobData>(
      QUEUE_NAMES.NOTIFICATION,
      async (job: Job<NotificationJobData>) => {
        logger.info(`[Worker:Notification] Processing Job ${job.id} for Recipient ${job.data.recipientId}`);

        await NotificationService.sendNotification({
          recipientId: job.data.recipientId,
          type: (job.data.type as NotificationType) || NotificationType.INFO,
          title: job.data.title,
          message: job.data.message,
          link: job.data.metadata?.link,
        });
      },
      {
        connection,
        concurrency: 10,
      },
    );

    notificationWorker.on('failed', (job, err) => {
      logger.error(`[Worker:Notification] Job ${job?.id} failed:`, err);
    });

    return notificationWorker;
  } catch (err: any) {
    logger.warn('Could not start notification worker:', err.message);
    return null;
  }
}
