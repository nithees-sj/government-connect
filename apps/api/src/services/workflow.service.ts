import mongoose from 'mongoose';
import {
  WorkflowInstance,
  type IWorkflowInstanceDocument,
  type IStepExecutionSchema,
} from '../models/WorkflowInstance.js';
import { Workflow, type IWorkflowDocument } from '../models/Workflow.js';
import { Application } from '../models/Application.js';
import { Citizen } from '../models/Citizen.js';
import { Department } from '../models/Department.js';
import { ConnectorRegistry } from './connectors/ConnectorRegistry.js';
import { DocumentService } from './document.service.js';
import { AuditService } from './audit.service.js';
import { NotificationService } from './notification.service.js';
import {
  WorkflowStepStatus,
  ApplicationStatus,
  AuditAction,
  NotificationType,
  UserRole,
  ServiceType,
} from '@govconnect/shared-types';
import { logger } from '../utils/logger.js';
import { ApiError } from '../middleware/errorHandler.js';

export class WorkflowService {
  /**
   * Helper to ensure default workflow template exists for a service type
   */
  static async getOrCreateWorkflowTemplate(serviceType: ServiceType, departmentId?: mongoose.Types.ObjectId): Promise<IWorkflowDocument> {
    let workflow = await Workflow.findOne({ serviceType, status: 'ACTIVE' });
    if (workflow) return workflow;

    let deptId = departmentId;
    if (!deptId) {
      const dept = (await Department.findOne()) || (await Department.create({
        name: 'Ministry of Commerce & Civil Services',
        code: 'DEPT_MCCS',
        description: 'Primary Administrative & Licensing Department',
        services: [serviceType],
        contactEmail: 'licensing@govconnect.gov.in',
        slaHours: 48,
        isActive: true,
      }));
      deptId = dept._id as mongoose.Types.ObjectId;
    }

    const defaultSteps = [
      {
        name: 'Identity & DigiLocker Pre-Validation',
        type: 'AUTOMATED_IDENTITY',
        order: 1,
        connectorCode: 'DEPT_A_IDENTITY',
        isAutomated: true,
      },
      {
        name: 'Tax Clearance & Compliance Verification',
        type: 'AUTOMATED_TAX',
        order: 2,
        connectorCode: 'DEPT_B_TAX',
        isAutomated: true,
      },
      {
        name: 'Commercial Filing & Entity Registration',
        type: 'AUTOMATED_COMMERCE',
        order: 3,
        connectorCode: 'DEPT_C_COMMERCE',
        isAutomated: true,
      },
      {
        name: 'Departmental Officer Verification & Adjudication',
        type: 'MANUAL_REVIEW',
        order: 4,
        requiredRole: UserRole.DEPT_OFFICER,
        isAutomated: false,
      },
      {
        name: 'Final Certificate Generation & Digital Stamp',
        type: 'FINAL_ISSUANCE',
        order: 5,
        isAutomated: true,
      },
    ];

    workflow = await Workflow.create({
      name: `${serviceType.replace(/_/g, ' ')} Standard Workflow`,
      serviceType,
      departmentId: deptId,
      steps: defaultSteps,
      status: 'ACTIVE',
    });

    return workflow;
  }

