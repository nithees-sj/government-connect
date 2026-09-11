import mongoose, { Schema, Document } from 'mongoose';
import { DocumentScanStatus, DocumentVerificationStatus } from '@govconnect/shared-types';

export interface IDocumentRecordDocument extends Document {
  citizenId: mongoose.Types.ObjectId;
  applicationId?: mongoose.Types.ObjectId;
  fileName: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  sha256Hash: string;
  scanStatus: DocumentScanStatus;
  verificationStatus: DocumentVerificationStatus;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const documentRecordSchema = new Schema<IDocumentRecordDocument>(
  {
    citizenId: {
      type: Schema.Types.ObjectId,
      ref: 'Citizen',
      required: true,
      index: true,
    },
    applicationId: {
      type: Schema.Types.ObjectId,
      ref: 'Application',
      index: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    sizeBytes: {
      type: Number,
      required: true,
    },
    storagePath: {
      type: String,
      required: true,
    },
    sha256Hash: {
      type: String,
      required: true,
      index: true,
    },
    scanStatus: {
      type: String,
      enum: Object.values(DocumentScanStatus),
      default: DocumentScanStatus.CLEAN,
    },
    verificationStatus: {
      type: String,
      enum: Object.values(DocumentVerificationStatus),
      default: DocumentVerificationStatus.VERIFIED,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

documentRecordSchema.index({ citizenId: 1, createdAt: -1 });

export const DocumentRecord = mongoose.model<IDocumentRecordDocument>(
  'DocumentRecord',
  documentRecordSchema,
);
