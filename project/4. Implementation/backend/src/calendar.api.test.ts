import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

import { AvailabilityResponse, Booking, MeetingType } from '@calendar/api-contract/schemas';
import type { FastifyInstance } from 'fastify';
import { afterEach, describe, expect, it } from 'vitest';

import { buildApp } from './app.js';

const openApps = new Set<FastifyInstance>();
const temporaryDirectories = new Set<string>();

const createTestApp = async (now = new Date('2026-08-11T09:07:00+03:00')) => {
  const directory = await mkdtemp(resolve(tmpdir(), 'calendar-api-'));
  temporaryDirectories.add(directory);
  const databasePath = resolve(directory, 'test.sqlite');
  const app = await buildApp({
    databasePath,
    migrationsDirectory: resolve(import.meta.dirname, '../drizzle'),
    staticDirectory: resolve(directory, 'missing-static'),
    now: () => now,
  });
  openApps.add(app);
  return { app, databasePath, directory };
};

const closeApp = async (app: FastifyInstance) => {
  if (!openApps.delete(app)) return;
  await app.close();
};

afterEach(async () => {
  await Promise.all([...openApps].map(closeApp));
  await Promise.all(
    [...temporaryDirectories].map((directory) => rm(directory, { force: true, recursive: true })),
  );
  temporaryDirectories.clear();
});

