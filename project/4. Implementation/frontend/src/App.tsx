import {
  Alert,
  Badge,
  Box,
  Button,
  Center,
  Divider,
  Group,
  Loader,
  NumberInput,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  TextInput,
  ThemeIcon,
  Title,
  UnstyledButton,
} from '@mantine/core';
import { DatePicker } from '@mantine/dates';
import { useForm } from '@mantine/form';
import {
  IconAlertCircle,
  IconArrowRight,
  IconCalendarCheck,
  IconCalendarEvent,
  IconCheck,
  IconCircleCheck,
  IconClock,
  IconInbox,
  IconMail,
  IconMapPin,
  IconPlus,
  IconUser,
} from '@tabler/icons-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router';

import componentClasses from '@design/src/components/components.module.css';
import screenClasses from '@design/src/screens/screens.module.css';

import { UIElements } from '../../../2. Spec, UX and Test Cases/UIElements';
import type { AvailabilityResponse } from '../../shared/api-contract/src/generated/models/availabilityResponse';
import type { Booking } from '../../shared/api-contract/src/generated/models/booking';
import type { MeetingType } from '../../shared/api-contract/src/generated/models/meetingType';
import {
  CreateMeetingTypeRequest,
  GuestDetails,
} from '../../shared/api-contract/src/generated/zod/schemas';
import {
  getGetMeetingTypeAvailabilityQueryKey,
  getGetMeetingTypeQueryKey,
  getListMeetingTypesQueryKey,
  getListUpcomingBookingsQueryKey,
  useCreateBooking,
  useCreateMeetingType,
  useGetMeetingType,
  useGetMeetingTypeAvailability,
  useListMeetingTypes,
  useListUpcomingBookings,
} from './api/generated/client';
import { ApiRequestError } from './api/httpClient';
import {
  APP_PATHS,
  bookingPath,
  failUnexpectedStatus,
  formatMoscowDate,
  formatMoscowTimeRange,
  guestDetailsPath,
  type AppComponent,
  type BookingSuccessState,
} from './App.contract';

function Header() {
  const { pathname } = useLocation();
  const active = pathname.startsWith('/admin')
    ? 'admin'
    : pathname.startsWith('/book')
      ? 'public'
      : undefined;

  return (
    <Box component="header" className={componentClasses.header} data-testid={UIElements.APP_HEADER}>
      <div className={componentClasses.headerInner}>
        <Button
          className={componentClasses.brand}
          color="dark"
          component={Link}
          data-testid={UIElements.APP_LOGO_LINK}
          leftSection={<IconCalendarEvent size={21} stroke={2.2} />}
          to={APP_PATHS.home}
          variant="transparent"
        >
          <span>
            Календарь<span className={componentClasses.brandSuffix}> звонков</span>
          </span>
        </Button>
        <Group gap="xs" wrap="nowrap">
          <Button
            color={active === 'public' ? 'orange' : 'gray'}
            component={Link}
            data-testid={UIElements.PUBLIC_BOOK_NAV_LINK}
            to={APP_PATHS.catalog}
            variant={active === 'public' ? 'light' : 'subtle'}
          >
            Записаться
          </Button>
          <Button
            color={active === 'admin' ? 'orange' : 'gray'}
            component={Link}
            data-testid={UIElements.ADMIN_NAV_LINK}
            to={APP_PATHS.adminMeetingTypes}
            variant={active === 'admin' ? 'light' : 'subtle'}
          >
            Админка
          </Button>
        </Group>
      </div>
    </Box>
  );
}

function Page({ children }: { readonly children: React.ReactNode }) {
  return (
    <div className={screenClasses.page}>
      <Header />
      {children}
    </div>
  );
}

function Loading({ testId, label = 'Загружаем данные…' }: { testId?: string; label?: string }) {
  return (
    <Center className={screenClasses.loadingPanel} data-testid={testId}>
      <Stack align="center" gap="sm">
        <Loader color="orange" />
        <Text c="dimmed">{label}</Text>
      </Stack>
    </Center>
  );
}

function EmptyState({
  actionLabel,
  description,
  onAction,
  testId,
  title,
}: {
  readonly title: string;
  readonly description?: string;
  readonly testId: UIElements;
  readonly actionLabel?: string;
  readonly onAction?: () => void;
}) {
  return (
    <Paper className={componentClasses.emptyState} data-testid={testId} p="xl" radius="lg">
      <Center>
        <Stack align="center" gap="sm" maw={440} ta="center">
          <ThemeIcon color="gray" radius="xl" size={48} variant="light">
            <IconInbox size={24} />
          </ThemeIcon>
          <Title order={3}>{title}</Title>
          {description ? <Text c="dimmed">{description}</Text> : null}
          {actionLabel ? (
            <Button color="orange" onClick={onAction}>
              {actionLabel}
            </Button>
          ) : null}
        </Stack>
      </Center>
    </Paper>
  );
}

