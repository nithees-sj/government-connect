import mongoose, { Schema, Document } from 'mongoose';
import { ConsentStatus } from '@govconnect/shared-types';

export interface IConsentDocument extends Document {
  token: string;
  citizenId: mongoose.Types.ObjectId;
  departmentId: mongoose.Types.ObjectId;
  purpose: string;
  dataFields: string[];
  version: string;
  status: ConsentStatus;
  grantedAt: Date;
  expiresAt: Date;
  revokedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const consentSchema = new Schema<IConsentDocument>(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    citizenId: {
      type: Schema.Types.ObjectId,
      ref: 'Citizen',
      required: true,
      index: true,
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    purpose: {
      type: String,
      required: true,
    },
    dataFields: {
      type: [String],
      default: [],
    },
    version: {
      type: String,
      default: 'v1.0-DPDP',
    },
    status: {
      type: String,
      enum: Object.values(ConsentStatus),
      default: ConsentStatus.GRANTED,
      index: true,
    },
    grantedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    revokedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

consentSchema.index({ citizenId: 1, departmentId: 1, status: 1 });

export const Consent = mongoose.model<IConsentDocument>(
  'Consent',
  consentSchema,
);
