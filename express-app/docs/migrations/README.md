# Migrations

MongoDB migrations for this app. Uses a **migration runner** and a **migration_log** collection so each migration runs once and is safe to re-run.

## Two-step flow (models + migrations in one command)

1. **Preview (no changes)** — see models to sync and pending migrations:
   ```bash
   npm run migration:preview
   ```
   Shows:
   - **Models to sync** — all `*.model.ts` under `src/` (collections + indexes)
   - **Pending migrations** — manual migrations not yet in `migration_log`
   Does not modify the DB.

2. **Apply (modifies DB)** — after you approve, run:
   ```bash
   npm run migration:run
   ```
   First syncs all models (create collections, sync indexes), then runs pending migrations in order.

Models are **auto-detected** from any `*.model.ts` (or `*.model.js`) under `src/`. Add a new model file and it will appear in preview and be synced on run. No separate command.

Requires `MONGO_URI` in the environment (e.g. via `.env` or `dotenv`).

## Add a new migration (manual migrations)

1. **Create a file** in `src/migrations/` with a numeric prefix and description, e.g. `002_add_user_indexes.ts`.

2. **Export `name`, optional `description`, and `up`:**
   ```ts
   import type { Connection } from 'mongoose';

   export const name = '002_add_user_indexes';
   export const description = 'Add unique index on users.email';
   export async function up(conn: Connection): Promise<void> {
     await conn.collection('users').createIndex({ email: 1 }, { unique: true });
   }
   ```

3. **Register it** in `src/migrations/index.ts`:
   ```ts
   import * as m002 from './002_add_user_indexes';
   // ...
   export const migrations: Migration[] = [
     { name: m001.name, description: m001.description, up: m001.up },
     { name: m002.name, description: m002.description, up: m002.up },
   ];
   ```

4. Run `npm run migration:preview` to see it listed, then `npm run migration:run` to apply.

## Conventions

- **Order:** Migrations run in the order they appear in `migrations` in `index.ts`. Use the numeric prefix in the filename to keep order clear.
- **Idempotency:** Prefer idempotent operations (e.g. createIndex is idempotent; avoid inserting duplicate data unless you guard by a unique key).
- **Large collections:** Use a cursor/stream to iterate; do not load all documents into memory. Example:
  ```ts
  const cursor = conn.collection('users').find({ someCondition }).batchSize(500);
  for await (const doc of cursor) {
    await conn.collection('users').updateOne({ _id: doc._id }, { $set: { ... } });
  }
  ```
- **Zero downtime:** For schema changes, use the expand-and-contract pattern: add new fields, dual-write, backfill in a migration, then in a later release remove old fields.

## migration_log

The runner records each completed migration in the `migration_log` collection with `name` and `createdAt`. Do not edit this collection by hand unless you need to re-run a migration (remove its entry).

---

# Seeders

Seeders feed **initial/reference data** (e.g. default roles, tenants). Run after migrations.

## Commands

- **Preview (no changes):** `npm run seed:preview` — lists pending seeders.
- **Apply:** `npm run seed:run` — runs pending seeders and records them in `seed_log`.

## Add a seeder

1. **Create a file** in `src/utils/seeders/`, e.g. `002_tenants.ts`:
   ```ts
   import type { Connection } from 'mongoose';
   import { Tenant } from '../../user/Tenant.model';

   export const name = '002_tenants';
   export const description = 'Seed default tenants';
   export async function up(conn: Connection): Promise<void> {
     const exists = await Tenant.exists({ slug: 'default' });
     if (!exists) await Tenant.create({ name: 'Default', slug: 'default' });
   }
   ```

2. **Register it** in `src/utils/seeders/index.ts`:
   ```ts
   import * as s002 from './002_tenants';
   export const seeders: Seeder[] = [
     { name: s001.name, description: s001.description, up: s001.up },
     { name: s002.name, description: s002.description, up: s002.up },
   ];
   ```

3. Run `npm run seed:preview` then `npm run seed:run`.

Keep seeders **idempotent** (e.g. check by slug/unique key before insert) so re-running is safe. Completed seeders are stored in the `seed_log` collection.
