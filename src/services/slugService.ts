import { Business } from '../models/Business.js';
import { isReservedSlug } from '../config/reservedSlugs.js';

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

export async function isSlugAvailable(slug: string, excludeBusinessId?: string): Promise<boolean> {
  if (!slug || isReservedSlug(slug)) return false;
  const existing = await Business.findOne({ slug }).select('_id').lean();
  if (!existing) return true;
  return excludeBusinessId ? existing._id.toString() === excludeBusinessId : false;
}

export async function suggestSlug(name: string): Promise<string> {
  const base = slugify(name) || 'bank';
  if (await isSlugAvailable(base)) return base;

  for (let i = 2; i < 100; i++) {
    const candidate = `${base}-${i}`;
    if (await isSlugAvailable(candidate)) return candidate;
  }
  return `${base}-${Date.now()}`;
}
