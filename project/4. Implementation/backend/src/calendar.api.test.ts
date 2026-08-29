import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

import { AvailabilityResponse, Booking, MeetingType } from '@calendar/api-contract/schemas';
import Database from 'better-sqlite3';
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

const createMeetingType = (
  app: FastifyInstance,
  values: {
    id: string;
    title?: string;
    description?: string;
    durationMinutes?: number;
  },
) =>
  app.inject({
    method: 'POST',
    url: '/api/meeting-types',
    payload: {
      title: 'Подробный разбор',
      description: 'Разбираем задачу по шагам.',
      durationMinutes: 30,
      ...values,
    },
  });

const validBookingPayload = {
  meetingTypeId: 'consultation',
  startsAt: '2026-08-12T07:00:00Z',
  guest: { name: 'Анна', email: 'anna@example.ru' },
};

const insertStoredBooking = (
  databasePath: string,
  booking: {
    id: string;
    startsAt: string;
    endsAt: string;
    guestName?: string;
    guestEmail?: string;
  },
) => {
  const database = new Database(databasePath);
  try {
    database
      .prepare(
        `INSERT INTO bookings (
          id, owner_id, meeting_type_id, guest_name, guest_email, guest_note,
          starts_at_ms, ends_at_ms, created_at_ms
        ) VALUES (
          @id, 'owner-1', 'consultation', @guestName, @guestEmail, NULL,
          @startsAtMs, @endsAtMs, @createdAtMs
        )`,
      )
      .run({
        id: booking.id,
        guestName: booking.guestName ?? 'Анна',
        guestEmail: booking.guestEmail ?? 'anna@example.ru',
        startsAtMs: new Date(booking.startsAt).getTime(),
        endsAtMs: new Date(booking.endsAt).getTime(),
        createdAtMs: new Date('2026-08-10T00:00:00Z').getTime(),
      });
  } finally {
    database.close();
  }
};

afterEach(async () => {
  await Promise.all([...openApps].map(closeApp));
  await Promise.all(
    [...temporaryDirectories].map((directory) => rm(directory, { force: true, recursive: true })),
  );
  temporaryDirectories.clear();
});

