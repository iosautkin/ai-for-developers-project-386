import {
  GetMeetingTypeAvailability200Response,
  GetMeetingTypeAvailability400Response,
  GetMeetingTypeAvailability404Response,
  GetMeetingTypeAvailability500Response,
  GetMeetingTypeAvailabilityParams,
} from '@calendar/api-contract/schemas';

import {
  AVAILABILITY_ROUTE_PATH,
  type RegisterAvailabilityRoute,
} from './availability.route.contract.js';

export const registerAvailabilityRoute: RegisterAvailabilityRoute = (app, service) => {
  app.get<{ Params: { meetingTypeId: string } }>(
    AVAILABILITY_ROUTE_PATH,
    {
      schema: {
        params: GetMeetingTypeAvailabilityParams,
        response: {
          200: GetMeetingTypeAvailability200Response,
          400: GetMeetingTypeAvailability400Response,
          404: GetMeetingTypeAvailability404Response,
          500: GetMeetingTypeAvailability500Response,
        },
      },
    },
    (request) => service.getAvailability(request.params.meetingTypeId),
  );
};
