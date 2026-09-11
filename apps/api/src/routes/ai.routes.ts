import { Router } from 'express';
import {
  suggestMapping,
  detectDuplicates,
  smartRouting,
  queryMonitoring,
} from '../controllers/ai.controller.js';
import { authenticate } from '../middleware/auth.js';
import { aiLimiter } from '../middleware/rateLimiter.js';
import { validateBody } from '../middleware/validate.js';
import {
  aiSuggestMappingSchema,
  aiDetectDuplicatesSchema,
  aiSmartRoutingSchema,
  aiMonitoringQuerySchema,
} from '../validation/schemas.js';

const router = Router();

router.use(authenticate);
router.use(aiLimiter);

router.post('/suggest-mapping', validateBody(aiSuggestMappingSchema), suggestMapping);
router.post('/detect-duplicates', validateBody(aiDetectDuplicatesSchema), detectDuplicates);
router.post('/smart-routing', validateBody(aiSmartRoutingSchema), smartRouting);
router.post('/monitoring-query', validateBody(aiMonitoringQuerySchema), queryMonitoring);

export { router as aiRouter };
