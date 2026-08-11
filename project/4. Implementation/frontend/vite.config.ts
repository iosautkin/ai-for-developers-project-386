import { fileURLToPath, URL } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, process.cwd(), '');
  const apiTarget =
    mode === 'mock'
      ? 'http://localhost:4010'
      : (environment.VITE_API_TARGET ?? 'http://localhost:3000');

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@design': fileURLToPath(
          new URL('../../2. Spec, UX and Test Cases/design/styles', import.meta.url),
        ),
      },
    },
    server: {
      proxy: {
        '/api': apiTarget,
      },
    },
  };
});
