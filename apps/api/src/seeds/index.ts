import mongoose from 'mongoose';
import { config } from '../config/index.js';
import { User } from '../models/User.js';
import { Department } from '../models/Department.js';
import { Citizen } from '../models/Citizen.js';
import { Application } from '../models/Application.js';
import { Workflow } from '../models/Workflow.js';
import { WorkflowInstance } from '../models/WorkflowInstance.js';
import { Connector } from '../models/Connector.js';
import { SchemaMapping } from '../models/SchemaMapping.js';
import { Consent } from '../models/Consent.js';
import { DocumentRecord } from '../models/DocumentRecord.js';
import { AuditEvent } from '../models/AuditEvent.js';
import { logger } from '../utils/logger.js';
import {
  UserRole,
  ServiceType,
  ApplicationStatus,
  WorkflowStepStatus,
  ConsentStatus,
  AuditAction,
  DocumentScanStatus,
  DocumentVerificationStatus,
  CircuitBreakerState,
} from '@govconnect/shared-types';

const seedUsers = [
  {
    name: 'Ravi Kumar',
    email: 'ravi.kumar@example.com',
    password: 'password123',
    role: UserRole.CITIZEN,
  },
  {
    name: 'Priya Sharma',
    email: 'priya.sharma@example.com',
    password: 'password123',
    role: UserRole.CITIZEN,
  },
  {
    name: 'Amit Patel',
    email: 'officer@govconnect.in',
    password: 'password123',
    role: UserRole.DEPT_OFFICER,
  },
  {
    name: 'Sunita Verma',
    email: 'dept.admin@govconnect.in',
    password: 'password123',
    role: UserRole.DEPT_ADMIN,
  },
  {
    name: 'Platform Admin',
    email: 'admin@govconnect.in',
    password: 'password123',
    role: UserRole.PLATFORM_ADMIN,
  },
  {
    name: 'Super Admin',
    email: 'superadmin@govconnect.in',
    password: 'password123',
    role: UserRole.SUPER_ADMIN,
  },
];

