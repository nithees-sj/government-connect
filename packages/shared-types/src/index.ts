// ─── User Roles ──────────────────────────────────────────
export enum UserRole {
  CITIZEN = 'CITIZEN',
  DEPT_OFFICER = 'DEPT_OFFICER',
  DEPT_ADMIN = 'DEPT_ADMIN',
  PLATFORM_ADMIN = 'PLATFORM_ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

// Role hierarchy (higher index = more privileged)
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.CITIZEN]: 0,
  [UserRole.DEPT_OFFICER]: 1,
  [UserRole.DEPT_ADMIN]: 2,
  [UserRole.PLATFORM_ADMIN]: 3,
  [UserRole.SUPER_ADMIN]: 4,
};

// ─── Application Status ─────────────────────────────────
export enum ApplicationStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  IN_REVIEW = 'IN_REVIEW',
  IDENTITY_VERIFICATION = 'IDENTITY_VERIFICATION',
  TAX_VERIFICATION = 'TAX_VERIFICATION',
  DEPARTMENT_REVIEW = 'DEPARTMENT_REVIEW',
  FINAL_APPROVAL = 'FINAL_APPROVAL',
  COMPLETED = 'COMPLETED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

// ─── Workflow Step Status ───────────────────────────────
export enum WorkflowStepStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
  FAILED = 'FAILED',
  RETRYING = 'RETRYING',
  CANCELLED = 'CANCELLED',
  SKIPPED = 'SKIPPED',
}

// ─── Circuit Breaker States ─────────────────────────────
export enum CircuitBreakerState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

// ─── Connector Status ───────────────────────────────────
export enum ConnectorStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DEGRADED = 'DEGRADED',
  FAILED = 'FAILED',
}

// ─── Department Status ──────────────────────────────────
export enum DepartmentStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  MAINTENANCE = 'MAINTENANCE',
}

// ─── Notification Type ──────────────────────────────────
export enum NotificationType {
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  ACTION = 'ACTION',
}

// ─── Consent Status ─────────────────────────────────────
export enum ConsentStatus {
  GRANTED = 'GRANTED',
  REVOKED = 'REVOKED',
  EXPIRED = 'EXPIRED',
}

// ─── Document Verification Status ───────────────────────
export enum DocumentScanStatus {
  PENDING = 'PENDING',
  SCANNING = 'SCANNING',
  CLEAN = 'CLEAN',
  INFECTED = 'INFECTED',
}

