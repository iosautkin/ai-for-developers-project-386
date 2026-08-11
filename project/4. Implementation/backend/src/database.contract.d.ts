import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';

/** Open SQLite resources owned by one application instance. */
export interface DatabaseConnection {
  readonly orm: BetterSQLite3Database;
  readonly close: () => void;
}

/** Opens SQLite, enables safety pragmas, and applies committed migrations. */
export type OpenDatabase = (
  databasePath: string,
  migrationsDirectory: string,
) => DatabaseConnection;
