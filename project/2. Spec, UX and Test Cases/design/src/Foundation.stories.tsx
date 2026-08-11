import { Alert } from '@mantine/core';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  component: Alert,
  parameters: {
    docs: {
      description: {
        component: 'Infrastructure-only smoke story. Product designs are intentionally absent.',
      },
    },
  },
  title: 'Infrastructure/Storybook smoke',
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ready: Story = {
  args: {
    children: 'Storybook и Mantine готовы к будущим дизайнам.',
    color: 'green',
  },
};
