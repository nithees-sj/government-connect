import mongoose, { Schema, Document } from 'mongoose';
import { UserRole, ServiceType } from '@govconnect/shared-types';

export interface IWorkflowStepSchema {
  name: string;
  type: string;
  order: number;
  requiredRole?: UserRole;
  connectorCode?: string;
  isAutomated?: boolean;
}

export interface IWorkflowDocument extends Document {
  name: string;
  serviceType: ServiceType;
  departmentId: mongoose.Types.ObjectId;
  steps: IWorkflowStepSchema[];
  status: 'ACTIVE' | 'DRAFT' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}

const workflowSchema = new Schema<IWorkflowDocument>(
  {
    name: {
      type: String,
      required: true,
    },
    serviceType: {
      type: String,
      enum: Object.values(ServiceType),
      required: true,
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    steps: [
      {
        name: { type: String, required: true },
        type: { type: String, required: true },
        order: { type: Number, required: true },
        requiredRole: { type: String, enum: Object.values(UserRole) },
        connectorCode: { type: String },
        isAutomated: { type: Boolean, default: false },
      },
    ],
    status: {
      type: String,
      enum: ['ACTIVE', 'DRAFT', 'INACTIVE'],
      default: 'ACTIVE',
    },
  },
  {
    timestamps: true,
  },
);

workflowSchema.index({ serviceType: 1, status: 1 });
workflowSchema.index({ departmentId: 1 });

export const Workflow = mongoose.model<IWorkflowDocument>(
  'Workflow',
  workflowSchema,
);
