import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

import { buildApp } from '../backend/dist/app.js';

export default async function globalSetup(): Promise<() => Promise<void>> {
  const directory = await mkdtemp(resolve(tmpdir(), 'calendar-e2e-'));
  const app = await buildApp({
    databasePath: resolve(directory, 'e2e.sqlite'),
    migrationsDirectory: resolve(import.meta.dirname, '../backend/drizzle'),
    staticDirectory: resolve(import.meta.dirname, '../frontend/dist'),
  });
  await app.listen({ host: '127.0.0.1', port: 3000 });

  return async () => {
    await app.close();
    await rm(directory, { force: true, recursive: true });
  };
}
