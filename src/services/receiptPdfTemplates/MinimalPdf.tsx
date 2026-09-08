import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { PAYMENT_LABELS, formatMoney, formatDateTime, getContactLines, getTaxLine, type ReceiptPdfProps } from './shared.js';

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: 'Helvetica', color: '#1e293b' },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  logo: { width: 28, height: 28, marginRight: 10, objectFit: 'contain' },
  businessName: { fontSize: 13, fontWeight: 500 },
  slogan: { fontSize: 9, color: '#94a3b8' },
  contactLine: { fontSize: 8.5, color: '#94a3b8' },
  taxLine: { fontSize: 7.5, color: '#94a3b8' },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 26 },
  dot: { width: 5, height: 5, borderRadius: 2.5, marginRight: 5 },
  dotSuccess: { backgroundColor: '#10b981' },
  dotVoid: { backgroundColor: '#ef4444' },
  statusText: { fontSize: 9, fontWeight: 500, color: '#64748b' },
  amount: { fontSize: 20, fontWeight: 700, marginTop: 4, color: '#0f172a' },
  table: { marginTop: 22, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  rowLabel: { fontSize: 7.5, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' },
  rowValue: { fontSize: 9.5, color: '#1e293b', textAlign: 'right', maxWidth: '65%' },
  qr: { width: 56, height: 56, marginTop: 22 },
  footer: { marginTop: 22, fontSize: 9, color: '#94a3b8' },
  platformBrand: { marginTop: 6, fontSize: 7, color: '#cbd5e1' },
});

export function MinimalPdf({ business, receipt, cashierName, qrDataUrl }: ReceiptPdfProps) {
  const { header, footerText, showPlatformBranding } = business.receiptConfig;
  const currency = business.currency;
  const isVoid = receipt.status === 'void';
  const taxLine = getTaxLine(business);
  const contactLines = getContactLines(business);

  const rows: { label: string; value?: string }[] = [
    { label: 'Reference', value: receipt.receiptNumber },
    { label: 'Transaction ID', value: receipt.transactionId },
    { label: 'Date', value: formatDateTime(receipt.createdAt) },
    { label: 'Paid by', value: receipt.customer?.name },
    { label: 'Phone', value: receipt.customer?.phone },
    { label: 'Narration', value: receipt.narration },
    { label: 'Payment method', value: PAYMENT_LABELS[receipt.paymentMethod] ?? receipt.paymentMethod },
    { label: 'Received by', value: cashierName },
  ].filter((r) => r.value);

  return (
    <Document title={`${receipt.receiptNumber} - ${business.name}`}>
      <Page size={[297.6, 560]} style={styles.page}>
        <View style={styles.headerRow}>
          {header.showLogo && business.logoUrl ? <Image style={styles.logo} src={business.logoUrl} /> : null}
          <View>
            {header.showBusinessName ? <Text style={styles.businessName}>{business.name}</Text> : null}
            {header.showSlogan && business.slogan ? <Text style={styles.slogan}>{business.slogan}</Text> : null}
          </View>
        </View>
        {contactLines.map((line, i) => (
          <Text key={i} style={styles.contactLine}>
            {line}
          </Text>
        ))}
        {taxLine ? <Text style={styles.taxLine}>{taxLine}</Text> : null}

        <View style={styles.statusRow}>
          <View style={[styles.dot, isVoid ? styles.dotVoid : styles.dotSuccess]} />
          <Text style={styles.statusText}>{isVoid ? 'Voided' : 'Successful'}</Text>
        </View>
        <Text style={styles.amount}>{formatMoney(receipt.amount, currency)}</Text>

        <View style={styles.table}>
          {rows.map((row) => (
            <View key={row.label} style={styles.row}>
              <Text style={styles.rowLabel}>{row.label}</Text>
              <Text style={styles.rowValue}>{row.value}</Text>
            </View>
          ))}
        </View>

        {qrDataUrl ? <Image style={styles.qr} src={qrDataUrl} /> : null}

        {footerText ? <Text style={styles.footer}>{footerText}</Text> : null}
        {showPlatformBranding ? <Text style={styles.platformBrand}>Powered by Receipt</Text> : null}
      </Page>
    </Document>
  );
}
