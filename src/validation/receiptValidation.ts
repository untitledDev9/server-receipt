import { z } from 'zod';

export const createReceiptSchema = z.object({
  businessId: z.string().min(1),
  amount: z.number().positive(),
  narration: z.string().max(300).optional(),
  customer: z
    .object({
      name: z.string().max(150).optional(),
      phone: z.string().max(30).optional(),
      email: z.string().email().optional().or(z.literal('')),
      address: z.string().max(300).optional(),
    })
    .optional(),
  paymentMethod: z.enum(['cash', 'transfer', 'pos', 'card', 'mobile_money', 'other']),
  cashierName: z.string().max(150).optional(),
});

export const updateReceiptSchema = createReceiptSchema.omit({ businessId: true }).partial();

export const listReceiptsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  paymentMethod: z.enum(['cash', 'transfer', 'pos', 'card', 'mobile_money', 'other']).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  businessId: z.string().optional(),
});
