import type { Request, Response } from 'express';
import { SupportThread, type SupportMessage } from '../models/SupportThread.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { resolvePublicReceipt } from './receiptController.js';
import { getIO } from '../realtime/socket.js';
import {
  sendSupportMessageSchema,
  replySupportMessageSchema,
  listSupportThreadsQuerySchema,
  updateSupportThreadStatusSchema,
} from '../validation/supportValidation.js';

function emitToReceiptRoom(receiptId: string, event: string, payload: unknown) {
  getIO()?.to(`support:${receiptId}`).emit(event, payload);
}

function emitAdminActivity(threadId: string) {
  getIO()?.to('support:admin').emit('support:activity', { threadId });
}

export const getPublicSupportThread = asyncHandler(async (req: Request, res: Response) => {
  const { receipt } = await resolvePublicReceipt(req.params.slug, req.params.receiptNumber);
  const thread = await SupportThread.findOne({ receiptId: receipt._id });
  res.json({ thread, receiptId: receipt._id });
});

export const sendPublicSupportMessage = asyncHandler(async (req: Request, res: Response) => {
  const data = sendSupportMessageSchema.parse(req.body);
  const { business, receipt } = await resolvePublicReceipt(req.params.slug, req.params.receiptNumber);

  let thread = await SupportThread.findOne({ receiptId: receipt._id });
  if (!thread) {
    thread = new SupportThread({ businessId: business._id, receiptId: receipt._id });
  }
  if (data.name) thread.customerName = data.name;
  if (data.email) thread.customerEmail = data.email;
  thread.messages.push({ sender: 'customer', body: data.body, createdAt: new Date() } as SupportMessage);
  thread.lastMessageAt = new Date();
  // A new message from the customer means the conversation needs attention again.
  thread.status = 'open';
  await thread.save();

  const receiptId = receipt._id.toString();
  const newMessage = thread.messages[thread.messages.length - 1];
  emitToReceiptRoom(receiptId, 'support:message', {
    threadId: thread._id,
    message: newMessage,
    status: thread.status,
    lastMessageAt: thread.lastMessageAt,
  });
  emitAdminActivity(thread._id.toString());

  res.status(201).json({ thread, receiptId: receipt._id });
});

export const listSupportThreads = asyncHandler(async (req: Request, res: Response) => {
  const query = listSupportThreadsQuerySchema.parse(req.query);
  const filter: Record<string, unknown> = {};
  if (query.status) filter.status = query.status;
  if (query.businessId) filter.businessId = query.businessId;

  const threadsQuery = SupportThread.find(filter)
    .sort({ lastMessageAt: -1 })
    .skip((query.page - 1) * query.limit)
    .limit(query.limit)
    .populate('businessId', 'name slug')
    .populate('receiptId', 'receiptNumber amount status createdAt customer');

  const [threads, total] = await Promise.all([threadsQuery, SupportThread.countDocuments(filter)]);
  res.json({ threads, total, page: query.page, limit: query.limit, pages: Math.ceil(total / query.limit) });
});

export const getSupportThread = asyncHandler(async (req: Request, res: Response) => {
  const thread = await SupportThread.findById(req.params.id).populate('businessId').populate('receiptId');
  if (!thread) throw ApiError.notFound('Conversation not found');
  res.json({ thread });
});

export const replySupportThread = asyncHandler(async (req: Request, res: Response) => {
  const data = replySupportMessageSchema.parse(req.body);
  const thread = await SupportThread.findById(req.params.id);
  if (!thread) throw ApiError.notFound('Conversation not found');

  const receiptId = thread.receiptId.toString();
  thread.messages.push({ sender: 'admin', body: data.body, createdAt: new Date() } as SupportMessage);
  thread.lastMessageAt = new Date();
  await thread.save();

  const newMessage = thread.messages[thread.messages.length - 1];
  emitToReceiptRoom(receiptId, 'support:message', {
    threadId: thread._id,
    message: newMessage,
    status: thread.status,
    lastMessageAt: thread.lastMessageAt,
  });
  emitAdminActivity(thread._id.toString());

  await thread.populate(['businessId', 'receiptId']);
  res.status(201).json({ thread });
});

export const updateSupportThreadStatus = asyncHandler(async (req: Request, res: Response) => {
  const data = updateSupportThreadStatusSchema.parse(req.body);
  const thread = await SupportThread.findById(req.params.id);
  if (!thread) throw ApiError.notFound('Conversation not found');

  const receiptId = thread.receiptId.toString();
  thread.status = data.status;
  await thread.save();

  emitToReceiptRoom(receiptId, 'support:status', { threadId: thread._id, status: thread.status });
  emitAdminActivity(thread._id.toString());

  await thread.populate(['businessId', 'receiptId']);
  res.json({ thread });
});
