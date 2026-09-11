import { z } from 'zod';
import { ServiceType, UserRole, ConsentStatus, ApplicationStatus } from '@govconnect/shared-types';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.nativeEnum(UserRole).optional(),
  phone: z.string().optional(),
  dob: z.string().optional(),
  aadhaarNumber: z.string().optional(),
  panNumber: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const createApplicationSchema = z.object({
  type: z.nativeEnum(ServiceType),
  departmentId: z.string().optional(),
  formData: z.record(z.any()),
  correlationId: z.string().optional(),
});

export const addNoteSchema = z.object({
  text: z.string().min(1, 'Note text cannot be empty').max(2000),
});

export const adjudicateWorkflowSchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT']),
  remarks: z.string().optional(),
  rejectionReason: z.string().optional(),
});

export const grantConsentSchema = z.object({
  departmentId: z.string().min(1, 'Department ID is required'),
  purpose: z.string().min(3, 'Purpose is required'),
  dataFields: z.array(z.string()).min(1, 'At least one data field is required'),
  validDays: z.number().int().positive().optional().default(365),
});

export const testTransformationSchema = z.object({
  rules: z.array(
    z.object({
      sourceField: z.string(),
      targetField: z.string(),
      transformationType: z.enum([
        'DIRECT',
        'UPPERCASE',
        'LOWERCASE',
        'TRIM',
        'DATE_FORMAT',
        'PHONE_NORMALIZE',
        'MASK_AADHAAR',
        'MASK_PAN',
        'BOOLEAN_CAST',
        'NUMBER_CAST',
        'CUSTOM',
      ]).optional(),
      defaultValue: z.any().optional(),
      required: z.boolean().optional(),
    }),
  ),
  samplePayload: z.record(z.any()),
});

export const createSchemaMappingSchema = z.object({
  sourceSystem: z.string().min(1),
  targetSystem: z.string().min(1),
  version: z.string().default('v1.0.0'),
  fieldMappings: z.array(
    z.object({
      sourceField: z.string(),
      targetField: z.string(),
      transformationType: z.string().default('DIRECT'),
      defaultValue: z.any().optional(),
      isRequired: z.boolean().default(false),
    }),
  ),
});

export const aiSuggestMappingSchema = z.object({
  sourceFields: z.array(z.string()).min(1),
  targetFields: z.array(z.string()).min(1),
  sourceSystem: z.string().optional(),
  targetSystem: z.string().optional(),
});

export const aiDetectDuplicatesSchema = z.object({
  formData: z.record(z.any()),
});

export const aiSmartRoutingSchema = z.object({
  type: z.string(),
  hasIdentityProof: z.boolean().optional(),
  hasTaxCompliance: z.boolean().optional(),
  businessCapital: z.number().optional(),
});

export const aiMonitoringQuerySchema = z.object({
  query: z.string().min(3, 'Query must be at least 3 characters'),
});
