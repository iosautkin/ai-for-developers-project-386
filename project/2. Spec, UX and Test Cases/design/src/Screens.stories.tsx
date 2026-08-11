import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  consultationFixture,
  firstAvailableSlotFixture,
  meetingTypesFixture,
  slotsFixture,
  upcomingBookingsFixture,
} from './fixtures';
import {
  AdminBookingsScreen,
  AdminCreateMeetingTypeScreen,
  AdminMeetingTypesScreen,
} from './screens/AdminScreens';
import {
  BookingScreen,
  BookingSuccessScreen,
  CatalogScreen,
  GuestDetailsScreen,
  HomeScreen,
} from './screens/PublicScreens';

const meta = {
  parameters: {
    docs: {
      description: {
        component:
          'Полноэкранные состояния спецификации. Связанные сценарии: @SCN-GB-*, @SCN-MT-*, @SCN-UB-*.',
      },
    },
  },
  title: 'Screens/Product states',
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Home: Story = { render: () => <HomeScreen /> };
export const Catalog: Story = {
  render: () => <CatalogScreen meetingTypes={meetingTypesFixture} />,
};
export const CatalogLoading: Story = {
  render: () => <CatalogScreen meetingTypes={[]} state="loading" />,
};
export const CatalogError: Story = {
  render: () => <CatalogScreen meetingTypes={[]} state="error" />,
};
export const CatalogEmpty: Story = {
  render: () => <CatalogScreen meetingTypes={[]} state="empty" />,
};
export const Booking: Story = {
  render: () => (
    <BookingScreen
      date="2026-08-11"
      meetingType={consultationFixture}
      selectedSlot={firstAvailableSlotFixture}
      slots={slotsFixture}
    />
  ),
};
export const BookingConflict: Story = {
  render: () => (
    <BookingScreen
      conflict
      date="2026-08-11"
      meetingType={consultationFixture}
      slots={slotsFixture}
    />
  ),
};
export const BookingNoSlots: Story = {
  render: () => (
    <BookingScreen date="2026-08-11" meetingType={consultationFixture} noSlots slots={[]} />
  ),
};
export const GuestDetails: Story = {
  render: () => (
    <GuestDetailsScreen
      meetingType={consultationFixture}
      selectedSlot={firstAvailableSlotFixture}
      values={{ email: '', name: '', note: '' }}
    />
  ),
};
export const GuestValidation: Story = {
  render: () => (
    <GuestDetailsScreen
      errors={{ email: 'Введите корректный email', name: 'Укажите имя' }}
      meetingType={consultationFixture}
      selectedSlot={firstAvailableSlotFixture}
      values={{ email: 'anna', name: '', note: '' }}
    />
  ),
};
export const GuestSubmitError: Story = {
  render: () => (
    <GuestDetailsScreen
      meetingType={consultationFixture}
      selectedSlot={firstAvailableSlotFixture}
      submitError
      values={{ email: 'anna@example.ru', name: 'Анна', note: '' }}
    />
  ),
};
export const BookingSuccess: Story = {
  render: () => (
    <BookingSuccessScreen
      guestName="Анна"
      meetingType={consultationFixture}
      selectedSlot={firstAvailableSlotFixture}
    />
  ),
};
export const AdminMeetingTypes: Story = {
  render: () => <AdminMeetingTypesScreen meetingTypes={meetingTypesFixture} />,
};
export const AdminMeetingTypesEmpty: Story = {
  render: () => <AdminMeetingTypesScreen meetingTypes={[]} />,
};
export const AdminMeetingTypeCreated: Story = {
  render: () => <AdminMeetingTypesScreen created meetingTypes={meetingTypesFixture} />,
};
export const AdminCreateMeetingType: Story = {
  render: () => (
    <AdminCreateMeetingTypeScreen values={{ description: '', duration: '30', id: '', title: '' }} />
  ),
};
export const AdminCreateValidation: Story = {
  render: () => (
    <AdminCreateMeetingTypeScreen
      errors={{
        description: 'Добавьте описание',
        id: 'Укажите идентификатор',
        title: 'Укажите название',
      }}
      values={{ description: '', duration: '30', id: '', title: '' }}
    />
  ),
};
export const AdminCreateDuplicate: Story = {
  render: () => (
    <AdminCreateMeetingTypeScreen
      duplicateError
      values={{
        description: 'Ещё одна консультация',
        duration: '30',
        id: 'consultation',
        title: 'Консультация',
      }}
    />
  ),
};
export const AdminBookings: Story = {
  render: () => <AdminBookingsScreen bookings={upcomingBookingsFixture} />,
};
export const AdminBookingsEmpty: Story = {
  render: () => <AdminBookingsScreen bookings={[]} />,
};