async function seed() {
  try {
    logger.info('🌱 Connecting to MongoDB for seeding...');
    await mongoose.connect(config.mongodb.uri);
    logger.info('✅ Connected to MongoDB');

    // Clear existing collections
    await User.deleteMany({});
    await Department.deleteMany({});
    await Citizen.deleteMany({});
    await Application.deleteMany({});
    await Workflow.deleteMany({});
    await WorkflowInstance.deleteMany({});
    await Connector.deleteMany({});
    await SchemaMapping.deleteMany({});
    await Consent.deleteMany({});
    await DocumentRecord.deleteMany({});
    await AuditEvent.deleteMany({});
    logger.info('🗑️  Cleared existing collections');

    // ─── 1. Create Departments ────────────────────────────────
    const identityDept = await Department.create({
      name: 'Department of Identity Verification (UIDAI / DigiLocker)',
      code: 'DEPT_ID',
      description: 'Handles citizen sovereign identity validation and KYC attestations',
      services: [ServiceType.IDENTITY_VERIFICATION],
      contactEmail: 'support@uidai.gov.in',
      slaHours: 12,
      isActive: true,
    });

    const taxDept = await Department.create({
      name: 'Department of Revenue & Tax (CBDT / GSTN)',
      code: 'DEPT_TAX',
      description: 'Validates PAN profiles and assesses annual tax compliance certifications',
      services: [ServiceType.TAX_CLEARANCE],
      contactEmail: 'compliance@incometax.gov.in',
      slaHours: 24,
      isActive: true,
    });

    const businessDept = await Department.create({
      name: 'Department of Business & Commerce (MCA)',
      code: 'DEPT_BIZ',
      description: 'Processes corporate incorporation and commercial trade licenses',
      services: [ServiceType.BUSINESS_APPROVAL, ServiceType.LAND_REGISTRATION, ServiceType.CERTIFICATE_ISSUANCE],
      contactEmail: 'licensing@mca.gov.in',
      slaHours: 48,
      isActive: true,
    });
    logger.info('✅ Created Departments');

    // ─── 2. Create Connectors ─────────────────────────────────
    await Connector.create([
      {
        name: 'UIDAI & DigiLocker Identity Gateway',
        code: 'DEPT_A_IDENTITY',
        type: 'REST',
        departmentId: identityDept._id,
        baseUrl: 'http://localhost:9001',
        circuitState: CircuitBreakerState.CLOSED,
        metrics: {
          totalRequests: 48,
          successfulRequests: 48,
          failedRequests: 0,
          averageLatencyMs: 95,
          lastSuccess: new Date(),
        },
        isActive: true,
      },
      {
        name: 'CBDT Direct Tax Clearance Bridge',
        code: 'DEPT_B_TAX',
        type: 'REST',
        departmentId: taxDept._id,
        baseUrl: 'http://localhost:9002',
        circuitState: CircuitBreakerState.CLOSED,
        metrics: {
          totalRequests: 32,
          successfulRequests: 32,
          failedRequests: 0,
          averageLatencyMs: 140,
          lastSuccess: new Date(),
        },
        isActive: true,
      },
      {
        name: 'MCA Commercial Registry Connector',
        code: 'DEPT_C_COMMERCE',
        type: 'REST',
        departmentId: businessDept._id,
        baseUrl: 'http://localhost:9003',
        circuitState: CircuitBreakerState.CLOSED,
        metrics: {
          totalRequests: 26,
          successfulRequests: 26,
          failedRequests: 0,
          averageLatencyMs: 180,
          lastSuccess: new Date(),
        },
        isActive: true,
      },
    ]);
    logger.info('✅ Created Connectors');

    // ─── 3. Create Schema Mappings ────────────────────────────
    await SchemaMapping.create([
      {
        name: 'UIDAI Legacy to Canonical Citizen Schema',
        sourceSystem: 'UIDAI_DEPT_A',
        targetSystem: 'GOVCONNECT_CANONICAL',
        version: 'v1.0.0',
        fieldMappings: [
          { sourceField: 'citizen_full_name', targetField: 'personal.fullName', transformationType: 'UPPERCASE', isRequired: true },
          { sourceField: 'date_of_birth_iso', targetField: 'personal.dob', transformationType: 'DATE_FORMAT', isRequired: true },
          { sourceField: 'phone_contact', targetField: 'contact.mobileNumber', transformationType: 'PHONE_NORMALIZE', isRequired: true },
          { sourceField: 'aadhaar_sha256', targetField: 'identity.aadhaarHash', transformationType: 'DIRECT', isRequired: false },
        ],
        isActive: true,
      },
      {
        name: 'CBDT Tax Clearance to Canonical Schema',
        sourceSystem: 'CBDT_DEPT_B',
        targetSystem: 'GOVCONNECT_CANONICAL',
        version: 'v1.0.0',
        fieldMappings: [
          { sourceField: 'taxpayer_id', targetField: 'tax.panNumber', transformationType: 'UPPERCASE', isRequired: true },
          { sourceField: 'legal_entity_name', targetField: 'tax.taxpayerName', transformationType: 'DIRECT', isRequired: true },
          { sourceField: 'clearance_certificate_number', targetField: 'tax.clearanceCertificateNumber', transformationType: 'DIRECT', isRequired: true },
          { sourceField: 'clearance_status', targetField: 'tax.status', transformationType: 'UPPERCASE', isRequired: true },
        ],
        isActive: true,
      },
    ]);
    logger.info('✅ Created Schema Mappings');

    // ─── 4. Create Workflows ──────────────────────────────────
    const bizWorkflow = await Workflow.create({
      name: 'Commercial Enterprise Multi-Department Clearance',
      serviceType: ServiceType.BUSINESS_APPROVAL,
      departmentId: businessDept._id,
      status: 'ACTIVE',
      steps: [
        { name: 'Identity & DigiLocker Pre-Validation', type: 'AUTOMATED_IDENTITY', order: 1, connectorCode: 'DEPT_A_IDENTITY', isAutomated: true },
        { name: 'Tax Clearance & Compliance Verification', type: 'AUTOMATED_TAX', order: 2, connectorCode: 'DEPT_B_TAX', isAutomated: true },
        { name: 'Commercial Filing & Entity Registration', type: 'AUTOMATED_COMMERCE', order: 3, connectorCode: 'DEPT_C_COMMERCE', isAutomated: true },
        { name: 'Departmental Officer Verification & Adjudication', type: 'MANUAL_REVIEW', order: 4, requiredRole: UserRole.DEPT_OFFICER, isAutomated: false },
        { name: 'Final Certificate Generation & Digital Stamp', type: 'FINAL_ISSUANCE', order: 5, isAutomated: true },
      ],
    });
    logger.info('✅ Created Workflows');

    // ─── 5. Create Users & Citizens ───────────────────────────
    const users: Record<string, any> = {};
    for (const userData of seedUsers) {
      const user = await User.create({
        ...userData,
        department: [UserRole.DEPT_OFFICER, UserRole.DEPT_ADMIN].includes(userData.role)
          ? businessDept._id
          : undefined,
      });
      users[userData.email] = user;
    }

    const ravi = await Citizen.create({
      userId: users['ravi.kumar@example.com']._id,
      fullName: 'Ravi Kumar',
      dateOfBirth: new Date('1985-06-15'),
      aadhaarNumber: '987654321012',
      panNumber: 'AAACR8821K',
      isIdentityVerified: true,
      contact: { email: 'ravi.kumar@example.com', phone: '9876543210' },
      address: {
        street: '123 MG Road',
        city: 'Bangalore',
        state: 'Karnataka',
        zipCode: '560001',
        country: 'India',
      },
    });

    const priya = await Citizen.create({
      userId: users['priya.sharma@example.com']._id,
      fullName: 'Priya Sharma',
      dateOfBirth: new Date('1990-08-22'),
      aadhaarNumber: '876543210987',
      panNumber: 'BJKPS9912M',
      isIdentityVerified: true,
      contact: { email: 'priya.sharma@example.com', phone: '9876543211' },
      address: {
        street: '456 Linking Road',
        city: 'Mumbai',
        state: 'Maharashtra',
        zipCode: '400050',
        country: 'India',
      },
    });
    logger.info('✅ Created Citizens');

    // ─── 6. Create DPDP Consents ──────────────────────────────
    await Consent.create([
      {
        token: 'DPDP-TKN-98F8A7D1C2E34567890123456789ABCD',
        citizenId: ravi._id,
        departmentId: businessDept._id,
        purpose: 'Commercial Entity Licensing and Tax Profile Verification under DPDP Act 2023',
        dataFields: ['fullName', 'aadhaarNumber', 'panNumber', 'address', 'incomeDetails'],
        version: 'v1.0-DPDP-2023',
        status: ConsentStatus.GRANTED,
        grantedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() + 360 * 24 * 60 * 60 * 1000),
      },
      {
        token: 'DPDP-TKN-12E4B5C6D7F84567890123456789EF12',
        citizenId: priya._id,
        departmentId: taxDept._id,
        purpose: 'Annual Tax Assessment & Clearance Retrieval',
        dataFields: ['fullName', 'panNumber', 'taxFilingHistory'],
        version: 'v1.0-DPDP-2023',
        status: ConsentStatus.GRANTED,
        grantedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() + 363 * 24 * 60 * 60 * 1000),
      },
    ]);
    logger.info('✅ Created DPDP Consents');

    // ─── 7. Create Documents ──────────────────────────────────
    await DocumentRecord.create([
      {
        citizenId: ravi._id,
        fileName: 'aadhaar_card_ravi.pdf',
        originalName: 'Aadhaar_UIDAI_Verified.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 1048576,
        storagePath: '/uploads/aadhaar_card_ravi.pdf',
        sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        scanStatus: DocumentScanStatus.CLEAN,
        verificationStatus: DocumentVerificationStatus.VERIFIED,
        metadata: { documentType: 'AADHAAR_CARD', issuingAuthority: 'UIDAI' },
      },
      {
        citizenId: ravi._id,
        fileName: 'pan_card_ravi.pdf',
        originalName: 'PAN_Card_CBDT.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 524288,
        storagePath: '/uploads/pan_card_ravi.pdf',
        sha256Hash: 'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb',
        scanStatus: DocumentScanStatus.CLEAN,
        verificationStatus: DocumentVerificationStatus.VERIFIED,
        metadata: { documentType: 'PAN_CARD', issuingAuthority: 'CBDT' },
      },
    ]);
    logger.info('✅ Created Documents');

    // ─── 8. Create Applications & Workflow Instances ──────────
    const app1 = await Application.create({
      applicationId: 'GC-2026-10021',
      citizenId: ravi._id,
      departmentId: businessDept._id,
      type: ServiceType.BUSINESS_APPROVAL,
      status: ApplicationStatus.IN_REVIEW,
      formData: {
        companyName: 'Ravi NextGen Software Solutions Pvt Ltd',
        businessType: 'Private Limited',
        industrySector: 'Information Technology Services',
        authorizedCapital: 2500000,
        applicantName: 'Ravi Kumar',
        aadhaarNumber: '987654321012',
        panNumber: 'AAACR8821K',
        phone: '9876543210',
      },
      currentStep: 'Departmental Officer Verification & Adjudication',
      correlationId: 'corr-demo-app-10021',
      notes: [
        {
          author: 'Amit Patel',
          role: UserRole.DEPT_OFFICER,
          text: 'UIDAI biometric validation and CBDT tax clearance verified automatically. Reviewing company Memorandum of Association.',
          createdAt: new Date(),
        },
      ],
    });

    const wfInstance1 = await WorkflowInstance.create({
      applicationId: app1._id,
      workflowId: bizWorkflow._id,
      currentStepIndex: 3, // Paused at step 4 (Manual Review)
      status: WorkflowStepStatus.PROCESSING,
      correlationId: 'corr-demo-app-10021',
      steps: [
        {
          stepName: 'Identity & DigiLocker Pre-Validation',
          stepType: 'AUTOMATED_IDENTITY',
          order: 1,
          status: WorkflowStepStatus.COMPLETED,
          startedAt: new Date(Date.now() - 3600000),
          completedAt: new Date(Date.now() - 3590000),
          retryCount: 0,
          outputData: { isVerified: true, verificationRef: 'UIDAI-VER-2026-8812', assuranceLevel: 'TIER_3_SOVEREIGN' },
        },
        {
          stepName: 'Tax Clearance & Compliance Verification',
          stepType: 'AUTOMATED_TAX',
          order: 2,
          status: WorkflowStepStatus.COMPLETED,
          startedAt: new Date(Date.now() - 3590000),
          completedAt: new Date(Date.now() - 3580000),
          retryCount: 0,
          outputData: { isCleared: true, clearanceCertificateNumber: 'CBDT-NOC-2026-991288', complianceRating: 'A_PLUS' },
        },
        {
          stepName: 'Commercial Filing & Entity Registration',
          stepType: 'AUTOMATED_COMMERCE',
          order: 3,
          status: WorkflowStepStatus.COMPLETED,
          startedAt: new Date(Date.now() - 3580000),
          completedAt: new Date(Date.now() - 3570000),
          retryCount: 0,
          outputData: { isRegistered: true, cin: 'U72200DL2026PTC109821', deskQueue: 'NEW_DELHI_COMMERCE_DESK_4' },
        },
        {
          stepName: 'Departmental Officer Verification & Adjudication',
          stepType: 'MANUAL_REVIEW',
          order: 4,
          status: WorkflowStepStatus.PROCESSING,
          startedAt: new Date(Date.now() - 3570000),
          retryCount: 0,
          requiredRole: UserRole.DEPT_OFFICER,
        },
        {
          stepName: 'Final Certificate Generation & Digital Stamp',
          stepType: 'FINAL_ISSUANCE',
          order: 5,
          status: WorkflowStepStatus.PENDING,
          retryCount: 0,
        },
      ],
      startedAt: new Date(Date.now() - 3600000),
    });

    app1.workflowInstanceId = wfInstance1._id as mongoose.Types.ObjectId;
    await app1.save();

    const app2 = await Application.create({
      applicationId: 'GC-2026-10042',
      citizenId: priya._id,
      departmentId: taxDept._id,
      type: ServiceType.TAX_CLEARANCE,
      status: ApplicationStatus.APPROVED,
      formData: {
        applicantName: 'Priya Sharma',
        panNumber: 'BJKPS9912M',
        assessmentYear: '2025-2026',
      },
      currentStep: 'COMPLETED',
      correlationId: 'corr-demo-app-10042',
    });

    logger.info('✅ Created Applications and Workflow Instances');

    // ─── 9. Create Audit Events (SHA-256 Chaining) ────────────
    const genesisHash = 'GENESIS_BLOCK_GOV_CONNECT_2026';
    const audit1 = await AuditEvent.create({
      actorId: users['ravi.kumar@example.com']._id,
      actorName: 'Ravi Kumar',
      actorRole: UserRole.CITIZEN,
      action: AuditAction.APPLICATION_SUBMITTED,
      resourceType: 'Application',
      resourceId: 'GC-2026-10021',
      correlationId: 'corr-demo-app-10021',
      sequenceNumber: 1,
      previousHash: genesisHash,
      currentHash: 'b45c3898f804dcde9eef52467d018742b6eb2d699e31d454655519183416b251',
      details: { serviceType: ServiceType.BUSINESS_APPROVAL, steps: 5 },
      timestamp: new Date(Date.now() - 3600000),
    });

    await AuditEvent.create({
      actorId: users['officer@govconnect.in']._id,
      actorName: 'Amit Patel',
      actorRole: UserRole.DEPT_OFFICER,
      action: AuditAction.INTEROPERABILITY_CALL_COMPLETED,
      resourceType: 'WorkflowStep',
      resourceId: 'GC-2026-10021:Commercial Filing & Entity Registration',
      correlationId: 'corr-demo-app-10021',
      sequenceNumber: 2,
      previousHash: audit1.currentHash,
      currentHash: '5a282d8c36b8565a54db647eef090623a411440f3299ea4fb315ff9209c15b12',
      details: { connector: 'DEPT_C_COMMERCE', latencyMs: 180 },
      timestamp: new Date(Date.now() - 3570000),
    });

    logger.info('✅ Created Audit Log Hash Chain');

    logger.info(`\n🎉 Seeding completed successfully!`);
    logger.info('\n📋 Demo Credentials:');
    logger.info('  Citizen:        ravi.kumar@example.com / password123');
    logger.info('  Citizen:        priya.sharma@example.com / password123');
    logger.info('  Officer:        officer@govconnect.in / password123');
    logger.info('  Dept Admin:     dept.admin@govconnect.in / password123');
    logger.info('  Platform Admin: admin@govconnect.in / password123');
    logger.info('  Super Admin:    superadmin@govconnect.in / password123');
  } catch (error) {
    logger.error('❌ Seed failed:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
