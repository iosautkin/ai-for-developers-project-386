import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import fastifyStatic from '@fastify/static';
import Fastify from 'fastify';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';

import type { BuildApp } from './app.contract.js';
import { openDatabase } from './database.js';
import { registerHealthRoute } from './health.route.js';

const moduleDirectory = dirname(fileURLToPath(import.meta.url));

export const buildApp: BuildApp = async (options = {}) => {
  const databasePath = options.databasePath ?? resolve(process.cwd(), 'data/calendar.sqlite');
  const migrationsDirectory = options.migrationsDirectory ?? resolve(moduleDirectory, '../drizzle');
  const staticDirectory =
    options.staticDirectory ?? resolve(moduleDirectory, '../../frontend/dist');

  mkdirSync(dirname(databasePath), { recursive: true });

  const database = openDatabase(databasePath, migrationsDirectory);
  const app = Fastify({ logger: process.env.NODE_ENV !== 'test' });
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  app.addHook('onClose', () => database.close());

  registerHealthRoute(app);

  if (existsSync(staticDirectory)) {
    await app.register(fastifyStatic, {
      root: staticDirectory,
      wildcard: false,
    });
    app.get('/*', (_request, reply) => reply.sendFile('index.html'));
  }

  return app;
};
