import { randomUUID } from 'node:crypto';

import { TZDate } from '@date-fns/tz';
import {
  MeetingDurationMinutes,
  type AvailabilityResponse,
  type Booking,
  type CreateBookingRequest,
  type CreateMeetingTypeRequest,
  type MeetingType,
} from '@calendar/api-contract/schemas';
import { and, asc, eq, gt, lt } from 'drizzle-orm';

import { ApiFailure } from './api-failure.js';
import {
  BOOKING_WINDOW_DAYS,
  CALENDAR_TIME_ZONE,
  SLOT_STEP_MINUTES,
  WORKDAY_END_HOUR,
  WORKDAY_START_HOUR,
  type CreateCalendarService,
} from './calendar.service.contract.js';
import { OWNER_DISPLAY_NAME, OWNER_ID, bookings, meetingTypes } from './database.contract.js';

const minutesToMilliseconds = (minutes: number) => minutes * 60_000;

const toCalendarDate = (date: Date) => {
  const moscow = new TZDate(date, CALENDAR_TIME_ZONE);
  return [
    moscow.getFullYear(),
    String(moscow.getMonth() + 1).padStart(2, '0'),
    String(moscow.getDate()).padStart(2, '0'),
  ].join('-');
};

const localDate = (reference: Date, dayOffset: number, hour = 0, minute = 0) => {
  const moscow = new TZDate(reference, CALENDAR_TIME_ZONE);
  return TZDate.tz(
    CALENDAR_TIME_ZONE,
    moscow.getFullYear(),
    moscow.getMonth(),
    moscow.getDate() + dayOffset,
    hour,
    minute,
  );
};

const owner = { id: OWNER_ID, displayName: OWNER_DISPLAY_NAME } as const;

const mapMeetingType = (row: typeof meetingTypes.$inferSelect): MeetingType => ({
  id: row.id,
  owner,
  title: row.title,
  description: row.description,
  durationMinutes: MeetingDurationMinutes.parse(row.durationMinutes),
});

const mapBooking = (
  row: typeof bookings.$inferSelect,
  meetingType: typeof meetingTypes.$inferSelect,
): Booking => ({
  id: row.id,
  owner,
  meetingType: {
    id: meetingType.id,
    title: meetingType.title,
    durationMinutes: MeetingDurationMinutes.parse(meetingType.durationMinutes),
  },
  startsAt: new Date(row.startsAtMs).toISOString(),
  endsAt: new Date(row.endsAtMs).toISOString(),
  guest: {
    name: row.guestName,
    email: row.guestEmail,
    ...(row.guestNote === null ? {} : { note: row.guestNote }),
  },
});

const notFound = () =>
  new ApiFailure(404, {
    code: 'MEETING_TYPE_NOT_FOUND',
    message: 'Тип встречи не найден.',
  });

const invalidStart = (message: string) =>
  new ApiFailure(400, {
    code: 'VALIDATION_ERROR',
    message,
    fieldErrors: [{ field: 'startsAt', message }],
  });

