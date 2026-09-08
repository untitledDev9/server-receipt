import fs from 'node:fs';
import path from 'node:path';
import { env } from '../config/env.js';

const uploadRoot = path.resolve(process.cwd(), env.uploadDir);
if (!fs.existsSync(uploadRoot)) {
  fs.mkdirSync(uploadRoot, { recursive: true });
}

/**
 * Local-disk implementation of the upload storage contract. Swapping to
 * S3/Cloudinary later means implementing this same `saveBuffer`/`remove`/
 * `urlFor` shape against that provider's SDK — nothing else in the app
 * touches the filesystem directly.
 */
export const storageService = {
  root: uploadRoot,

  urlFor(filename: string): string {
    // Absolute so the URL still resolves once the client is deployed on a
    // different domain than the API.
    return `${env.publicUrl}/uploads/${filename}`;
  },

  remove(filename: string | undefined | null): void {
    if (!filename) return;
    const resolved = path.join(uploadRoot, path.basename(filename));
    fs.rm(resolved, { force: true }, () => undefined);
  },
};