describe('Meeting types API', () => {
  it('[API-MT-001] returns an empty meeting type list', async () => {
    const { app, databasePath } = await createTestApp();
    const database = new Database(databasePath);
    database.prepare('DELETE FROM meeting_types').run();
    database.close();

    const response = await app.inject({ method: 'GET', url: '/api/meeting-types' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([]);
  });

  it('[API-MT-002] creates and normalizes a meeting type', async () => {
    const { app, databasePath } = await createTestApp();
    const database = new Database(databasePath);
    database.prepare('DELETE FROM meeting_types').run();
    database.close();

    const response = await createMeetingType(app, {
      id: 'consultation',
      title: '  Консультация  ',
      description: '  Разберём вопрос и наметим следующие шаги.  ',
      durationMinutes: 30,
    });

    expect(response.statusCode).toBe(201);
    expect(MeetingType.parse(response.json())).toEqual({
      id: 'consultation',
      title: 'Консультация',
      description: 'Разберём вопрос и наметим следующие шаги.',
      durationMinutes: 30,
      owner: { id: 'owner-1', displayName: 'Иван' },
    });
  });

  it('[API-MT-003] lists meeting types in creation order', async () => {
    const { app } = await createTestApp();
    expect((await createMeetingType(app, { id: 'deep-dive' })).statusCode).toBe(201);

    const response = await app.inject({ method: 'GET', url: '/api/meeting-types' });

    expect(response.statusCode).toBe(200);
    expect(response.json().map((item: { id: string }) => item.id)).toEqual([
      'consultation',
      'deep-dive',
    ]);
  });

  it('[API-MT-004] returns a meeting type by id', async () => {
    const { app } = await createTestApp();
    const response = await app.inject({ method: 'GET', url: '/api/meeting-types/consultation' });

    expect(response.statusCode).toBe(200);
    expect(MeetingType.parse(response.json())).toMatchObject({
      id: 'consultation',
      owner: { id: 'owner-1', displayName: 'Иван' },
    });
  });

  it('[API-MT-005] returns a not-found error for an unknown meeting type', async () => {
    const { app } = await createTestApp();
    const response = await app.inject({
      method: 'GET',
      url: '/api/meeting-types/missing-type',
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({ code: 'MEETING_TYPE_NOT_FOUND' });
  });

  it.each([
    { id: '', title: 'Консультация', description: 'Описание', durationMinutes: 30, field: 'id' },
    {
      id: 'Bad_ID',
      title: 'Консультация',
      description: 'Описание',
      durationMinutes: 30,
      field: 'id',
    },
    { id: 'valid-id', title: '', description: 'Описание', durationMinutes: 30, field: 'title' },
    {
      id: 'valid-id',
      title: 'Консультация',
      description: '',
      durationMinutes: 30,
      field: 'description',
    },
    {
      id: 'valid-id',
      title: 'Консультация',
      description: 'Описание',
      durationMinutes: 20,
      field: 'durationMinutes',
    },
    {
      id: 'valid-id',
      title: 'Консультация',
      description: 'Описание',
      durationMinutes: 555,
      field: 'durationMinutes',
    },
  ])('[API-MT-006] reports $field for an invalid meeting type', async (payload) => {
    const { app } = await createTestApp();
    const response = await app.inject({ method: 'POST', url: '/api/meeting-types', payload });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      code: 'VALIDATION_ERROR',
      fieldErrors: expect.arrayContaining([expect.objectContaining({ field: payload.field })]),
    });
  });

  it('[API-MT-007] rejects a duplicate id without changing the existing type', async () => {
    const { app } = await createTestApp();
    const duplicate = await createMeetingType(app, {
      id: 'consultation',
      title: 'Дубликат',
      description: 'Не должен сохраниться',
      durationMinutes: 45,
    });
    const existing = await app.inject({
      method: 'GET',
      url: '/api/meeting-types/consultation',
    });

    expect(duplicate.statusCode).toBe(409);
    expect(duplicate.json()).toMatchObject({ code: 'DUPLICATE_MEETING_TYPE' });
    expect(MeetingType.parse(existing.json())).toMatchObject({
      id: 'consultation',
      title: 'Консультация',
      description: 'Обсудим ваш вопрос и определим следующие шаги.',
      durationMinutes: 30,
    });
  });

  it('[API-MT-008] validates the meeting type id in the path', async () => {
    const { app } = await createTestApp();
    const response = await app.inject({ method: 'GET', url: '/api/meeting-types/Bad_ID' });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      code: 'VALIDATION_ERROR',
      fieldErrors: expect.arrayContaining([expect.objectContaining({ field: 'meetingTypeId' })]),
    });
  });
});

