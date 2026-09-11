import { BaseConnector } from './BaseConnector.js';
import { config } from '../../config/index.js';
import { TransformationService } from '../transformation.service.js';

export interface IdentityVerifyRequest {
  citizenName: string;
  dob?: string;
  mobileNumber?: string;
  aadhaarNumber?: string;
  correlationId?: string;
}

export interface IdentityVerifyResponse {
  isVerified: boolean;
  verificationRef: string;
  citizenName: string;
  assuranceLevel: string;
  canonicalProfile: Record<string, any>;
  rawResponse: any;
}

export class IdentityConnector extends BaseConnector {
  readonly code = 'DEPT_A_IDENTITY';
  readonly name = 'Department of Identity Verification (UIDAI / DigiLocker)';
  readonly baseUrl = config.departments.a || 'http://localhost:9001';

  /**
   * Perform cryptographic identity verification against UIDAI/DigiLocker Dept A
   */
  async verifyIdentity(params: IdentityVerifyRequest): Promise<IdentityVerifyResponse> {
    // Transform to Dept A legacy request schema
    const payload = {
      citizen_name: params.citizenName,
      dob: params.dob,
      mobile_number: params.mobileNumber,
      aadhaar_ref: params.aadhaarNumber,
    };

    const rawResponse = await this.request<any>('/verify', {
      method: 'POST',
      body: payload,
      correlationId: params.correlationId,
      timeoutMs: 8000,
    });

    const isVerified = rawResponse.verification_status === 'VERIFIED';
    const canonicalProfile = TransformationService.toCanonicalCitizen({
      aadhaarNumber: params.aadhaarNumber,
      fullName: rawResponse.citizen_full_name,
      dob: rawResponse.date_of_birth_iso,
      phone: rawResponse.phone_contact,
      isVerified,
      verificationTimestamp: rawResponse.verified_at,
    });

    return {
      isVerified,
      verificationRef: rawResponse.verification_reference,
      citizenName: rawResponse.citizen_full_name,
      assuranceLevel: rawResponse.assurance_level,
      canonicalProfile,
      rawResponse,
    };
  }
}
