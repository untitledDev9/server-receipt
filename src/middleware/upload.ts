import multer from 'multer';

const ALLOWED_MIME = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'image/x-icon']);
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

// Memory storage: the file lands in req.file.buffer instead of on disk, so
// the controller can write it straight into MongoDB.
export const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      cb(new Error('Only PNG, JPG, WEBP, or SVG images are allowed'));
      return;
    }
    cb(null, true);
  },
});
