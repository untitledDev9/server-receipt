import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { PAYMENT_LABELS, formatMoney, formatDateTime, getContactLines, getTaxLine, type ReceiptPdfProps } from './shared.js';

const styles = StyleSheet.create({
  page: { padding: 28, fontSize: 10, fontFamily: 'Courier', color: '#1e293b', alignItems: 'center' },
  ticket: { width: 220, borderWidth: 1.5, borderColor: '#cbd5e1', borderStyle: 'dashed', padding: 16 },
  center: { textAlign: 'center' },
  logo: { width: 26, height: 26, marginBottom: 4, alignSelf: 'center', objectFit: 'contain' },
  businessName: { fontSize: 11, fontWeight: 700, textTransform: 'uppercase' },
  slogan: { fontSize: 8, color: '#64748b' },
  taxLine: { fontSize: 7, color: '#94a3b8' },
  divider: { borderTopWidth: 1, borderTopColor: '#cbd5e1', borderTopStyle: 'dashed', marginVertical: 10 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: 8.5, textTransform: 'uppercase', color: '#64748b' },
  statusSuccess: { fontSize: 8.5, fontWeight: 700, textTransform: 'uppercase', color: '#059669' },
  statusVoid: { fontSize: 8.5, fontWeight: 700, textTransform: 'uppercase', color: '#dc2626' },
  amountRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4, alignItems: 'center' },
  amount: { fontSize: 14, fontWeight: 700 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  rowValue: { fontWeight: 700, maxWidth: '60%', textAlign: 'right' },
  qr: { width: 52, height: 52, alignSelf: 'center', marginTop: 4 },
  footer: { marginTop: 8, textAlign: 'center', fontSize: 8 },
  platformBrand: { marginTop: 4, textAlign: 'center', fontSize: 6.5, color: '#94a3b8' },
});

export function CompactPdf({ business, receipt, cashierName, qrDataUrl }: ReceiptPdfProps) {
  const { header, footerText, showPlatformBranding } = business.receiptConfig;
  const currency = business.currency;
  const isVoid = receipt.status === 'void';
  const taxLine = getTaxLine(business);
  const contactLines = getContactLines(business);

  const rows: { label: string; value?: string }[] = [
    { label: 'Ref', value: receipt.receiptNumber },
    { label: 'Txn ID', value: receipt.transactionId },
    { label: 'Date', value: formatDateTime(receipt.createdAt) },
    { label: 'Paid by', value: receipt.customer?.name },
    { label: 'Phone', value: receipt.customer?.phone },
    { label: 'Note', value: receipt.narration },
    { label: 'Method', value: PAYMENT_LABELS[receipt.paymentMethod] ?? receipt.paymentMethod },
    { label: 'By', value: cashierName },
  ].filter((r) => r.value);

  return (
    <Document title={`${receipt.receiptNumber} - ${business.name}`}>
      <Page size={[297.6, 560]} style={styles.page}>
        <View style={styles.ticket}>
          <View style={styles.center}>
            {header.showLogo && business.logoUrl ? <Image style={styles.logo} src={business.logoUrl} /> : null}
            {header.showBusinessName ? <Text style={styles.businessName}>{business.name}</Text> : null}
            {header.showSlogan && business.slogan ? <Text style={styles.slogan}>{business.slogan}</Text> : null}
            {contactLines.map((line, i) => (
              <Text key={i} style={styles.slogan}>
                {line}
              </Text>
            ))}
            {taxLine ? <Text style={styles.taxLine}>{taxLine}</Text> : null}
          </View>

          <View style={styles.divider} />

          <View style={styles.statusRow}>
            <Text style={styles.label}>Status</Text>
            <Text style={isVoid ? styles.statusVoid : styles.statusSuccess}>{isVoid ? 'Voided' : 'Successful'}</Text>
          </View>
          <View style={styles.amountRow}>
            <Text style={styles.label}>Amount</Text>
            <Text style={styles.amount}>{formatMoney(receipt.amount, currency)}</Text>
          </View>

          <View style={styles.divider} />

          {rows.map((row) => (
            <View key={row.label} style={styles.row}>
              <Text style={styles.label}>{row.label}</Text>
              <Text style={styles.rowValue}>{row.value}</Text>
            </View>
          ))}

          {qrDataUrl ? (
            <>
              <View style={styles.divider} />
              <Image style={styles.qr} src={qrDataUrl} />
            </>
          ) : null}

          {footerText ? <Text style={styles.footer}>{footerText}</Text> : null}
          {showPlatformBranding ? <Text style={styles.platformBrand}>Powered by Receipt</Text> : null}
        </View>
      </Page>
    </Document>
  );
}
