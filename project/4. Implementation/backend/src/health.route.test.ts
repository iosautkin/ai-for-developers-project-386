import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

import Database from 'better-sqlite3';
import { afterEach, describe, expect, it } from 'vitest';

import { buildApp } from './app.js';

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

describe('GET /api/health', () => {
  it('[API-SYS-001] reports that the process and database are ready', async () => {
    const directory = await mkdtemp(resolve(tmpdir(), 'calendar-foundation-'));
    temporaryDirectories.push(directory);
    const app = await buildApp({
      databasePath: resolve(directory, 'test.sqlite'),
      migrationsDirectory: resolve(import.meta.dirname, '../drizzle'),
      staticDirectory: resolve(directory, 'missing-static'),
    });

    const response = await app.inject({ method: 'GET', url: '/api/health' });
    await app.close();

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
  });

  it('[API-SYS-002] hides internal details of an unexpected database error', async () => {
    const directory = await mkdtemp(resolve(tmpdir(), 'calendar-foundation-'));
    temporaryDirectories.push(directory);
    const databasePath = resolve(directory, 'test.sqlite');
    const app = await buildApp({
      databasePath,
      migrationsDirectory: resolve(import.meta.dirname, '../drizzle'),
      staticDirectory: resolve(directory, 'missing-static'),
    });
    const database = new Database(databasePath);
    database.exec('DROP TABLE meeting_types');
    database.close();

    const response = await app.inject({ method: 'GET', url: '/api/meeting-types' });
    await app.close();
    const body = response.json();

    expect(response.statusCode).toBe(500);
    expect(body).toEqual({
      code: 'INTERNAL_ERROR',
      message: 'Внутренняя ошибка сервера.',
    });
    expect(JSON.stringify(body)).not.toMatch(/stack|sql|select|meeting_types/i);
  });
});
