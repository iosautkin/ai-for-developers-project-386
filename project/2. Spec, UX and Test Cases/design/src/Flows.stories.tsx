import { expect, userEvent, within } from 'storybook/test';

import type { Meta, StoryObj } from '@storybook/react-vite';

import { UIElements } from '../../UIElements';
import { AdminDesignFlow, EmptyCatalogFlow, GuestBookingFlow } from './flows/ProductFlows';

const meta = {
  parameters: {
    docs: {
      description: {
        component:
          'Кликабельные эталонные пути. Каждый play-test использует сквозные идентификаторы из UIElements.ts.',
      },
    },
  },
  title: 'Flows/Acceptance paths',
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const SuccessfulBooking: Story = {
  parameters: { docs: { description: { story: '@SCN-GB-001, @SCN-GB-002, @SCN-GB-006' } } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByTestId(UIElements.HOME_BOOK_BUTTON));
    await userEvent.click(canvas.getAllByTestId(UIElements.CATALOG_MEETING_TYPE_CARD)[1]!);
    await userEvent.click(canvas.getAllByTestId(UIElements.BOOKING_SLOT_BUTTON)[2]!);
    await userEvent.click(canvas.getByTestId(UIElements.BOOKING_CONTINUE_BUTTON));
    await userEvent.type(canvas.getByTestId(UIElements.GUEST_NAME_INPUT), 'Анна Петрова');
    await userEvent.type(canvas.getByTestId(UIElements.GUEST_EMAIL_INPUT), 'anna@example.ru');
    await userEvent.click(canvas.getByTestId(UIElements.GUEST_SUBMIT_BUTTON));
    await expect(canvas.getByTestId(UIElements.BOOKING_SUCCESS_SCREEN)).toBeInTheDocument();
  },
  render: () => <GuestBookingFlow />,
};

export const SlotConflict: Story = {
  parameters: { docs: { description: { story: '@SCN-GB-011' } } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getAllByTestId(UIElements.BOOKING_SLOT_BUTTON)[2]!);
    await userEvent.click(canvas.getByTestId(UIElements.BOOKING_CONTINUE_BUTTON));
    await userEvent.type(canvas.getByTestId(UIElements.GUEST_NAME_INPUT), 'Анна');
    await userEvent.type(canvas.getByTestId(UIElements.GUEST_EMAIL_INPUT), 'anna@example.ru');
    await userEvent.click(canvas.getByTestId(UIElements.GUEST_SUBMIT_BUTTON));
    await expect(canvas.getByTestId(UIElements.BOOKING_CONFLICT_ALERT)).toBeInTheDocument();
    await expect(canvas.getByTestId(UIElements.BOOKING_CONTINUE_BUTTON)).toBeDisabled();
  },
  render: () => <GuestBookingFlow conflictOnSubmit initialStep="booking" />,
};

export const CreateMeetingType: Story = {
  parameters: { docs: { description: { story: '@SCN-MT-001' } } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByTestId(UIElements.ADMIN_CREATE_MEETING_TYPE_BUTTON));
    await userEvent.type(
      canvas.getByTestId(UIElements.ADMIN_MEETING_TYPE_ID_INPUT),
      'portfolio-review',
    );
    await userEvent.type(
      canvas.getByTestId(UIElements.ADMIN_MEETING_TYPE_TITLE_INPUT),
      'Разбор портфолио',
    );
    await userEvent.type(
      canvas.getByTestId(UIElements.ADMIN_MEETING_TYPE_DESCRIPTION_INPUT),
      'Обсудим сильные стороны и точки роста.',
    );
    await userEvent.click(canvas.getByTestId(UIElements.ADMIN_MEETING_TYPE_SUBMIT_BUTTON));
    await expect(
      canvas.getByTestId(UIElements.ADMIN_MEETING_TYPE_CREATED_NOTIFICATION),
    ).toBeInTheDocument();
    await expect(canvas.getByText('Разбор портфолио')).toBeInTheDocument();
  },
  render: () => <AdminDesignFlow />,
};

export const OwnerBookingsList: Story = {
  parameters: { docs: { description: { story: '@SCN-UB-001, @SCN-UB-002' } } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByTestId(UIElements.ADMIN_BOOKINGS_TAB));
    await expect(canvas.getByTestId(UIElements.ADMIN_BOOKINGS_LIST)).toBeInTheDocument();
    await expect(canvas.getAllByTestId(UIElements.ADMIN_BOOKING_CARD)).toHaveLength(3);
  },
  render: () => <AdminDesignFlow />,
};

export const EmptyCatalog: Story = {
  parameters: { docs: { description: { story: '@SCN-GB-004' } } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId(UIElements.CATALOG_EMPTY_STATE)).toBeInTheDocument();
  },
  render: () => <EmptyCatalogFlow />,
};
