import mongoose from 'mongoose';
import { Application, type IApplicationDocument } from '../models/Application.js';
import { Citizen } from '../models/Citizen.js';
import { Department } from '../models/Department.js';
import { User } from '../models/User.js';
import { WorkflowService } from './workflow.service.js';
import { AuditService } from './audit.service.js';
import {
  ApplicationStatus,
  ServiceType,
  AuditAction,
  UserRole,
} from '@govconnect/shared-types';
import { ApiError } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';

export interface CreateApplicationDTO {
  type: ServiceType;
  departmentId?: string;
  formData: Record<string, any>;
  correlationId?: string;
}

export interface ApplicationFilterDTO {
  citizenId?: string;
  departmentId?: string;
  status?: ApplicationStatus;
  type?: ServiceType;
  search?: string;
  page?: number;
  limit?: number;
}

export class ApplicationService {
  /**
   * Create and submit a new citizen application
   */
  static async createApplication(
    userId: string,
    dto: CreateApplicationDTO,
    actorUser?: { name?: string; role?: string },
  ) {
    // 1. Resolve citizen record
    let citizen = await Citizen.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    if (!citizen) {
      const user = await User.findById(userId);
      if (!user) throw new ApiError(404, 'User account not found');

      citizen = await Citizen.create({
        userId: user._id,
        fullName: user.name,
        dateOfBirth: new Date('1990-01-01'),
        contact: {
          email: user.email,
          phone: dto.formData?.phone || '9876543210',
        },
        address: {
          street: '123 Civil Lines',
          city: 'New Delhi',
          state: 'Delhi',
          zipCode: '110001',
          country: 'India',
        },
      });
    }

    // 2. Resolve department
    let departmentId = dto.departmentId;
    if (!departmentId) {
      // Find matching department by service type or create standard default
      let dept = await Department.findOne({ services: dto.type });
      if (!dept) {
        dept = await Department.findOne() || await Department.create({
          name: 'Ministry of Commerce & Public Services',
          code: 'DEPT_COMMERCE',
          description: 'Department responsible for commercial approvals and citizen certificates',
          services: [dto.type],
          contactEmail: 'support@govconnect.gov.in',
          slaHours: 48,
          isActive: true,
        });
      }
      departmentId = dept._id.toString();
    }

    // 3. Generate human-readable Application ID
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const applicationId = `GC-2026-${randomSuffix}`;
    const correlationId = dto.correlationId || `corr-${Date.now()}-${randomSuffix}`;

    // 4. Create Application document
    const application = await Application.create({
      applicationId,
      citizenId: citizen._id,
      departmentId: new mongoose.Types.ObjectId(departmentId),
      type: dto.type,
      status: ApplicationStatus.SUBMITTED,
      formData: dto.formData || {},
      correlationId,
      currentStep: 'Initialization',
    });

    await AuditService.logEvent({
      actorId: userId,
      actorName: actorUser?.name || citizen.fullName,
      actorRole: (actorUser?.role as UserRole) || UserRole.CITIZEN,
      action: AuditAction.APPLICATION_SUBMITTED,
      resourceType: 'Application',
      resourceId: applicationId,
      correlationId,
      details: {
        serviceType: dto.type,
        departmentId,
      },
    });

    // 5. Start the automated workflow engine
    const workflowInstance = await WorkflowService.startWorkflow(application._id);

    return {
      application,
      workflowInstance,
    };
  }

  /**
   * Get application by ID (either MongoDB _id or formatted applicationId like GC-2026-12345)
   */
  static async getApplicationById(id: string) {
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId ? { $or: [{ _id: new mongoose.Types.ObjectId(id) }, { applicationId: id }] } : { applicationId: id };

    const application = await Application.findOne(query)
      .populate('citizenId')
      .populate('departmentId')
      .populate('workflowInstanceId')
      .lean();

    if (!application) {
      throw new ApiError(404, `Application '${id}' not found`);
    }

    return application;
  }

  /**
   * List applications with filtering and pagination
   */
  static async listApplications(filter: ApplicationFilterDTO) {
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filter.limit) || 20));
    const skip = (page - 1) * limit;

    const query: mongoose.FilterQuery<IApplicationDocument> = {};

    if (filter.citizenId) {
      query.citizenId = new mongoose.Types.ObjectId(filter.citizenId);
    }
    if (filter.departmentId) {
      query.departmentId = new mongoose.Types.ObjectId(filter.departmentId);
    }
    if (filter.status) {
      query.status = filter.status;
    }
    if (filter.type) {
      query.type = filter.type;
    }
    if (filter.search) {
      query.$or = [
        { applicationId: { $regex: filter.search, $options: 'i' } },
        { 'formData.applicantName': { $regex: filter.search, $options: 'i' } },
        { 'formData.companyName': { $regex: filter.search, $options: 'i' } },
      ];
    }

    const [applications, total] = await Promise.all([
      Application.find(query)
        .populate('citizenId', 'fullName contact aadhaarNumber')
        .populate('departmentId', 'name code')
        .populate('workflowInstanceId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Application.countDocuments(query),
    ]);

    return {
      applications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Add an officer review note to an application
   */
  static async addNote(
    applicationId: string,
    author: { name: string; role: UserRole },
    text: string,
  ) {
    const isObjectId = mongoose.Types.ObjectId.isValid(applicationId);
    const query = isObjectId ? { $or: [{ _id: new mongoose.Types.ObjectId(applicationId) }, { applicationId }] } : { applicationId };

    const application = await Application.findOne(query);
    if (!application) {
      throw new ApiError(404, 'Application not found');
    }

    application.notes = application.notes || [];
    application.notes.push({
      author: author.name,
      role: author.role,
      text,
      createdAt: new Date(),
    });

    await application.save();
    return application;
  }
}
