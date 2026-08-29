import type { FastifyInstance } from 'fastify';

import type { CalendarService } from './calendar.service.contract.js';

/**
 * HTTP adapter for owner meeting types.
 *
 * The module holds no state or business rules. It validates TypeSpec-derived request shapes,
 * normalizes surrounding whitespace and delegates list, detail and create operations to the
 * backend calendar service.
 */

/** Collection endpoint declared in TypeSpec. */
export const MEETING_TYPES_ROUTE_PATH = '/api/meeting-types';

/** Fastify path for one public meeting type. */
export const MEETING_TYPE_ROUTE_PATH = '/api/meeting-types/:meetingTypeId';

/** Registers all meeting-type endpoints on an application instance. */
export type RegisterMeetingTypesRoutes = (app: FastifyInstance, service: CalendarService) => void;
