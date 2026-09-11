import mongoose, { Schema, Document } from 'mongoose';
import { DepartmentStatus, ServiceType } from '@govconnect/shared-types';

export interface IDepartmentDocument extends Document {
  name: string;
  code: string;
  description?: string;
  apiEndpoint?: string;
  services: ServiceType[];
  contactEmail?: string;
  slaHours: number;
  status: DepartmentStatus;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const departmentSchema = new Schema<IDepartmentDocument>(
  {
    name: {
      type: String,
      required: [true, 'Department name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Department code is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    description: {
      type: String,
    },
    apiEndpoint: {
      type: String,
    },
    services: [
      {
        type: String,
        enum: Object.values(ServiceType),
      },
    ],
    contactEmail: {
      type: String,
    },
    slaHours: {
      type: Number,
      default: 48,
    },
    status: {
      type: String,
      enum: Object.values(DepartmentStatus),
      default: DepartmentStatus.ACTIVE,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

departmentSchema.index({ status: 1 });

export const Department = mongoose.model<IDepartmentDocument>(
  'Department',
  departmentSchema,
);
