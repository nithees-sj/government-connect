import { Worker, Job } from 'bullmq';
import { getBullMQRedisClient } from '../../config/redis.js';
import { QUEUE_NAMES, type AuditJobData } from '../queueManager.js';
import { AuditService } from '../../services/audit.service.js';
import { AuditAction, UserRole } from '@govconnect/shared-types';
import { logger } from '../../utils/logger.js';

let auditWorker: Worker | null = null;

export function startAuditWorker(): Worker | null {
  try {
    const connection = getBullMQRedisClient();

    auditWorker = new Worker<AuditJobData>(
      QUEUE_NAMES.AUDIT,
      async (job: Job<AuditJobData>) => {
        logger.debug(`[Worker:Audit] Processing Audit Job ${job.id} Action=${job.data.action}`);

        await AuditService.logEvent({
          actorId: job.data.actorId,
          actorName: job.data.actorName,
          actorRole: (job.data.actorRole as UserRole | 'SYSTEM') || 'SYSTEM',
          action: (job.data.action as AuditAction) || AuditAction.SYSTEM_CONFIG_UPDATED,
          resourceType: job.data.resourceType,
          resourceId: job.data.resourceId,
          correlationId: job.data.correlationId,
          ipAddress: job.data.ipAddress,
          userAgent: job.data.userAgent,
          details: job.data.details,
        });
      },
      {
        connection,
        concurrency: 10,
      },
    );

    auditWorker.on('failed', (job, err) => {
      logger.error(`[Worker:Audit] Job ${job?.id} failed:`, err);
    });

    return auditWorker;
  } catch (err: any) {
    logger.warn('Could not start audit worker:', err.message);
    return null;
  }
}