export enum DocumentVerificationStatus {
  UNVERIFIED = 'UNVERIFIED',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

// ─── Audit Actions ──────────────────────────────────────
export enum AuditAction {
  USER_LOGIN = 'USER_LOGIN',
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  USER_LOGOUT = 'USER_LOGOUT',
  LOGOUT = 'LOGOUT',
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  APPLICATION_CREATED = 'APPLICATION_CREATED',
  APPLICATION_VIEWED = 'APPLICATION_VIEWED',
  APPLICATION_UPDATED = 'APPLICATION_UPDATED',
  APPLICATION_SUBMITTED = 'APPLICATION_SUBMITTED',
  APPLICATION_APPROVED = 'APPLICATION_APPROVED',
  APPLICATION_REJECTED = 'APPLICATION_REJECTED',
  WORKFLOW_TRANSITION = 'WORKFLOW_TRANSITION',
  WORKFLOW_STEP_COMPLETED = 'WORKFLOW_STEP_COMPLETED',
  WORKFLOW_STEP_FAILED = 'WORKFLOW_STEP_FAILED',
  INTEROPERABILITY_CALL_COMPLETED = 'INTEROPERABILITY_CALL_COMPLETED',
  INTEROPERABILITY_CALL_FAILED = 'INTEROPERABILITY_CALL_FAILED',
  DATA_ACCESSED = 'DATA_ACCESSED',
  DATA_TRANSFORMED = 'DATA_TRANSFORMED',
  CONNECTOR_INVOKED = 'CONNECTOR_INVOKED',
  CONNECTOR_UPDATED = 'CONNECTOR_UPDATED',
  CONNECTOR_TESTED = 'CONNECTOR_TESTED',
  CIRCUIT_BREAKER_STATE_CHANGE = 'CIRCUIT_BREAKER_STATE_CHANGE',
  CIRCUIT_BREAKER_RESET = 'CIRCUIT_BREAKER_RESET',
  SCHEMA_MAPPING_CREATED = 'SCHEMA_MAPPING_CREATED',
  SYSTEM_CONFIG_UPDATED = 'SYSTEM_CONFIG_UPDATED',
  CONSENT_GRANTED = 'CONSENT_GRANTED',
  CONSENT_REVOKED = 'CONSENT_REVOKED',
  DOCUMENT_UPLOADED = 'DOCUMENT_UPLOADED',
  DOCUMENT_VERIFIED = 'DOCUMENT_VERIFIED',
  AI_SUGGESTION_ACCEPTED = 'AI_SUGGESTION_ACCEPTED',
  INTEGRATION_FAILURE = 'INTEGRATION_FAILURE',
}

// ─── Service Types ──────────────────────────────────────
export enum ServiceType {
  BUSINESS_APPROVAL = 'BUSINESS_APPROVAL',
  TRADE_LICENSE = 'TRADE_LICENSE',
  BUILDING_PERMIT = 'BUILDING_PERMIT',
  TAX_CLEARANCE = 'TAX_CLEARANCE',
  PROPERTY_CERTIFICATE = 'PROPERTY_CERTIFICATE',
  IDENTITY_VERIFICATION = 'IDENTITY_VERIFICATION',
  LAND_REGISTRATION = 'LAND_REGISTRATION',
  CERTIFICATE_ISSUANCE = 'CERTIFICATE_ISSUANCE',
}

// ─── Mock Department Modes ──────────────────────────────
export enum DepartmentMode {
  NORMAL = 'NORMAL',
  SLOW = 'SLOW',
  TIMEOUT = 'TIMEOUT',
  FAILURE = 'FAILURE',
  MALFORMED_RESPONSE = 'MALFORMED_RESPONSE',
  DUPLICATE_EVENT = 'DUPLICATE_EVENT',
}

// ─── API Response Types ─────────────────────────────────
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
  meta?: Record<string, unknown>;
  pagination?: PaginationInfo;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

// ─── Auth Types ─────────────────────────────────────────
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
  phone?: string;
  dateOfBirth?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  name: string;
}

// ─── Domain Entities ────────────────────────────────────

