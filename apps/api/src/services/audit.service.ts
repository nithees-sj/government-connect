import crypto from 'crypto';
import mongoose from 'mongoose';
import { AuditEvent, type IAuditEventDocument } from '../models/AuditEvent.js';
import { AuditAction, UserRole } from '@govconnect/shared-types';
import { logger } from '../utils/logger.js';

export interface CreateAuditParams {
  actorId?: string | mongoose.Types.ObjectId;
  actorName?: string;
  actorRole?: UserRole | 'SYSTEM';
  action: AuditAction;
  resourceType: string;
  resourceId?: string;
  correlationId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
}

export interface AuditQueryFilter {
  actorId?: string;
  action?: AuditAction;
  resourceType?: string;
  resourceId?: string;
  correlationId?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  page?: number;
  limit?: number;
}

function calculateHash(data: {
  sequenceNumber: number;
  previousHash: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  actorRole?: string;
  timestamp: string;
  details: any;
}): string {
  const content = JSON.stringify(data);
  return crypto.createHash('sha256').update(content).digest('hex');
}

export class AuditService {
  /**
   * Log an audit event with SHA-256 hash chaining
   */
  static async logEvent(params: CreateAuditParams): Promise<IAuditEventDocument> {
    try {
      const lastEvent = await AuditEvent.findOne()
        .sort({ sequenceNumber: -1 })
        .lean();

      const sequenceNumber = lastEvent && typeof lastEvent.sequenceNumber === 'number'
        ? lastEvent.sequenceNumber + 1
        : 1;

      const previousHash = lastEvent?.currentHash || 'GENESIS_BLOCK_GOV_CONNECT_2026';
      const timestamp = new Date();

      const hashData = {
        sequenceNumber,
        previousHash,
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        actorRole: params.actorRole || 'SYSTEM',
        timestamp: timestamp.toISOString(),
        details: params.details || {},
      };

      const currentHash = calculateHash(hashData);

      const event = await AuditEvent.create({
        actorId: params.actorId,
        actorName: params.actorName || 'System',
        actorRole: params.actorRole || 'SYSTEM',
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        correlationId: params.correlationId,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        details: params.details || {},
        sequenceNumber,
        previousHash,
        currentHash,
        timestamp,
      });

      return event;
    } catch (error: any) {
      logger.error('Failed to create audit log event:', error);
      throw error;
    }
  }

  /**
   * Query audit logs with pagination & filtering
   */
  static async queryLogs(filter: AuditQueryFilter) {
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filter.limit) || 20));
    const skip = (page - 1) * limit;

    const query: mongoose.FilterQuery<IAuditEventDocument> = {};

    if (filter.actorId) {
      query.actorId = new mongoose.Types.ObjectId(filter.actorId);
    }
    if (filter.action) {
      query.action = filter.action;
    }
    if (filter.resourceType) {
      query.resourceType = filter.resourceType;
    }
    if (filter.resourceId) {
      query.resourceId = filter.resourceId;
    }
    if (filter.correlationId) {
      query.correlationId = filter.correlationId;
    }

    if (filter.startDate || filter.endDate) {
      query.timestamp = {};
      if (filter.startDate) {
        query.timestamp.$gte = new Date(filter.startDate);
      }
      if (filter.endDate) {
        query.timestamp.$lte = new Date(filter.endDate);
      }
    }

    const [events, total] = await Promise.all([
      AuditEvent.find(query)
        .sort({ timestamp: -1, sequenceNumber: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditEvent.countDocuments(query),
    ]);

    return {
      events,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Verify the integrity of the SHA-256 audit hash chain
   */
  static async verifyChainIntegrity(limit: number = 500): Promise<{
    isValid: boolean;
    checkedCount: number;
    brokenAtSequence?: number;
    details?: string;
  }> {
    const events = await AuditEvent.find()
      .sort({ sequenceNumber: 1 })
      .limit(limit)
      .lean();

    if (events.length === 0) {
      return { isValid: true, checkedCount: 0 };
    }

    let previousHash = 'GENESIS_BLOCK_GOV_CONNECT_2026';

    for (let i = 0; i < events.length; i++) {
      const event = events[i];

      if (event.previousHash !== previousHash && i > 0) {
        return {
          isValid: false,
          checkedCount: i,
          brokenAtSequence: event.sequenceNumber,
          details: `Previous hash mismatch at sequence ${event.sequenceNumber}. Expected ${previousHash}, got ${event.previousHash}`,
        };
      }

      const expectedHash = calculateHash({
        sequenceNumber: event.sequenceNumber || i + 1,
        previousHash: event.previousHash || previousHash,
        action: event.action,
        resourceType: event.resourceType,
        resourceId: event.resourceId,
        actorRole: event.actorRole,
        timestamp: new Date(event.timestamp).toISOString(),
        details: event.details || {},
      });

      if (event.currentHash && event.currentHash !== expectedHash) {
        return {
          isValid: false,
          checkedCount: i + 1,
          brokenAtSequence: event.sequenceNumber,
          details: `Current hash mismatch at sequence ${event.sequenceNumber}. Record data may have been altered.`,
        };
      }

      previousHash = event.currentHash || expectedHash;
    }

    return {
      isValid: true,
      checkedCount: events.length,
    };
  }
}
