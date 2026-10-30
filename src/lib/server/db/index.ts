import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import * as schema from './schema';

const path = process.env.DATABASE_PATH ?? './data/tindify.db';
mkdirSync(dirname(path), { recursive: true });

const sqlite = new Database(path);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });

// Les migrations versionnées dans /drizzle s'appliquent au démarrage.
migrate(db, { migrationsFolder: process.env.MIGRATIONS_PATH ?? './drizzle' });

export { schema };
