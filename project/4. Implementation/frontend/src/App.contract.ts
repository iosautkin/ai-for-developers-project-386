import type { Booking } from '../../shared/api-contract/src/generated/models/booking.js';
import type { ComponentType } from 'react';

/**
 * Product UI composition for the calendar application.
 *
 * The module keeps only transient navigation and form state in React. Meeting types, availability
 * and bookings remain backend-owned server state and are read or changed through generated API
 * hooks. Routes cover the guest booking flow and the owner screens described by layer 2.
 */

/** IANA zone used whenever a backend UTC instant is presented to product users. */
export const MOSCOW_TIME_ZONE = 'Europe/Moscow';

/** Stable application paths shared by navigation and route declarations. */
export const APP_PATHS = {
  home: '/',
  catalog: '/book',
  adminMeetingTypes: '/admin',
  adminCreateMeetingType: '/admin/meeting-types/new',
  adminBookings: '/admin/bookings',
} as const;

/** Builds the public slot-selection URL for a meeting type supplied by the API. */
export const bookingPath = (meetingTypeId: string) => `/book/${encodeURIComponent(meetingTypeId)}`;

/** Builds the guest-details URL without moving the selected UTC instant into client state. */
export const guestDetailsPath = (meetingTypeId: string, startsAt: string) =>
  `${bookingPath(meetingTypeId)}/details?startsAt=${encodeURIComponent(startsAt)}`;

/** Formats an API UTC instant as a Moscow calendar date followed by its weekday. */
export const formatMoscowDate = (instant: string) => {
  const date = new Date(instant);
  const dateLabel = new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: MOSCOW_TIME_ZONE,
  })
    .format(date)
    .replace(' г.', '');
  const weekday = new Intl.DateTimeFormat('ru-RU', {
    timeZone: MOSCOW_TIME_ZONE,
    weekday: 'long',
  }).format(date);
  return `${dateLabel}, ${weekday}`;
};

/** Formats a backend UTC interval as a compact Moscow time range. */
export const formatMoscowTimeRange = (startsAt: string, endsAt: string) => {
  const formatter = new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: MOSCOW_TIME_ZONE,
  });
  return `${formatter.format(new Date(startsAt))}–${formatter.format(new Date(endsAt))}`;
};

/** Fails closed if generated response unions ever expose a non-success envelope to UI code. */
export const failUnexpectedStatus = (status: number): never => {
  throw new Error(`Unexpected API status ${status}`);
};

/** State passed to the confirmation route after the backend has persisted a booking. */
export interface BookingSuccessState {
  readonly booking: Booking;
}

/** Root React component that declares all product routes. */
export type AppComponent = ComponentType;