export const createCalendarService: CreateCalendarService = (database, now) => {
  const findMeetingTypeRow = (meetingTypeId: string) => {
    const row = database.orm
      .select()
      .from(meetingTypes)
      .where(eq(meetingTypes.id, meetingTypeId))
      .get();
    if (!row) throw notFound();
    return row;
  };

  const listMeetingTypes = () =>
    database.orm
      .select()
      .from(meetingTypes)
      .orderBy(asc(meetingTypes.sequence))
      .all()
      .map(mapMeetingType);

  const getMeetingType = (meetingTypeId: string) =>
    mapMeetingType(findMeetingTypeRow(meetingTypeId));

  const createMeetingType = (request: CreateMeetingTypeRequest) =>
    database.orm.transaction(
      (transaction) => {
        const duplicate = transaction
          .select({ id: meetingTypes.id })
          .from(meetingTypes)
          .where(eq(meetingTypes.id, request.id))
          .get();
        if (duplicate) {
          throw new ApiFailure(409, {
            code: 'DUPLICATE_MEETING_TYPE',
            message: 'Тип встречи с таким идентификатором уже существует.',
          });
        }
        transaction
          .insert(meetingTypes)
          .values({
            id: request.id,
            ownerId: OWNER_ID,
            title: request.title,
            description: request.description,
            durationMinutes: request.durationMinutes,
            createdAtMs: now().getTime(),
          })
          .run();
        return mapMeetingType(findMeetingTypeRow(request.id));
      },
      { behavior: 'immediate' },
    );

  const getAvailability = (meetingTypeId: string): AvailabilityResponse => {
    const meetingType = findMeetingTypeRow(meetingTypeId);
    const generatedAt = now();
    const windowStart = localDate(generatedAt, 0);
    const windowEndExclusive = localDate(generatedAt, BOOKING_WINDOW_DAYS);
    const occupiedIntervals = database.orm
      .select({ startsAtMs: bookings.startsAtMs, endsAtMs: bookings.endsAtMs })
      .from(bookings)
      .where(
        and(
          lt(bookings.startsAtMs, windowEndExclusive.getTime()),
          gt(bookings.endsAtMs, windowStart.getTime()),
        ),
      )
      .all();

    const dates = Array.from({ length: BOOKING_WINDOW_DAYS }, (_, dayOffset) => {
      const day = localDate(generatedAt, dayOffset);
      const date = toCalendarDate(day);
      if (day.getDay() === 0 || day.getDay() === 6) {
        return { date, bookable: false, reason: 'WEEKEND' as const, slots: [] };
      }

      const slots = [];
      const workdayEnd = localDate(generatedAt, dayOffset, WORKDAY_END_HOUR);
      for (
        let slotStart = localDate(generatedAt, dayOffset, WORKDAY_START_HOUR);
        slotStart.getTime() + minutesToMilliseconds(meetingType.durationMinutes) <=
        workdayEnd.getTime();
        slotStart = new TZDate(
          slotStart.getTime() + minutesToMilliseconds(SLOT_STEP_MINUTES),
          CALENDAR_TIME_ZONE,
        )
      ) {
        if (slotStart.getTime() <= generatedAt.getTime()) continue;
        const slotEndMs = slotStart.getTime() + minutesToMilliseconds(meetingType.durationMinutes);
        const occupied = occupiedIntervals.some(
          (booking) => slotStart.getTime() < booking.endsAtMs && slotEndMs > booking.startsAtMs,
        );
        slots.push({
          startsAt: new Date(slotStart.getTime()).toISOString(),
          endsAt: new Date(slotEndMs).toISOString(),
          status: occupied ? ('occupied' as const) : ('available' as const),
        });
      }

      const bookable = slots.some((slot) => slot.status === 'available');
      return {
        date,
        bookable,
        ...(!bookable
          ? { reason: slots.length === 0 ? ('PAST' as const) : ('NO_SLOTS' as const) }
          : {}),
        slots,
      };
    });

    return {
      meetingType: {
        id: meetingType.id,
        title: meetingType.title,
        durationMinutes: MeetingDurationMinutes.parse(meetingType.durationMinutes),
      },
      generatedAt: generatedAt.toISOString(),
      windowStartsOn: toCalendarDate(windowStart),
      windowEndsOn: toCalendarDate(localDate(generatedAt, BOOKING_WINDOW_DAYS - 1)),
      timeZone: CALENDAR_TIME_ZONE,
      dates,
    };
  };

  const createBooking = (request: CreateBookingRequest) =>
    database.orm.transaction(
      (transaction) => {
        const meetingType = findMeetingTypeRow(request.meetingTypeId);
        const currentTime = now();
        const startsAt = new Date(request.startsAt);
        const startsAtMoscow = new TZDate(startsAt, CALENDAR_TIME_ZONE);
        const windowStartsOn = toCalendarDate(localDate(currentTime, 0));
        const windowEndsOn = toCalendarDate(localDate(currentTime, BOOKING_WINDOW_DAYS - 1));
        const requestedDate = toCalendarDate(startsAt);
        if (requestedDate < windowStartsOn || requestedDate > windowEndsOn) {
          throw new ApiFailure(400, {
            code: 'DATE_OUTSIDE_BOOKING_WINDOW',
            message: 'Дата находится вне доступного окна записи.',
            fieldErrors: [{ field: 'startsAt', message: 'Выберите дату в ближайшие 14 дней.' }],
          });
        }
        if (startsAtMoscow.getDay() === 0 || startsAtMoscow.getDay() === 6) {
          throw invalidStart('На выходные запись недоступна.');
        }
        if (
          startsAt.getTime() <= currentTime.getTime() ||
          startsAtMoscow.getSeconds() !== 0 ||
          startsAtMoscow.getMilliseconds() !== 0 ||
          startsAtMoscow.getMinutes() % SLOT_STEP_MINUTES !== 0 ||
          startsAtMoscow.getHours() < WORKDAY_START_HOUR
        ) {
          throw invalidStart('Начало должно быть будущим слотом на 15-минутной сетке.');
        }
        const endsAtMs = startsAt.getTime() + minutesToMilliseconds(meetingType.durationMinutes);
        const endsAtMoscow = new TZDate(endsAtMs, CALENDAR_TIME_ZONE);
        if (
          toCalendarDate(endsAtMoscow) !== requestedDate ||
          endsAtMoscow.getHours() > WORKDAY_END_HOUR ||
          (endsAtMoscow.getHours() === WORKDAY_END_HOUR && endsAtMoscow.getMinutes() > 0)
        ) {
          throw invalidStart('Встреча должна полностью помещаться в рабочее время 09:00–18:00.');
        }

        const conflict = transaction
          .select({ id: bookings.id })
          .from(bookings)
          .where(and(lt(bookings.startsAtMs, endsAtMs), gt(bookings.endsAtMs, startsAt.getTime())))
          .get();
        if (conflict) {
          throw new ApiFailure(409, {
            code: 'SLOT_CONFLICT',
            message: 'Выбранный слот уже занят.',
          });
        }

        const row = {
          id: randomUUID(),
          ownerId: OWNER_ID,
          meetingTypeId: meetingType.id,
          guestName: request.guest.name,
          guestEmail: request.guest.email,
          guestNote: request.guest.note ?? null,
          startsAtMs: startsAt.getTime(),
          endsAtMs,
          createdAtMs: currentTime.getTime(),
        };
        transaction.insert(bookings).values(row).run();
        return mapBooking(row, meetingType);
      },
      { behavior: 'immediate' },
    );

  const listUpcomingBookings = () =>
    database.orm
      .select({ booking: bookings, meetingType: meetingTypes })
      .from(bookings)
      .innerJoin(meetingTypes, eq(bookings.meetingTypeId, meetingTypes.id))
      .where(gt(bookings.startsAtMs, now().getTime()))
      .orderBy(asc(bookings.startsAtMs))
      .all()
      .map((row) => mapBooking(row.booking, row.meetingType));

  return {
    createBooking,
    createMeetingType,
    getAvailability,
    getMeetingType,
    listMeetingTypes,
    listUpcomingBookings,
  };
};
