import type { Request, Response } from 'express';
import { Receipt } from '../models/Receipt.js';
import { Business } from '../models/Business.js';
import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { createReceiptSchema, updateReceiptSchema, listReceiptsQuerySchema } from '../validation/receiptValidation.js';
import { nextReceiptNumber } from '../services/numberingService.js';
import { generateReceiptPdf } from '../services/pdfService.js';
import { generateReceiptQrDataUrl } from '../services/qrService.js';
import { generateTransactionId } from '../services/transactionIdService.js';

export const createReceipt = asyncHandler(async (req: Request, res: Response) => {
  const data = createReceiptSchema.parse(req.body);

  const business = await Business.findById(data.businessId);
  if (!business) throw ApiError.notFound('Bank not found');
  if (business.status !== 'active') throw ApiError.forbidden('This bank is suspended');

  const receiptNumber = await nextReceiptNumber(data.businessId);

  const receipt = await Receipt.create({
    businessId: data.businessId,
    receiptNumber,
    transactionId: generateTransactionId(),
    amount: data.amount,
    narration: data.narration,
    customer: data.customer,
    paymentMethod: data.paymentMethod,
    cashierId: req.user!.userId,
    cashierName: data.cashierName,
  });

  res.status(201).json({ receipt });
});

export const listReceipts = asyncHandler(async (req: Request, res: Response) => {
  const query = listReceiptsQuerySchema.parse(req.query);

  // No businessId means "every business" (the platform-wide receipts view);
  // the single admin is authorized to see all of them either way.
  const filter: Record<string, unknown> = {};
  if (query.businessId) filter.businessId = query.businessId;
  if (query.paymentMethod) filter.paymentMethod = query.paymentMethod;
  if (query.search) {
    filter.$or = [
      { receiptNumber: { $regex: query.search, $options: 'i' } },
      { narration: { $regex: query.search, $options: 'i' } },
      { 'customer.name': { $regex: query.search, $options: 'i' } },
      { 'customer.phone': { $regex: query.search, $options: 'i' } },
    ];
  }
  if (query.from || query.to) {
    const range: Record<string, Date> = {};
    if (query.from) range.$gte = new Date(query.from);
    if (query.to) range.$lte = new Date(query.to);
    filter.createdAt = range;
  }

  const receiptsQuery = Receipt.find(filter)
    .sort({ createdAt: -1 })
    .skip((query.page - 1) * query.limit)
    .limit(query.limit)
    .populate('cashierId', 'name')
    .populate('businessId', 'name slug');

  const [receipts, total] = await Promise.all([receiptsQuery, Receipt.countDocuments(filter)]);

  res.json({ receipts, total, page: query.page, limit: query.limit, pages: Math.ceil(total / query.limit) });
});

async function loadReceipt(req: Request) {
  const receipt = await Receipt.findById(req.params.id).populate('cashierId', 'name');
  if (!receipt) throw ApiError.notFound('Receipt not found');
  return receipt;
}

export const getReceipt = asyncHandler(async (req: Request, res: Response) => {
  const receipt = await loadReceipt(req);
  const business = await Business.findById(receipt.businessId).select('slug receiptConfig.publicReceiptEnabled');
  const qrDataUrl = business?.receiptConfig.publicReceiptEnabled
    ? await generateReceiptQrDataUrl(business.slug, receipt.receiptNumber)
    : undefined;
  res.json({ receipt, qrDataUrl });
});

export const updateReceipt = asyncHandler(async (req: Request, res: Response) => {
  const data = updateReceiptSchema.parse(req.body);
  const receipt = await loadReceipt(req);
  if (receipt.status === 'void') throw ApiError.badRequest('Cannot edit a voided receipt');

  if (data.amount !== undefined) receipt.amount = data.amount;
  if (data.narration !== undefined) receipt.narration = data.narration;
  if (data.customer !== undefined) receipt.customer = data.customer;
  if (data.paymentMethod !== undefined) receipt.paymentMethod = data.paymentMethod;
  if (data.cashierName !== undefined) receipt.cashierName = data.cashierName;
  await receipt.save();

  res.json({ receipt });
});

export const getReceiptPdf = asyncHandler(async (req: Request, res: Response) => {
  const receipt = await loadReceipt(req);
  const business = await Business.findById(receipt.businessId);
  if (!business) throw ApiError.notFound('Bank not found');
  const cashier = await User.findById(receipt.cashierId).select('name');

  const pdfBuffer = await generateReceiptPdf(business, receipt, receipt.cashierName || cashier?.name || 'Staff');
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${receipt.receiptNumber}.pdf"`);
  res.send(pdfBuffer);
});

export const duplicateReceipt = asyncHandler(async (req: Request, res: Response) => {
  const original = await loadReceipt(req);
  const business = await Business.findById(original.businessId);
  if (!business) throw ApiError.notFound('Bank not found');
  if (business.status !== 'active') throw ApiError.forbidden('This bank is suspended');

  const receiptNumber = await nextReceiptNumber(business._id.toString());
  const receipt = await Receipt.create({
    businessId: original.businessId,
    receiptNumber,
    transactionId: generateTransactionId(),
    amount: original.amount,
    narration: original.narration,
    customer: original.customer,
    paymentMethod: original.paymentMethod,
    cashierId: req.user!.userId,
    cashierName: original.cashierName,
  });

  res.status(201).json({ receipt });
});