function StatusAlert({
  actionLabel,
  actionTestId,
  kind,
  message,
  onAction,
  testId,
}: {
  readonly kind: 'success' | 'error' | 'conflict';
  readonly message: string;
  readonly testId: UIElements;
  readonly actionLabel?: string;
  readonly actionTestId?: UIElements;
  readonly onAction?: () => void;
}) {
  const success = kind === 'success';
  return (
    <Alert
      color={success ? 'green' : kind === 'conflict' ? 'orange' : 'red'}
      data-testid={testId}
      icon={success ? <IconCircleCheck size={19} /> : <IconAlertCircle size={19} />}
      radius="md"
      title={success ? 'Готово' : kind === 'conflict' ? 'Время недоступно' : 'Что-то пошло не так'}
    >
      <Stack gap="sm">
        <Text size="sm">{message}</Text>
        {actionLabel ? (
          <Button
            color={success ? 'green' : 'red'}
            data-testid={actionTestId}
            onClick={onAction}
            size="xs"
            variant="light"
          >
            {actionLabel}
          </Button>
        ) : null}
      </Stack>
    </Alert>
  );
}

function HomeScreen() {
  const steps = [
    ['1', 'Выберите формат', 'От короткого знакомства до подробной консультации.'],
    ['2', 'Найдите время', 'Свободные интервалы показаны по Москве.'],
    ['3', 'Подтвердите запись', 'Оставьте имя и email — без регистрации.'],
  ] as const;

  return (
    <Page>
      <main className={screenClasses.main} data-testid={UIElements.HOME_SCREEN}>
        <section className={screenClasses.hero}>
          <Stack align="flex-start" gap="xl">
            <Badge color="blue" size="lg" variant="light">
              Простой календарь для звонков
            </Badge>
            <Title className={screenClasses.heroTitle} order={1}>
              Запланируйте звонок <span className={screenClasses.heroAccent}>без переписки</span>
            </Title>
            <Text c="dimmed" maw={620} size="xl">
              Выберите формат встречи и удобное время по Москве.
            </Text>
            <Button
              color="orange"
              component={Link}
              data-testid={UIElements.HOME_BOOK_BUTTON}
              rightSection={<IconArrowRight size={19} />}
              size="lg"
              to={APP_PATHS.catalog}
            >
              Записаться
            </Button>
          </Stack>
          <Paper
            className={screenClasses.featurePanel}
            data-testid={UIElements.HOME_FEATURES_PANEL}
            p="xl"
            radius="xl"
          >
            <Stack gap="xl">
              {steps.map(([number, title, description]) => (
                <Group align="flex-start" key={number} wrap="nowrap">
                  <ThemeIcon
                    className={screenClasses.stepNumber}
                    color="orange"
                    radius="xl"
                    size="xl"
                  >
                    {number}
                  </ThemeIcon>
                  <div>
                    <Text fw={700} size="lg">
                      {title}
                    </Text>
                    <Text c="dimmed" mt={3}>
                      {description}
                    </Text>
                  </div>
                </Group>
              ))}
            </Stack>
          </Paper>
        </section>
      </main>
    </Page>
  );
}

