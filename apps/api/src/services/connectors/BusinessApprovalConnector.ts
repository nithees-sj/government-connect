import { BaseConnector } from './BaseConnector.js';
import { config } from '../../config/index.js';
import { TransformationService } from '../transformation.service.js';

export interface BusinessRegistrationRequest {
  enterpriseName: string;
  sectorType?: string;
  directorIdentityToken?: string;
  authorizedCapitalInr?: number;
  correlationId?: string;
}

export interface BusinessRegistrationResponse {
  isRegistered: boolean;
  acknowledgementNo: string;
  cin: string;
  industrySector: string;
  deskQueue: string;
  canonicalBusinessRecord: Record<string, any>;
  rawResponse: any;
}

export class BusinessApprovalConnector extends BaseConnector {
  readonly code = 'DEPT_C_COMMERCE';
  readonly name = 'Department of Business & Commerce (MCA / Commercial Registry)';
  readonly baseUrl = config.departments.c || 'http://localhost:9003';

  /**
   * Submit business incorporation and clearance request to MCA Dept C
   */
  async submitRegistration(
    params: BusinessRegistrationRequest,
  ): Promise<BusinessRegistrationResponse> {
    const payload = {
      enterpriseName: params.enterpriseName,
      sectorType: params.sectorType || 'Information Technology Services',
      directorIdentityToken: params.directorIdentityToken,
      authorizedCapitalInr: params.authorizedCapitalInr || 1000000,
    };

    const rawResponse = await this.request<any>('/register', {
      method: 'POST',
      body: payload,
      correlationId: params.correlationId,
      timeoutMs: 8000,
    });

    const isRegistered = rawResponse.incorporation_status === 'STAGE_1_CLEARANCE_ACCEPTED';
    const canonicalBusinessRecord = TransformationService.toCanonicalBusinessApplication({
      companyName: rawResponse.approved_trade_name,
      registrationNumber: rawResponse.corporate_identification_number,
      businessType: 'PRIVATE_LIMITED',
      licenseCategory: rawResponse.industry_sector,
      approvalStatus: isRegistered ? 'APPROVED' : 'PENDING',
      complianceScore: 95,
    });

    return {
      isRegistered,
      acknowledgementNo: rawResponse.filing_acknowledgement,
      cin: rawResponse.corporate_identification_number,
      industrySector: rawResponse.industry_sector,
      deskQueue: rawResponse.officer_desk_queue,
      canonicalBusinessRecord,
      rawResponse,
    };
  }
}
