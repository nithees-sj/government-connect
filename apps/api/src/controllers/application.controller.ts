import { Request, Response, NextFunction } from 'express';
import { ApplicationService } from '../services/application.service.js';
import { WorkflowService } from '../services/workflow.service.js';
import { AuditService } from '../services/audit.service.js';
import { Citizen } from '../models/Citizen.js';
import { User } from '../models/User.js';
import { UserRole } from '@govconnect/shared-types';

export const getApplications = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as any;
    const type = req.query.type as any;
    const search = req.query.search as string;

    let citizenId: string | undefined;
    let departmentId = req.query.departmentId as string | undefined;

    if (req.user?.role === UserRole.CITIZEN) {
      const citizen = await Citizen.findOne({ userId: req.user.userId });
      if (citizen) {
        citizenId = citizen._id.toString();
      } else {
        return res.json({
          success: true,
          data: [],
          pagination: { page: 1, limit, total: 0, totalPages: 0 },
        });
      }
    } else if (
      [UserRole.DEPT_OFFICER, UserRole.DEPT_ADMIN].includes(req.user?.role as UserRole)
    ) {
      const user = await User.findById(req.user?.userId);
      if (user?.department) {
        departmentId = user.department.toString();
      }
    }

    const result = await ApplicationService.listApplications({
      citizenId,
      departmentId,
      status,
      type,
      search,
      page,
      limit,
    });

    res.json({
      success: true,
      data: result.applications,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getApplicationById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.params.id as string;
    const application = await ApplicationService.getApplicationById(id);
    const workflowProgress = await WorkflowService.getWorkflowProgress(application._id);
    const auditLogs = await AuditService.queryLogs({
      resourceId: application.applicationId,
      limit: 25,
    });

    res.json({
      success: true,
      data: {
        ...application,
        workflowProgress,
        auditTrail: auditLogs.events,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createApplication = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!.userId;
    const { type, departmentId, formData, correlationId } = req.body;

    const result = await ApplicationService.createApplication(
      userId,
      {
        type,
        departmentId,
        formData,
        correlationId,
      },
      { name: req.user?.name, role: req.user?.role },
    );

    res.status(201).json({
      success: true,
      data: result.application,
      workflow: result.workflowInstance,
      message: 'Application submitted successfully and processing initiated.',
    });
  } catch (error) {
    next(error);
  }
};

export const addNote = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.params.id as string;
    const { text } = req.body;
    const author = {
      name: req.user?.name || 'Officer',
      role: (req.user?.role as UserRole) || UserRole.DEPT_OFFICER,
    };

    const application = await ApplicationService.addNote(id, author, text);

    res.json({
      success: true,
      data: application,
      message: 'Note added successfully',
    });
  } catch (error) {
    next(error);
  }
};
