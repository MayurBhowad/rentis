/**
 * Single migration flow: models (collections + indexes) + manual migrations.
 * Preview: npm run migration:preview — shows models to sync and pending migrations (no changes).
 * Apply:  npm run migration:run — syncs all models, then runs pending migrations.
 * Requires: MONGO_URI in environment (dotenv loaded).
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { connectDB } from '../config/db';
import { migrations } from '../migrations';

const LOG_COLLECTION = 'migration_log';
const MODELS_SYNC_KEY = '__models__';
const DRY_RUN = process.argv.includes('--dry-run');
const MODELS_DIR = path.join(__dirname, '..');

function findModelFiles(dir: string, files: string[] = []): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) findModelFiles(full, files);
    else if (e.name.endsWith('.model.ts') || e.name.endsWith('.model.js')) files.push(full);
  }
  return files;
}

function loadModels(): string[] {
  const modelFiles = findModelFiles(MODELS_DIR).sort();
  for (const file of modelFiles) {
    require(path.resolve(file));
  }
  return Object.keys(mongoose.models);
}

async function syncModels(): Promise<void> {
  const modelNames = Object.keys(mongoose.models);
  if (modelNames.length === 0) return;
  for (const name of modelNames) {
    const Model = mongoose.models[name];
    await Model.createCollection();
    await Model.syncIndexes();
    if (!DRY_RUN) console.log(`  OK (model): ${name}`);
  }
}

async function run(): Promise<void> {
  await connectDB();
  const conn = mongoose.connection;
  const log = conn.collection(LOG_COLLECTION);

  const done = new Set(
    (await log.find({}, { projection: { name: 1 } }).toArray()).map((d) => d.name)
  );
  const pending = migrations.filter((m) => !done.has(m.name));

  const modelNames = loadModels();
  const modelsSyncDoc = await log.findOne({ name: MODELS_SYNC_KEY });
  const syncedModelNames: string[] = Array.isArray(modelsSyncDoc?.modelNames)
    ? modelsSyncDoc.modelNames
    : [];
  const modelsToSync = modelNames.filter((n) => !syncedModelNames.includes(n));

  if (DRY_RUN) {
    await mongoose.disconnect();
    let hasAny = false;
    if (modelsToSync.length > 0) {
      console.log('Models to sync (collections + indexes):\n');
      modelsToSync.forEach((name, i) => console.log(`  ${i + 1}. ${name}`));
      hasAny = true;
    }
    if (pending.length > 0) {
      console.log('\nPending migrations (would run in this order):\n');
      pending.forEach((m, i) => {
        const desc = m.description ? ` — ${m.description}` : '';
        console.log(`  ${i + 1}. ${m.name}${desc}`);
      });
      hasAny = true;
    }
    if (!hasAny) console.log('Nothing to do. Models and migrations are up to date.');
    else console.log('\nNo changes were made. Run "npm run migration:run" to apply.');
    process.exit(0);
    return;
  }

  if (modelsToSync.length > 0) {
    console.log('Syncing models:', modelsToSync.join(', '));
    await syncModels();
    await log.updateOne(
      { name: MODELS_SYNC_KEY },
      { $set: { name: MODELS_SYNC_KEY, modelNames, updatedAt: new Date() } },
      { upsert: true }
    );
  }

  for (const m of migrations) {
    if (done.has(m.name)) {
      console.log(`Skip (already run): ${m.name}`);
      continue;
    }
    console.log(`Running: ${m.name}`);
    try {
      await m.up(conn);
      await log.insertOne({ name: m.name, createdAt: new Date() });
      console.log(`Done: ${m.name}`);
    } catch (err) {
      console.error(`Migration failed: ${m.name}`, err);
      await mongoose.disconnect();
      process.exit(1);
    }
  }

  console.log('All migrations complete.');
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('Migration runner failed:', err);
  process.exit(1);
});
