import { Schema, model, Types } from 'mongoose';
import type { PaymentMethod, ReceiptStatus } from '../types/index.js';

export interface ReceiptCustomer {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface ReceiptDocument {
  _id: Types.ObjectId;
  businessId: Types.ObjectId;
  receiptNumber: string;
  transactionId: string;
  amount: number;
  narration?: string;
  customer: ReceiptCustomer;
  paymentMethod: PaymentMethod;
  cashierId: Types.ObjectId;
  // Freeform override for "Received by" on the receipt — lets the single
  // admin account attribute a receipt to whichever real-world teller/cashier
  // handled it, instead of every receipt always showing the admin's name.
  cashierName?: string;
  status: ReceiptStatus;
  createdAt: Date;
  updatedAt: Date;
}

const receiptSchema = new Schema<ReceiptDocument>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    receiptNumber: { type: String, required: true },
    transactionId: { type: String, required: true, unique: true },
    amount: { type: Number, required: true, min: 0 },
    narration: { type: String, trim: true },
    customer: {
      name: String,
      phone: String,
      email: String,
      address: String,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'transfer', 'pos', 'card', 'mobile_money', 'other'],
      default: 'cash',
    },
    cashierId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    cashierName: { type: String, trim: true },
    status: { type: String, enum: ['completed', 'void'], default: 'completed' },
  },
  { timestamps: true }
);

receiptSchema.index({ businessId: 1, receiptNumber: 1 }, { unique: true });
receiptSchema.index({ businessId: 1, createdAt: -1 });

export const Receipt = model<ReceiptDocument>('Receipt', receiptSchema);
