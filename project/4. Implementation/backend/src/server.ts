import { buildApp } from './app.js';

import type { StartServer } from './server.contract.js';

export const startServer: StartServer = async () => {
  const app = await buildApp({
    databasePath: process.env.DATABASE_PATH,
    migrationsDirectory: process.env.MIGRATIONS_DIR,
    staticDirectory: process.env.STATIC_DIR,
  });
  const port = Number(process.env.PORT ?? 3000);
  await app.listen({ host: '0.0.0.0', port });
};

await startServer();
