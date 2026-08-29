import type {
  AvailabilityResponse,
  Booking,
  CreateBookingRequest,
  CreateMeetingTypeRequest,
  MeetingType,
} from '@calendar/api-contract/schemas';

import type { DatabaseConnection } from './database.contract.js';

/**
 * Backend-owned calendar domain service.
 *
 * The service has no in-memory product state: every meeting type and booking is read from or
 * written to SQLite through Drizzle. It computes the complete 14-day Moscow availability view,
 * validates booking rules and performs conflict-check plus insert in one immediate transaction.
 */

/** Product time zone fixed by the specification. */
export const CALENDAR_TIME_ZONE = 'Europe/Moscow';

/** Number of Moscow calendar dates returned for every availability request. */
export const BOOKING_WINDOW_DAYS = 14;

/** First bookable hour of a weekday in Moscow. */
export const WORKDAY_START_HOUR = 9;

/** Exclusive end hour of a weekday in Moscow. */
export const WORKDAY_END_HOUR = 18;

/** Grid step used to enumerate and validate meeting starts. */
export const SLOT_STEP_MINUTES = 15;

/** Clock boundary kept as one function so time-sensitive tests remain deterministic. */
export type Clock = () => Date;

/** All product operations used by the thin API routes. */
export interface CalendarService {
  /** Returns meeting types in backend creation order. */
  readonly listMeetingTypes: () => MeetingType[];
  /** Returns one type or raises MEETING_TYPE_NOT_FOUND. */
  readonly getMeetingType: (meetingTypeId: string) => MeetingType;
  /** Normalizes and persists one owner meeting type or raises a duplicate conflict. */
  readonly createMeetingType: (request: CreateMeetingTypeRequest) => MeetingType;
  /** Computes dates, slots and occupancy from the backend clock and all owner bookings. */
  readonly getAvailability: (meetingTypeId: string) => AvailabilityResponse;
  /** Validates and atomically persists a guest booking, deriving its end time. */
  readonly createBooking: (request: CreateBookingRequest) => Booking;
  /** Returns only bookings starting after the backend clock in ascending order. */
  readonly listUpcomingBookings: () => Booking[];
}

/** Creates the single business service over a real application database and clock. */
export type CreateCalendarService = (database: DatabaseConnection, now: Clock) => CalendarService;
