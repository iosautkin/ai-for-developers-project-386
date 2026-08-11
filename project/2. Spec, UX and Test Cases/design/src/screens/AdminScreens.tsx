import { Button, Group, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';

import { UIElements } from '../../../UIElements';
import type { MeetingTypeFixture, UpcomingBookingFixture } from '../fixtures';
import {
  AdminMeetingTypeCard,
  MeetingTypeForm,
  UpcomingBookingCard,
  type MeetingTypeFormProps,
} from '../components/AdminComponents';
import { AdminNavigation, AppHeader, EmptyState, StatusAlert } from '../components/Shell';

import classes from './screens.module.css';

interface AdminShellProps {
  readonly active: 'meeting-types' | 'bookings';
  readonly children: React.ReactNode;
  readonly onHome?: (() => void) | undefined;
  readonly onPublic?: (() => void) | undefined;
  readonly onMeetingTypes?: (() => void) | undefined;
  readonly onBookings?: (() => void) | undefined;
}

function AdminShell({
  active,
  children,
  onBookings,
  onHome,
  onMeetingTypes,
  onPublic,
}: AdminShellProps) {
  return (
    <div className={classes.page}>
      <AppHeader active="admin" onBook={onPublic} onHome={onHome} />
      <AdminNavigation active={active} onBookings={onBookings} onMeetingTypes={onMeetingTypes} />
      {children}
    </div>
  );
}

export interface AdminMeetingTypesScreenProps {
  readonly meetingTypes: readonly MeetingTypeFixture[];
  readonly created?: boolean | undefined;
  readonly onCreate?: (() => void) | undefined;
  readonly onBookings?: (() => void) | undefined;
}

export function AdminMeetingTypesScreen({
  created,
  meetingTypes,
  onBookings,
  onCreate,
}: AdminMeetingTypesScreenProps) {
  return (
    <AdminShell active="meeting-types" onBookings={onBookings} onMeetingTypes={() => undefined}>
      <main className={classes.main} data-testid={UIElements.ADMIN_MEETING_TYPES_SCREEN}>
        <Group align="flex-end" className={classes.sectionHeader} justify="space-between">
          <div>
            <Title order={1}>Типы встреч</Title>
            <Text c="dimmed" mt={6}>
              Форматы, которые гости могут выбрать в публичном каталоге.
            </Text>
          </div>
          <Button
            color="orange"
            data-testid={UIElements.ADMIN_CREATE_MEETING_TYPE_BUTTON}
            leftSection={<IconPlus size={17} />}
            onClick={onCreate}
          >
            Создать тип встречи
          </Button>
        </Group>
        <Stack gap="md">
          {created ? (
            <StatusAlert
              kind="success"
              message="Тип встречи создан и появился в публичном каталоге."
              testId={UIElements.ADMIN_MEETING_TYPE_CREATED_NOTIFICATION}
            />
          ) : null}
          {meetingTypes.length === 0 ? (
            <EmptyState
              actionLabel="Создать тип встречи"
              description="Добавьте первый формат, чтобы гости могли записываться."
              onAction={onCreate}
              testId={UIElements.ADMIN_MEETING_TYPES_EMPTY_STATE}
              title="Типы встреч ещё не созданы"
            />
          ) : (
            <SimpleGrid cols={{ base: 1, md: 2 }} data-testid={UIElements.ADMIN_MEETING_TYPES_LIST}>
              {meetingTypes.map((meetingType) => (
                <AdminMeetingTypeCard key={meetingType.id} meetingType={meetingType} />
              ))}
            </SimpleGrid>
          )}
        </Stack>
      </main>
    </AdminShell>
  );
}

export interface AdminCreateMeetingTypeScreenProps extends Pick<
  MeetingTypeFormProps,
  'errors' | 'onCancel' | 'onChange' | 'onSubmit' | 'values'
> {
  readonly duplicateError?: boolean | undefined;
  readonly onBookings?: (() => void) | undefined;
}

export function AdminCreateMeetingTypeScreen({
  duplicateError,
  errors,
  onBookings,
  onCancel,
  onChange,
  onSubmit,
  values,
}: AdminCreateMeetingTypeScreenProps) {
  return (
    <AdminShell active="meeting-types" onBookings={onBookings} onMeetingTypes={onCancel}>
      <main className={classes.main} data-testid={UIElements.ADMIN_CREATE_MEETING_TYPE_SCREEN}>
        <div className={classes.sectionHeader}>
          <Title order={1}>Новый тип встречи</Title>
          <Text c="dimmed" mt={6}>
            Задайте понятное название, описание и длительность, кратную 15 минутам.
          </Text>
        </div>
        <Stack gap="md" maw={760}>
          {Object.keys(errors ?? {}).length > 0 ? (
            <StatusAlert
              kind="error"
              message="Проверьте обязательные поля"
              testId={UIElements.ADMIN_MEETING_TYPE_FORM_ERROR_ALERT}
            />
          ) : null}
          {duplicateError ? (
            <StatusAlert
              kind="error"
              message="Тип встречи с таким идентификатором уже существует"
              testId={UIElements.ADMIN_MEETING_TYPE_DUPLICATE_ALERT}
            />
          ) : null}
          <MeetingTypeForm
            errors={errors}
            onCancel={onCancel}
            onChange={onChange}
            onSubmit={onSubmit}
            values={values}
          />
        </Stack>
      </main>
    </AdminShell>
  );
}

export interface AdminBookingsScreenProps {
  readonly bookings: readonly UpcomingBookingFixture[];
  readonly onMeetingTypes?: (() => void) | undefined;
}

export function AdminBookingsScreen({ bookings, onMeetingTypes }: AdminBookingsScreenProps) {
  return (
    <AdminShell active="bookings" onBookings={() => undefined} onMeetingTypes={onMeetingTypes}>
      <main className={classes.main} data-testid={UIElements.ADMIN_BOOKINGS_SCREEN}>
        <div className={classes.sectionHeader}>
          <Title order={1}>Предстоящие встречи</Title>
          <Text c="dimmed" mt={6}>
            Ближайшие записи в хронологическом порядке, время по Москве.
          </Text>
        </div>
        {bookings.length === 0 ? (
          <EmptyState
            description="Новые записи появятся здесь автоматически."
            testId={UIElements.ADMIN_BOOKINGS_EMPTY_STATE}
            title="Предстоящих встреч пока нет"
          />
        ) : (
          <div className={classes.adminList} data-testid={UIElements.ADMIN_BOOKINGS_LIST}>
            {bookings.map((booking) => (
              <UpcomingBookingCard booking={booking} key={booking.id} />
            ))}
          </div>
        )}
      </main>
    </AdminShell>
  );
}