function MeetingTypeCard({ meetingType }: { readonly meetingType: MeetingType }) {
  return (
    <Paper className={componentClasses.meetingCard} p="lg" radius="lg" withBorder>
      <UnstyledButton
        className={componentClasses.cardButton}
        component={Link}
        data-testid={UIElements.CATALOG_MEETING_TYPE_CARD}
        to={bookingPath(meetingType.id)}
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

function CatalogScreen() {
  const meetingTypes = useListMeetingTypes<MeetingType[]>({
    query: {
      queryKey: getListMeetingTypesQueryKey(),
      retry: false,
      select: (response) =>
        response.status === 200 ? response.data : failUnexpectedStatus(response.status),
    },
  });

  return (
    <Page>
      <main className={screenClasses.main} data-testid={UIElements.CATALOG_SCREEN}>
        <div className={screenClasses.sectionHeader}>
          <Badge color="orange" variant="light">
            Каталог
          </Badge>
          <Title data-testid={UIElements.CATALOG_HEADING} mt="sm" order={1}>
            Выберите тип встречи
          </Title>
          <Text c="dimmed" mt={8}>
            Каждый вариант показывает длительность и назначение звонка.
          </Text>
        </div>
        {meetingTypes.isPending ? (
          <Loading label="Загружаем типы встреч…" testId={UIElements.CATALOG_LOADING} />
        ) : null}
        {meetingTypes.isError ? (
          <StatusAlert
            actionLabel="Повторить"
            actionTestId={UIElements.CATALOG_RETRY_BUTTON}
            kind="error"
            message="Не удалось загрузить данные"
            onAction={() => void meetingTypes.refetch()}
            testId={UIElements.CATALOG_ERROR_ALERT}
          />
        ) : null}
        {meetingTypes.data?.length === 0 ? (
          <EmptyState
            description="Вернитесь позже — владелец календаря ещё не добавил варианты."
            testId={UIElements.CATALOG_EMPTY_STATE}
            title="Пока нет доступных типов встреч"
          />
        ) : null}
        {meetingTypes.data?.length ? (
          <SimpleGrid cols={{ base: 1, sm: 2 }} data-testid={UIElements.CATALOG_MEETING_TYPE_LIST}>
            {meetingTypes.data.map((meetingType) => (
              <MeetingTypeCard key={meetingType.id} meetingType={meetingType} />
            ))}
          </SimpleGrid>
        ) : null}
      </main>
    </Page>
  );
}

function BookingSummary({
  dateLabel,
  meetingType,
  timeLabel,
}: {
  readonly meetingType: MeetingType;
  readonly dateLabel?: string | undefined;
  readonly timeLabel?: string | undefined;
}) {
  return (
    <Paper
      className={componentClasses.summaryPanel}
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

function BookingScreen() {
  const { meetingTypeId = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const meetingType = useGetMeetingType<MeetingType>(meetingTypeId, {
    query: {
      queryKey: getGetMeetingTypeQueryKey(meetingTypeId),
      select: (response) =>
        response.status === 200 ? response.data : failUnexpectedStatus(response.status),
    },
  });
  const availability = useGetMeetingTypeAvailability<AvailabilityResponse>(meetingTypeId, {
    query: {
      queryKey: getGetMeetingTypeAvailabilityQueryKey(meetingTypeId),
      select: (response) =>
        response.status === 200 ? response.data : failUnexpectedStatus(response.status),
    },
  });
  const selectedDate = searchParams.get('date');
  const selectedStart = searchParams.get('startsAt');
  const currentDate =
    availability.data?.dates.find((item) => item.date === selectedDate) ??
    availability.data?.dates.find((item) => item.bookable);
  const selectedSlot = currentDate?.slots.find(
    (slot) => slot.startsAt === selectedStart && slot.status === 'available',
  );

  if (meetingType.isPending || availability.isPending) {
    return (
      <Page>
        <main className={screenClasses.main}>
          <Loading />
        </main>
      </Page>
    );
  }
  if (meetingType.isError || availability.isError || !meetingType.data || !availability.data) {
    return (
      <Page>
        <main className={screenClasses.main}>
          <Alert color="red">Не удалось загрузить расписание.</Alert>
        </main>
      </Page>
    );
  }

  const dateAvailability = new Map(availability.data.dates.map((date) => [date.date, date]));
  const chooseDate = (date: string | null) => date && setSearchParams({ date });
  const chooseSlot = (startsAt: string) =>
    setSearchParams({ date: currentDate?.date ?? '', startsAt });

  return (
    <Page>
      <main className={screenClasses.main} data-testid={UIElements.BOOKING_SCREEN}>
        <div className={screenClasses.sectionHeader}>
          <Title order={1}>Выберите дату и время</Title>
          <Text c="dimmed" mt={6}>
            Доступны будние дни в ближайшие 14 дней.
          </Text>
        </div>
        <Stack gap="md">
          {searchParams.get('conflict') === '1' ? (
            <StatusAlert
              kind="conflict"
              message="Это время уже заняли. Выберите другой слот"
              testId={UIElements.BOOKING_CONFLICT_ALERT}
            />
          ) : null}
          <div className={screenClasses.bookingGrid}>
            <BookingSummary
              dateLabel={
                currentDate ? formatMoscowDate(`${currentDate.date}T12:00:00Z`) : undefined
              }
              meetingType={meetingType.data}
              timeLabel={
                selectedSlot
                  ? formatMoscowTimeRange(selectedSlot.startsAt, selectedSlot.endsAt)
                  : undefined
              }
            />
            <Paper
              className={componentClasses.calendarPanel}
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
                  defaultDate={availability.data.windowStartsOn}
                  excludeDate={(date) => !dateAvailability.get(date)?.bookable}
                  firstDayOfWeek={1}
                  locale="ru"
                  maxDate={availability.data.windowEndsOn}
                  minDate={availability.data.windowStartsOn}
                  onChange={chooseDate}
                  size="md"
                  value={currentDate?.date ?? null}
                />
              </Stack>
            </Paper>
            {currentDate?.slots.some((slot) => slot.status === 'available') ? (
              <Paper
                className={componentClasses.slotPanel}
                data-testid={UIElements.BOOKING_SLOT_LIST}
                p="lg"
                radius="lg"
                withBorder
              >
                <Stack gap="md">
                  <Title order={3}>Доступное время</Title>
                  <Stack className={componentClasses.slotList} gap="xs">
                    {currentDate.slots.map((slot) => {
                      const occupied = slot.status === 'occupied';
                      const selected = selectedSlot?.startsAt === slot.startsAt;
                      return (
                        <Button
                          className={`${componentClasses.slotButton} ${occupied ? componentClasses.occupiedSlot : ''}`}
                          color={selected ? 'orange' : 'gray'}
                          data-testid={UIElements.BOOKING_SLOT_BUTTON}
                          disabled={occupied}
                          fullWidth
                          justify="space-between"
                          key={slot.startsAt}
                          onClick={() => chooseSlot(slot.startsAt)}
                          variant={selected ? 'filled' : 'outline'}
                        >
                          <span>{formatMoscowTimeRange(slot.startsAt, slot.endsAt)}</span>
                          <Text component="span" fw={600} size="xs">
                            {occupied ? 'Занято' : selected ? 'Выбрано' : 'Свободно'}
                          </Text>
                        </Button>
                      );
                    })}
                  </Stack>
                </Stack>
              </Paper>
            ) : (
              <EmptyState
                description="Попробуйте выбрать другой день."
                testId={UIElements.BOOKING_NO_SLOTS_STATE}
                title="На эту дату свободного времени нет"
              />
            )}
          </div>
          <Group justify="space-between" mt="sm">
            <Button
              data-testid={UIElements.BOOKING_BACK_BUTTON}
              onClick={() => navigate(APP_PATHS.catalog)}
              variant="default"
            >
              Назад
            </Button>
            <Button
              color="orange"
              data-testid={UIElements.BOOKING_CONTINUE_BUTTON}
              disabled={!selectedSlot}
              onClick={() =>
                selectedSlot && navigate(guestDetailsPath(meetingTypeId, selectedSlot.startsAt))
              }
              rightSection={<IconArrowRight size={17} />}
            >
              Продолжить
            </Button>
          </Group>
        </Stack>
      </main>
    </Page>
  );
}

function zodFieldErrors(result: {
  readonly success: boolean;
  readonly error?: {
    readonly issues: readonly { readonly path: readonly PropertyKey[]; readonly message: string }[];
  };
}) {
  if (result.success || !result.error) return {};
  return Object.fromEntries(
    result.error.issues.map((issue) => [issue.path.join('.'), issue.message]),
  );
}

function GuestDetailsScreen() {
  const { meetingTypeId = '' } = useParams();
  const [searchParams] = useSearchParams();
  const startsAt = searchParams.get('startsAt') ?? '';
  const meetingType = useGetMeetingType<MeetingType>(meetingTypeId, {
    query: {
      queryKey: getGetMeetingTypeQueryKey(meetingTypeId),
      select: (response) =>
        response.status === 200 ? response.data : failUnexpectedStatus(response.status),
    },
  });
  const availability = useGetMeetingTypeAvailability<AvailabilityResponse>(meetingTypeId, {
    query: {
      queryKey: getGetMeetingTypeAvailabilityQueryKey(meetingTypeId),
      select: (response) =>
        response.status === 200 ? response.data : failUnexpectedStatus(response.status),
    },
  });
  const mutation = useCreateBooking<ApiRequestError>();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const form = useForm({ initialValues: { name: '', email: '', note: '' } });
  const slot = availability.data?.dates
    .flatMap((date) => date.slots)
    .find((item) => item.startsAt === startsAt);

  const submit = form.onSubmit(async (values) => {
    const normalized = {
      name: values.name.trim(),
      email: values.email.trim(),
      ...(values.note.trim() ? { note: values.note.trim() } : {}),
    };
    const parsed = GuestDetails.safeParse(normalized);
    if (!parsed.success) {
      const errors = zodFieldErrors(parsed);
      form.setErrors({
        ...(errors.name ? { name: values.name.trim() ? 'Проверьте имя' : 'Укажите имя' } : {}),
        ...(errors.email
          ? { email: values.email.trim() ? 'Укажите корректный email' : 'Укажите email' }
          : {}),
        ...(errors.note ? { note: 'Проверьте заметку' } : {}),
      });
      return;
    }
    try {
      const response = await mutation.mutateAsync({
        data: { meetingTypeId, startsAt, guest: parsed.data },
      });
      if (response.status === 201) {
        navigate(`${bookingPath(meetingTypeId)}/success`, {
          state: { booking: response.data } satisfies BookingSuccessState,
        });
      } else {
        failUnexpectedStatus(response.status);
      }
    } catch (error) {
      if (error instanceof ApiRequestError && error.code === 'SLOT_CONFLICT') {
        await queryClient.invalidateQueries({
          queryKey: getGetMeetingTypeAvailabilityQueryKey(meetingTypeId),
        });
        const date = availability.data?.dates.find((item) =>
          item.slots.some((candidate) => candidate.startsAt === startsAt),
        )?.date;
        navigate(
          `${bookingPath(meetingTypeId)}?${new URLSearchParams({ ...(date ? { date } : {}), conflict: '1' })}`,
        );
      }
    }
  });

  if (meetingType.isPending || availability.isPending) {
    return (
      <Page>
        <main className={screenClasses.main}>
          <Loading />
        </main>
      </Page>
    );
  }
  if (!meetingType.data || !slot) return <Navigate replace to={bookingPath(meetingTypeId)} />;

  return (
    <Page>
      <main className={screenClasses.main} data-testid={UIElements.GUEST_DETAILS_SCREEN}>
        <div className={screenClasses.sectionHeader}>
          <Title order={1}>Завершите запись</Title>
          <Text c="dimmed" mt={6}>
            Проверьте время и представьтесь владельцу календаря.
          </Text>
        </div>
        <Stack gap="md">
          {Object.keys(form.errors).length ? (
            <StatusAlert
              kind="error"
              message={Object.values(form.errors).map(String).join('. ')}
              testId={UIElements.GUEST_FORM_ERROR_ALERT}
            />
          ) : null}
          {mutation.isError &&
          !(
            mutation.error instanceof ApiRequestError && mutation.error.code === 'SLOT_CONFLICT'
          ) ? (
            <StatusAlert
              actionLabel="Повторить"
              actionTestId={UIElements.GUEST_RETRY_BUTTON}
              kind="error"
              message="Не удалось создать запись. Попробуйте ещё раз"
              onAction={() => submit()}
              testId={UIElements.GUEST_SUBMIT_ERROR_ALERT}
            />
          ) : null}
          <div className={screenClasses.formGrid}>
            <Paper
              className={componentClasses.formPanel}
              component="form"
              noValidate
              onSubmit={submit}
              p="xl"
              radius="lg"
              withBorder
            >
              <Stack gap="md">
                <div>
                  <Title order={2}>Ваши данные</Title>
                  <Text c="dimmed" mt={4} size="sm">
                    Мы используем их только для этой встречи.
                  </Text>
                </div>
                <TextInput
                  data-testid={UIElements.GUEST_NAME_INPUT}
                  label="Имя"
                  maxLength={100}
                  placeholder="Анна"
                  required
                  {...form.getInputProps('name')}
                />
                <TextInput
                  data-testid={UIElements.GUEST_EMAIL_INPUT}
                  label="Email"
                  maxLength={254}
                  placeholder="anna@example.ru"
                  required
                  type="email"
                  {...form.getInputProps('email')}
                />
                <Textarea
                  data-testid={UIElements.GUEST_NOTE_INPUT}
                  label="Заметка"
                  maxLength={1000}
                  minRows={4}
                  placeholder="Необязательно"
                  {...form.getInputProps('note')}
                />
                <Group justify="space-between" mt="sm">
                  <Button
                    data-testid={UIElements.GUEST_BACK_BUTTON}
                    onClick={() => navigate(-1)}
                    type="button"
                    variant="default"
                  >
                    Назад ко времени
                  </Button>
                  <Button
                    color="orange"
                    data-testid={UIElements.GUEST_SUBMIT_BUTTON}
                    loading={mutation.isPending}
                    type="submit"
                  >
                    Подтвердить запись
                  </Button>
                </Group>
              </Stack>
            </Paper>
            <BookingSummary
              dateLabel={formatMoscowDate(slot.startsAt)}
              meetingType={meetingType.data}
              timeLabel={formatMoscowTimeRange(slot.startsAt, slot.endsAt)}
            />
          </div>
        </Stack>
      </main>
    </Page>
  );
}

function BookingSuccessScreen() {
  const location = useLocation();
  const state = location.state as BookingSuccessState | null;
  const booking = state?.booking;
  if (!booking) return <Navigate replace to={APP_PATHS.catalog} />;

  return (
    <Page>
      <main className={screenClasses.main} data-testid={UIElements.BOOKING_SUCCESS_SCREEN}>
        <Paper className={screenClasses.successCard} p={40} radius="xl" withBorder>
          <Stack align="center" gap="lg" ta="center">
            <ThemeIcon className={screenClasses.successIcon} radius="xl" size={72} variant="light">
              <IconCheck size={36} stroke={2.5} />
            </ThemeIcon>
            <div>
              <Title order={1}>Вы записаны</Title>
              <Text c="dimmed" mt={8}>
                {booking.guest.name}, встреча добавлена в календарь.
              </Text>
            </div>
            <Paper data-testid={UIElements.BOOKING_SUCCESS_DETAILS} p="lg" radius="lg" withBorder>
              <Stack gap="xs">
                <Group gap="xs" justify="center">
                  <IconCalendarCheck size={18} />
                  <Text fw={700}>
                    {booking.meetingType.title} · {booking.meetingType.durationMinutes} минут
                  </Text>
                </Group>
                <Group c="dimmed" gap="xs" justify="center">
                  <IconClock size={17} />
                  <Text>
                    {formatMoscowDate(booking.startsAt)},{' '}
                    {formatMoscowTimeRange(booking.startsAt, booking.endsAt)} · Москва
                  </Text>
                </Group>
                <Text c="dimmed" size="sm">
                  Гость: {booking.guest.name} · Владелец: {booking.owner.displayName}
                </Text>
              </Stack>
            </Paper>
            <Group justify="center">
              <Button
                color="orange"
                component={Link}
                data-testid={UIElements.SUCCESS_BOOK_AGAIN_BUTTON}
                to={bookingPath(booking.meetingType.id)}
              >
                Записаться ещё
              </Button>
              <Button
                component={Link}
                data-testid={UIElements.SUCCESS_HOME_LINK}
                to={APP_PATHS.home}
                variant="default"
              >
                На главную
              </Button>
            </Group>
          </Stack>
        </Paper>
      </main>
    </Page>
  );
}

function AdminNavigation({ active }: { readonly active: 'meeting-types' | 'bookings' }) {
  return (
    <Box className={componentClasses.adminNav} data-testid={UIElements.ADMIN_SHELL}>
      <Group gap="xs" maw="var(--calendar-content-width)" mx="auto" px="md" py="sm">
        <Button
          color="orange"
          component={Link}
          data-testid={UIElements.ADMIN_MEETING_TYPES_TAB}
          to={APP_PATHS.adminMeetingTypes}
          variant={active === 'meeting-types' ? 'filled' : 'subtle'}
        >
          Типы встреч
        </Button>
        <Button
          color="orange"
          component={Link}
          data-testid={UIElements.ADMIN_BOOKINGS_TAB}
          to={APP_PATHS.adminBookings}
          variant={active === 'bookings' ? 'filled' : 'subtle'}
        >
          Предстоящие встречи
        </Button>
      </Group>
    </Box>
  );
}

function AdminMeetingTypesScreen() {
  const navigate = useNavigate();
  const query = useListMeetingTypes<MeetingType[]>({
    query: {
      queryKey: getListMeetingTypesQueryKey(),
      select: (response) =>
        response.status === 200 ? response.data : failUnexpectedStatus(response.status),
    },
  });
  const [searchParams] = useSearchParams();

  return (
    <Page>
      <AdminNavigation active="meeting-types" />
      <main className={screenClasses.main} data-testid={UIElements.ADMIN_MEETING_TYPES_SCREEN}>
        <Group align="flex-end" className={screenClasses.sectionHeader} justify="space-between">
          <div>
            <Title order={1}>Типы встреч</Title>
            <Text c="dimmed" mt={6}>
              Форматы, которые гости могут выбрать в публичном каталоге.
            </Text>
          </div>
          <Button
            color="orange"
            component={Link}
            data-testid={UIElements.ADMIN_CREATE_MEETING_TYPE_BUTTON}
            leftSection={<IconPlus size={17} />}
            to={APP_PATHS.adminCreateMeetingType}
          >
            Создать тип встречи
          </Button>
        </Group>
        <Stack gap="md">
          {searchParams.get('created') === '1' ? (
            <StatusAlert
              kind="success"
              message="Тип встречи создан и появился в публичном каталоге."
              testId={UIElements.ADMIN_MEETING_TYPE_CREATED_NOTIFICATION}
            />
          ) : null}
          {query.isPending ? <Loading /> : null}
          {query.data?.length === 0 ? (
            <EmptyState
              actionLabel="Создать тип встречи"
              description="Добавьте первый формат, чтобы гости могли записываться."
              onAction={() => navigate(APP_PATHS.adminCreateMeetingType)}
              testId={UIElements.ADMIN_MEETING_TYPES_EMPTY_STATE}
              title="Типы встреч ещё не созданы"
            />
          ) : null}
          {query.data?.length ? (
            <SimpleGrid cols={{ base: 1, md: 2 }} data-testid={UIElements.ADMIN_MEETING_TYPES_LIST}>
              {query.data.map((meetingType) => (
                <Paper
                  className={componentClasses.adminCard}
                  data-testid={UIElements.ADMIN_MEETING_TYPE_CARD}
                  key={meetingType.id}
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
              ))}
            </SimpleGrid>
          ) : null}
        </Stack>
      </main>
    </Page>
  );
}

function AdminCreateMeetingTypeScreen() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const mutation = useCreateMeetingType<ApiRequestError>();
  const form = useForm({
    initialValues: { id: '', title: '', description: '', durationMinutes: 30 },
  });
  const submit = form.onSubmit(async (values) => {
    const parsed = CreateMeetingTypeRequest.safeParse({
      ...values,
      id: values.id.trim(),
      title: values.title.trim(),
      description: values.description.trim(),
    });
    if (!parsed.success) {
      const errors = zodFieldErrors(parsed);
      form.setErrors({
        ...(errors.id
          ? {
              id: values.id.trim()
                ? 'Используйте латиницу, цифры и дефисы'
                : 'Укажите идентификатор',
            }
          : {}),
        ...(errors.title ? { title: 'Укажите название' } : {}),
        ...(errors.description ? { description: 'Укажите описание' } : {}),
        ...(errors.durationMinutes
          ? { durationMinutes: 'Длительность должна быть кратна 15 минутам' }
          : {}),
      });
      return;
    }
    try {
      await mutation.mutateAsync({ data: parsed.data });
      await queryClient.invalidateQueries({ queryKey: getListMeetingTypesQueryKey() });
      navigate(`${APP_PATHS.adminMeetingTypes}?created=1`);
    } catch {
      /* The mutation state renders the contract error below. */
    }
  });
  const duplicate =
    mutation.error instanceof ApiRequestError && mutation.error.code === 'DUPLICATE_MEETING_TYPE';

  return (
    <Page>
      <AdminNavigation active="meeting-types" />
      <main
        className={screenClasses.main}
        data-testid={UIElements.ADMIN_CREATE_MEETING_TYPE_SCREEN}
      >
        <div className={screenClasses.sectionHeader}>
          <Title order={1}>Новый тип встречи</Title>
          <Text c="dimmed" mt={6}>
            Задайте понятное название, описание и длительность, кратную 15 минутам.
          </Text>
        </div>
        <Stack gap="md" maw={760}>
          {Object.keys(form.errors).length ? (
            <StatusAlert
              kind="error"
              message={Object.values(form.errors).map(String).join('. ')}
              testId={UIElements.ADMIN_MEETING_TYPE_FORM_ERROR_ALERT}
            />
          ) : null}
          {duplicate ? (
            <StatusAlert
              kind="error"
              message="Тип встречи с таким идентификатором уже существует"
              testId={UIElements.ADMIN_MEETING_TYPE_DUPLICATE_ALERT}
            />
          ) : null}
          <Paper
            className={componentClasses.formPanel}
            component="form"
            noValidate
            onSubmit={submit}
            p="xl"
            radius="lg"
            withBorder
          >
            <Stack gap="md">
              <TextInput
                data-testid={UIElements.ADMIN_MEETING_TYPE_ID_INPUT}
                description="Латинские буквы, цифры и дефисы, 3–64 символа"
                label="Идентификатор"
                maxLength={64}
                placeholder="consultation"
                required
                {...form.getInputProps('id')}
              />
              <TextInput
                data-testid={UIElements.ADMIN_MEETING_TYPE_TITLE_INPUT}
                label="Название"
                maxLength={100}
                placeholder="Консультация"
                required
                {...form.getInputProps('title')}
              />
              <Textarea
                data-testid={UIElements.ADMIN_MEETING_TYPE_DESCRIPTION_INPUT}
                label="Описание"
                maxLength={500}
                minRows={4}
                placeholder="Расскажите гостю, чему посвящена встреча"
                required
                {...form.getInputProps('description')}
              />
              <NumberInput
                data-testid={UIElements.ADMIN_MEETING_TYPE_DURATION_SELECT}
                label="Длительность, минут"
                max={540}
                min={15}
                required
                step={15}
                {...form.getInputProps('durationMinutes')}
              />
              <Group justify="flex-end" mt="sm">
                <Button
                  data-testid={UIElements.ADMIN_MEETING_TYPE_CANCEL_BUTTON}
                  onClick={() => navigate(APP_PATHS.adminMeetingTypes)}
                  type="button"
                  variant="default"
                >
                  Отмена
                </Button>
                <Button
                  color="orange"
                  data-testid={UIElements.ADMIN_MEETING_TYPE_SUBMIT_BUTTON}
                  loading={mutation.isPending}
                  type="submit"
                >
                  Создать тип встречи
                </Button>
              </Group>
            </Stack>
          </Paper>
        </Stack>
      </main>
    </Page>
  );
}

function BookingCard({ booking }: { readonly booking: Booking }) {
  return (
    <Paper
      className={componentClasses.bookingCard}
      data-testid={UIElements.ADMIN_BOOKING_CARD}
      p="lg"
      radius="lg"
      withBorder
    >
      <Stack gap="md">
        <Group align="flex-start" justify="space-between">
          <div>
            <Title order={3}>{booking.meetingType.title}</Title>
            <Group c="dimmed" gap={6} mt={5}>
              <IconCalendarEvent size={16} />
              <Text size="sm">{formatMoscowDate(booking.startsAt)}</Text>
            </Group>
          </div>
          <Badge color="orange" variant="light">
            {formatMoscowTimeRange(booking.startsAt, booking.endsAt)}
          </Badge>
        </Group>
        <Group align="flex-start" grow>
          <Group gap={7} wrap="nowrap">
            <IconUser size={17} />
            <Text size="sm">{booking.guest.name}</Text>
          </Group>
          <Group gap={7} wrap="nowrap">
            <IconMail size={17} />
            <Text size="sm">{booking.guest.email}</Text>
          </Group>
        </Group>
        <Text c={booking.guest.note ? 'dark' : 'dimmed'} size="sm">
          {booking.guest.note ?? 'Без заметки'}
        </Text>
      </Stack>
    </Paper>
  );
}

function AdminBookingsScreen() {
  const query = useListUpcomingBookings<Booking[]>({
    query: {
      queryKey: getListUpcomingBookingsQueryKey(),
      select: (response) =>
        response.status === 200 ? response.data : failUnexpectedStatus(response.status),
    },
  });

  return (
    <Page>
      <AdminNavigation active="bookings" />
      <main className={screenClasses.main} data-testid={UIElements.ADMIN_BOOKINGS_SCREEN}>
        <div className={screenClasses.sectionHeader}>
          <Title order={1}>Предстоящие встречи</Title>
          <Text c="dimmed" mt={6}>
            Ближайшие записи в хронологическом порядке, время по Москве.
          </Text>
        </div>
        {query.isPending ? <Loading /> : null}
        {query.data?.length === 0 ? (
          <EmptyState
            description="Новые записи появятся здесь автоматически."
            testId={UIElements.ADMIN_BOOKINGS_EMPTY_STATE}
            title="Предстоящих встреч пока нет"
          />
        ) : null}
        {query.data?.length ? (
          <div className={screenClasses.adminList} data-testid={UIElements.ADMIN_BOOKINGS_LIST}>
            {query.data.map((booking) => (
              <BookingCard booking={booking} key={booking.id} />
            ))}
          </div>
        ) : null}
      </main>
    </Page>
  );
}

export const App: AppComponent = () => (
  <Routes>
    <Route element={<HomeScreen />} path={APP_PATHS.home} />
    <Route element={<CatalogScreen />} path={APP_PATHS.catalog} />
    <Route element={<BookingScreen />} path="/book/:meetingTypeId" />
    <Route element={<GuestDetailsScreen />} path="/book/:meetingTypeId/details" />
    <Route element={<BookingSuccessScreen />} path="/book/:meetingTypeId/success" />
    <Route element={<AdminMeetingTypesScreen />} path={APP_PATHS.adminMeetingTypes} />
    <Route element={<AdminCreateMeetingTypeScreen />} path={APP_PATHS.adminCreateMeetingType} />
    <Route element={<AdminBookingsScreen />} path={APP_PATHS.adminBookings} />
    <Route element={<Navigate replace to={APP_PATHS.home} />} path="*" />
  </Routes>
);
