import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import 'dayjs/locale/ru';
import '../styles/tokens.css';

import { MantineProvider } from '@mantine/core';

import type { Preview } from '@storybook/react-vite';

import { designTheme } from '../src/theme';

const preview: Preview = {
  decorators: [
    (Story) => (
      <MantineProvider theme={designTheme}>
        <Story />
      </MantineProvider>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    options: {
      storySort: {
        order: ['Components', 'Screens', 'Flows'],
      },
    },
  },
  tags: ['autodocs'],
};

export default preview;
