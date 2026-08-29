import {
  CreateMeetingType201Response,
  CreateMeetingType400Response,
  CreateMeetingType409Response,
  CreateMeetingType500Response,
  CreateMeetingTypeBody,
  GetMeetingType200Response,
  GetMeetingType400Response,
  GetMeetingType404Response,
  GetMeetingType500Response,
  GetMeetingTypeParams,
  ListMeetingTypes200Response,
  ListMeetingTypes500Response,
  type CreateMeetingTypeRequest,
} from '@calendar/api-contract/schemas';

import {
  MEETING_TYPES_ROUTE_PATH,
  MEETING_TYPE_ROUTE_PATH,
  type RegisterMeetingTypesRoutes,
} from './meeting-types.route.contract.js';

export const registerMeetingTypesRoutes: RegisterMeetingTypesRoutes = (app, service) => {
  app.get(
    MEETING_TYPES_ROUTE_PATH,
    {
      schema: { response: { 200: ListMeetingTypes200Response, 500: ListMeetingTypes500Response } },
    },
    () => service.listMeetingTypes(),
  );

  app.post<{ Body: CreateMeetingTypeRequest }>(
    MEETING_TYPES_ROUTE_PATH,
    {
      preValidation: (request, _reply, done) => {
        const body = request.body;
        if (typeof body !== 'object' || body === null) {
          done();
          return;
        }
        const trim = (value: unknown) => (typeof value === 'string' ? value.trim() : value);
        request.body = {
          ...body,
          id: trim(body.id),
          title: trim(body.title),
          description: trim(body.description),
        } as CreateMeetingTypeRequest;
        done();
      },
      schema: {
        body: CreateMeetingTypeBody,
        response: {
          201: CreateMeetingType201Response,
          400: CreateMeetingType400Response,
          409: CreateMeetingType409Response,
          500: CreateMeetingType500Response,
        },
      },
    },
    (request, reply) => reply.code(201).send(service.createMeetingType(request.body)),
  );

  app.get<{ Params: { meetingTypeId: string } }>(
    MEETING_TYPE_ROUTE_PATH,
    {
      schema: {
        params: GetMeetingTypeParams,
        response: {
          200: GetMeetingType200Response,
          400: GetMeetingType400Response,
          404: GetMeetingType404Response,
          500: GetMeetingType500Response,
        },
      },
    },
    (request) => service.getMeetingType(request.params.meetingTypeId),
  );
};
