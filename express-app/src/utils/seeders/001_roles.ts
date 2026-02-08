import type { Connection } from 'mongoose';
import { Role } from '../../user/Role.model';

export const name = '001_roles';
export const description = 'Seed default roles';

const DEFAULT_ROLES = [
  { name: 'Admin', slug: 'admin' },
  { name: 'User', slug: 'user' },
  { name: 'Manager', slug: 'manager' },
];

export function slugs(): string[] {
  return DEFAULT_ROLES.map((r) => r.slug);
}

export async function up(
  conn: Connection,
  context?: { previousSeededSlugs?: string[] }
): Promise<void> {
  const currentSlugs = slugs();
  const previousSlugs = context?.previousSeededSlugs ?? [];

  for (const r of DEFAULT_ROLES) {
    const exists = await Role.exists({ slug: r.slug });
    if (!exists) {
      await Role.create(r);
    }
  }

  const toRemove = previousSlugs.filter((s) => !currentSlugs.includes(s));
  if (toRemove.length > 0) {
    await Role.deleteMany({ slug: { $in: toRemove } });
  }
}
