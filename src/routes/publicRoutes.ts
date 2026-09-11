import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { getBusinessFavicon, getBusinessLogo, getPublicBusiness } from '../controllers/businessController.js';
import { getPublicReceipt, verifyReceipt } from '../controllers/receiptController.js';
import { getPublicSupportThread, sendPublicSupportMessage } from '../controllers/supportController.js';

const router = Router();

// This endpoint has no auth barrier at all, so it's the one most exposed to spam/abuse.
const supportMessageLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });

router.get('/businesses/:slug', getPublicBusiness);
router.get('/businesses/:slug/logo', getBusinessLogo);
router.get('/businesses/:slug/favicon', getBusinessFavicon);
router.get('/businesses/:slug/receipts/:receiptNumber', getPublicReceipt);
router.get('/businesses/:slug/receipts/:receiptNumber/support', getPublicSupportThread);
router.post('/businesses/:slug/receipts/:receiptNumber/support/messages', supportMessageLimiter, sendPublicSupportMessage);
router.get('/verify/:receiptNumber', verifyReceipt);

export default router;
