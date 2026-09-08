import { z } from 'zod';

export const sendSupportMessageSchema = z.object({
  body: z.string().trim().min(1).max(2000),
  name: z.string().trim().max(150).optional(),
  email: z.string().trim().email().optional().or(z.literal('')),
});

export const replySupportMessageSchema = sendSupportMessageSchema.pick({ body: true });

export const listSupportThreadsQuerySchema = z.object({
  status: z.enum(['open', 'resolved']).optional(),
  businessId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const updateSupportThreadStatusSchema = z.object({
  status: z.enum(['open', 'resolved']),
});
