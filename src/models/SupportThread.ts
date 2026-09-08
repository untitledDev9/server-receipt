import { Schema, model, Types } from 'mongoose';

export type SupportSender = 'customer' | 'admin';
export type SupportThreadStatus = 'open' | 'resolved';

export interface SupportMessage {
  _id: Types.ObjectId;
  sender: SupportSender;
  body: string;
  createdAt: Date;
}

export interface SupportThreadDocument {
  _id: Types.ObjectId;
  businessId: Types.ObjectId;
  receiptId: Types.ObjectId;
  customerName?: string;
  customerEmail?: string;
  status: SupportThreadStatus;
  lastMessageAt: Date;
  messages: SupportMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const supportMessageSchema = new Schema<SupportMessage>(
  {
    sender: { type: String, enum: ['customer', 'admin'], required: true },
    body: { type: String, required: true, trim: true, maxlength: 2000 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const supportThreadSchema = new Schema<SupportThreadDocument>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    // One conversation per receipt keeps the model simple and matches the
    // product idea directly: the receipt itself is the conversation, not the visitor.
    receiptId: { type: Schema.Types.ObjectId, ref: 'Receipt', required: true, unique: true },
    customerName: { type: String, trim: true },
    customerEmail: { type: String, trim: true, lowercase: true },
    status: { type: String, enum: ['open', 'resolved'], default: 'open' },
    lastMessageAt: { type: Date, default: Date.now },
    messages: { type: [supportMessageSchema], default: [] },
  },
  { timestamps: true }
);

supportThreadSchema.index({ status: 1, lastMessageAt: -1 });

export const SupportThread = model<SupportThreadDocument>('SupportThread', supportThreadSchema);
