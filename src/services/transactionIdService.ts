import crypto from 'node:crypto';

/**
 * A long, purely numeric identifier in the style of a bank transfer's
 * session ID — distinct from the short, business-configured receiptNumber
 * ("Reference"). Timestamp-prefixed so it's naturally sortable and
 * effectively unique without a database round-trip to check.
 */
export function generateTransactionId(): string {
  const timestamp = Date.now().toString();
  const random = crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
  return `${timestamp}${random}`;
}
