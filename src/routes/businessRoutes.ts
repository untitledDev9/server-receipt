import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { uploadImage } from '../middleware/upload.js';
import {
  checkSlugAvailability,
  createBusiness,
  deleteBusiness,
  getBusiness,
  getPlatformStats,
  listBusinesses,
  setBusinessStatus,
  suggestBusinessSlug,
  updateBusiness,
  uploadBusinessFavicon,
  uploadBusinessLogo,
} from '../controllers/businessController.js';

const router = Router();

router.use(requireAuth);

router.get('/', listBusinesses);
router.post('/', createBusiness);
router.get('/stats', getPlatformStats);
router.get('/suggest-slug', suggestBusinessSlug);
router.get('/check-slug', checkSlugAvailability);

router.get('/:id', getBusiness);
router.patch('/:id', updateBusiness);
router.patch('/:id/status', setBusinessStatus);
router.delete('/:id', deleteBusiness);
router.post('/:id/logo', uploadImage.single('logo'), uploadBusinessLogo);
router.post('/:id/favicon', uploadImage.single('favicon'), uploadBusinessFavicon);

export default router;
