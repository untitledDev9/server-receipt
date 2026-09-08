import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  createReceipt,
  duplicateReceipt,
  getReceipt,
  getReceiptPdf,
  getTenantDashboardStats,
  listReceipts,
  updateReceipt,
  voidReceipt,
} from '../controllers/receiptController.js';

const router = Router();

router.use(requireAuth);

router.get('/dashboard-stats', getTenantDashboardStats);
router.get('/', listReceipts);
router.post('/', createReceipt);
router.get('/:id', getReceipt);
router.patch('/:id', updateReceipt);
router.get('/:id/pdf', getReceiptPdf);
router.post('/:id/duplicate', duplicateReceipt);
router.patch('/:id/void', voidReceipt);

export default router;