describe('Calendar API', () => {
  it('creates, normalizes and lists meeting types in creation order', async () => {
    const { app } = await createTestApp();

    const createdResponse = await app.inject({
      method: 'POST',
      url: '/api/meeting-types',
      payload: {
        id: 'deep-dive',
        title: '  Подробный разбор  ',
        description: '  Разбираем задачу по шагам.  ',
        durationMinutes: 45,
      },
    });
    const duplicateResponse = await app.inject({
      method: 'POST',
      url: '/api/meeting-types',
      payload: {
        id: 'deep-dive',
        title: 'Дубликат',
        description: 'Не должен сохраниться',
        durationMinutes: 45,
      },
    });
    const listResponse = await app.inject({ method: 'GET', url: '/api/meeting-types' });

    expect(createdResponse.statusCode).toBe(201);
    expect(MeetingType.parse(createdResponse.json())).toMatchObject({
      id: 'deep-dive',
      title: 'Подробный разбор',
      description: 'Разбираем задачу по шагам.',
      owner: { id: 'owner-1', displayName: 'Иван' },
    });
    expect(duplicateResponse.statusCode).toBe(409);
    expect(duplicateResponse.json()).toMatchObject({ code: 'DUPLICATE_MEETING_TYPE' });
    expect(listResponse.json().map((item: { id: string }) => item.id)).toEqual([
      'consultation',
      'deep-dive',
    ]);
  });

  it('computes the complete 14-day Moscow availability snapshot', async () => {
    const { app } = await createTestApp(new Date('2026-08-11T12:07:00+03:00'));

    const response = await app.inject({
      method: 'GET',
      url: '/api/meeting-types/consultation/availability',
    });
    expect(response.statusCode).toBe(200);
    const availability = AvailabilityResponse.parse(response.json());

    expect(availability).toMatchObject({
      timeZone: 'Europe/Moscow',
      windowStartsOn: '2026-08-11',
      windowEndsOn: '2026-08-24',
    });
    expect(availability.dates).toHaveLength(14);
    expect(availability.dates.find((date) => date.date === '2026-08-15')).toMatchObject({
      bookable: false,
      reason: 'WEEKEND',
      slots: [],
    });
    expect(availability.dates[0]?.slots[0]?.startsAt).toBe('2026-08-11T09:15:00.000Z');
    expect(
      availability.dates
        .find((date) => date.date === '2026-08-12')
        ?.slots.some((slot) => slot.startsAt === '2026-08-12T14:45:00.000Z'),
    ).toBe(false);
  });

  it('atomically creates one normalized booking and exposes it as upcoming', async () => {
    const { app } = await createTestApp();
    const payload = {
      meetingTypeId: 'consultation',
      startsAt: '2026-08-12T07:00:00Z',
      guest: {
        name: '  Анна Петрова  ',
        email: '  ANNA@EXAMPLE.RU  ',
        note: '  Обсудим задачу  ',
      },
    };

    const [first, second] = await Promise.all([
      app.inject({ method: 'POST', url: '/api/bookings', payload }),
      app.inject({ method: 'POST', url: '/api/bookings', payload }),
    ]);
    const responses = [first, second].sort((left, right) => left.statusCode - right.statusCode);
    const booking = Booking.parse(responses[0]?.json());
    const upcoming = await app.inject({ method: 'GET', url: '/api/bookings/upcoming' });

    expect(responses.map((response) => response.statusCode)).toEqual([201, 409]);
    expect(booking).toMatchObject({
      startsAt: '2026-08-12T07:00:00.000Z',
      endsAt: '2026-08-12T07:30:00.000Z',
      guest: {
        name: 'Анна Петрова',
        email: 'anna@example.ru',
        note: 'Обсудим задачу',
      },
    });
    expect(upcoming.json()).toHaveLength(1);
  });

  it('marks overlapping availability occupied while keeping a touching slot free', async () => {
    const { app } = await createTestApp();
    const created = await app.inject({
      method: 'POST',
      url: '/api/bookings',
      payload: {
        meetingTypeId: 'consultation',
        startsAt: '2026-08-12T07:00:00Z',
        guest: { name: 'Анна', email: 'anna@example.ru' },
      },
    });
    const response = await app.inject({
      method: 'GET',
      url: '/api/meeting-types/consultation/availability',
    });
    const availability = AvailabilityResponse.parse(response.json());
    const slots = availability.dates.find((date) => date.date === '2026-08-12')?.slots;

    expect(created.statusCode).toBe(201);
    expect(slots?.find((slot) => slot.startsAt === '2026-08-12T07:00:00.000Z')).toMatchObject({
      status: 'occupied',
    });
    expect(slots?.find((slot) => slot.startsAt === '2026-08-12T07:30:00.000Z')).toMatchObject({
      status: 'available',
    });
  });

  it('returns generated field validation errors for invalid guest details', async () => {
    const { app } = await createTestApp();

    const response = await app.inject({
      method: 'POST',
      url: '/api/bookings',
      payload: {
        meetingTypeId: 'consultation',
        startsAt: '2026-08-12T07:00:00Z',
        guest: { name: '   ', email: 'not-an-email' },
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR' });
    expect(response.json().fieldErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'guest.name' }),
        expect.objectContaining({ field: 'guest.email' }),
      ]),
    );
  });

  it('rejects starts outside the window and starts off the 15-minute grid', async () => {
    const { app } = await createTestApp();
    const request = (startsAt: string) =>
      app.inject({
        method: 'POST',
        url: '/api/bookings',
        payload: {
          meetingTypeId: 'consultation',
          startsAt,
          guest: { name: 'Анна', email: 'anna@example.ru' },
        },
      });

    const outside = await request('2026-08-25T07:00:00Z');
    const offGrid = await request('2026-08-12T07:10:00Z');

    expect(outside.statusCode).toBe(400);
    expect(outside.json()).toMatchObject({ code: 'DATE_OUTSIDE_BOOKING_WINDOW' });
    expect(offGrid.statusCode).toBe(400);
    expect(offGrid.json()).toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('keeps meeting types and bookings after reopening the same SQLite file', async () => {
    const { app, databasePath, directory } = await createTestApp();
    const payload = {
      meetingTypeId: 'consultation',
      startsAt: '2026-08-12T07:00:00Z',
      guest: { name: 'Анна', email: 'anna@example.ru' },
    };
    expect((await app.inject({ method: 'POST', url: '/api/bookings', payload })).statusCode).toBe(
      201,
    );
    await closeApp(app);

    const reopened = await buildApp({
      databasePath,
      migrationsDirectory: resolve(import.meta.dirname, '../drizzle'),
      staticDirectory: resolve(directory, 'missing-static'),
      now: () => new Date('2026-08-11T09:07:00+03:00'),
    });
    openApps.add(reopened);

    expect(
      (await reopened.inject({ method: 'GET', url: '/api/meeting-types' })).json(),
    ).toHaveLength(1);
    expect(
      (await reopened.inject({ method: 'GET', url: '/api/bookings/upcoming' })).json(),
    ).toHaveLength(1);
  });
});
