import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { PAYMENT_LABELS, formatMoney, formatDateTime, getContactLines, getTaxLine, type ReceiptPdfProps } from './shared.js';

const styles = StyleSheet.create({
  page: { fontSize: 10, fontFamily: 'Helvetica', color: '#111827' },
  band: { padding: 24, paddingBottom: 30 },
  bandHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  logo: { width: 32, height: 32, marginRight: 10, objectFit: 'contain' },
  businessName: { fontSize: 13, fontWeight: 700, color: '#ffffff' },
  slogan: { fontSize: 8.5, color: '#e5e7eb' },
  statusRow: { fontSize: 9, fontWeight: 700, color: '#f3f4f6', marginBottom: 3 },
  amount: { fontSize: 24, fontWeight: 700, color: '#ffffff' },
  body: { padding: 24, paddingTop: 18 },
  contactLine: { fontSize: 8.5, color: '#9ca3af', marginBottom: 8 },
  taxLine: { fontSize: 7.5, color: '#9ca3af', marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  field: { width: '50%', marginBottom: 12, paddingRight: 8 },
  fieldLabel: { fontSize: 7.5, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 2 },
  fieldValue: { fontSize: 10, fontWeight: 700, color: '#111827' },
  narrationBlock: { borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 10, marginTop: 2, marginBottom: 4 },
  qr: { width: 64, height: 64, alignSelf: 'center', marginTop: 12 },
  footer: { marginTop: 14, textAlign: 'center', fontSize: 9, color: '#4b5563' },
  platformBrand: { marginTop: 6, textAlign: 'center', fontSize: 7, color: '#9ca3af' },
});

function Field({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

export function ModernPdf({ business, receipt, cashierName, qrDataUrl }: ReceiptPdfProps) {
  const { header, footerText, showPlatformBranding } = business.receiptConfig;
  const currency = business.currency;
  const isVoid = receipt.status === 'void';
  const taxLine = getTaxLine(business);
  const contactLines = getContactLines(business);

  return (
    <Document title={`${receipt.receiptNumber} - ${business.name}`}>
      <Page size={[297.6, 560]} style={styles.page}>
        <View style={[styles.band, { backgroundColor: business.branding.primaryColor }]}>
          <View style={styles.bandHeaderRow}>
            {header.showLogo && business.logoUrl ? <Image style={styles.logo} src={business.logoUrl} /> : null}
            <View>
              {header.showBusinessName ? <Text style={styles.businessName}>{business.name}</Text> : null}
              {header.showSlogan && business.slogan ? <Text style={styles.slogan}>{business.slogan}</Text> : null}
            </View>
          </View>
          <Text style={styles.statusRow}>{isVoid ? 'Voided' : 'Successful'}</Text>
          <Text style={styles.amount}>{formatMoney(receipt.amount, currency)}</Text>
        </View>

        <View style={styles.body}>
          {contactLines.length > 0 ? <Text style={styles.contactLine}>{contactLines.join(' · ')}</Text> : null}
          {taxLine ? <Text style={styles.taxLine}>{taxLine}</Text> : null}

          <View style={styles.grid}>
            <Field label="Reference" value={receipt.receiptNumber} />
            <Field label="Date" value={formatDateTime(receipt.createdAt)} />
            <Field label="Transaction ID" value={receipt.transactionId} />
            <Field label="Payment method" value={PAYMENT_LABELS[receipt.paymentMethod] ?? receipt.paymentMethod} />
            <Field label="Paid by" value={receipt.customer?.name} />
            <Field label="Phone" value={receipt.customer?.phone} />
            <Field label="Received by" value={cashierName} />
          </View>

          {receipt.narration ? (
            <View style={styles.narrationBlock}>
              <Text style={styles.fieldLabel}>Narration</Text>
              <Text style={styles.fieldValue}>{receipt.narration}</Text>
            </View>
          ) : null}

          {qrDataUrl ? <Image style={styles.qr} src={qrDataUrl} /> : null}

          {footerText ? <Text style={styles.footer}>{footerText}</Text> : null}
          {showPlatformBranding ? <Text style={styles.platformBrand}>Powered by Receipt</Text> : null}
        </View>
      </Page>
    </Document>
  );
}
