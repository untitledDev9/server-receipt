import type { Request, Response } from 'express';
import { Business } from '../models/Business.js';
import { Receipt } from '../models/Receipt.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { createBusinessSchema, updateBusinessSchema } from '../validation/businessValidation.js';
import { isSlugAvailable, suggestSlug } from '../services/slugService.js';
import { storageService } from '../services/storageService.js';
import { isReservedSlug } from '../config/reservedSlugs.js';

export const listBusinesses = asyncHandler(async (req: Request, res: Response) => {
  const { search, status, page = '1', limit = '20' } = req.query as Record<string, string>;
  const filter: Record<string, unknown> = {};
  if (status && status !== 'all') filter.status = status;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { slug: { $regex: search, $options: 'i' } },
    ];
  }

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(100, Math.max(1, Number(limit)));

  const [businesses, total] = await Promise.all([
    Business.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Business.countDocuments(filter),
  ]);

  res.json({ businesses, total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) });
});

export const suggestBusinessSlug = asyncHandler(async (req: Request, res: Response) => {
  const name = String(req.query.name ?? '');
  if (!name.trim()) throw ApiError.badRequest('name is required');
  const slug = await suggestSlug(name);
  res.json({ slug });
});

export const checkSlugAvailability = asyncHandler(async (req: Request, res: Response) => {
  const slug = String(req.query.slug ?? '').toLowerCase();
  const excludeId = req.query.excludeId as string | undefined;
  if (!slug) throw ApiError.badRequest('slug is required');
  const available = await isSlugAvailable(slug, excludeId);
  res.json({ available, reserved: isReservedSlug(slug) });
});

export const createBusiness = asyncHandler(async (req: Request, res: Response) => {
  const data = createBusinessSchema.parse(req.body);

  let slug = data.slug ? data.slug.toLowerCase() : await suggestSlug(data.name);
  if (!(await isSlugAvailable(slug))) {
    throw ApiError.conflict(`Slug "${slug}" is already taken or reserved`);
  }

  const business = await Business.create({
    name: data.name,
    slug,
    slogan: data.slogan,
    description: data.description,
    address: data.address,
    phone: data.phone,
    whatsapp: data.whatsapp,
    email: data.email || undefined,
    website: data.website,
    taxId: data.taxId,
    registrationNumber: data.registrationNumber,
    currency: data.currency ?? 'USD',
    branding: data.branding,
    receiptConfig: data.receiptConfig,
    createdBy: req.user!.userId,
  });

  res.status(201).json({ business });
});

export const getBusiness = asyncHandler(async (req: Request, res: Response) => {
  const business = await Business.findById(req.params.id);
  if (!business) throw ApiError.notFound('Bank not found');
  res.json({ business });
});

export const updateBusiness = asyncHandler(async (req: Request, res: Response) => {
  const data = updateBusinessSchema.parse(req.body);
  const business = await Business.findById(req.params.id);
  if (!business) throw ApiError.notFound('Bank not found');

  if (data.slug && data.slug !== business.slug) {
    if (!(await isSlugAvailable(data.slug, business._id.toString()))) {
      throw ApiError.conflict(`Slug "${data.slug}" is already taken or reserved`);
    }
    business.slug = data.slug;
  }

  const { branding, receiptConfig, address, ...rest } = data;
  Object.assign(business, rest);
  if (address) Object.assign(business.address, address);
  if (branding) Object.assign(business.branding, branding);
  if (receiptConfig) {
    const { header, numbering, paymentMethods, customerFields, ...restConfig } = receiptConfig;
    Object.assign(business.receiptConfig, restConfig);
    if (header) Object.assign(business.receiptConfig.header, header);
    if (numbering) Object.assign(business.receiptConfig.numbering, numbering);
    if (paymentMethods) Object.assign(business.receiptConfig.paymentMethods, paymentMethods);
    if (customerFields) Object.assign(business.receiptConfig.customerFields, customerFields);
  }

  await business.save();
  res.json({ business });
});

export const setBusinessStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.body as { status: 'active' | 'suspended' };
  if (!['active', 'suspended'].includes(status)) {
    throw ApiError.badRequest('status must be "active" or "suspended"');
  }
  const business = await Business.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!business) throw ApiError.notFound('Bank not found');
  res.json({ business });
});

export const deleteBusiness = asyncHandler(async (req: Request, res: Response) => {
  const business = await Business.findByIdAndDelete(req.params.id);
  if (!business) throw ApiError.notFound('Bank not found');
  await Receipt.deleteMany({ businessId: business._id });
  res.json({ success: true });
});

export const uploadBusinessLogo = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw ApiError.badRequest('No file uploaded');
  const business = await Business.findById(req.params.id);
  if (!business) throw ApiError.notFound('Bank not found');

  storageService.remove(business.logoUrl?.split('/').pop());
  business.logoUrl = storageService.urlFor(req.file.filename);
  await business.save();
  res.json({ business });
});

export const uploadBusinessFavicon = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw ApiError.badRequest('No file uploaded');
  const business = await Business.findById(req.params.id);
  if (!business) throw ApiError.notFound('Bank not found');

  storageService.remove(business.faviconUrl?.split('/').pop());
  business.faviconUrl = storageService.urlFor(req.file.filename);
  await business.save();
  res.json({ business });
});

export const getPublicBusiness = asyncHandler(async (req: Request, res: Response) => {
  const business = await Business.findOne({ slug: req.params.slug.toLowerCase() }).select(
    'name slug slogan description logoUrl faviconUrl address phone whatsapp email website taxId registrationNumber currency status branding receiptConfig'
  );
  if (!business) throw ApiError.notFound('Bank not found');
  res.json({ business });
});

export const getPlatformStats = asyncHandler(async (_req: Request, res: Response) => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [
    totalBusinesses,
    activeBusinesses,
    suspendedBusinesses,
    totalReceipts,
    receiptsToday,
    receiptsThisMonth,
    recentBusinesses,
    recentReceipts,
  ] = await Promise.all([
    Business.countDocuments(),
    Business.countDocuments({ status: 'active' }),
    Business.countDocuments({ status: 'suspended' }),
    Receipt.countDocuments(),
    Receipt.countDocuments({ createdAt: { $gte: startOfToday } }),
    Receipt.countDocuments({ createdAt: { $gte: startOfMonth } }),
    Business.find().sort({ createdAt: -1 }).limit(5).select('name slug status createdAt'),
    Receipt.find().sort({ createdAt: -1 }).limit(5).populate('businessId', 'name slug'),
  ]);

  res.json({
    totalBusinesses,
    activeBusinesses,
    suspendedBusinesses,
    totalReceipts,
    receiptsToday,
    receiptsThisMonth,
    recentBusinesses,
    recentReceipts,
  });
});
