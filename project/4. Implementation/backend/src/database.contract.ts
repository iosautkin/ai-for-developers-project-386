import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';

/**
 * SQLite lifecycle boundary for one application instance.
 *
 * The module owns the native SQLite handle, enables foreign keys, WAL and a bounded busy timeout,
 * applies committed migrations, and exposes only the Drizzle ORM plus an explicit close operation.
 */

/** Maximum time SQLite waits for a competing writer before reporting that the database is busy. */
export const SQLITE_BUSY_TIMEOUT_MILLISECONDS = 5_000;

/** Open SQLite resources owned by one application instance. */
export interface DatabaseConnection {
  /** Drizzle API used by repositories. */
  readonly orm: BetterSQLite3Database;
  /** Releases the native SQLite handle. */
  readonly close: () => void;
}

/** Opens SQLite, enables safety pragmas, and applies committed migrations before returning. */
export type OpenDatabase = (
  databasePath: string, // SQLite file created or opened by the module
  migrationsDirectory: string, // committed migrations applied before the connection is returned
) => DatabaseConnection;
