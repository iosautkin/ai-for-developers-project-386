import { GetHealthResponse } from '@calendar/api-contract/schemas';

import type { RegisterHealthRoute } from './health.route.contract.js';

export const registerHealthRoute: RegisterHealthRoute = (app) => {
  app.get(
    '/api/health',
    {
      schema: {
        response: {
          200: GetHealthResponse,
        },
      },
    },
    () => ({ status: 'ok' as const }),
  );
};
