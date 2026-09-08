import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getSupportThread, listSupportThreads, replySupportThread, updateSupportThreadStatus } from '../controllers/supportController.js';

const router = Router();

router.use(requireAuth);

router.get('/', listSupportThreads);
router.get('/:id', getSupportThread);
router.post('/:id/messages', replySupportThread);
router.patch('/:id', updateSupportThreadStatus);

export default router;
