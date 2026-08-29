import {
  CreateBooking201Response,
  CreateBooking400Response,
  CreateBooking404Response,
  CreateBooking409Response,
  CreateBooking500Response,
  CreateBookingBody,
  ListUpcomingBookings200Response,
  ListUpcomingBookings500Response,
  type CreateBookingRequest,
} from '@calendar/api-contract/schemas';

import {
  BOOKINGS_ROUTE_PATH,
  UPCOMING_BOOKINGS_ROUTE_PATH,
  type RegisterBookingsRoutes,
} from './bookings.route.contract.js';

export const registerBookingsRoutes: RegisterBookingsRoutes = (app, service) => {
  app.post<{ Body: CreateBookingRequest }>(
    BOOKINGS_ROUTE_PATH,
    {
      preValidation: (request, _reply, done) => {
        const body = request.body;
        if (typeof body !== 'object' || body === null || typeof body.guest !== 'object') {
          done();
          return;
        }
        const trim = (value: unknown) => (typeof value === 'string' ? value.trim() : value);
        const note = trim(body.guest?.note);
        request.body = {
          ...body,
          guest: {
            name: trim(body.guest?.name),
            email:
              typeof body.guest?.email === 'string'
                ? body.guest.email.trim().toLowerCase()
                : body.guest?.email,
            ...(typeof note === 'string' && note ? { note } : {}),
          },
        } as CreateBookingRequest;
        done();
      },
      schema: {
        body: CreateBookingBody,
        response: {
          201: CreateBooking201Response,
          400: CreateBooking400Response,
          404: CreateBooking404Response,
          409: CreateBooking409Response,
          500: CreateBooking500Response,
        },
      },
    },
    (request, reply) => reply.code(201).send(service.createBooking(request.body)),
  );

  app.get(
    UPCOMING_BOOKINGS_ROUTE_PATH,
    {
      schema: {
        response: {
          200: ListUpcomingBookings200Response,
          500: ListUpcomingBookings500Response,
        },
      },
    },
    () => service.listUpcomingBookings(),
  );
};
