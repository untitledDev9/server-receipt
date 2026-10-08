import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { PAYMENT_LABELS, formatMoney, formatDateTime, getContactLines, getTaxLine, maskAccountNumber, type ReceiptPdfProps } from './shared.js';

const styles = StyleSheet.create({
  page: { fontSize: 10, fontFamily: 'Helvetica', color: '#111827', backgroundColor: '#ffffff' },
  header: { padding: 24, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  logo: { width: 40, height: 40, marginRight: 12, objectFit: 'contain' },
  businessName: { fontSize: 14, fontWeight: 700, color: '#111827' },
  slogan: { fontSize: 8, color: '#64748b' },
  amountLabel: { fontSize: 7, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 },
  amount: { fontSize: 28, fontWeight: 700, color: '#111827' },
  statusBadge: { marginTop: 8, fontSize: 9, fontWeight: 700, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  contactLine: { fontSize: 8, color: '#64748b', marginBottom: 6, textAlign: 'center' },
  taxLine: { fontSize: 7.5, color: '#64748b', textAlign: 'center' },
  statusStamp: { padding: 24, textAlign: 'center', fontSize: 18, fontWeight: 700, textTransform: 'uppercase' },
  body: { padding: 24, paddingTop: 16 },
  detailsBox: { padding: 12, marginBottom: 12, borderRadius: 4, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
  detailsLabel: { fontSize: 7, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 4 },
  detailsName: { fontSize: 10, fontWeight: 700, color: '#111827', marginBottom: 2 },
  detailsValue: { fontSize: 8, color: '#64748b' },
  transactionDetails: { borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 10, marginTop: 4 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 },
  metaLabel: { fontSize: 7, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' },
  metaValue: { fontSize: 9, fontWeight: 700, color: '#111827', textAlign: 'right' },
  qrSection: { margin: 16, padding: 16, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 4 },
  qrContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qr: { width: 56, height: 56 },
  qrText: { flex: 1 },
  qrTitle: { fontSize: 9, fontWeight: 700, color: '#111827' },
  qrDescription: { fontSize: 7.5, color: '#64748b', marginTop: 2 },
});

function DetailBox({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.detailsBox}>
      <Text style={styles.detailsLabel}>{label}</Text>
      {children}
    </View>
  );
}

function MetaRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <View style={styles.metaRow}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

function getStatusColor(status: string): { bg: string; border: string; text: string } {
  switch (status) {
    case 'reversed':
      return { bg: '#fee2e2', border: '#fecaca', text: '#991b1b' };
    case 'pending':
      return { bg: '#fef3c7', border: '#fcd34d', text: '#92400e' };
    case 'refunded':
      return { bg: '#fed7aa', border: '#fdba74', text: '#9a3412' };
    default:
      return { bg: '#dcfce7', border: '#bbf7d0', text: '#166534' };
  }
}

export function WhitePdf({ business, receipt, cashierName, qrDataUrl }: ReceiptPdfProps) {
  const { header, footerText, showPlatformBranding } = business.receiptConfig;
  const currency = business.currency;
  const primary = business.branding.primaryColor || '#3b82f6';

  const contactLines = getContactLines(business);
  const taxLine = getTaxLine(business);
  const status = receipt.status || 'completed';
  const statusColor = getStatusColor(status);
  const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);

  const senderName = receipt.sender?.name || business.name;
  const senderBank = receipt.sender?.bankName || business.bankName;
  const senderAccount = receipt.sender?.accountNumber || business.accountNumber;

  return (
    <Document title={`${receipt.receiptNumber} - ${business.name}`}>
      <Page size={[297.6, 840]} style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            {header.showLogo && business.logoUrl ? (
              <Image style={styles.logo} src={business.logoUrl} />
            ) : (
              <View style={{ width: 40, height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 4 }}>
                <Text style={{ fontSize: 16, fontWeight: 700, color: primary }}>{business.name.charAt(0)}</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              {header.showBusinessName ? <Text style={styles.businessName}>{business.name}</Text> : null}
            </View>
          </View>

          {/* Amount */}
          <View>
            <Text style={styles.amountLabel}>Amount</Text>
            <Text style={[styles.amount, { color: primary }]}>{formatMoney(receipt.amount, currency)}</Text>
          </View>

          {/* Status Badge */}
          {receipt.status && (
            <View style={[styles.statusBadge, { backgroundColor: statusColor.bg, borderWidth: 1, borderColor: statusColor.border }]}>
              <Text style={{ color: statusColor.text }}>{statusLabel}</Text>
            </View>
          )}
        </View>

        {/* Contact Info */}
        {(contactLines.length > 0 || taxLine) && (
          <View style={{ borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingVertical: 8, paddingHorizontal: 24 }}>
            {contactLines.map((line, idx) => (
              <Text key={idx} style={styles.contactLine}>{line}</Text>
            ))}
            {taxLine && <Text style={styles.taxLine}>{taxLine}</Text>}
          </View>
        )}

        {/* Status Stamp */}
        {receipt.status && (
          <View style={[styles.statusStamp, { backgroundColor: statusColor.bg, borderWidth: 2, borderColor: statusColor.border }]}>
            <Text style={{ color: statusColor.text, transform: 'rotate(-3deg)' }}>{statusLabel}</Text>
          </View>
        )}

        {/* Body */}
        <View style={styles.body}>
          {/* Recipient Details */}
          {(receipt.customer?.name || receipt.customer?.bankName || receipt.customer?.accountNumber) && (
            <DetailBox label="Recipient Details">
              {receipt.customer?.name && <Text style={styles.detailsName}>{receipt.customer.name}</Text>}
              {(receipt.customer?.bankName || receipt.customer?.accountNumber) && (
                <Text style={styles.detailsValue}>
                  {receipt.customer.bankName}
                  {receipt.customer.accountNumber ? ` | ${receipt.customer.accountNumber}` : ''}
                </Text>
              )}
            </DetailBox>
          )}

          {/* Sender Details */}
          {(senderName || senderBank || senderAccount) && (
            <DetailBox label="Sender Details">
              <Text style={styles.detailsName}>{senderName}</Text>
              {(senderBank || senderAccount) && (
                <Text style={styles.detailsValue}>
                  {senderBank}
                  {senderAccount ? ` | ${maskAccountNumber(senderAccount)}` : ''}
                </Text>
              )}
            </DetailBox>
          )}

          {/* Transaction Details */}
          <View style={styles.transactionDetails}>
            {receipt.receiptNumber && <MetaRow label="Reference" value={receipt.receiptNumber} />}
            {receipt.transactionId && <MetaRow label="Transaction No." value={receipt.transactionId} />}
            {receipt.createdAt && <MetaRow label="Date" value={formatDateTime(receipt.createdAt)} />}
            {receipt.paymentMethod && <MetaRow label="Method" value={PAYMENT_LABELS[receipt.paymentMethod]} />}
            {receipt.customer?.phone && <MetaRow label="Phone" value={receipt.customer.phone} />}
            {receipt.narration && <MetaRow label="Note" value={receipt.narration} />}
            {cashierName && <MetaRow label="Received by" value={cashierName} />}
          </View>
        </View>

        {/* QR Section */}
        {business.receiptConfig.publicReceiptEnabled && (
          <View style={styles.qrSection}>
            <View style={styles.qrContainer}>
              {qrDataUrl ? (
                <Image style={styles.qr} src={qrDataUrl} />
              ) : (
                <View style={{ width: 56, height: 56, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f5f9' }}>
                  <Text style={{ fontSize: 12, color: '#cbd5e1' }}>QR</Text>
                </View>
              )}
              <View style={styles.qrText}>
                <Text style={styles.qrTitle}>Verify Receipt</Text>
                <Text style={styles.qrDescription}>Scan with your phone to confirm this receipt is genuine.</Text>
              </View>
            </View>
          </View>
        )}

        {/* Footer */}
        {footerText && (
          <View style={{ paddingHorizontal: 24, paddingBottom: 12, textAlign: 'center' }}>
            <Text style={{ fontSize: 7.5, color: '#9ca3af' }}>{footerText}</Text>
          </View>
        )}

        {showPlatformBranding && (
          <View style={{ paddingHorizontal: 24, paddingBottom: 6, textAlign: 'center' }}>
            <Text style={{ fontSize: 6.5, color: '#cbd5e1' }}>Powered by Sharp Receipt</Text>
          </View>
        )}
      </Page>
    </Document>
  );
}
