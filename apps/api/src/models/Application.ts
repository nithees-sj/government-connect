import mongoose, { Schema, Document } from 'mongoose';
import { ApplicationStatus, ServiceType, UserRole } from '@govconnect/shared-types';

export interface IApplicationDocument extends Document {
  applicationId: string;
  citizenId: mongoose.Types.ObjectId;
  departmentId: mongoose.Types.ObjectId;
  type: ServiceType;
  status: ApplicationStatus;
  formData: Record<string, any>;
  currentStep?: string;
  workflowInstanceId?: mongoose.Types.ObjectId;
  correlationId?: string;
  notes?: {
    author: string;
    role: UserRole;
    text: string;
    createdAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const applicationSchema = new Schema<IApplicationDocument>(
  {
    applicationId: {
      type: String,
      required: true,
      unique: true,
    },
    citizenId: {
      type: Schema.Types.ObjectId,
      ref: 'Citizen',
      required: true,
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(ServiceType),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(ApplicationStatus),
      default: ApplicationStatus.DRAFT,
    },
    formData: {
      type: Schema.Types.Mixed,
      default: {},
    },
    currentStep: {
      type: String,
    },
    workflowInstanceId: {
      type: Schema.Types.ObjectId,
      ref: 'WorkflowInstance',
    },
    correlationId: {
      type: String,
      index: true,
    },
    notes: [
      {
        author: { type: String, required: true },
        role: { type: String, enum: Object.values(UserRole), required: true },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  },
);

applicationSchema.index({ citizenId: 1, status: 1 });
applicationSchema.index({ departmentId: 1, status: 1 });
applicationSchema.index({ type: 1, status: 1 });
applicationSchema.index({ createdAt: -1 });

export const Application = mongoose.model<IApplicationDocument>(
  'Application',
  applicationSchema,
);