export const voidReceipt = asyncHandler(async (req: Request, res: Response) => {
  const receipt = await loadReceipt(req);
  receipt.status = 'void';
  await receipt.save();
  res.json({ receipt });
});

export async function resolvePublicReceipt(slug: string, receiptNumber: string) {
  const business = await Business.findOne({ slug: slug.toLowerCase() });
  if (!business || business.status !== 'active') throw ApiError.notFound('Bank not found');
  if (!business.receiptConfig.publicReceiptEnabled) throw ApiError.forbidden('Public receipt viewing is disabled for this bank');

  const receipt = await Receipt.findOne({ businessId: business._id, receiptNumber });
  if (!receipt) throw ApiError.notFound('Receipt not found');

  return { business, receipt };
}

export const getPublicReceipt = asyncHandler(async (req: Request, res: Response) => {
  const { business, receipt } = await resolvePublicReceipt(req.params.slug, req.params.receiptNumber);
  const qrDataUrl = await generateReceiptQrDataUrl(business.slug, receipt.receiptNumber);
  res.json({ receipt: sanitizeReceipt(receipt), business: sanitizeBusiness(business), qrDataUrl });
});

export const verifyReceipt = asyncHandler(async (req: Request, res: Response) => {
  const bizSlug = req.query.biz as string | undefined;
  let receipt;
  let business;

  if (bizSlug) {
    business = await Business.findOne({ slug: bizSlug.toLowerCase() });
    if (!business) throw ApiError.notFound('Receipt could not be verified');
    receipt = await Receipt.findOne({ businessId: business._id, receiptNumber: req.params.receiptNumber });
  } else {
    const matches = await Receipt.find({ receiptNumber: req.params.receiptNumber }).limit(2);
    if (matches.length !== 1) {
      throw ApiError.notFound('Receipt could not be verified. Use the verification link from your receipt.');
    }
    receipt = matches[0];
    business = await Business.findById(receipt.businessId);
  }

  if (!receipt || !business) throw ApiError.notFound('Receipt could not be verified');

  res.json({
    valid: receipt.status === 'completed',
    receiptNumber: receipt.receiptNumber,
    transactionId: receipt.transactionId,
    businessName: business.name,
    amount: receipt.amount,
    currency: business.currency,
    date: receipt.createdAt,
    status: receipt.status,
  });
});

export const getTenantDashboardStats = asyncHandler(async (req: Request, res: Response) => {
  const businessIdParam = req.query.businessId as string | undefined;
  if (!businessIdParam) throw ApiError.badRequest('businessId query parameter is required');
  const businessId = businessIdParam;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [todayAgg, monthAgg, recentReceipts] = await Promise.all([
    Receipt.aggregate([
      { $match: { businessId, createdAt: { $gte: startOfToday }, status: 'completed' } },
      { $group: { _id: null, sales: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    Receipt.aggregate([
      { $match: { businessId, createdAt: { $gte: startOfMonth }, status: 'completed' } },
      { $group: { _id: null, sales: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    Receipt.find({ businessId }).sort({ createdAt: -1 }).limit(8).populate('cashierId', 'name'),
  ]);

  const today = todayAgg[0] ?? { sales: 0, count: 0 };
  const month = monthAgg[0] ?? { sales: 0, count: 0 };

  res.json({
    todaySales: today.sales,
    receiptsToday: today.count,
    monthSales: month.sales,
    receiptsThisMonth: month.count,
    averageReceipt: month.count ? Math.round((month.sales / month.count) * 100) / 100 : 0,
    recentReceipts,
  });
});

function sanitizeBusiness(business: InstanceType<typeof Business>) {
  return {
    _id: business._id,
    name: business.name,
    slug: business.slug,
    slogan: business.slogan,
    description: business.description,
    logoUrl: business.logoUrl,
    address: business.address,
    phone: business.phone,
    whatsapp: business.whatsapp,
    email: business.email,
    website: business.website,
    taxId: business.taxId,
    registrationNumber: business.registrationNumber,
    currency: business.currency,
    status: business.status,
    branding: business.branding,
    receiptConfig: business.receiptConfig,
    createdAt: business.createdAt,
    updatedAt: business.updatedAt,
  };
}

function sanitizeReceipt(receipt: InstanceType<typeof Receipt>) {
  return {
    _id: receipt._id,
    businessId: receipt.businessId,
    receiptNumber: receipt.receiptNumber,
    transactionId: receipt.transactionId,
    amount: receipt.amount,
    narration: receipt.narration,
    customer: receipt.customer,
    paymentMethod: receipt.paymentMethod,
    status: receipt.status,
    createdAt: receipt.createdAt,
    updatedAt: receipt.updatedAt,
  };
}
