import { Business } from '../models/Business.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Atomically claims the next receipt number for a business. Using
 * findOneAndUpdate with $inc means two concurrent receipt creations for the
 * same tenant can never be handed the same number, without needing a
 * separate counters collection or a transaction.
 */
export async function nextReceiptNumber(businessId: string): Promise<string> {
  const business = await Business.findOneAndUpdate(
    { _id: businessId },
    { $inc: { 'receiptConfig.numbering.nextNumber': 1 } },
    { new: false } // return the pre-increment document so we know the number we just claimed
  ).select('receiptConfig.numbering');

  if (!business) {
    throw ApiError.notFound('Bank not found');
  }

  const { prefix, nextNumber, padding } = business.receiptConfig.numbering;
  return `${prefix}-${String(nextNumber).padStart(padding, '0')}`;
}
