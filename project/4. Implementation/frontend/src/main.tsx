import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';

import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router';

import { App } from './App';
import type { MountApplication } from './main.contract';

const queryClient = new QueryClient();

export const mountApplication: MountApplication = () => {
  const rootElement = document.querySelector('#root');
  if (!(rootElement instanceof HTMLElement)) {
    throw new Error('Expected #root element');
  }

  createRoot(rootElement).render(
    <StrictMode>
      <MantineProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <Routes>
              <Route element={<App />} path="*" />
            </Routes>
          </BrowserRouter>
        </QueryClientProvider>
      </MantineProvider>
    </StrictMode>,
  );
};

mountApplication();
