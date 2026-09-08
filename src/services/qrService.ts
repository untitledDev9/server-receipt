import QRCode from 'qrcode';
import { env } from '../config/env.js';

export function publicReceiptUrl(slug: string, receiptNumber: string): string {
  return `${env.clientUrl}/${slug}/r/${encodeURIComponent(receiptNumber)}`;
}

export async function generateReceiptQrDataUrl(slug: string, receiptNumber: string): Promise<string> {
  const url = publicReceiptUrl(slug, receiptNumber);
  return QRCode.toDataURL(url, { margin: 1, width: 200 });
}
