import { Router } from 'express';
import {
  getConsents,
  grantConsent,
  revokeConsent,
} from '../controllers/consent.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { grantConsentSchema } from '../validation/schemas.js';

const router = Router();

router.use(authenticate);

router.get('/', getConsents);
router.post('/', validateBody(grantConsentSchema), grantConsent);
router.post('/:id/revoke', revokeConsent);

export { router as consentRouter };
