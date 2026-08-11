import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

import type { OpenDatabase } from './database.contract.js';

export const openDatabase: OpenDatabase = (databasePath, migrationsDirectory) => {
  const sqlite = new Database(databasePath);
  sqlite.pragma('foreign_keys = ON');
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('busy_timeout = 5000');

  const orm = drizzle(sqlite);
  migrate(orm, { migrationsFolder: migrationsDirectory });

  return {
    orm,
    close: () => sqlite.close(),
  };
};
