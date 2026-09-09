import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import type { JwtPayload } from '../types/index.js';

const COOKIE_NAME = 'receipt_session';
const REMEMBER_ME_EXPIRY = '30d';
const REMEMBER_ME_COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000;
// This is a single-admin private tool, not a multi-user public app — there's
// little security upside to a short-lived default session, and it was
// causing re-logins mid-workday. Still a plain browser-session cookie (no
// maxAge) unless "Remember me" is checked, so it clears on full browser close.
const SESSION_EXPIRY = '7d';

export function signToken(payload: JwtPayload, rememberMe = false): string {
  const expiresIn = rememberMe ? REMEMBER_ME_EXPIRY : SESSION_EXPIRY;
  return jwt.sign(payload, env.jwtSecret, { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] });
}

// In dev, the client only ever talks to its own origin — Vite's proxy
// forwards /api behind the scenes, so the browser sees this as same-site
// and `lax` works. In production the client and API are on different
// domains, so the cookie needs `sameSite: 'none'`, which browsers only
// honor when `secure` is also set (HTTPS-only).
const isCrossSite = env.nodeEnv === 'production';

/**
 * Persistent (rememberMe) cookies get a maxAge so they survive browser
 * restarts; without it, omitting maxAge/expires makes the cookie a session
 * cookie that the browser drops as soon as it's closed.
 */
export function setSessionCookie(res: Response, token: string, rememberMe = false): void {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: isCrossSite ? 'none' : 'lax',
    secure: isCrossSite,
    ...(rememberMe ? { maxAge: REMEMBER_ME_COOKIE_MAX_AGE } : {}),
    path: '/',
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME, { path: '/', sameSite: isCrossSite ? 'none' : 'lax', secure: isCrossSite });
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) {
    throw ApiError.unauthorized('Authentication required');
  }
  try {
    const decoded = jwt.verify(token, env.jwtSecret) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    throw ApiError.unauthorized('Invalid or expired session');
  }
}
