import { ClassicPdf } from './receiptPdfTemplates/ClassicPdf.js';
import { ModernPdf } from './receiptPdfTemplates/ModernPdf.js';
import { FormalPdf } from './receiptPdfTemplates/FormalPdf.js';
import { MinimalPdf } from './receiptPdfTemplates/MinimalPdf.js';
import { CompactPdf } from './receiptPdfTemplates/CompactPdf.js';
import { WhitePdf } from './receiptPdfTemplates/WhitePdf.js';
import type { ReceiptPdfProps } from './receiptPdfTemplates/shared.js';

export function ReceiptPdfDocument(props: ReceiptPdfProps) {
  const template = props.receipt.template || props.business.receiptConfig.template;
  switch (template) {
    case 'modern':
      return ModernPdf(props);
    case 'formal':
      return FormalPdf(props);
    case 'minimal':
      return MinimalPdf(props);
    case 'compact':
      return CompactPdf(props);
    case 'white':
      return WhitePdf(props);
    case 'classic':
    default:
      return ClassicPdf(props);
  }
}
