import type { Meta, StoryObj } from '@storybook/react-vite';

import { UIElements } from '../../UIElements';

import {
  AdminMeetingTypeCard,
  MeetingTypeForm,
  UpcomingBookingCard,
} from './components/AdminComponents';
import {
  BookingCalendar,
  BookingSummary,
  GuestDetailsForm,
  MeetingTypeCard,
  SlotList,
} from './components/BookingComponents';
import { AdminNavigation, AppHeader, EmptyState, StatusAlert } from './components/Shell';
import { consultationFixture, firstUpcomingBookingFixture, slotsFixture } from './fixtures';

const meta = {
  parameters: {
    docs: {
      description: {
        component:
          'Переиспользуемые визуальные элементы слоя 2. Данные захардкожены, продуктовая логика отсутствует.',
      },
    },
  },
  title: 'Components/Product UI',
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Header: Story = {
  render: () => <AppHeader active="public" />,
};

export const MeetingType: Story = {
  render: () => <MeetingTypeCard meetingType={consultationFixture} />,
};

export const Calendar: Story = {
  render: () => <BookingCalendar onChange={() => undefined} value="2026-08-11" />,
};

export const TimeSlots: Story = {
  render: () => <SlotList selectedSlotId="10-00" slots={slotsFixture} />,
};

export const Summary: Story = {
  render: () => (
    <BookingSummary
      dateLabel="11 августа 2026, вторник"
      meetingType={consultationFixture}
      timeLabel="10:00–10:30"
    />
  ),
};

export const GuestForm: Story = {
  render: () => (
    <GuestDetailsForm
      values={{ email: 'anna@example.ru', name: 'Анна Петрова', note: 'Хочу обсудить задачу.' }}
    />
  ),
};

export const Alerts: Story = {
  render: () => (
    <StatusAlert
      actionLabel="Повторить"
      kind="error"
      message="Не удалось загрузить данные"
      testId={UIElements.CATALOG_ERROR_ALERT}
    />
  ),
};

export const Empty: Story = {
  render: () => (
    <EmptyState
      description="Вернитесь позже."
      testId={UIElements.CATALOG_EMPTY_STATE}
      title="Пока нет доступных типов встреч"
    />
  ),
};

export const AdminTabs: Story = {
  render: () => <AdminNavigation active="meeting-types" />,
};

export const AdminMeetingType: Story = {
  render: () => <AdminMeetingTypeCard meetingType={consultationFixture} />,
};

export const MeetingTypeEditor: Story = {
  render: () => (
    <MeetingTypeForm
      values={{
        description: 'Разберём вопрос и наметим следующие шаги.',
        duration: '30',
        id: 'consultation',
        title: 'Консультация',
      }}
    />
  ),
};

export const UpcomingMeeting: Story = {
  render: () => <UpcomingBookingCard booking={firstUpcomingBookingFixture} />,
};
