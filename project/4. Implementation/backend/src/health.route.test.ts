import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

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
  it('reports that the process and database are ready', async () => {
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
});
