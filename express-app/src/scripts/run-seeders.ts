/**
 * Run pending seeders in order. Uses seed_log collection to track completed runs.
 * Re-runs a seeder when its file content changes (e.g. new role in DEFAULT_ROLES).
 * Preview: npm run seed:preview — shows which seeders would run (no changes).
 * Apply:  npm run seed:run — runs pending seeders and records them in seed_log.
 * Requires: MONGO_URI in environment (dotenv loaded).
 */
import 'dotenv/config';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { connectDB } from '../config/db';
import { seeders } from '../utils/seeders';

const LOG_COLLECTION = 'seed_log';
const DRY_RUN = process.argv.includes('--dry-run');
const SEEDERS_DIR = path.join(__dirname, '../utils/seeders');

function seederFileHash(seederName: string): string {
  const basePath = path.join(SEEDERS_DIR, seederName);
  const filePath = fs.existsSync(basePath + '.ts') ? basePath + '.ts' : basePath + '.js';
  if (!fs.existsSync(filePath)) {
    return crypto.createHash('sha256').update(seederName).digest('hex');
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  return crypto.createHash('sha256').update(content).digest('hex');
}

async function run(): Promise<void> {
  await connectDB();
  const conn = mongoose.connection;
  const log = conn.collection(LOG_COLLECTION);

  const logDocs = await log.find({}, { projection: { name: 1, hash: 1, seededSlugs: 1 } }).toArray();
  const logByName = new Map(logDocs.map((d) => [d.name, d]));

  const pending = seeders.filter((s) => {
    const stored = logByName.get(s.name);
    const currentHash = seederFileHash(s.name);
    return !stored || (stored as { hash?: string }).hash !== currentHash;
  });

  if (DRY_RUN) {
    await mongoose.disconnect();
    if (pending.length === 0) {
      console.log('No pending seeders. Seed data is up to date.');
      process.exit(0);
      return;
    }
    console.log('Pending seeders (would run in this order):\n');
    pending.forEach((s, i) => {
      const desc = s.description ? ` — ${s.description}` : '';
      console.log(`  ${i + 1}. ${s.name}${desc}`);
    });
    console.log('\nNo changes were made. Run "npm run seed:run" to apply.');
    process.exit(0);
    return;
  }

  for (const s of seeders) {
    const stored = logByName.get(s.name);
    const currentHash = seederFileHash(s.name);
    if (stored && (stored as { hash?: string }).hash === currentHash) {
      console.log(`Skip (unchanged): ${s.name}`);
      continue;
    }
    console.log(`Running: ${s.name}`);
    try {
      const storedDoc = logByName.get(s.name) as { seededSlugs?: string[] } | undefined;
      const previousSeededSlugs = storedDoc?.seededSlugs;
      await s.up(conn, { previousSeededSlugs });
      const seededSlugs = s.slugs?.() ?? [];
      await log.updateOne(
        { name: s.name },
        {
          $set: {
            name: s.name,
            hash: currentHash,
            seededSlugs,
            updatedAt: new Date(),
          },
        },
        { upsert: true }
      );
      console.log(`Done: ${s.name}`);
    } catch (err) {
      console.error(`Seeder failed: ${s.name}`, err);
      await mongoose.disconnect();
      process.exit(1);
    }
  }

  console.log('All seeders complete.');
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('Seeder runner failed:', err);
  process.exit(1);
});
