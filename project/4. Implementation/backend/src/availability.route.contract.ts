import type { FastifyInstance } from 'fastify';

import type { CalendarService } from './calendar.service.contract.js';

/**
 * HTTP adapter for backend-computed availability.
 *
 * The module is stateless. It validates the public meeting-type identifier and returns the full
 * 14-day snapshot produced by the calendar service without performing calculations in the route.
 */

/** Fastify path corresponding to the TypeSpec availability operation. */
export const AVAILABILITY_ROUTE_PATH = '/api/meeting-types/:meetingTypeId/availability';

/** Registers the meeting-type availability endpoint. */
export type RegisterAvailabilityRoute = (app: FastifyInstance, service: CalendarService) => void;
