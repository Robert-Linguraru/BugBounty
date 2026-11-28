import { Router } from 'express';
import {
  createReport,
  getReports,
  getReportById,
  updateReport,
  deleteReport
} from '../controllers/reportController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/', verifyToken, createReport);
router.get('/', verifyToken, getReports);
router.get('/:id', verifyToken, getReportById);
router.put('/:id', verifyToken, updateReport);
router.delete('/:id', verifyToken, deleteReport);

export default router;