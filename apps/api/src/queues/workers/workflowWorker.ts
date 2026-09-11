import { Worker, Job } from 'bullmq';
import { getBullMQRedisClient } from '../../config/redis.js';
import { QUEUE_NAMES, type WorkflowJobData } from '../queueManager.js';
import { WorkflowService } from '../../services/workflow.service.js';
import { logger } from '../../utils/logger.js';

let workflowWorker: Worker | null = null;

export function startWorkflowWorker(): Worker | null {
  try {
    const connection = getBullMQRedisClient();

    workflowWorker = new Worker<WorkflowJobData>(
      QUEUE_NAMES.WORKFLOW,
      async (job: Job<WorkflowJobData>) => {
        logger.info(`[Worker:Workflow] Processing Job ${job.id}: Action=${job.data.action}, Instance=${job.data.workflowInstanceId}`);

        if (job.data.action === 'EXECUTE_STEP') {
          await WorkflowService.executeStep(job.data.workflowInstanceId, Number(job.data.stepId) || 0);
        } else if (job.data.action === 'AUTO_PROCESS_WORKFLOW') {
          await WorkflowService.startWorkflow(job.data.applicationId);
        }
      },
      {
        connection,
        concurrency: 5,
      },
    );

    workflowWorker.on('completed', (job) => {
      logger.debug(`[Worker:Workflow] Job ${job.id} completed successfully`);
    });

    workflowWorker.on('failed', (job, err) => {
      logger.error(`[Worker:Workflow] Job ${job?.id} failed:`, err);
    });

    return workflowWorker;
  } catch (err: any) {
    logger.warn('Could not start workflow worker (Redis may be offline):', err.message);
    return null;
  }
}