describe('Availability API', () => {
  it('[API-AV-001] returns a complete 14-day Moscow snapshot', async () => {
    const { app } = await createTestApp(new Date('2026-08-11T12:07:00+03:00'));
    const response = await app.inject({
      method: 'GET',
      url: '/api/meeting-types/consultation/availability',
    });
    const availability = AvailabilityResponse.parse(response.json());
    const dates = availability.dates.map((date) => date.date);

    expect(response.statusCode).toBe(200);
    expect(availability).toMatchObject({
      timeZone: 'Europe/Moscow',
      windowStartsOn: '2026-08-11',
      windowEndsOn: '2026-08-24',
      generatedAt: '2026-08-11T09:07:00.000Z',
    });
    expect(availability.generatedAt).toMatch(/Z$/);
    expect(dates).toHaveLength(14);
    expect(dates).toEqual([...dates].sort());
  });

  it('[API-AV-002] marks both weekend dates unavailable', async () => {
    const { app } = await createTestApp(new Date('2026-08-11T12:07:00+03:00'));
    const response = await app.inject({
      method: 'GET',
      url: '/api/meeting-types/consultation/availability',
    });
    const availability = AvailabilityResponse.parse(response.json());

    for (const date of ['2026-08-15', '2026-08-16']) {
      expect(availability.dates.find((item) => item.date === date)).toEqual({
        date,
        bookable: false,
        reason: 'WEEKEND',
        slots: [],
      });
    }
  });

  it('[API-AV-003] omits past intervals and aligns the first slot to the grid', async () => {
    const { app } = await createTestApp(new Date('2026-08-11T12:07:00+03:00'));
    const response = await app.inject({
      method: 'GET',
      url: '/api/meeting-types/consultation/availability',
    });
    const availability = AvailabilityResponse.parse(response.json());
    const currentDate = availability.dates.find((date) => date.date === '2026-08-11');

    expect(currentDate?.slots[0]?.startsAt).toBe('2026-08-11T09:15:00.000Z');
    expect(
      currentDate?.slots.every((slot) => {
        const start = new Date(slot.startsAt);
        return start >= new Date('2026-08-11T09:15:00Z') && start.getUTCMinutes() % 15 === 0;
      }),
    ).toBe(true);
  });

  it('[API-AV-004] returns only slots that fully fit in working hours', async () => {
    const { app } = await createTestApp(new Date('2026-08-11T12:07:00+03:00'));
    const response = await app.inject({
      method: 'GET',
      url: '/api/meeting-types/consultation/availability',
    });
    const availability = AvailabilityResponse.parse(response.json());
    const slots = availability.dates.find((date) => date.date === '2026-08-12')?.slots ?? [];

    expect(slots).toContainEqual({
      startsAt: '2026-08-12T14:30:00.000Z',
      endsAt: '2026-08-12T15:00:00.000Z',
      status: 'available',
    });
    expect(slots).not.toContainEqual(
      expect.objectContaining({
        startsAt: '2026-08-12T14:45:00.000Z',
        endsAt: '2026-08-12T15:15:00.000Z',
      }),
    );
  });

  it('[API-AV-005] blocks overlaps across meeting types without leaking booking data', async () => {
    const { app } = await createTestApp();
    expect((await createMeetingType(app, { id: 'deep-dive' })).statusCode).toBe(201);
    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/api/bookings',
          payload: { ...validBookingPayload, meetingTypeId: 'deep-dive' },
        })
      ).statusCode,
    ).toBe(201);

    const response = await app.inject({
      method: 'GET',
      url: '/api/meeting-types/consultation/availability',
    });
    const availability = AvailabilityResponse.parse(response.json());
    const occupiedSlots =
      availability.dates
        .find((date) => date.date === '2026-08-12')
        ?.slots.filter((slot) => slot.status === 'occupied') ?? [];

    expect(occupiedSlots).toContainEqual(
      expect.objectContaining({ startsAt: '2026-08-12T07:00:00.000Z', status: 'occupied' }),
    );
    expect(occupiedSlots.length).toBeGreaterThan(0);
    for (const slot of occupiedSlots) {
      expect(Object.keys(slot).sort()).toEqual(['endsAt', 'startsAt', 'status']);
    }
  });

  it('[API-AV-006] keeps a touching interval available', async () => {
    const { app } = await createTestApp();
    expect(
      (await app.inject({ method: 'POST', url: '/api/bookings', payload: validBookingPayload }))
        .statusCode,
    ).toBe(201);

    const response = await app.inject({
      method: 'GET',
      url: '/api/meeting-types/consultation/availability',
    });
    const availability = AvailabilityResponse.parse(response.json());
    const slots = availability.dates.find((date) => date.date === '2026-08-12')?.slots;

    expect(slots).toContainEqual({
      startsAt: '2026-08-12T07:30:00.000Z',
      endsAt: '2026-08-12T08:00:00.000Z',
      status: 'available',
    });
  });

  it('[API-AV-007] keeps occupied slots when a date has no availability', async () => {
    const { app } = await createTestApp();
    expect(
      (
        await createMeetingType(app, {
          id: 'full-day',
          title: 'Полный день',
          durationMinutes: 540,
        })
      ).statusCode,
    ).toBe(201);
    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/api/bookings',
          payload: {
            ...validBookingPayload,
            meetingTypeId: 'full-day',
            startsAt: '2026-08-12T06:00:00Z',
          },
        })
      ).statusCode,
    ).toBe(201);

    const response = await app.inject({
      method: 'GET',
      url: '/api/meeting-types/consultation/availability',
    });
    const date = AvailabilityResponse.parse(response.json()).dates.find(
      (item) => item.date === '2026-08-12',
    );

    expect(date).toMatchObject({ bookable: false, reason: 'NO_SLOTS' });
    expect(date?.slots.length).toBeGreaterThan(0);
    expect(date?.slots.every((slot) => slot.status === 'occupied')).toBe(true);
  });

  it('[API-AV-008] marks an elapsed current workday as past', async () => {
    const { app } = await createTestApp(new Date('2026-08-11T18:01:00+03:00'));
    const response = await app.inject({
      method: 'GET',
      url: '/api/meeting-types/consultation/availability',
    });
    const date = AvailabilityResponse.parse(response.json()).dates.find(
      (item) => item.date === '2026-08-11',
    );

    expect(date).toEqual({
      date: '2026-08-11',
      bookable: false,
      reason: 'PAST',
      slots: [],
    });
  });

  it("[API-AV-009] sorts dates and each date's slots", async () => {
    const { app } = await createTestApp(new Date('2026-08-11T12:07:00+03:00'));
    const response = await app.inject({
      method: 'GET',
      url: '/api/meeting-types/consultation/availability',
    });
    const availability = AvailabilityResponse.parse(response.json());
    const dates = availability.dates.map((date) => date.date);

    expect(dates).toEqual([...dates].sort());
    for (const date of availability.dates) {
      const starts = date.slots.map((slot) => slot.startsAt);
      expect(starts).toEqual([...starts].sort());
    }
  });

  it('[API-AV-010] returns a not-found error for an unknown meeting type', async () => {
    const { app } = await createTestApp();
    const response = await app.inject({
      method: 'GET',
      url: '/api/meeting-types/missing-type/availability',
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({ code: 'MEETING_TYPE_NOT_FOUND' });
  });

  it('[API-AV-011] validates the meeting type id in the availability path', async () => {
    const { app } = await createTestApp();
    const response = await app.inject({
      method: 'GET',
      url: '/api/meeting-types/Bad_ID/availability',
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      code: 'VALIDATION_ERROR',
      fieldErrors: expect.arrayContaining([expect.objectContaining({ field: 'meetingTypeId' })]),
    });
  });
});

