import { Schema, model, Types } from 'mongoose';
import type { BusinessStatus } from '../types/index.js';

export interface ReceiptHeaderConfig {
  showLogo: boolean;
  showBusinessName: boolean;
  showSlogan: boolean;
  showAddress: boolean;
  showPhone: boolean;
  showEmail: boolean;
  showWebsite: boolean;
  order: string[];
}

export interface NumberingConfig {
  prefix: string;
  startingNumber: number;
  nextNumber: number;
  padding: number;
}

export interface PaymentMethodsConfig {
  cash: boolean;
  transfer: boolean;
  pos: boolean;
  card: boolean;
  mobileMoney: boolean;
  other: boolean;
}

export interface CustomerFieldsConfig {
  name: boolean;
  phone: boolean;
  email: boolean;
  address: boolean;
}

export interface BrandingConfig {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  textColor: string;
  headerStyle: 'centered' | 'left' | 'split';
}

export type ReceiptTemplate = 'classic' | 'modern' | 'formal' | 'minimal' | 'compact';

export interface ReceiptConfig {
  template: ReceiptTemplate;
  header: ReceiptHeaderConfig;
  footerText: string;
  numbering: NumberingConfig;
  paymentMethods: PaymentMethodsConfig;
  customerFields: CustomerFieldsConfig;
  publicReceiptEnabled: boolean;
  showPlatformBranding: boolean;
}

export interface BusinessDocument {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  slogan?: string;
  description?: string;
  logoUrl?: string;
  faviconUrl?: string;
  address: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
  };
  phone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  taxId?: string;
  registrationNumber?: string;
  currency: string;
  status: BusinessStatus;
  branding: BrandingConfig;
  receiptConfig: ReceiptConfig;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const addressSchema = new Schema(
  {
    street: String,
    city: String,
    state: String,
    country: String,
  },
  { _id: false }
);

const brandingSchema = new Schema<BrandingConfig>(
  {
    primaryColor: { type: String, default: '#111827' },
    secondaryColor: { type: String, default: '#4b5563' },
    accentColor: { type: String, default: '#2563eb' },
    textColor: { type: String, default: '#111827' },
    headerStyle: { type: String, enum: ['centered', 'left', 'split'], default: 'centered' },
  },
  { _id: false }
);

const receiptConfigSchema = new Schema<ReceiptConfig>(
  {
    template: { type: String, enum: ['classic', 'modern', 'formal', 'minimal', 'compact'], default: 'classic' },
    header: {
      showLogo: { type: Boolean, default: true },
      showBusinessName: { type: Boolean, default: true },
      showSlogan: { type: Boolean, default: true },
      showAddress: { type: Boolean, default: true },
      showPhone: { type: Boolean, default: true },
      showEmail: { type: Boolean, default: false },
      showWebsite: { type: Boolean, default: false },
      order: {
        type: [String],
        default: ['logo', 'businessName', 'slogan', 'address', 'phone', 'email', 'website'],
      },
    },
    footerText: { type: String, default: 'Thank you for your patronage!' },
    numbering: {
      prefix: { type: String, default: 'RC' },
      startingNumber: { type: Number, default: 1000 },
      nextNumber: { type: Number, default: 1000 },
      padding: { type: Number, default: 6 },
    },
    paymentMethods: {
      cash: { type: Boolean, default: true },
      transfer: { type: Boolean, default: true },
      pos: { type: Boolean, default: true },
      card: { type: Boolean, default: true },
      mobileMoney: { type: Boolean, default: true },
      other: { type: Boolean, default: true },
    },
    customerFields: {
      name: { type: Boolean, default: true },
      phone: { type: Boolean, default: true },
      email: { type: Boolean, default: false },
      address: { type: Boolean, default: false },
    },
    publicReceiptEnabled: { type: Boolean, default: true },
    showPlatformBranding: { type: Boolean, default: false },
  },
  { _id: false }
);

const businessSchema = new Schema<BusinessDocument>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    slogan: { type: String, trim: true },
    description: { type: String, trim: true },
    logoUrl: String,
    faviconUrl: String,
    address: { type: addressSchema, default: () => ({}) },
    phone: String,
    whatsapp: String,
    email: String,
    website: String,
    taxId: String,
    registrationNumber: String,
    currency: { type: String, default: 'USD' },
    status: { type: String, enum: ['active', 'suspended'], default: 'active' },
    branding: { type: brandingSchema, default: () => ({}) },
    receiptConfig: { type: receiptConfigSchema, default: () => ({}) },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Business = model<BusinessDocument>('Business', businessSchema);
