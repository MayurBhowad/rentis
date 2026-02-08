import type { Connection } from 'mongoose';

/**
 * Example migration. Replace with real migrations or remove once you add your first.
 * Use cursor/streaming for large collections; keep migrations idempotent where possible.
 */
export const name = '001_example';
export const description = 'Create unique index on migration_log.name';
export async function up(conn: Connection): Promise<void> {
  await conn.collection('migration_log').createIndex({ name: 1 }, { unique: true, background: true });
}
