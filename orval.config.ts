import { defineConfig } from 'orval';

const input = './project/3. Architecture/api/generated/openapi.yaml';

export default defineConfig({
  frontend: {
    input,
    output: {
      clean: true,
      client: 'react-query',
      httpClient: 'fetch',
      mode: 'single',
      override: {
        mutator: {
          name: 'httpClient',
          path: './project/4. Implementation/frontend/src/api/httpClient.ts',
        },
      },
      schemas: './project/4. Implementation/shared/api-contract/src/generated/models',
      target: './project/4. Implementation/frontend/src/api/generated/client.ts',
    },
  },
  schemas: {
    input,
    output: {
      clean: false,
      client: 'zod',
      mode: 'single',
      override: {
        zod: {
          exactOptional: true,
          generate: {
            body: true,
            param: true,
            query: true,
            response: true,
          },
          generateEachHttpStatus: true,
          generateReusableSchemas: true,
          version: 4,
        },
      },
      target: './project/4. Implementation/shared/api-contract/src/generated/zod/schemas.ts',
    },
  },
});
