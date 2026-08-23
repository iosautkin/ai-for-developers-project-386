import { buildApp } from './app.js';

import { DEFAULT_SERVER_PORT, SERVER_HOST, type StartServer } from './server.contract.js';

export const startServer: StartServer = async () => {
  const app = await buildApp({
    databasePath: process.env.DATABASE_PATH,
    migrationsDirectory: process.env.MIGRATIONS_DIR,
    staticDirectory: process.env.STATIC_DIR,
  });
  const port = Number(process.env.PORT ?? DEFAULT_SERVER_PORT);
  await app.listen({ host: SERVER_HOST, port });
};

await startServer();
