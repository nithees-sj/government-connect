import { BaseConnector } from './BaseConnector.js';
import { config } from '../../config/index.js';
import { TransformationService } from '../transformation.service.js';

export interface TaxVerifyRequest {
  applicantName: string;
  panNumber: string;
  assessmentYear?: string;
  correlationId?: string;
}

export interface TaxVerifyResponse {
  isCleared: boolean;
  clearanceCertificateNumber: string;
  complianceRating: string;
  outstandingDues: number;
  canonicalTaxRecord: Record<string, any>;
  rawResponse: any;
}

export class TaxConnector extends BaseConnector {
  readonly code = 'DEPT_B_TAX';
  readonly name = 'Department of Revenue & Tax (CBDT / GSTN)';
  readonly baseUrl = config.departments.b || 'http://localhost:9002';

  /**
   * Perform direct PAN and Tax clearance verification against CBDT Dept B
   */
  async verifyTaxClearance(params: TaxVerifyRequest): Promise<TaxVerifyResponse> {
    const payload = {
      applicantName: params.applicantName,
      panNumber: params.panNumber,
      assessmentYear: params.assessmentYear || '2025-2026',
    };

    const rawResponse = await this.request<any>('/verify', {
      method: 'POST',
      body: payload,
      correlationId: params.correlationId,
      timeoutMs: 8000,
    });

    const isCleared = rawResponse.clearance_status === 'CLEARED';
    const canonicalTaxRecord = TransformationService.toCanonicalTaxProfile({
      pan: rawResponse.taxpayer_id,
      taxpayerName: rawResponse.legal_entity_name,
      taxStatus: isCleared ? 'COMPLIANT' : 'NON_COMPLIANT',
      annualIncome: 1200000,
      taxClearanceCertificate: rawResponse.clearance_certificate_number,
      gstin: '07AAAAA0000A1Z5',
      gstStatus: 'ACTIVE',
      isCompliant: isCleared,
    });

    return {
      isCleared,
      clearanceCertificateNumber: rawResponse.clearance_certificate_number,
      complianceRating: rawResponse.tax_compliance_rating,
      outstandingDues: rawResponse.outstanding_dues_amount || 0,
      canonicalTaxRecord,
      rawResponse,
    };
  }
}
