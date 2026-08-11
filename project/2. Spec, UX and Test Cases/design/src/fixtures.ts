export interface MeetingTypeFixture {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly durationMinutes: number;
}

export interface SlotFixture {
  readonly id: string;
  readonly label: string;
  readonly status: 'available' | 'occupied';
}

export interface UpcomingBookingFixture {
  readonly id: string;
  readonly meetingTypeTitle: string;
  readonly dateLabel: string;
  readonly timeLabel: string;
  readonly guestName: string;
  readonly email: string;
  readonly note?: string;
}

export const ownerFixture = {
  id: 'owner-1',
  displayName: 'Иван',
} as const;

export const meetingTypesFixture: readonly MeetingTypeFixture[] = [
  {
    id: 'quick-intro',
    title: 'Знакомство',
    description: 'Короткий звонок, чтобы познакомиться и обсудить задачу.',
    durationMinutes: 15,
  },
  {
    id: 'consultation',
    title: 'Консультация',
    description: 'Разберём ваш вопрос и наметим следующие шаги.',
    durationMinutes: 30,
  },
  {
    id: 'deep-dive',
    title: 'Подробная консультация',
    description: 'Спокойно погрузимся в тему и проработаем детали.',
    durationMinutes: 60,
  },
] as const;

export const consultationFixture = meetingTypesFixture[1]!;

export const slotsFixture: readonly SlotFixture[] = [
  { id: '09-00', label: '09:00–09:30', status: 'occupied' },
  { id: '09-30', label: '09:30–10:00', status: 'occupied' },
  { id: '10-00', label: '10:00–10:30', status: 'available' },
  { id: '10-30', label: '10:30–11:00', status: 'available' },
  { id: '11-00', label: '11:00–11:30', status: 'available' },
  { id: '11-30', label: '11:30–12:00', status: 'available' },
] as const;

export const firstAvailableSlotFixture = slotsFixture[2]!;

export const conflictedSlotsFixture: readonly SlotFixture[] = slotsFixture.map((slot) =>
  slot.id === '10-00' ? { ...slot, status: 'occupied' as const } : slot,
);

export const upcomingBookingsFixture: readonly UpcomingBookingFixture[] = [
  {
    id: 'booking-1',
    meetingTypeTitle: 'Знакомство',
    dateLabel: '12 августа 2026, среда',
    timeLabel: '10:00–10:15',
    guestName: 'Анна Петрова',
    email: 'anna@example.ru',
    note: 'Хочу обсудить формат сотрудничества.',
  },
  {
    id: 'booking-2',
    meetingTypeTitle: 'Консультация',
    dateLabel: '13 августа 2026, четверг',
    timeLabel: '14:30–15:00',
    guestName: 'Михаил Орлов',
    email: 'mikhail@example.ru',
  },
  {
    id: 'booking-3',
    meetingTypeTitle: 'Подробная консультация',
    dateLabel: '17 августа 2026, понедельник',
    timeLabel: '11:00–12:00',
    guestName: 'Елена Смирнова',
    email: 'elena@example.ru',
    note: 'Подготовлю вопросы заранее.',
  },
] as const;

export const firstUpcomingBookingFixture = upcomingBookingsFixture[0]!;
