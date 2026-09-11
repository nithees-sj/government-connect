import { Request, Response, NextFunction } from 'express';
import { WorkflowService } from '../services/workflow.service.js';
import { WorkflowInstance } from '../models/WorkflowInstance.js';
import { ApiError } from '../middleware/errorHandler.js';

export async function getWorkflowProgress(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const progress = await WorkflowService.getWorkflowProgress(id);
    if (!progress) {
      throw new ApiError(404, 'Workflow progress not found');
    }
    res.json({ success: true, data: progress });
  } catch (error) {
    next(error);
  }
}

export async function adjudicateStep(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const { decision, remarks, rejectionReason } = req.body;

    const officerUser = {
      _id: req.user?.userId,
      userId: req.user?.userId,
      name: req.user?.name,
      role: req.user?.role,
    };

    const instance = await WorkflowService.adjudicateStep({
      workflowInstanceId: id,
      decision,
      officerUser,
      remarks,
      rejectionReason,
    });

    res.json({
      success: true,
      data: instance,
      message: `Workflow step successfully ${decision === 'APPROVE' ? 'approved' : 'rejected'}`,
    });
  } catch (error) {
    next(error);
  }
}

export async function retryFailedStep(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const instance = await WorkflowInstance.findById(id);
    if (!instance) {
      throw new ApiError(404, 'Workflow instance not found');
    }

    instance.status = 'PROCESSING' as any;
    if (instance.steps[instance.currentStepIndex]) {
      instance.steps[instance.currentStepIndex].status = 'PROCESSING' as any;
      instance.steps[instance.currentStepIndex].retryCount += 1;
    }
    await instance.save();

    WorkflowService.executeStep(id, instance.currentStepIndex).catch((err) => {
      console.error('Retry error:', err);
    });

    res.json({
      success: true,
      data: instance,
      message: 'Step retry initiated',
    });
  } catch (error) {
    next(error);
  }
}
