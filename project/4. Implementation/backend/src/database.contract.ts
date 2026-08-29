import { sql } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { check, index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

/**
 * SQLite lifecycle boundary for one application instance.
 *
 * The module owns the native SQLite handle, enables foreign keys, WAL and a bounded busy timeout,
 * applies committed migrations, and exposes the typed Drizzle ORM plus an explicit close operation.
 */

/** Maximum time SQLite waits for a competing writer before reporting that the database is busy. */
export const SQLITE_BUSY_TIMEOUT_MILLISECONDS = 5_000;

/** Stable identity of the only owner supported by this educational product. */
export const OWNER_ID = 'owner-1';

/** Display name returned in every owner summary. */
export const OWNER_DISPLAY_NAME = 'Иван';

/** Persisted singleton owner profile. */
export const owners = sqliteTable('owners', {
  id: text('id').primaryKey(),
  displayName: text('display_name').notNull(),
});

/** Owner-created meeting types ordered by their internal sequence. */
export const meetingTypes = sqliteTable(
  'meeting_types',
  {
    sequence: integer('sequence').primaryKey({ autoIncrement: true }),
    id: text('id').notNull(),
    ownerId: text('owner_id')
      .notNull()
      .references(() => owners.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    title: text('title').notNull(),
    description: text('description').notNull(),
    durationMinutes: integer('duration_minutes').notNull(),
    createdAtMs: integer('created_at_ms').notNull(),
  },
  (table) => [
    uniqueIndex('meeting_types_public_id_unique').on(table.id),
    check(
      'meeting_types_duration_valid',
      sql`${table.durationMinutes} >= 15 and ${table.durationMinutes} <= 540 and ${table.durationMinutes} % 15 = 0`,
    ),
  ],
);

/** Guest booking snapshots and their globally exclusive time intervals. */
export const bookings = sqliteTable(
  'bookings',
  {
    id: text('id').primaryKey(),
    ownerId: text('owner_id')
      .notNull()
      .references(() => owners.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    meetingTypeId: text('meeting_type_id')
      .notNull()
      .references(() => meetingTypes.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    guestName: text('guest_name').notNull(),
    guestEmail: text('guest_email').notNull(),
    guestNote: text('guest_note'),
    startsAtMs: integer('starts_at_ms').notNull(),
    endsAtMs: integer('ends_at_ms').notNull(),
    createdAtMs: integer('created_at_ms').notNull(),
  },
  (table) => [
    index('bookings_interval_idx').on(table.startsAtMs, table.endsAtMs),
    check('bookings_interval_valid', sql`${table.endsAtMs} > ${table.startsAtMs}`),
  ],
);

/** Schema passed to Drizzle so all service queries retain row and column types. */
export const databaseSchema = { bookings, meetingTypes, owners };

/** Open SQLite resources owned by one application instance. */
export interface DatabaseConnection {
  /** Drizzle API used directly by business services. */
  readonly orm: BetterSQLite3Database<typeof databaseSchema>;
  /** Releases the native SQLite handle. */
  readonly close: () => void;
}

/** Opens SQLite, enables safety pragmas, and applies committed migrations before returning. */
export type OpenDatabase = (
  databasePath: string, // SQLite file created or opened by the module
  migrationsDirectory: string, // committed migrations applied before the connection is returned
) => DatabaseConnection;
