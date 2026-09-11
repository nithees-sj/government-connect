import { Router } from 'express';
import {
  getDocuments,
  uploadDocument,
  downloadDocument,
  getWallet,
  updateWallet,
} from '../controllers/document.controller.js';
import { authenticate } from '../middleware/auth.js';
import { uploadMiddleware } from '../services/document.service.js';
import { uploadLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.use(authenticate);

router.get('/', getDocuments);
router.post('/upload', uploadLimiter, uploadMiddleware.single('file'), uploadDocument);
router.get('/wallet', getWallet);
router.post('/wallet', updateWallet);
router.get('/:id/download', downloadDocument);

export { router as documentRouter };

