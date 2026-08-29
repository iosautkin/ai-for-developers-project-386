import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import 'dayjs/locale/ru';
import '@design/styles/tokens.css';

import { createTheme, MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';

import { App } from './App';
import { APPLICATION_ROOT_SELECTOR, type MountApplication } from './main.contract';

const queryClient = new QueryClient();
const theme = createTheme({
  defaultRadius: 'md',
  fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
  headings: {
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
    fontWeight: '700',
  },
  primaryColor: 'orange',
});

export const mountApplication: MountApplication = () => {
  const rootElement = document.querySelector(APPLICATION_ROOT_SELECTOR);
  if (!(rootElement instanceof HTMLElement)) {
    throw new Error(`Expected ${APPLICATION_ROOT_SELECTOR} element`);
  }

  createRoot(rootElement).render(
    <StrictMode>
      <MantineProvider theme={theme}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </QueryClientProvider>
      </MantineProvider>
    </StrictMode>,
  );
};

mountApplication();
