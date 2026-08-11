import { useState } from 'react';

import type { GuestFormValues } from '../components/BookingComponents';
import type { MeetingTypeFormValues } from '../components/AdminComponents';
import {
  conflictedSlotsFixture,
  consultationFixture,
  meetingTypesFixture,
  slotsFixture,
  upcomingBookingsFixture,
  type MeetingTypeFixture,
  type SlotFixture,
} from '../fixtures';
import {
  AdminBookingsScreen,
  AdminCreateMeetingTypeScreen,
  AdminMeetingTypesScreen,
} from '../screens/AdminScreens';
import {
  BookingScreen,
  BookingSuccessScreen,
  CatalogScreen,
  GuestDetailsScreen,
  HomeScreen,
} from '../screens/PublicScreens';

type GuestStep = 'home' | 'catalog' | 'booking' | 'details' | 'success';

export interface GuestBookingFlowProps {
  readonly conflictOnSubmit?: boolean;
  readonly initialStep?: GuestStep;
}

const initialGuestValues: GuestFormValues = { email: '', name: '', note: '' };

export function GuestBookingFlow({
  conflictOnSubmit = false,
  initialStep = 'home',
}: GuestBookingFlowProps) {
  const [step, setStep] = useState<GuestStep>(initialStep);
  const [meetingType, setMeetingType] = useState<MeetingTypeFixture>(consultationFixture);
  const [date, setDate] = useState<string | null>('2026-08-11');
  const [selectedSlot, setSelectedSlot] = useState<SlotFixture | undefined>();
  const [guest, setGuest] = useState<GuestFormValues>(initialGuestValues);
  const [conflict, setConflict] = useState(false);

  const openCatalog = () => {
    setConflict(false);
    setSelectedSlot(undefined);
    setStep('catalog');
  };

  if (step === 'home') {
    return <HomeScreen onBook={() => setStep('catalog')} />;
  }

  if (step === 'catalog') {
    return (
      <CatalogScreen
        meetingTypes={meetingTypesFixture}
        onHome={() => setStep('home')}
        onSelect={(selectedMeetingType) => {
          setMeetingType(selectedMeetingType);
          setStep('booking');
        }}
      />
    );
  }

  if (step === 'booking') {
    return (
      <BookingScreen
        conflict={conflict}
        date={date}
        meetingType={meetingType}
        onBack={() => setStep('catalog')}
        onContinue={() => setStep('details')}
        onDateChange={(nextDate) => {
          setDate(nextDate);
          setSelectedSlot(undefined);
        }}
        onSlotSelect={setSelectedSlot}
        selectedSlot={selectedSlot}
        slots={conflict ? conflictedSlotsFixture : slotsFixture}
      />
    );
  }

  if (step === 'details' && selectedSlot) {
    return (
      <GuestDetailsScreen
        meetingType={meetingType}
        onBack={() => setStep('booking')}
        onChange={(field, value) => setGuest((current) => ({ ...current, [field]: value }))}
        onSubmit={() => {
          if (conflictOnSubmit) {
            setConflict(true);
            setSelectedSlot(undefined);
            setStep('booking');
            return;
          }
          setStep('success');
        }}
        selectedSlot={selectedSlot}
        values={guest}
      />
    );
  }

  if (step === 'success' && selectedSlot) {
    return (
      <BookingSuccessScreen
        guestName={guest.name || 'Гость'}
        meetingType={meetingType}
        onBookAgain={openCatalog}
        onHome={() => setStep('home')}
        selectedSlot={selectedSlot}
      />
    );
  }

  return (
    <BookingScreen
      date={date}
      meetingType={meetingType}
      onBack={() => setStep('catalog')}
      onContinue={() => setStep('details')}
      onDateChange={setDate}
      onSlotSelect={setSelectedSlot}
      selectedSlot={selectedSlot}
      slots={slotsFixture}
    />
  );
}

type AdminStep = 'meeting-types' | 'create' | 'bookings';

export interface AdminDesignFlowProps {
  readonly initialStep?: AdminStep;
}

const initialMeetingTypeValues: MeetingTypeFormValues = {
  description: '',
  duration: '30',
  id: '',
  title: '',
};

export function AdminDesignFlow({ initialStep = 'meeting-types' }: AdminDesignFlowProps) {
  const [step, setStep] = useState<AdminStep>(initialStep);
  const [meetingTypes, setMeetingTypes] =
    useState<readonly MeetingTypeFixture[]>(meetingTypesFixture);
  const [values, setValues] = useState<MeetingTypeFormValues>(initialMeetingTypeValues);
  const [created, setCreated] = useState(false);

  if (step === 'create') {
    return (
      <AdminCreateMeetingTypeScreen
        onBookings={() => setStep('bookings')}
        onCancel={() => setStep('meeting-types')}
        onChange={(field, value) => setValues((current) => ({ ...current, [field]: value }))}
        onSubmit={() => {
          const newMeetingType: MeetingTypeFixture = {
            description: values.description,
            durationMinutes: Number(values.duration),
            id: values.id,
            title: values.title,
          };
          setMeetingTypes((current) => [...current, newMeetingType]);
          setCreated(true);
          setStep('meeting-types');
        }}
        values={values}
      />
    );
  }

  if (step === 'bookings') {
    return (
      <AdminBookingsScreen
        bookings={upcomingBookingsFixture}
        onMeetingTypes={() => setStep('meeting-types')}
      />
    );
  }

  return (
    <AdminMeetingTypesScreen
      created={created}
      meetingTypes={meetingTypes}
      onBookings={() => setStep('bookings')}
      onCreate={() => setStep('create')}
    />
  );
}

export function EmptyCatalogFlow() {
  return <CatalogScreen meetingTypes={[]} state="empty" />;
}
