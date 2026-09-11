import { Router } from 'express';
import {
  getApplications,
  getApplicationById,
  createApplication,
  addNote,
} from '../controllers/application.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireApplicationAccess, authorize } from '../middleware/rbac.js';
import { validateBody } from '../middleware/validate.js';
import { createApplicationSchema, addNoteSchema } from '../validation/schemas.js';
import { UserRole } from '@govconnect/shared-types';

const router = Router();

router.use(authenticate);

router.get('/', getApplications);
router.get('/:id', requireApplicationAccess, getApplicationById);
router.post('/', validateBody(createApplicationSchema), createApplication);
router.post(
  '/:id/notes',
  requireApplicationAccess,
  authorize(UserRole.DEPT_OFFICER, UserRole.DEPT_ADMIN, UserRole.PLATFORM_ADMIN, UserRole.SUPER_ADMIN),
  validateBody(addNoteSchema),
  addNote,
);

export { router as applicationRouter };
