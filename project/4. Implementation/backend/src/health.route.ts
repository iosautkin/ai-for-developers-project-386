import { GetHealth200Response, GetHealth500Response } from '@calendar/api-contract/schemas';

import { HEALTH_ROUTE_PATH, type RegisterHealthRoute } from './health.route.contract.js';

export const registerHealthRoute: RegisterHealthRoute = (app) => {
  app.get(
    HEALTH_ROUTE_PATH,
    {
      schema: {
        response: {
          200: GetHealth200Response,
          500: GetHealth500Response,
        },
      },
    },
    () => ({ status: 'ok' as const }),
  );
};
