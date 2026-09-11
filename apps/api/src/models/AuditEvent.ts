import mongoose, { Schema, Document } from 'mongoose';
import { AuditAction, UserRole } from '@govconnect/shared-types';

export interface IAuditEventDocument extends Document {
  actorId?: mongoose.Types.ObjectId;
  actorName?: string;
  actorRole?: UserRole | 'SYSTEM';
  action: AuditAction;
  resourceType: string;
  resourceId?: string;
  correlationId?: string;
  ipAddress?: string;
  userAgent?: string;
  details: Record<string, any>;
  sequenceNumber?: number;
  previousHash?: string;
  currentHash?: string;
  timestamp: Date;
}

const auditEventSchema = new Schema<IAuditEventDocument>(
  {
    actorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    actorName: {
      type: String,
      default: 'System',
    },
    actorRole: {
      type: String,
      default: 'SYSTEM',
    },
    action: {
      type: String,
      enum: Object.values(AuditAction),
      required: true,
      index: true,
    },
    resourceType: {
      type: String,
      required: true,
      index: true,
    },
    resourceId: {
      type: String,
      index: true,
    },
    correlationId: {
      type: String,
      index: true,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },
    sequenceNumber: {
      type: Number,
      index: true,
    },
    previousHash: {
      type: String,
      default: 'GENESIS',
    },
    currentHash: {
      type: String,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  },
);

auditEventSchema.index({ correlationId: 1, timestamp: -1 });
auditEventSchema.index({ action: 1, timestamp: -1 });

export const AuditEvent = mongoose.model<IAuditEventDocument>(
  'AuditEvent',
  auditEventSchema,
);
