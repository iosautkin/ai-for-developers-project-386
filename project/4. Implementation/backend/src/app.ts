import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import fastifyStatic from '@fastify/static';
import Fastify from 'fastify';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';

import { ApiFailure } from './api-failure.js';
import type { BuildApp } from './app.contract.js';
import { registerAvailabilityRoute } from './availability.route.js';
import { registerBookingsRoutes } from './bookings.route.js';
import { createCalendarService } from './calendar.service.js';
import { openDatabase } from './database.js';
import { registerHealthRoute } from './health.route.js';
import { registerMeetingTypesRoutes } from './meeting-types.route.js';

const moduleDirectory = dirname(fileURLToPath(import.meta.url));

interface ValidationIssue {
  readonly instancePath: string;
  readonly message?: string | undefined;
}

const hasValidationIssues = (error: unknown): error is { validation: ValidationIssue[] } =>
  typeof error === 'object' && error !== null && Array.isArray(Reflect.get(error, 'validation'));

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

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ApiFailure) {
      return reply.code(error.statusCode).send(error.body);
    }
    if (hasValidationIssues(error)) {
      return reply.code(400).send({
        code: 'VALIDATION_ERROR',
        message: 'Запрос не соответствует API-контракту.',
        fieldErrors: error.validation.map((issue) => ({
          field: issue.instancePath.replace(/^\//, '').replaceAll('/', '.') || 'request',
          message: issue.message ?? 'Некорректное значение.',
        })),
      });
    }
    request.log.error(error);
    return reply.code(500).send({
      code: 'INTERNAL_ERROR',
      message: 'Внутренняя ошибка сервера.',
    });
  });

  const service = createCalendarService(database, options.now ?? (() => new Date()));
  registerHealthRoute(app, database);
  registerMeetingTypesRoutes(app, service);
  registerAvailabilityRoute(app, service);
  registerBookingsRoutes(app, service);

  if (existsSync(staticDirectory)) {
    await app.register(fastifyStatic, {
      root: staticDirectory,
      wildcard: false,
    });
    app.get('/*', (_request, reply) => reply.sendFile('index.html'));
  }

  return app;
};
