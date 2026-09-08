export const RESERVED_SLUGS = new Set([
  'admin',
  'sharp',
  'businesses',
  'receipts',
  'support',
  'login',
  'register',
  'logout',
  'api',
  'verify',
  'r',
  'static',
  'assets',
  'public',
  'help',
  'about',
  'pricing',
  'contact',
  'terms',
  'privacy',
  'favicon.ico',
  'robots.txt',
  'dashboard',
  'settings',
  'signup',
  'signin',
]);

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase());
}