export interface IUser {
  _id?: string;
  id?: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string | any;
  isActive: boolean;
  isLocked?: boolean;
  loginAttempts?: number;
  lastLogin?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICitizen {
  _id?: string;
  id?: string;
  userId: string | any;
  fullName: string;
  dateOfBirth: Date | string;
  aadhaarNumber?: string;
  panNumber?: string;
  contact: {
    email: string;
    phone: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  isIdentityVerified?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IDepartment {
  _id?: string;
  id?: string;
  name: string;
  code: string;
  description?: string;
  apiEndpoint?: string;
  services?: ServiceType[];
  contactEmail?: string;
  slaHours?: number;
  status?: DepartmentStatus;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IApplication {
  _id?: string;
  id?: string;
  applicationId: string;
  citizenId: string | any;
  departmentId: string | any;
  type: ServiceType;
  status: ApplicationStatus;
  currentStep?: string;
  formData: Record<string, any>;
  workflowInstanceId?: string | any;
  correlationId?: string;
  notes?: {
    author: string;
    role: UserRole;
    text: string;
    createdAt: Date;
  }[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IWorkflowStep {
  name: string;
  type: string;
  order: number;
  requiredRole?: UserRole;
  connectorCode?: string;
  isAutomated?: boolean;
}

export interface IWorkflow {
  _id?: string;
  id?: string;
  name: string;
  serviceType: ServiceType;
  departmentId: string | any;
  steps: IWorkflowStep[];
  status: 'ACTIVE' | 'DRAFT' | 'INACTIVE';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IStepExecution {
  stepName: string;
  stepType: string;
  order: number;
  status: WorkflowStepStatus;
  startedAt?: Date;
  completedAt?: Date;
  outputData?: Record<string, any>;
  errorMessage?: string;
  retryCount: number;
  requiredRole?: UserRole;
  performedBy?: string;
}

export interface IWorkflowInstance {
  _id?: string;
  id?: string;
  applicationId: string | any;
  workflowId: string | any;
  currentStepIndex: number;
  status: WorkflowStepStatus;
  steps: IStepExecution[];
  correlationId: string;
  startedAt: Date;
  completedAt?: Date;
}

export interface IConnector {
  _id?: string;
  id?: string;
  name: string;
  code: string;
  type?: 'REST' | 'SOAP' | 'GRAPHQL' | 'GRPC';
  departmentId: string | any;
  baseUrl: string;
  healthEndpoint?: string;
  authType?: 'NONE' | 'API_KEY' | 'BEARER' | 'MTLS';
  timeoutMs?: number;
  maxRetries?: number;
  circuitState?: CircuitBreakerState;
  metrics?: {
    totalRequests?: number;
    successfulRequests?: number;
    failedRequests?: number;
    averageLatencyMs?: number;
    lastSuccess?: Date;
    lastFailure?: Date;
    lastErrorMessage?: string;
  };
  isActive?: boolean;
  status?: ConnectorStatus;
  latencyMs?: number;
  lastChecked?: Date;
}

export interface IFieldMapping {
  sourceField: string;
  targetField: string;
  transformationType: 'DIRECT' | 'UPPERCASE' | 'LOWERCASE' | 'TRIM' | 'DATE_FORMAT' | 'PHONE_NORMALIZE' | 'MASK_AADHAAR' | 'MASK_PAN' | 'BOOLEAN_CAST' | 'NUMBER_CAST' | 'CUSTOM' | string;
  defaultValue?: any;
  isRequired?: boolean;
}

export interface ISchemaMapping {
  _id?: string;
  id?: string;
  name: string;
  sourceSystem: string;
  targetSystem: string;
  version: string;
  fieldMappings: IFieldMapping[];
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IConsent {
  _id?: string;
  id?: string;
  token: string;
  citizenId: string | any;
  departmentId: string | any;
  purpose: string;
  dataFields: string[];
  version: string;
  status: ConsentStatus;
  grantedAt: Date;
  expiresAt: Date;
  revokedAt?: Date;
}

export interface IDocumentRecord {
  _id?: string;
  id?: string;
  citizenId: string | any;
  applicationId?: string | any;
  fileName: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  sha256Hash: string;
  scanStatus: DocumentScanStatus;
  verificationStatus: DocumentVerificationStatus;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface INotification {
  _id?: string;
  id?: string;
  recipientId: string | any;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt?: Date;
}

export interface IAuditEvent {
  _id?: string;
  id?: string;
  actorId?: string | any;
  actorName?: string;
  actorRole?: UserRole | 'SYSTEM';
  action: AuditAction;
  resourceType: string;
  resourceId?: string;
  correlationId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
  sequenceNumber?: number;
  previousHash?: string;
  currentHash?: string;
  timestamp: Date;
}

export interface IIntegrationEvent {
  _id?: string;
  id?: string;
  connectorCode: string;
  endpoint: string;
  method: string;
  correlationId: string;
  requestPayload?: any;
  responsePayload?: any;
  statusCode?: number;
  latencyMs: number;
  success: boolean;
  errorMessage?: string;
  timestamp: Date;
}

// ─── AI Response Types ──────────────────────────────────
export interface AISchemaSuggestion {
  sourceField: string;
  targetField: string;
  confidence: number;
  suggestedTransformation?: string;
  reasoning?: string;
}

export interface AIDuplicateCandidate {
  applicationId: string;
  similarityScore: number;
  matchingFields: string[];
  status?: string;
  createdAt?: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface AIRoutingRecommendation {
  recommendedDepartment: string;
  recommendedQueue: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  slaHours: number;
  estimatedProcessingDays: number;
  rationale: string[];
}

export interface AIMonitoringQueryAnswer {
  query: string;
  answer: string;
  category: string;
  confidence: number;
  metrics: Record<string, any>;
  timestamp: string;
}
