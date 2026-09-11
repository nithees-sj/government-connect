import { SchemaMapping, type ISchemaMappingDocument } from '../models/SchemaMapping.js';
import { logger } from '../utils/logger.js';
import { ApiError } from '../middleware/errorHandler.js';

export interface FieldTransformationRule {
  sourceField: string;
  targetField: string;
  transformationType?: 'DIRECT' | 'UPPERCASE' | 'LOWERCASE' | 'TRIM' | 'DATE_FORMAT' | 'PHONE_NORMALIZE' | 'MASK_AADHAAR' | 'MASK_PAN' | 'BOOLEAN_CAST' | 'NUMBER_CAST' | 'CUSTOM';
  defaultValue?: any;
  customFormula?: string;
  required?: boolean;
}

export class TransformationService {
  /**
   * Helper to get a nested value from an object using a dot-path (e.g. 'applicant.details.name')
   */
  static getNestedValue(obj: any, path: string): any {
    if (!obj || !path) return undefined;
    const parts = path.split('.');
    let current = obj;
    for (const part of parts) {
      if (current === null || current === undefined) return undefined;
      current = current[part];
    }
    return current;
  }

  /**
   * Helper to set a nested value into an object using a dot-path
   */
  static setNestedValue(obj: any, path: string, value: any): void {
    if (!obj || !path) return;
    const parts = path.split('.');
    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in current) || typeof current[part] !== 'object' || current[part] === null) {
        current[part] = {};
      }
      current = current[part];
    }
    current[parts[parts.length - 1]] = value;
  }

  /**
   * Transform a single field value based on its transformation rule
   */
  static transformFieldValue(val: any, rule: FieldTransformationRule): any {
    if (val === undefined || val === null || val === '') {
      return rule.defaultValue !== undefined ? rule.defaultValue : undefined;
    }

    switch (rule.transformationType) {
      case 'UPPERCASE':
        return String(val).toUpperCase();

      case 'LOWERCASE':
        return String(val).toLowerCase();

      case 'TRIM':
        return String(val).trim();

      case 'DATE_FORMAT': {
        const d = new Date(val);
        if (!isNaN(d.getTime())) {
          return d.toISOString().split('T')[0]; // YYYY-MM-DD
        }
        // Handle DD/MM/YYYY or DD-MM-YYYY
        const match = String(val).match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
        if (match) {
          const [, day, month, year] = match;
          return `${year}-${month}-${day}`;
        }
        return val;
      }

      case 'PHONE_NORMALIZE': {
        // Strip everything except digits, strip leading 91 or +91 if 12 digits
        const cleaned = String(val).replace(/\D/g, '');
        if (cleaned.length === 12 && cleaned.startsWith('91')) {
          return cleaned.slice(2);
        }
        if (cleaned.length === 11 && cleaned.startsWith('0')) {
          return cleaned.slice(1);
        }
        return cleaned;
      }

      case 'MASK_AADHAAR': {
        const cleaned = String(val).replace(/\D/g, '');
        if (cleaned.length >= 12) {
          return `XXXXXXXX${cleaned.slice(-4)}`;
        }
        return val;
      }

      case 'MASK_PAN': {
        const str = String(val).trim().toUpperCase();
        if (str.length === 10) {
          return `${str.slice(0, 2)}XXXXX${str.slice(-3)}`;
        }
        return str;
      }

      case 'BOOLEAN_CAST': {
        const str = String(val).toLowerCase().trim();
        return str === 'true' || str === '1' || str === 'yes' || str === 'y' || str === 'active';
      }

      case 'NUMBER_CAST': {
        const num = Number(val);
        return isNaN(num) ? rule.defaultValue || 0 : num;
      }

      case 'CUSTOM':
      case 'DIRECT':
      default:
        return val;
    }
  }

  /**
   * Execute transformation using a list of rules
   */
  static transformObject(sourceData: any, rules: FieldTransformationRule[]): Record<string, any> {
    const result: Record<string, any> = {};

    for (const rule of rules) {
      const rawVal = this.getNestedValue(sourceData, rule.sourceField);
      const transformedVal = this.transformFieldValue(rawVal, rule);

      if (rule.required && (transformedVal === undefined || transformedVal === null || transformedVal === '')) {
        throw new ApiError(
          422,
          `Transformation validation error: Required target field '${rule.targetField}' could not be resolved from source '${rule.sourceField}'`,
        );
      }

      if (transformedVal !== undefined) {
        this.setNestedValue(result, rule.targetField, transformedVal);
      }
    }

    return result;
  }

  /**
   * Transform data using a named schema mapping from the database
   */
  static async transformByMapping(
    sourceSystem: string,
    targetSystem: string,
    version: string,
    payload: any,
  ): Promise<{ transformedData: Record<string, any>; mappingVersion: string; mappingId: string }> {
    const mapping = await SchemaMapping.findOne({
      sourceSystem,
      targetSystem,
      isActive: true,
    }).sort({ version: -1 });

    if (!mapping) {
      logger.warn(
        `No explicit schema mapping found for ${sourceSystem} -> ${targetSystem}. Applying direct canonical passthrough.`,
      );
      return {
        transformedData: payload,
        mappingVersion: 'direct-passthrough',
        mappingId: 'none',
      };
    }

    const rules: FieldTransformationRule[] = mapping.fieldMappings.map((m) => ({
      sourceField: m.sourceField,
      targetField: m.targetField,
      transformationType: (m.transformationType as any) || 'DIRECT',
      defaultValue: m.defaultValue,
      required: m.isRequired,
    }));

    const transformedData = this.transformObject(payload, rules);
    return {
      transformedData,
      mappingVersion: mapping.version,
      mappingId: mapping._id.toString(),
    };
  }

  /**
   * Canonical Mappings for SIH Mock Departments
   */
  static toCanonicalCitizen(rawDeptAData: any): Record<string, any> {
    const rules: FieldTransformationRule[] = [
      { sourceField: 'aadhaarNumber', targetField: 'identity.aadhaarNumber', transformationType: 'DIRECT' },
      { sourceField: 'fullName', targetField: 'personal.fullName', transformationType: 'UPPERCASE' },
      { sourceField: 'dob', targetField: 'personal.dob', transformationType: 'DATE_FORMAT' },
      { sourceField: 'gender', targetField: 'personal.gender', transformationType: 'UPPERCASE' },
      { sourceField: 'phone', targetField: 'contact.mobileNumber', transformationType: 'PHONE_NORMALIZE' },
      { sourceField: 'email', targetField: 'contact.email', transformationType: 'LOWERCASE' },
      { sourceField: 'address.street', targetField: 'address.line1', transformationType: 'DIRECT' },
      { sourceField: 'address.city', targetField: 'address.city', transformationType: 'DIRECT' },
      { sourceField: 'address.state', targetField: 'address.state', transformationType: 'DIRECT' },
      { sourceField: 'address.pincode', targetField: 'address.pincode', transformationType: 'DIRECT' },
      { sourceField: 'isVerified', targetField: 'verification.identityVerified', transformationType: 'BOOLEAN_CAST' },
      { sourceField: 'verificationTimestamp', targetField: 'verification.timestamp', transformationType: 'DIRECT' },
    ];
    return this.transformObject(rawDeptAData, rules);
  }

  static toCanonicalTaxProfile(rawDeptBData: any): Record<string, any> {
    const rules: FieldTransformationRule[] = [
      { sourceField: 'pan', targetField: 'tax.panNumber', transformationType: 'UPPERCASE' },
      { sourceField: 'taxpayerName', targetField: 'tax.taxpayerName', transformationType: 'DIRECT' },
      { sourceField: 'taxStatus', targetField: 'tax.status', transformationType: 'UPPERCASE' },
      { sourceField: 'annualIncome', targetField: 'tax.annualIncome', transformationType: 'NUMBER_CAST' },
      { sourceField: 'taxClearanceCertificate', targetField: 'tax.clearanceCertificateNumber', transformationType: 'DIRECT' },
      { sourceField: 'gstin', targetField: 'tax.gstin', transformationType: 'UPPERCASE' },
      { sourceField: 'gstStatus', targetField: 'tax.gstStatus', transformationType: 'UPPERCASE' },
      { sourceField: 'isCompliant', targetField: 'verification.taxCompliant', transformationType: 'BOOLEAN_CAST' },
    ];
    return this.transformObject(rawDeptBData, rules);
  }

  static toCanonicalBusinessApplication(rawDeptCData: any): Record<string, any> {
    const rules: FieldTransformationRule[] = [
      { sourceField: 'companyName', targetField: 'business.legalEntityName', transformationType: 'UPPERCASE' },
      { sourceField: 'registrationNumber', targetField: 'business.cinOrRegNo', transformationType: 'UPPERCASE' },
      { sourceField: 'businessType', targetField: 'business.structureType', transformationType: 'UPPERCASE' },
      { sourceField: 'licenseCategory', targetField: 'business.licenseType', transformationType: 'DIRECT' },
      { sourceField: 'approvalStatus', targetField: 'business.status', transformationType: 'UPPERCASE' },
      { sourceField: 'complianceScore', targetField: 'business.riskScore', transformationType: 'NUMBER_CAST' },
    ];
    return this.transformObject(rawDeptCData, rules);
  }
}
