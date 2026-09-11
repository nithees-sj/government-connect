import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import mongoose from 'mongoose';
import multer from 'multer';
import { DocumentRecord, type IDocumentRecordDocument } from '../models/DocumentRecord.js';
import { DocumentScanStatus, DocumentVerificationStatus, AuditAction } from '@govconnect/shared-types';
import { AuditService } from './audit.service.js';
import { ApiError } from '../middleware/errorHandler.js';

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer storage engine configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `doc-${uniqueSuffix}${ext}`);
  },
});

// File filter for safety (PDF, JPG, PNG, WEBP max 10MB)
export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ApiError(400, 'Invalid file type. Only PDF, JPEG, PNG, and WebP are allowed.'));
    }
  },
});

export class DocumentService {
  /**
   * Calculate SHA-256 hash of a file on disk
   */
  static async computeFileHash(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);
      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', (err) => reject(err));
    });
  }

  /**
   * Store uploaded file record in MongoDB with SHA-256 checksum and simulated clean AV scan
   */
  static async processUploadedFile(params: {
    citizenId: string | mongoose.Types.ObjectId;
    applicationId?: string | mongoose.Types.ObjectId;
    file: Express.Multer.File;
    documentType?: string;
    metadata?: Record<string, any>;
    actorUser?: { userId?: string; name?: string };
  }): Promise<IDocumentRecordDocument> {
    const sha256Hash = await this.computeFileHash(params.file.path);

    const docRecord = await DocumentRecord.create({
      citizenId: new mongoose.Types.ObjectId(params.citizenId),
      applicationId: params.applicationId ? new mongoose.Types.ObjectId(params.applicationId) : undefined,
      fileName: params.file.filename,
      originalName: params.file.originalname,
      mimeType: params.file.mimetype,
      sizeBytes: params.file.size,
      storagePath: params.file.path,
      sha256Hash,
      scanStatus: DocumentScanStatus.CLEAN,
      verificationStatus: DocumentVerificationStatus.VERIFIED,
      metadata: {
        documentType: params.documentType || 'GENERAL_DOCUMENT',
        uploadedAt: new Date().toISOString(),
        ...(params.metadata || {}),
      },
    });

    await AuditService.logEvent({
      actorId: params.actorUser?.userId || params.citizenId,
      actorName: params.actorUser?.name || 'Citizen',
      action: AuditAction.DOCUMENT_UPLOADED,
      resourceType: 'DocumentRecord',
      resourceId: docRecord._id.toString(),
      details: {
        fileName: params.file.originalname,
        sha256Hash,
        fileSize: params.file.size,
      },
    });

    return docRecord;
  }

  /**
   * Get all verified documents for a citizen vault
   */
  static async getCitizenDocuments(citizenId: string | mongoose.Types.ObjectId) {
    return DocumentRecord.find({ citizenId: new mongoose.Types.ObjectId(citizenId) })
      .sort({ createdAt: -1 })
      .lean();
  }

  /**
   * Get document file path for download
   */
  static async getDocumentForDownload(documentId: string, citizenId?: string) {
    const filter: any = { _id: new mongoose.Types.ObjectId(documentId) };
    if (citizenId) {
      filter.citizenId = new mongoose.Types.ObjectId(citizenId);
    }
    const doc = await DocumentRecord.findOne(filter);
    if (!doc || !fs.existsSync(doc.storagePath)) {
      throw new ApiError(404, 'Document not found on storage');
    }
    return doc;
  }
}
