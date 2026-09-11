import mongoose, { Schema, Document } from 'mongoose';
import { WorkflowStepStatus, UserRole } from '@govconnect/shared-types';

export interface IStepExecutionSchema {
  stepName: string;
  stepType: string;
  order: number;
  status: WorkflowStepStatus;
  startedAt?: Date;
  completedAt?: Date;
  outputData?: Record<string, any>;
  errorMessage?: string;
  retryCount: number;
  requiredRole?: UserRole;
  performedBy?: string;
}

export interface IWorkflowInstanceDocument extends Document {
  applicationId: mongoose.Types.ObjectId;
  workflowId: mongoose.Types.ObjectId;
  currentStepIndex: number;
  status: WorkflowStepStatus;
  steps: IStepExecutionSchema[];
  correlationId: string;
  startedAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const stepExecutionSchema = new Schema<IStepExecutionSchema>(
  {
    stepName: { type: String, required: true },
    stepType: { type: String, required: true },
    order: { type: Number, required: true },
    status: {
      type: String,
      enum: Object.values(WorkflowStepStatus),
      default: WorkflowStepStatus.PENDING,
    },
    startedAt: { type: Date },
    completedAt: { type: Date },
    outputData: { type: Schema.Types.Mixed, default: {} },
    errorMessage: { type: String },
    retryCount: { type: Number, default: 0 },
    requiredRole: { type: String, enum: Object.values(UserRole) },
    performedBy: { type: String },
  },
  { _id: false },
);

const workflowInstanceSchema = new Schema<IWorkflowInstanceDocument>(
  {
    applicationId: {
      type: Schema.Types.ObjectId,
      ref: 'Application',
      required: true,
      index: true,
    },
    workflowId: {
      type: Schema.Types.ObjectId,
      ref: 'Workflow',
      required: true,
    },
    currentStepIndex: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: Object.values(WorkflowStepStatus),
      default: WorkflowStepStatus.PROCESSING,
    },
    steps: [stepExecutionSchema],
    correlationId: {
      type: String,
      required: true,
      index: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

workflowInstanceSchema.index({ applicationId: 1 });
workflowInstanceSchema.index({ status: 1 });

export const WorkflowInstance = mongoose.model<IWorkflowInstanceDocument>(
  'WorkflowInstance',
  workflowInstanceSchema,
);
