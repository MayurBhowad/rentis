import type { Connection } from 'mongoose';
import * as s001 from './001_roles';

export interface SeederContext {
  /** Slugs we seeded last run; remove from DB if no longer in seeder. */
  previousSeededSlugs?: string[];
}

export interface Seeder {
  name: string;
  description?: string;
  /** Return current slugs this seeder manages; used to sync removals. */
  slugs?: () => string[];
  up: (conn: Connection, context?: SeederContext) => Promise<void>;
}

export const seeders: Seeder[] = [
  { name: s001.name, description: s001.description, slugs: s001.slugs, up: s001.up },
  // Add new seeders here, e.g.:
  // { name: s002.name, description: s002.description, slugs: s002.slugs, up: s002.up },
];
