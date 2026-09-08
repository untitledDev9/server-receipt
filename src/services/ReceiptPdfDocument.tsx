import { ClassicPdf } from './receiptPdfTemplates/ClassicPdf.js';
import { ModernPdf } from './receiptPdfTemplates/ModernPdf.js';
import { FormalPdf } from './receiptPdfTemplates/FormalPdf.js';
import { MinimalPdf } from './receiptPdfTemplates/MinimalPdf.js';
import { CompactPdf } from './receiptPdfTemplates/CompactPdf.js';
import type { ReceiptPdfProps } from './receiptPdfTemplates/shared.js';

export function ReceiptPdfDocument(props: ReceiptPdfProps) {
  switch (props.business.receiptConfig.template) {
    case 'modern':
      return ModernPdf(props);
    case 'formal':
      return FormalPdf(props);
    case 'minimal':
      return MinimalPdf(props);
    case 'compact':
      return CompactPdf(props);
    case 'classic':
    default:
      return ClassicPdf(props);
  }
}
