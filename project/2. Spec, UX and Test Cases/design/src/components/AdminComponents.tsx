import {
  Badge,
  Button,
  Group,
  Paper,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core';
import { IconCalendarEvent, IconClock, IconMail, IconUser } from '@tabler/icons-react';

import { UIElements } from '../../../UIElements';
import type { MeetingTypeFixture, UpcomingBookingFixture } from '../fixtures';

import classes from './components.module.css';

export interface MeetingTypeFormValues {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly duration: string;
}

export interface MeetingTypeFormProps {
  readonly values: MeetingTypeFormValues;
  readonly errors?: Partial<Record<keyof MeetingTypeFormValues, string>> | undefined;
  readonly onChange?: ((field: keyof MeetingTypeFormValues, value: string) => void) | undefined;
  readonly onCancel?: (() => void) | undefined;
  readonly onSubmit?: (() => void) | undefined;
}

export function MeetingTypeForm({
  errors = {},
  onCancel,
  onChange,
  onSubmit,
  values,
}: MeetingTypeFormProps) {
  return (
    <Paper className={classes.formPanel} p="xl" radius="lg" withBorder>
      <Stack gap="md">
        <TextInput
          data-testid={UIElements.ADMIN_MEETING_TYPE_ID_INPUT}
          description="Латинские буквы, цифры и дефисы, 3–64 символа"
          error={errors.id}
          label="Идентификатор"
          maxLength={64}
          onChange={(event) => onChange?.('id', event.currentTarget.value)}
          placeholder="consultation"
          required
          value={values.id}
        />
        <TextInput
          data-testid={UIElements.ADMIN_MEETING_TYPE_TITLE_INPUT}
          error={errors.title}
          label="Название"
          maxLength={100}
          onChange={(event) => onChange?.('title', event.currentTarget.value)}
          placeholder="Консультация"
          required
          value={values.title}
        />
        <Textarea
          data-testid={UIElements.ADMIN_MEETING_TYPE_DESCRIPTION_INPUT}
          error={errors.description}
          label="Описание"
          maxLength={500}
          minRows={4}
          onChange={(event) => onChange?.('description', event.currentTarget.value)}
          placeholder="Расскажите гостю, чему посвящена встреча"
          required
          value={values.description}
        />
        <Select
          allowDeselect={false}
          data={['15', '30', '45', '60', '90', '120'].map((duration) => ({
            label: `${duration} минут`,
            value: duration,
          }))}
          data-testid={UIElements.ADMIN_MEETING_TYPE_DURATION_SELECT}
          error={errors.duration}
          label="Длительность"
          onChange={(value) => onChange?.('duration', value ?? '30')}
          required
          value={values.duration}
        />
        <Group justify="flex-end" mt="sm">
          <Button
            data-testid={UIElements.ADMIN_MEETING_TYPE_CANCEL_BUTTON}
            onClick={onCancel}
            variant="default"
          >
            Отмена
          </Button>
          <Button
            color="orange"
            data-testid={UIElements.ADMIN_MEETING_TYPE_SUBMIT_BUTTON}
            onClick={onSubmit}
          >
            Создать тип встречи
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
}

export function AdminMeetingTypeCard({
  meetingType,
}: {
  readonly meetingType: MeetingTypeFixture;
}) {
  return (
    <Paper
      className={classes.adminCard}
      data-testid={UIElements.ADMIN_MEETING_TYPE_CARD}
      p="lg"
      radius="lg"
      withBorder
    >
      <Group align="flex-start" justify="space-between">
        <div>
          <Title order={3}>{meetingType.title}</Title>
          <Text c="dimmed" mt={4} size="sm">
            {meetingType.description}
          </Text>
          <Text c="dimmed" mt="sm" size="xs">
            ID: {meetingType.id}
          </Text>
        </div>
        <Badge color="orange" leftSection={<IconClock size={13} />} variant="light">
          {meetingType.durationMinutes} мин
        </Badge>
      </Group>
    </Paper>
  );
}

export function UpcomingBookingCard({ booking }: { readonly booking: UpcomingBookingFixture }) {
  return (
    <Paper
      className={classes.bookingCard}
      data-testid={UIElements.ADMIN_BOOKING_CARD}
      p="lg"
      radius="lg"
      withBorder
    >
      <Stack gap="md">
        <Group align="flex-start" justify="space-between">
          <div>
            <Title order={3}>{booking.meetingTypeTitle}</Title>
            <Group c="dimmed" gap={6} mt={5}>
              <IconCalendarEvent size={16} />
              <Text size="sm">{booking.dateLabel}</Text>
            </Group>
          </div>
          <Badge color="orange" variant="light">
            {booking.timeLabel}
          </Badge>
        </Group>
        <Group align="flex-start" grow>
          <Group gap={7} wrap="nowrap">
            <IconUser size={17} />
            <Text size="sm">{booking.guestName}</Text>
          </Group>
          <Group gap={7} wrap="nowrap">
            <IconMail size={17} />
            <Text size="sm">{booking.email}</Text>
          </Group>
        </Group>
        <Text c={booking.note ? 'dark' : 'dimmed'} size="sm">
          {booking.note ?? 'Без заметки'}
        </Text>
      </Stack>
    </Paper>
  );
}
