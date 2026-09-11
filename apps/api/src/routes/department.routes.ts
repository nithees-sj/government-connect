import { Router } from 'express';
import {
  getDepartments,
  getDepartmentById,
} from '../controllers/department.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getDepartments);
router.get('/:id', getDepartmentById);

export { router as departmentRouter };
