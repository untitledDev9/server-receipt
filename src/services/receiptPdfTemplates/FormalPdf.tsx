import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { PAYMENT_LABELS, formatMoney, formatDateTime, getContactLines, getTaxLine, type ReceiptPdfProps } from './shared.js';

const styles = StyleSheet.create({
  page: { padding: 24, fontSize: 10, fontFamily: 'Helvetica', color: '#111827' },
  document: { flexGrow: 1, borderWidth: 1.5, borderColor: '#1e293b', padding: 18 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottomWidth: 1.5, borderBottomColor: '#1e293b', paddingBottom: 10 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
  logo: { width: 30, height: 30, marginRight: 8, objectFit: 'contain' },
  businessName: { fontSize: 12, fontWeight: 700, textTransform: 'uppercase' },
  slogan: { fontSize: 8.5, color: '#64748b' },
  badge: { borderWidth: 1, borderRadius: 3, paddingVertical: 3, paddingHorizontal: 8 },
  badgePaid: { borderColor: '#047857' },
  badgeVoid: { borderColor: '#dc2626' },
  badgeTextPaid: { fontSize: 8, fontWeight: 700, color: '#047857', textTransform: 'uppercase' },
  badgeTextVoid: { fontSize: 8, fontWeight: 700, color: '#dc2626', textTransform: 'uppercase' },
  contactBlock: { marginTop: 8 },
  contactLine: { fontSize: 8.5, color: '#64748b' },
  taxLine: { fontSize: 7.5, color: '#94a3b8', marginTop: 2 },
  receiptNoLabel: { marginTop: 16, textAlign: 'center', fontSize: 8, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 },
  table: { marginTop: 8, borderWidth: 1, borderColor: '#cbd5e1' },
  tableRow: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingVertical: 6, paddingHorizontal: 10 },
  tableRowLast: { borderBottomWidth: 0 },
  tableLabel: { fontSize: 8.5, color: '#64748b' },
  tableValue: { fontSize: 8.5, fontWeight: 700, textAlign: 'right', maxWidth: '65%' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1.5, borderTopColor: '#1e293b', paddingTop: 10, marginTop: 10 },
  totalLabel: { fontSize: 9, fontWeight: 700, textTransform: 'uppercase' },
  totalValue: { fontSize: 17, fontWeight: 700 },
  qr: { width: 60, height: 60, alignSelf: 'center', marginTop: 14 },
  footer: { marginTop: 12, textAlign: 'center', fontSize: 8.5, color: '#64748b' },
  platformBrand: { marginTop: 6, textAlign: 'center', fontSize: 7, color: '#cbd5e1' },
});

export function FormalPdf({ business, receipt, cashierName, qrDataUrl }: ReceiptPdfProps) {
  const { header, footerText, showPlatformBranding } = business.receiptConfig;
  const currency = business.currency;
  const isVoid = receipt.status === 'void';
  const taxLine = getTaxLine(business);
  const contactLines = getContactLines(business);

  const rows: { label: string; value?: string }[] = [
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
        <View style={styles.document}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              {header.showLogo && business.logoUrl ? <Image style={styles.logo} src={business.logoUrl} /> : null}
              <View>
                {header.showBusinessName ? <Text style={styles.businessName}>{business.name}</Text> : null}
                {header.showSlogan && business.slogan ? <Text style={styles.slogan}>{business.slogan}</Text> : null}
              </View>
            </View>
            <View style={[styles.badge, isVoid ? styles.badgeVoid : styles.badgePaid]}>
              <Text style={isVoid ? styles.badgeTextVoid : styles.badgeTextPaid}>{isVoid ? 'Void' : 'Paid'}</Text>
            </View>
          </View>

          <View style={styles.contactBlock}>
            {contactLines.map((line, i) => (
              <Text key={i} style={styles.contactLine}>
                {line}
              </Text>
            ))}
            {taxLine ? <Text style={styles.taxLine}>{taxLine}</Text> : null}
          </View>

          <Text style={styles.receiptNoLabel}>Receipt No. {receipt.receiptNumber}</Text>

          <View style={styles.table}>
            {rows.map((row, i) => (
              <View key={row.label} style={[styles.tableRow, i === rows.length - 1 ? styles.tableRowLast : {}]}>
                <Text style={styles.tableLabel}>{row.label}</Text>
                <Text style={styles.tableValue}>{row.value}</Text>
              </View>
            ))}
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={[styles.totalValue, { color: business.branding.primaryColor }]}>{formatMoney(receipt.amount, currency)}</Text>
          </View>

          {qrDataUrl ? <Image style={styles.qr} src={qrDataUrl} /> : null}

          {footerText ? <Text style={styles.footer}>{footerText}</Text> : null}
          {showPlatformBranding ? <Text style={styles.platformBrand}>Powered by Receipt</Text> : null}
        </View>
      </Page>
    </Document>
  );
}
