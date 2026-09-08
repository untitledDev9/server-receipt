import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { PAYMENT_LABELS, formatMoney, formatDateTime, getContactLines, getTaxLine, type ReceiptPdfProps } from './shared.js';

const styles = StyleSheet.create({
  page: { padding: 28, fontSize: 10, fontFamily: 'Helvetica', color: '#111827' },
  center: { textAlign: 'center' },
  logo: { width: 48, height: 48, marginBottom: 8, alignSelf: 'center', objectFit: 'contain' },
  businessName: { fontSize: 14, fontWeight: 700, marginBottom: 2 },
  slogan: { fontSize: 9, color: '#4b5563', marginBottom: 6 },
  contactLine: { fontSize: 8.5, color: '#4b5563' },
  taxLine: { fontSize: 7.5, color: '#9ca3af', marginTop: 2 },
  divider: { borderBottomWidth: 1, borderBottomColor: '#d1d5db', borderBottomStyle: 'dashed', marginVertical: 12 },
  statusBadge: { alignSelf: 'center', borderRadius: 4, paddingVertical: 4, paddingHorizontal: 10, marginBottom: 10 },
  statusBadgeSuccess: { backgroundColor: '#ecfdf5' },
  statusBadgeVoid: { backgroundColor: '#fef2f2' },
  statusTextSuccess: { color: '#059669', fontSize: 9, fontWeight: 700 },
  statusTextVoid: { color: '#dc2626', fontSize: 9, fontWeight: 700 },
  amount: { fontSize: 26, fontWeight: 700, textAlign: 'center', marginBottom: 14 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  metaLabel: { color: '#6b7280' },
  metaValue: { fontWeight: 700, maxWidth: '65%', textAlign: 'right' },
  footer: { marginTop: 16, textAlign: 'center', fontSize: 9, color: '#4b5563' },
  qr: { width: 70, height: 70, alignSelf: 'center', marginTop: 12 },
  platformBrand: { marginTop: 8, textAlign: 'center', fontSize: 7, color: '#9ca3af' },
});

export function ClassicPdf({ business, receipt, cashierName, qrDataUrl }: ReceiptPdfProps) {
  const { header, footerText, showPlatformBranding } = business.receiptConfig;
  const currency = business.currency;
  const isVoid = receipt.status === 'void';
  const taxLine = getTaxLine(business);

  return (
    <Document title={`${receipt.receiptNumber} - ${business.name}`}>
      {/* A6's width suits a receipt, but its height is too short for this
          layout and react-pdf has no "auto height" — it silently spills onto
          a near-blank second page instead. Keep A6's width, give it more room. */}
      <Page size={[297.6, 560]} style={styles.page}>
        <View style={styles.center}>
          {header.showLogo && business.logoUrl ? <Image style={styles.logo} src={business.logoUrl} /> : null}
          {header.showBusinessName ? <Text style={styles.businessName}>{business.name}</Text> : null}
          {header.showSlogan && business.slogan ? <Text style={styles.slogan}>{business.slogan}</Text> : null}
          {getContactLines(business).map((line, i) => (
            <Text key={i} style={styles.contactLine}>
              {line}
            </Text>
          ))}
          {taxLine ? <Text style={styles.taxLine}>{taxLine}</Text> : null}
        </View>

        <View style={styles.divider} />

        <View style={[styles.statusBadge, isVoid ? styles.statusBadgeVoid : styles.statusBadgeSuccess]}>
          <Text style={isVoid ? styles.statusTextVoid : styles.statusTextSuccess}>{isVoid ? 'VOIDED' : 'SUCCESSFUL'}</Text>
        </View>
        <Text style={styles.amount}>{formatMoney(receipt.amount, currency)}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Reference</Text>
          <Text style={styles.metaValue}>{receipt.receiptNumber}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Transaction ID</Text>
          <Text style={styles.metaValue}>{receipt.transactionId}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Date</Text>
          <Text style={styles.metaValue}>{formatDateTime(receipt.createdAt)}</Text>
        </View>
        {receipt.customer?.name ? (
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Paid by</Text>
            <Text style={styles.metaValue}>{receipt.customer.name}</Text>
          </View>
        ) : null}
        {receipt.customer?.phone ? (
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Phone</Text>
            <Text style={styles.metaValue}>{receipt.customer.phone}</Text>
          </View>
        ) : null}
        {receipt.narration ? (
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Narration</Text>
            <Text style={styles.metaValue}>{receipt.narration}</Text>
          </View>
        ) : null}
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Payment method</Text>
          <Text style={styles.metaValue}>{PAYMENT_LABELS[receipt.paymentMethod] ?? receipt.paymentMethod}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Received by</Text>
          <Text style={styles.metaValue}>{cashierName}</Text>
        </View>

        {qrDataUrl ? <Image style={styles.qr} src={qrDataUrl} /> : null}

        {footerText ? <Text style={styles.footer}>{footerText}</Text> : null}
        {showPlatformBranding ? <Text style={styles.platformBrand}>Powered by Receipt</Text> : null}
      </Page>
    </Document>
  );
}
