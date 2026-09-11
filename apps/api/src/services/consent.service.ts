import crypto from 'crypto';
import mongoose from 'mongoose';
import { Consent, type IConsentDocument } from '../models/Consent.js';
import { Citizen } from '../models/Citizen.js';
import { Department } from '../models/Department.js';
import { ConsentStatus, AuditAction } from '@govconnect/shared-types';
import { AuditService } from './audit.service.js';
import { ApiError } from '../middleware/errorHandler.js';

export class ConsentService {
  /**
   * Grant a DPDP-compliant consent token
   */
  static async grantConsent(params: {
    citizenId: string | mongoose.Types.ObjectId;
    departmentId: string | mongoose.Types.ObjectId;
    purpose: string;
    dataFields: string[];
    validDays?: number;
    actorUser?: { userId?: string; name?: string };
  }): Promise<IConsentDocument> {
    const validDays = params.validDays || 365;
    const expiresAt = new Date(Date.now() + validDays * 24 * 60 * 60 * 1000);
    const token = `DPDP-TKN-${crypto.randomBytes(16).toString('hex').toUpperCase()}`;

    const consent = await Consent.create({
      token,
      citizenId: new mongoose.Types.ObjectId(params.citizenId),
      departmentId: new mongoose.Types.ObjectId(params.departmentId),
      purpose: params.purpose,
      dataFields: params.dataFields,
      version: 'v1.0-DPDP-2023',
      status: ConsentStatus.GRANTED,
      grantedAt: new Date(),
      expiresAt,
    });

    await AuditService.logEvent({
      actorId: params.actorUser?.userId || params.citizenId,
      actorName: params.actorUser?.name || 'Citizen',
      action: AuditAction.CONSENT_GRANTED,
      resourceType: 'Consent',
      resourceId: token,
      details: {
        departmentId: params.departmentId,
        purpose: params.purpose,
        dataFields: params.dataFields,
        expiresAt,
      },
    });

    return consent;
  }

  /**
   * Revoke an active consent token
   */
  static async revokeConsent(
    consentId: string,
    citizenId: string | mongoose.Types.ObjectId,
    actorUser?: { userId?: string; name?: string },
  ): Promise<IConsentDocument> {
    const consent = await Consent.findOne({
      _id: new mongoose.Types.ObjectId(consentId),
      citizenId: new mongoose.Types.ObjectId(citizenId),
    });

    if (!consent) {
      throw new ApiError(404, 'Consent record not found or unauthorized');
    }

    if (consent.status === ConsentStatus.REVOKED) {
      return consent;
    }

    consent.status = ConsentStatus.REVOKED;
    consent.revokedAt = new Date();
    await consent.save();

    await AuditService.logEvent({
      actorId: actorUser?.userId || citizenId,
      actorName: actorUser?.name || 'Citizen',
      action: AuditAction.CONSENT_REVOKED,
      resourceType: 'Consent',
      resourceId: consent.token,
      details: {
        departmentId: consent.departmentId,
        revokedAt: consent.revokedAt,
      },
    });

    return consent;
  }

  /**
   * Get all consents for a citizen with populated department info
   */
  static async getCitizenConsents(citizenId: string | mongoose.Types.ObjectId) {
    return Consent.find({ citizenId: new mongoose.Types.ObjectId(citizenId) })
      .populate('departmentId', 'name code description')
      .sort({ createdAt: -1 })
      .lean();
  }

  /**
   * Verify if active consent exists for data exchange
   */
  static async isConsentActive(
    citizenId: string | mongoose.Types.ObjectId,
    departmentId: string | mongoose.Types.ObjectId,
  ): Promise<boolean> {
    const count = await Consent.countDocuments({
      citizenId: new mongoose.Types.ObjectId(citizenId),
      departmentId: new mongoose.Types.ObjectId(departmentId),
      status: ConsentStatus.GRANTED,
      expiresAt: { $gt: new Date() },
    });
    return count > 0;
  }
}
