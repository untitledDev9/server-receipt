import type { BusinessDocument } from '../../models/Business.js';
import type { ReceiptDocument } from '../../models/Receipt.js';

export const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Cash',
  transfer: 'Bank Transfer',
  pos: 'POS',
  card: 'Card',
  mobile_money: 'Mobile Money',
  other: 'Other',
};

// The PDF's base Helvetica font only covers WinAnsiEncoding, which excludes
// most currency symbols (₦, ₵, etc.) — rendering them here produces broken
// glyphs. Using the currency code instead guarantees correct rendering
// without bundling a custom Unicode font just for this one line.
export function formatMoney(amount: number, currency: string): string {
  return `${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export function getContactLines(business: BusinessDocument): string[] {
  const { header } = business.receiptConfig;
  const lines: string[] = [];
  if (header.showAddress && business.address?.street) {
    lines.push([business.address.street, business.address.city, business.address.state].filter(Boolean).join(', '));
  }
  if (header.showPhone && business.phone) lines.push(business.phone);
  if (header.showEmail && business.email) lines.push(business.email);
  if (header.showWebsite && business.website) lines.push(business.website);
  return lines;
}

export function getTaxLine(business: BusinessDocument): string | undefined {
  if (!business.taxId && !business.registrationNumber) return undefined;
  return [business.taxId && `Tax ID: ${business.taxId}`, business.registrationNumber && `RC: ${business.registrationNumber}`]
    .filter(Boolean)
    .join('   ·   ');
}

export interface ReceiptPdfProps {
  business: BusinessDocument;
  receipt: ReceiptDocument;
  cashierName: string;
  qrDataUrl: string;
}
