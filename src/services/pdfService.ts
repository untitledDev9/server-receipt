import type { HydratedDocument } from 'mongoose';
import { renderToBuffer } from '@react-pdf/renderer';
import type { BusinessDocument } from '../models/Business.js';
import type { ReceiptDocument } from '../models/Receipt.js';
import { ReceiptPdfDocument } from './ReceiptPdfDocument.js';
import { generateReceiptQrDataUrl } from './qrService.js';

// react-pdf's <Image> accepts a base64 data URI directly, same as the QR
// code below — the logo lives as raw bytes in Mongo, so embed it inline
// instead of resolving a URL/file path (the caller must have selected
// +logoImage.data, since that path is select: false by default).
function logoDataUrl(business: BusinessDocument): string | undefined {
  const { data, contentType } = business.logoImage ?? {};
  if (!data || !contentType) return undefined;
  return `data:${contentType};base64,${data.toString('base64')}`;
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
  const businessForPdf = { ...business.toObject(), logoUrl: logoDataUrl(business) } as BusinessDocument;

  return renderToBuffer(
    ReceiptPdfDocument({ business: businessForPdf, receipt, cashierName, qrDataUrl })
  );
}
