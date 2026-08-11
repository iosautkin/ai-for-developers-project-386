import {
  Badge,
  Button,
  Divider,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
  UnstyledButton,
} from '@mantine/core';
import { DatePicker } from '@mantine/dates';
import { IconArrowRight, IconClock, IconMapPin } from '@tabler/icons-react';

import { UIElements } from '../../../UIElements';
import type { MeetingTypeFixture, SlotFixture } from '../fixtures';

import classes from './components.module.css';

export interface MeetingTypeCardProps {
  readonly meetingType: MeetingTypeFixture;
  readonly onSelect?: ((meetingType: MeetingTypeFixture) => void) | undefined;
  readonly testId?: UIElements | undefined;
}

export function MeetingTypeCard({ meetingType, onSelect, testId }: MeetingTypeCardProps) {
  return (
    <Paper className={classes.meetingCard} p="lg" radius="lg" withBorder>
      <UnstyledButton
        className={classes.cardButton}
        data-testid={testId ?? UIElements.CATALOG_MEETING_TYPE_CARD}
        onClick={() => onSelect?.(meetingType)}
      >
        <Stack gap="md">
          <Group align="flex-start" justify="space-between" wrap="nowrap">
            <div>
              <Title order={3}>{meetingType.title}</Title>
              <Text c="dimmed" mt={6} size="sm">
                {meetingType.description}
              </Text>
            </div>
            <Badge color="orange" leftSection={<IconClock size={13} />} variant="light">
              {meetingType.durationMinutes} мин
            </Badge>
          </Group>
          <Group c="orange.8" gap={5}>
            <Text fw={600} size="sm">
              Выбрать время
            </Text>
            <IconArrowRight size={16} />
          </Group>
        </Stack>
      </UnstyledButton>
    </Paper>
  );
}

export interface BookingCalendarProps {
  readonly value: string | null;
  readonly onChange?: ((value: string | null) => void) | undefined;
}

export function BookingCalendar({ onChange = () => undefined, value }: BookingCalendarProps) {
  return (
    <Paper
      className={classes.calendarPanel}
      data-testid={UIElements.BOOKING_DATE_CALENDAR}
      p="lg"
      radius="lg"
      withBorder
    >
      <Stack gap="md">
        <div>
          <Title order={3}>Выберите дату</Title>
          <Group c="dimmed" gap={6} mt={4}>
            <IconMapPin size={15} />
            <Text data-testid={UIElements.BOOKING_TIMEZONE_LABEL} size="sm">
              Время указано по Москве
            </Text>
          </Group>
        </div>
        <DatePicker
          defaultDate="2026-08-11"
          excludeDate={(date) => {
            const day = new Date(`${date}T12:00:00Z`).getUTCDay();
            return day === 0 || day === 6;
          }}
          firstDayOfWeek={1}
          locale="ru"
          maxDate="2026-08-24"
          minDate="2026-08-11"
          onChange={onChange}
          size="md"
          value={value}
        />
      </Stack>
    </Paper>
  );
}

export interface SlotListProps {
  readonly slots: readonly SlotFixture[];
  readonly selectedSlotId?: string | undefined;
  readonly onSelect?: ((slot: SlotFixture) => void) | undefined;
}

export function SlotList({ onSelect, selectedSlotId, slots }: SlotListProps) {
  return (
    <Paper
      className={classes.slotPanel}
      data-testid={UIElements.BOOKING_SLOT_LIST}
      p="lg"
      radius="lg"
      withBorder
    >
      <Stack gap="md">
        <Title order={3}>Доступное время</Title>
        <Stack gap="xs">
          {slots.map((slot) => {
            const occupied = slot.status === 'occupied';
            const selected = selectedSlotId === slot.id;

            return (
              <Button
                className={`${classes.slotButton} ${occupied ? classes.occupiedSlot : ''}`}
                color={selected ? 'orange' : 'gray'}
                data-testid={UIElements.BOOKING_SLOT_BUTTON}
                disabled={occupied}
                fullWidth
                justify="space-between"
                key={slot.id}
                onClick={() => onSelect?.(slot)}
                variant={selected ? 'filled' : 'outline'}
              >
                <span>{slot.label}</span>
                <Text component="span" fw={600} size="xs">
                  {occupied ? 'Занято' : selected ? 'Выбрано' : 'Свободно'}
                </Text>
              </Button>
            );
          })}
        </Stack>
      </Stack>
    </Paper>
  );
}