  /**
   * Start a new workflow instance for an application
   */
  static async startWorkflow(applicationId: string | mongoose.Types.ObjectId): Promise<IWorkflowInstanceDocument> {
    const application = await Application.findById(applicationId);
    if (!application) {
      throw new ApiError(404, 'Application not found to initiate workflow');
    }

    const template = await this.getOrCreateWorkflowTemplate(application.type, application.departmentId);

    const steps: IStepExecutionSchema[] = template.steps.map((s) => ({
      stepName: s.name,
      stepType: s.type,
      order: s.order,
      status: WorkflowStepStatus.PENDING,
      retryCount: 0,
      requiredRole: s.requiredRole,
      outputData: {},
    }));

    const correlationId = application.correlationId || `corr-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const instance = await WorkflowInstance.create({
      applicationId: application._id,
      workflowId: template._id,
      currentStepIndex: 0,
      status: WorkflowStepStatus.PROCESSING,
      steps,
      correlationId,
      startedAt: new Date(),
    });

    application.workflowInstanceId = instance._id as mongoose.Types.ObjectId;
    application.status = ApplicationStatus.IN_REVIEW;
    application.currentStep = steps[0].stepName;
    await application.save();

    await AuditService.logEvent({
      action: AuditAction.APPLICATION_SUBMITTED,
      resourceType: 'Application',
      resourceId: application.applicationId,
      correlationId,
      details: { workflowInstanceId: instance._id, totalSteps: steps.length },
    });

    this.executeStep(instance._id.toString(), 0).catch((err) => {
      logger.error(`Workflow step execution error for instance ${instance._id}:`, err);
    });

    return instance;
  }

  /**
   * Execute a specific step within a workflow instance
   */
  static async executeStep(instanceId: string, stepIndex: number): Promise<void> {
    const instance = await WorkflowInstance.findById(instanceId);
    if (!instance || instance.status === WorkflowStepStatus.COMPLETED || instance.status === WorkflowStepStatus.FAILED) {
      return;
    }

    if (stepIndex >= instance.steps.length) {
      await this.finalizeWorkflow(instance);
      return;
    }

    const step = instance.steps[stepIndex];
    instance.currentStepIndex = stepIndex;
    step.status = WorkflowStepStatus.PROCESSING;
    step.startedAt = new Date();
    await instance.save();

    const application = await Application.findById(instance.applicationId);
    if (!application) return;

    application.currentStep = step.stepName;
    await application.save();

    logger.info(
      `⚙️ Executing Workflow Step [${stepIndex + 1}/${instance.steps.length}]: "${step.stepName}" for Application ${application.applicationId}`,
    );

    if (step.stepType === 'MANUAL_REVIEW' || step.stepType === 'OFFICER_REVIEW' || step.requiredRole) {
      application.status = ApplicationStatus.IN_REVIEW;
      await application.save();
      logger.info(`⏳ Workflow paused at manual step: "${step.stepName}". Awaiting officer review.`);
      return;
    }

    let citizen = null;
    try {
      citizen = await Citizen.findById(application.citizenId);
      const applicantName = (citizen && citizen.fullName) || application.formData?.applicantName || 'Citizen Applicant';
      let stepOutput: Record<string, any> = {};

      const citizenDocs = citizen ? await DocumentService.getCitizenDocuments(citizen._id) : [];

      if (step.stepType === 'AUTOMATED_IDENTITY' || step.stepType.includes('IDENTITY')) {
        // Realistic gateway verification delay so user sees real-time backend state machine
        await new Promise((resolve) => setTimeout(resolve, 2500));

        const hasAadhaarDoc = citizenDocs.some(
          (d) => d.metadata?.documentType === 'SOVEREIGN_IDENTITY' || d.metadata?.documentType === 'AADHAAR',
        );
        const formAadhaar = application.formData?.aadhaarNumber ? String(application.formData.aadhaarNumber).trim() : '';
        const citizenAadhaar = citizen?.aadhaarNumber ? String(citizen.aadhaarNumber).trim() : '';
        const aadhaar = formAadhaar || citizenAadhaar || (hasAadhaarDoc ? 'UIDAI-LINKED-VAULT-2026' : '');

        if (!aadhaar) {
          throw new Error(
            'Identity verification failed: No Aadhaar card or Sovereign Identity document found in Citizen Wallet. Please upload and link your Aadhaar in the Documents Vault / Wallet to proceed with inter-departmental verification.',
          );
        }

        const identityConnector = ConnectorRegistry.getIdentityConnector();
        const dobStr = citizen?.dateOfBirth ? new Date(citizen.dateOfBirth).toISOString().split('T')[0] : '1990-01-01';
        const phoneStr = citizen?.contact?.phone || application.formData?.phone || '9876543210';

        const verifyRes = await identityConnector.verifyIdentity({
          citizenName: applicantName,
          dob: dobStr,
          mobileNumber: phoneStr,
          aadhaarNumber: aadhaar,
          correlationId: instance.correlationId,
        });
        stepOutput = verifyRes;
      } else if (step.stepType === 'AUTOMATED_TAX' || step.stepType.includes('TAX')) {
        // Realistic gateway verification delay
        await new Promise((resolve) => setTimeout(resolve, 2500));

        const hasPanDoc = citizenDocs.some(
          (d) => d.metadata?.documentType === 'TAX_CLEARANCE' || d.metadata?.documentType === 'PAN',
        );
        const formPan = application.formData?.panNumber ? String(application.formData.panNumber).trim().toUpperCase() : '';
        const citizenPan = citizen?.panNumber ? String(citizen.panNumber).trim().toUpperCase() : '';
        const pan = formPan || citizenPan || (hasPanDoc ? 'CBDT-LINKED-VAULT-2026' : '');

        if (!pan) {
          throw new Error(
            'Tax compliance verification failed: No PAN Card or Tax Clearance document found in Citizen Wallet. Please upload and link your PAN in the Documents Vault / Wallet to proceed with inter-departmental verification.',
          );
        }

        const taxConnector = ConnectorRegistry.getTaxConnector();
        const taxRes = await taxConnector.verifyTaxClearance({
          applicantName,
          panNumber: pan,
          assessmentYear: application.formData?.assessmentYear || '2025-2026',
          correlationId: instance.correlationId,
        });
        stepOutput = taxRes;
      } else if (step.stepType === 'AUTOMATED_COMMERCE' || step.stepType.includes('COMMERCE') || step.stepType.includes('BUSINESS')) {
        // Realistic gateway verification delay
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const bizConnector = ConnectorRegistry.getBusinessConnector();
        const bizName = application.formData?.companyName || application.formData?.businessName || `${applicantName} Enterprises`;
        const bizRes = await bizConnector.submitRegistration({
          enterpriseName: bizName,
          sectorType: application.formData?.industrySector || 'Technology & Digital Services',
          authorizedCapitalInr: Number(application.formData?.authorizedCapital) || Number(application.formData?.capital) || 1000000,
          correlationId: instance.correlationId,
        });
        stepOutput = bizRes;
      } else if (step.stepType === 'FINAL_ISSUANCE' || step.stepType.includes('FINAL') || step.stepType.includes('ISSUANCE')) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        const certificateNumber = `GOV-${application.type.slice(0, 3)}-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
        stepOutput = {
          certificateNumber,
          issuedAt: new Date().toISOString(),
          issuingAuthority: 'Government Interoperability Platform (GovConnect)',
          status: 'DIGITALLY_SIGNED_AND_SEALED',
        };
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        stepOutput = {
          processedAt: new Date().toISOString(),
          status: 'SUCCESS',
          message: `Step ${step.stepName} automatically processed successfully`,
        };
      }

