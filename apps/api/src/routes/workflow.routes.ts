import { Router } from 'express';
import {
  getWorkflowProgress,
  adjudicateStep,
  retryFailedStep,
} from '../controllers/workflow.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { validateBody } from '../middleware/validate.js';
import { adjudicateWorkflowSchema } from '../validation/schemas.js';
import { UserRole } from '@govconnect/shared-types';

const router = Router();

router.use(authenticate);

router.get('/instances/:id/progress', getWorkflowProgress);
router.post(
  '/instances/:id/adjudicate',
  authorize(UserRole.DEPT_OFFICER, UserRole.DEPT_ADMIN, UserRole.PLATFORM_ADMIN, UserRole.SUPER_ADMIN),
  validateBody(adjudicateWorkflowSchema),
  adjudicateStep,
);
router.post(
  '/instances/:id/retry',
  authorize(UserRole.CITIZEN, UserRole.DEPT_OFFICER, UserRole.DEPT_ADMIN, UserRole.PLATFORM_ADMIN, UserRole.SUPER_ADMIN),
  retryFailedStep,
);

export { router as workflowRouter };