export interface BookingSummaryProps {
  readonly meetingType: MeetingTypeFixture;
  readonly dateLabel?: string | undefined;
  readonly timeLabel?: string | undefined;
}

export function BookingSummary({ dateLabel, meetingType, timeLabel }: BookingSummaryProps) {
  return (
    <Paper
      className={classes.summaryPanel}
      data-testid={UIElements.BOOKING_SUMMARY}
      p="lg"
      radius="lg"
      withBorder
    >
      <Stack gap="md">
        <div>
          <Badge color="orange" variant="light">
            {meetingType.durationMinutes} минут
          </Badge>
          <Title mt="sm" order={2}>
            {meetingType.title}
          </Title>
          <Text c="dimmed" mt={6} size="sm">
            {meetingType.description}
          </Text>
        </div>
        <Divider />
        <Stack gap={5}>
          <Text c="dimmed" size="xs" tt="uppercase">
            Выбранная дата
          </Text>
          <Text fw={600}>{dateLabel ?? 'Дата не выбрана'}</Text>
          <Text c="dimmed" mt="xs" size="xs" tt="uppercase">
            Выбранное время
          </Text>
          <Text fw={600}>{timeLabel ?? 'Время не выбрано'}</Text>
        </Stack>
      </Stack>
    </Paper>
  );
}

export interface GuestFormValues {
  readonly name: string;
  readonly email: string;
  readonly note: string;
}

export interface GuestDetailsFormProps {
  readonly values: GuestFormValues;
  readonly errors?: Partial<Record<keyof GuestFormValues, string>> | undefined;
  readonly submitting?: boolean | undefined;
  readonly onChange?: ((field: keyof GuestFormValues, value: string) => void) | undefined;
  readonly onBack?: (() => void) | undefined;
  readonly onSubmit?: (() => void) | undefined;
}

export function GuestDetailsForm({
  errors = {},
  onBack,
  onChange,
  onSubmit,
  submitting,
  values,
}: GuestDetailsFormProps) {
  return (
    <Paper className={classes.formPanel} p="xl" radius="lg" withBorder>
      <Stack gap="md">
        <div>
          <Title order={2}>Ваши данные</Title>
          <Text c="dimmed" mt={4} size="sm">
            Мы используем их только для этой встречи.
          </Text>
        </div>
        <TextInput
          data-testid={UIElements.GUEST_NAME_INPUT}
          error={errors.name}
          label="Имя"
          maxLength={100}
          onChange={(event) => onChange?.('name', event.currentTarget.value)}
          placeholder="Анна"
          required
          value={values.name}
        />
        <TextInput
          data-testid={UIElements.GUEST_EMAIL_INPUT}
          error={errors.email}
          label="Email"
          maxLength={254}
          onChange={(event) => onChange?.('email', event.currentTarget.value)}
          placeholder="anna@example.ru"
          required
          type="email"
          value={values.email}
        />
        <Textarea
          data-testid={UIElements.GUEST_NOTE_INPUT}
          error={errors.note}
          label="Заметка"
          maxLength={1000}
          minRows={4}
          onChange={(event) => onChange?.('note', event.currentTarget.value)}
          placeholder="Необязательно"
          value={values.note}
        />
        <Group justify="space-between" mt="sm">
          <Button data-testid={UIElements.GUEST_BACK_BUTTON} onClick={onBack} variant="default">
            Назад ко времени
          </Button>
          <Button
            color="orange"
            data-testid={UIElements.GUEST_SUBMIT_BUTTON}
            loading={Boolean(submitting)}
            onClick={onSubmit}
          >
            Подтвердить запись
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
}

export function MeetingTypeGrid({
  meetingTypes,
  onSelect,
}: {
  readonly meetingTypes: readonly MeetingTypeFixture[];
  readonly onSelect?: ((meetingType: MeetingTypeFixture) => void) | undefined;
}) {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2 }} data-testid={UIElements.CATALOG_MEETING_TYPE_LIST}>
      {meetingTypes.map((meetingType) => (
        <MeetingTypeCard key={meetingType.id} meetingType={meetingType} onSelect={onSelect} />
      ))}
    </SimpleGrid>
  );
}
