import { Router } from 'express';
import {
  getConnectors,
  testConnector,
  resetCircuitBreaker,
  getSchemaMappings,
  createSchemaMapping,
  testTransformation,
  getAuditLogs,
  verifyAuditIntegrity,
  getMonitoringOverview,
  getSimulationStatus,
  setSimulationMode,
} from '../controllers/admin.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { validateBody } from '../middleware/validate.js';
import { testTransformationSchema, createSchemaMappingSchema } from '../validation/schemas.js';
import { UserRole } from '@govconnect/shared-types';

const router = Router();

router.use(authenticate);
router.use(
  authorize(UserRole.DEPT_ADMIN, UserRole.PLATFORM_ADMIN, UserRole.SUPER_ADMIN),
);

// Connectors & Circuit Breakers
router.get('/connectors', getConnectors);
router.post('/connectors/:code/test', testConnector);
router.post('/connectors/:code/reset-circuit', resetCircuitBreaker);

// Schema Mappings & Transformation Engine
router.get('/schema-mappings', getSchemaMappings);
router.post('/schema-mappings', validateBody(createSchemaMappingSchema), createSchemaMapping);
router.post('/schema-mappings/test', validateBody(testTransformationSchema), testTransformation);

// Audit Trail & Chain Verification
router.get('/audit-logs', getAuditLogs);
router.get('/audit-logs/verify-chain', verifyAuditIntegrity);

// Telemetry & KPI Monitoring
router.get('/monitoring/overview', getMonitoringOverview);

// Simulation Controls
router.get('/simulation/status', getSimulationStatus);
router.post('/simulation/mode', setSimulationMode);

export { router as adminRouter };