describe('Bookings API', () => {
  it('[API-BK-001] creates a normalized booking with backend-computed summaries', async () => {
    const { app } = await createTestApp();
    const response = await app.inject({
      method: 'POST',
      url: '/api/bookings',
      payload: {
        meetingTypeId: 'consultation',
        startsAt: '2026-08-12T07:00:00Z',
        guest: {
          name: '  Анна Петрова  ',
          email: '  ANNA@EXAMPLE.RU  ',
          note: '  Обсудим задачу  ',
        },
      },
    });

    expect(response.statusCode).toBe(201);
    expect(Booking.parse(response.json())).toMatchObject({
      owner: { id: 'owner-1', displayName: 'Иван' },
      meetingType: { id: 'consultation', title: 'Консультация', durationMinutes: 30 },
      startsAt: '2026-08-12T07:00:00.000Z',
      endsAt: '2026-08-12T07:30:00.000Z',
      guest: {
        name: 'Анна Петрова',
        email: 'anna@example.ru',
        note: 'Обсудим задачу',
      },
    });
  });

  it('[API-BK-002] omits a whitespace-only guest note', async () => {
    const { app } = await createTestApp();
    const response = await app.inject({
      method: 'POST',
      url: '/api/bookings',
      payload: { ...validBookingPayload, guest: { ...validBookingPayload.guest, note: '   ' } },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).not.toHaveProperty('guest.note');
  });

  it.each([
    { name: '', email: 'guest@test.ru', field: 'guest.name' },
    { name: 'Анна', email: '', field: 'guest.email' },
    { name: 'Анна', email: 'неверный-email', field: 'guest.email' },
  ])('[API-BK-003] reports $field for invalid guest data', async (guest) => {
    const { app } = await createTestApp();
    const response = await app.inject({
      method: 'POST',
      url: '/api/bookings',
      payload: { ...validBookingPayload, guest },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      code: 'VALIDATION_ERROR',
      fieldErrors: expect.arrayContaining([expect.objectContaining({ field: guest.field })]),
    });
  });

  it('[API-BK-004] rejects a booking for an unknown meeting type', async () => {
    const { app } = await createTestApp();
    const response = await app.inject({
      method: 'POST',
      url: '/api/bookings',
      payload: { ...validBookingPayload, meetingTypeId: 'missing-type' },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({ code: 'MEETING_TYPE_NOT_FOUND' });
  });

  it.each([
    { startsAt: '2026-08-25T07:00:00Z', code: 'DATE_OUTSIDE_BOOKING_WINDOW' },
    { startsAt: '2026-08-15T07:00:00Z', code: 'VALIDATION_ERROR' },
    { startsAt: '2026-08-12T07:10:00Z', code: 'VALIDATION_ERROR' },
    { startsAt: '2026-08-12T05:45:00Z', code: 'VALIDATION_ERROR' },
    { startsAt: '2026-08-12T14:45:00Z', code: 'VALIDATION_ERROR' },
  ])('[API-BK-005] rejects $startsAt with $code', async ({ startsAt, code }) => {
    const { app } = await createTestApp();
    const response = await app.inject({
      method: 'POST',
      url: '/api/bookings',
      payload: { ...validBookingPayload, startsAt },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code });
  });

  it('[API-BK-006] rejects an occupied interval without storing another booking', async () => {
    const { app } = await createTestApp();
    expect(
      (await app.inject({ method: 'POST', url: '/api/bookings', payload: validBookingPayload }))
        .statusCode,
    ).toBe(201);
    const response = await app.inject({
      method: 'POST',
      url: '/api/bookings',
      payload: {
        ...validBookingPayload,
        guest: { name: 'Борис', email: 'boris@example.ru' },
      },
    });
    const upcoming = await app.inject({ method: 'GET', url: '/api/bookings/upcoming' });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({ code: 'SLOT_CONFLICT' });
    expect(upcoming.json()).toHaveLength(1);
  });

  it('[API-BK-007] rejects the same POST without requiring an idempotency key', async () => {
    const { app } = await createTestApp();
    const first = await app.inject({
      method: 'POST',
      url: '/api/bookings',
      payload: validBookingPayload,
    });
    const repeated = await app.inject({
      method: 'POST',
      url: '/api/bookings',
      payload: validBookingPayload,
    });

    expect(first.statusCode).toBe(201);
    expect(repeated.statusCode).toBe(409);
    expect(repeated.json()).toMatchObject({ code: 'SLOT_CONFLICT' });
  });

  it('[API-BK-008] persists exactly one of two concurrent booking requests', async () => {
    const { app } = await createTestApp();
    const [first, second] = await Promise.all([
      app.inject({ method: 'POST', url: '/api/bookings', payload: validBookingPayload }),
      app.inject({ method: 'POST', url: '/api/bookings', payload: validBookingPayload }),
    ]);
    const responses = [first, second].sort((left, right) => left.statusCode - right.statusCode);
    const upcoming = await app.inject({ method: 'GET', url: '/api/bookings/upcoming' });

    expect(responses.map((response) => response.statusCode)).toEqual([201, 409]);
    expect(responses[1]?.json()).toMatchObject({ code: 'SLOT_CONFLICT' });
    expect(upcoming.json()).toHaveLength(1);
  });

  it('[API-BK-009] returns an empty upcoming booking list', async () => {
    const { app } = await createTestApp();
    const response = await app.inject({ method: 'GET', url: '/api/bookings/upcoming' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([]);
  });

  it('[API-BK-010] returns only strictly future bookings in start order', async () => {
    const { app, databasePath } = await createTestApp();
    insertStoredBooking(databasePath, {
      id: 'past',
      startsAt: '2026-08-11T05:00:00Z',
      endsAt: '2026-08-11T05:30:00Z',
    });
    insertStoredBooking(databasePath, {
      id: 'current',
      startsAt: '2026-08-11T06:07:00Z',
      endsAt: '2026-08-11T06:37:00Z',
    });
    insertStoredBooking(databasePath, {
      id: 'future-later',
      startsAt: '2026-08-12T08:00:00Z',
      endsAt: '2026-08-12T08:30:00Z',
      guestName: 'Борис',
      guestEmail: 'boris@example.ru',
    });
    insertStoredBooking(databasePath, {
      id: 'future-earlier',
      startsAt: '2026-08-12T07:00:00Z',
      endsAt: '2026-08-12T07:30:00Z',
    });

    const response = await app.inject({ method: 'GET', url: '/api/bookings/upcoming' });
    const bookings = Booking.array().parse(response.json());

    expect(response.statusCode).toBe(200);
    expect(bookings.map((booking) => booking.id)).toEqual(['future-earlier', 'future-later']);
    for (const booking of bookings) {
      expect(booking).toMatchObject({
        owner: { id: 'owner-1', displayName: 'Иван' },
        meetingType: { id: 'consultation', title: 'Консультация', durationMinutes: 30 },
        guest: { name: expect.any(String), email: expect.any(String) },
      });
    }
  });
});

describe('SQLite persistence regression', () => {
  it('keeps meeting types and bookings after reopening the same SQLite file', async () => {
    const { app, databasePath, directory } = await createTestApp();
    expect(
      (await app.inject({ method: 'POST', url: '/api/bookings', payload: validBookingPayload }))
        .statusCode,
    ).toBe(201);
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