      step.status = WorkflowStepStatus.COMPLETED;
      step.completedAt = new Date();
      step.outputData = stepOutput;
      step.errorMessage = undefined;
      await instance.save();

      await AuditService.logEvent({
        action: AuditAction.INTEROPERABILITY_CALL_COMPLETED,
        resourceType: 'WorkflowStep',
        resourceId: `${application.applicationId}:${step.stepName}`,
        correlationId: instance.correlationId,
        details: { stepIndex, stepName: step.stepName, output: stepOutput },
      });

      await this.executeStep(instanceId, stepIndex + 1);
    } catch (error: any) {
      logger.error(`❌ Step failed: "${step.stepName}" for Application ${application.applicationId}:`, error);

      step.status = WorkflowStepStatus.FAILED;
      step.completedAt = new Date();
      step.errorMessage = error.message || 'Unknown step processing failure';
      instance.status = WorkflowStepStatus.FAILED;
      await instance.save();

      application.status = ApplicationStatus.FAILED;
      await application.save();

      await AuditService.logEvent({
        action: AuditAction.INTEROPERABILITY_CALL_FAILED,
        resourceType: 'WorkflowStep',
        resourceId: `${application.applicationId}:${step.stepName}`,
        correlationId: instance.correlationId,
        details: { stepIndex, stepName: step.stepName, error: error.message },
      });

      if (citizen && citizen.userId) {
        await NotificationService.sendNotification({
          recipientId: citizen.userId,
          type: NotificationType.ERROR,
          title: `Application Step Failed (${application.applicationId})`,
          message: `Processing failed at step "${step.stepName}": ${error.message}`,
          link: `/applications/${application.applicationId}`,
        });
      }
    }
  }

  /**
   * Adjudicate manual review step (Officer Approve or Reject)
   */
  static async adjudicateStep(params: {
    workflowInstanceId: string;
    decision: 'APPROVE' | 'REJECT';
    officerUser: { _id?: any; userId?: any; name?: string; role?: string };
    remarks?: string;
    rejectionReason?: string;
  }): Promise<IWorkflowInstanceDocument> {
    const instance = await WorkflowInstance.findById(params.workflowInstanceId);
    if (!instance) {
      throw new ApiError(404, 'Workflow instance not found');
    }

    const application = await Application.findById(instance.applicationId);
    if (!application) {
      throw new ApiError(404, 'Application not found');
    }

    const currentStepIndex = instance.currentStepIndex;
    const currentStep = instance.steps[currentStepIndex];

    if (!currentStep) {
      throw new ApiError(400, 'Invalid step index for workflow instance');
    }

    const officerName = params.officerUser.name || 'Officer';
    const officerRole = (params.officerUser.role as UserRole) || UserRole.DEPT_OFFICER;

    if (params.decision === 'APPROVE') {
      currentStep.status = WorkflowStepStatus.COMPLETED;
      currentStep.completedAt = new Date();
      currentStep.performedBy = officerName;
      currentStep.outputData = {
        decision: 'APPROVED',
        adjudicatedBy: officerName,
        remarks: params.remarks || 'Application reviewed and approved by officer.',
        timestamp: new Date().toISOString(),
      };

      if (params.remarks) {
        application.notes = application.notes || [];
        application.notes.push({
          author: officerName,
          role: officerRole,
          text: params.remarks,
          createdAt: new Date(),
        });
        await application.save();
      }

      await instance.save();

      await AuditService.logEvent({
        actorId: params.officerUser._id || params.officerUser.userId,
        actorName: officerName,
        actorRole: officerRole,
        action: AuditAction.APPLICATION_APPROVED,
        resourceType: 'Application',
        resourceId: application.applicationId,
        correlationId: instance.correlationId,
        details: { stepName: currentStep.stepName, remarks: params.remarks },
      });

      this.executeStep(instance._id.toString(), currentStepIndex + 1).catch((err) =>
        logger.error(`Error advancing workflow after officer approval:`, err),
      );
    } else {
      currentStep.status = WorkflowStepStatus.REJECTED;
      currentStep.completedAt = new Date();
      currentStep.performedBy = officerName;
      currentStep.errorMessage = params.rejectionReason || 'Rejected by officer';
      currentStep.outputData = {
        decision: 'REJECTED',
        adjudicatedBy: officerName,
        rejectionReason: params.rejectionReason || 'Application rejected during departmental review',
        remarks: params.remarks,
        timestamp: new Date().toISOString(),
      };

      instance.status = WorkflowStepStatus.FAILED;
      await instance.save();

      application.status = ApplicationStatus.REJECTED;
      if (params.remarks || params.rejectionReason) {
        application.notes = application.notes || [];
        application.notes.push({
          author: officerName,
          role: officerRole,
          text: `[REJECTION] ${params.rejectionReason || ''}. ${params.remarks || ''}`.trim(),
          createdAt: new Date(),
        });
      }
      await application.save();

      await AuditService.logEvent({
        actorId: params.officerUser._id || params.officerUser.userId,
        actorName: officerName,
        actorRole: officerRole,
        action: AuditAction.APPLICATION_REJECTED,
        resourceType: 'Application',
        resourceId: application.applicationId,
        correlationId: instance.correlationId,
        details: { stepName: currentStep.stepName, reason: params.rejectionReason },
      });

      const citizen = await Citizen.findById(application.citizenId);
      if (citizen && citizen.userId) {
        await NotificationService.sendNotification({
          recipientId: citizen.userId,
          type: NotificationType.WARNING,
          title: `Application Rejected (${application.applicationId})`,
          message: `Your application was rejected during departmental review. Reason: ${params.rejectionReason || 'Requirements not met'}`,
          link: `/applications/${application.applicationId}`,
        });
      }
    }

    return instance;
  }

  /**
   * Finalize workflow on completion of all steps
   */
  private static async finalizeWorkflow(instance: IWorkflowInstanceDocument): Promise<void> {
    instance.status = WorkflowStepStatus.COMPLETED;
    instance.completedAt = new Date();
    await instance.save();

    const application = await Application.findById(instance.applicationId);
    if (!application) return;

    application.status = ApplicationStatus.APPROVED;
    application.currentStep = 'COMPLETED';
    await application.save();

    logger.info(`🎉 Workflow fully completed and approved for Application ${application.applicationId}!`);

    await AuditService.logEvent({
      action: AuditAction.APPLICATION_APPROVED,
      resourceType: 'Application',
      resourceId: application.applicationId,
      correlationId: instance.correlationId,
      details: { workflowInstanceId: instance._id, completedAt: instance.completedAt },
    });

    const citizen = await Citizen.findById(application.citizenId);
    if (citizen && citizen.userId) {
      await NotificationService.sendNotification({
        recipientId: citizen.userId,
        type: NotificationType.SUCCESS,
        title: `Application Approved! (${application.applicationId})`,
        message: `Congratulations! Your ${application.type.replace(/_/g, ' ')} application has been approved and issued.`,
        link: `/applications/${application.applicationId}`,
      });
    }
  }

  /**
   * Get workflow instance with populated steps and progress percent
   */
  static async getWorkflowProgress(applicationId: string | mongoose.Types.ObjectId): Promise<any> {
    const instance = await WorkflowInstance.findOne({ applicationId }).lean();
    if (!instance) return null;

    const totalSteps = instance.steps.length;
    const completedSteps = instance.steps.filter(
      (s) => s.status === WorkflowStepStatus.COMPLETED,
    ).length;
    const progressPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

    return {
      ...instance,
      progressPercent,
      totalSteps,
      completedSteps,
    };
  }
}
