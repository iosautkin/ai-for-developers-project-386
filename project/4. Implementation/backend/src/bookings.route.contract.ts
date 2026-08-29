import type { FastifyInstance } from 'fastify';

import type { CalendarService } from './calendar.service.contract.js';

/**
 * HTTP adapter for guest bookings and the owner's upcoming list.
 *
 * The module owns no state. It normalizes guest strings before generated validation and delegates
 * atomic creation and chronological listing to the backend service.
 */

/** Booking collection endpoint declared in TypeSpec. */
export const BOOKINGS_ROUTE_PATH = '/api/bookings';

/** Owner-facing future booking endpoint declared in TypeSpec. */
export const UPCOMING_BOOKINGS_ROUTE_PATH = '/api/bookings/upcoming';

/** Registers booking creation and upcoming-list endpoints. */
export type RegisterBookingsRoutes = (app: FastifyInstance, service: CalendarService) => void;
