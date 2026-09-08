import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { loginSchema } from '../validation/authValidation.js';
import { clearSessionCookie, setSessionCookie, signToken } from '../middleware/auth.js';

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, rememberMe } = loginSchema.parse(req.body);

  const user = await User.findOne({ email });
  if (!user || !user.isActive) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = signToken({ userId: user._id.toString(), role: user.role }, rememberMe);
  setSessionCookie(res, token, rememberMe);

  res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } });
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  clearSessionCookie(res);
  res.json({ success: true });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }
  const user = await User.findById(req.user.userId).select('-passwordHash');
  if (!user) {
    throw ApiError.unauthorized();
  }

  res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } });
});
