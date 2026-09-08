import path from 'node:path';
import type { HydratedDocument } from 'mongoose';
import { renderToBuffer } from '@react-pdf/renderer';
import { env } from '../config/env.js';
import type { BusinessDocument } from '../models/Business.js';
import type { ReceiptDocument } from '../models/Receipt.js';
import { ReceiptPdfDocument } from './ReceiptPdfDocument.js';
import { generateReceiptQrDataUrl } from './qrService.js';
import { storageService } from './storageService.js';

/** react-pdf's <Image> needs a real URL or filesystem path — resolve our
 * own uploads (stored as absolute "{publicUrl}/uploads/xyz.png" links, or
 * legacy relative "/uploads/xyz.png" ones) to a local file path so PDF
 * generation reads straight off disk instead of looping back over HTTP. */
function resolveImageSrc(url: string | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith(`${env.publicUrl}/uploads/`) || url.startsWith('/uploads/')) {
    return path.join(storageService.root, path.basename(url));
  }
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return url;
}

export async function generateReceiptPdf(
  business: HydratedDocument<BusinessDocument>,
  receipt: ReceiptDocument,
  cashierName: string
): Promise<Buffer> {
  const qrDataUrl = business.receiptConfig.publicReceiptEnabled
    ? await generateReceiptQrDataUrl(business.slug, receipt.receiptNumber)
    : '';

  // `business` is a live Mongoose document — its schema fields are prototype
  // getters, not own enumerable properties, so `{...business}` silently drops
  // nested paths like receiptConfig/branding. toObject() gives a plain copy.
  const businessForPdf = { ...business.toObject(), logoUrl: resolveImageSrc(business.logoUrl) } as BusinessDocument;

  return renderToBuffer(
    ReceiptPdfDocument({ business: businessForPdf, receipt, cashierName, qrDataUrl })
  );
}
