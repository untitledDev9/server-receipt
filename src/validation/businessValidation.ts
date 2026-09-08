import { z } from 'zod';

const addressSchema = z
  .object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
  })
  .partial();

const brandingSchema = z
  .object({
    primaryColor: z.string(),
    secondaryColor: z.string(),
    accentColor: z.string(),
    textColor: z.string(),
    headerStyle: z.enum(['centered', 'left', 'split']),
  })
  .partial();

const headerConfigSchema = z
  .object({
    showLogo: z.boolean(),
    showBusinessName: z.boolean(),
    showSlogan: z.boolean(),
    showAddress: z.boolean(),
    showPhone: z.boolean(),
    showEmail: z.boolean(),
    showWebsite: z.boolean(),
    order: z.array(z.string()),
  })
  .partial();

const numberingSchema = z
  .object({
    prefix: z.string().min(1).max(10),
    startingNumber: z.number().int().min(0),
    padding: z.number().int().min(1).max(10),
  })
  .partial();

const paymentMethodsSchema = z
  .object({
    cash: z.boolean(),
    transfer: z.boolean(),
    pos: z.boolean(),
    card: z.boolean(),
    mobileMoney: z.boolean(),
    other: z.boolean(),
  })
  .partial();

const customerFieldsSchema = z
  .object({
    name: z.boolean(),
    phone: z.boolean(),
    email: z.boolean(),
    address: z.boolean(),
  })
  .partial();

const receiptConfigSchema = z
  .object({
    template: z.enum(['classic', 'modern', 'formal', 'minimal', 'compact']),
    header: headerConfigSchema,
    footerText: z.string().max(500),
    numbering: numberingSchema,
    paymentMethods: paymentMethodsSchema,
    customerFields: customerFieldsSchema,
    publicReceiptEnabled: z.boolean(),
    showPlatformBranding: z.boolean(),
  })
  .partial();

export const createBusinessSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(40).regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens').optional(),
  slogan: z.string().max(150).optional(),
  description: z.string().max(500).optional(),
  address: addressSchema.optional(),
  phone: z.string().max(30).optional(),
  whatsapp: z.string().max(30).optional(),
  email: z.string().email().optional().or(z.literal('')),
  website: z.string().max(200).optional(),
  taxId: z.string().max(60).optional(),
  registrationNumber: z.string().max(60).optional(),
  currency: z.string().min(3).max(3).optional(),
  branding: brandingSchema.optional(),
  receiptConfig: receiptConfigSchema.optional(),
});

export const updateBusinessSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  slug: z.string().min(2).max(40).regex(/^[a-z0-9-]+$/).optional(),
  slogan: z.string().max(150).optional(),
  description: z.string().max(500).optional(),
  address: addressSchema.optional(),
  phone: z.string().max(30).optional(),
  whatsapp: z.string().max(30).optional(),
  email: z.string().email().optional().or(z.literal('')),
  website: z.string().max(200).optional(),
  taxId: z.string().max(60).optional(),
  registrationNumber: z.string().max(60).optional(),
  currency: z.string().min(3).max(3).optional(),
  branding: brandingSchema.optional(),
  receiptConfig: receiptConfigSchema.optional(),
});

export const slugCheckSchema = z.object({
  slug: z.string().min(2).max(40),
  excludeId: z.string().optional(),
});
