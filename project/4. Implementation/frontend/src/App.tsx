import {
  Alert,
  Anchor,
  AppShell,
  Badge,
  Button,
  Card,
  Center,
  Container,
  Group,
  Loader,
  NavLink,
  NumberInput,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  TextInput,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconArrowRight, IconCheck, IconClock, IconPlus } from '@tabler/icons-react';
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

import classes from './App.module.css';

function Header() {
  return (
    <AppShell.Header className={classes.header} data-testid={UIElements.APP_HEADER}>
      <Group h="100%" justify="space-between">
        <Anchor
          className={classes.logo}
          component={Link}
          data-testid={UIElements.APP_LOGO_LINK}
          to={APP_PATHS.home}
          underline="never"
        >
          Календарь звонков
        </Anchor>
        <Group gap="xs">
          <Button
            component={Link}
            data-testid={UIElements.PUBLIC_BOOK_NAV_LINK}
            to={APP_PATHS.catalog}
            variant="subtle"
          >
            Записаться
          </Button>
          <Button
            component={Link}
            data-testid={UIElements.ADMIN_NAV_LINK}
            to={APP_PATHS.adminMeetingTypes}
            variant="default"
          >
            Владелец
          </Button>
        </Group>
      </Group>
    </AppShell.Header>
  );
}

function Page({ children }: { readonly children: React.ReactNode }) {
  return (
    <AppShell header={{ height: 72 }}>
      <Header />
      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}

function Loading({ testId }: { readonly testId?: string }) {
  return (
    <Center className={classes.statePanel} data-testid={testId}>
      <Loader color="orange" />
    </Center>
  );
}

function HomeScreen() {
  return (
    <Page>
      <Container className={classes.main} data-testid={UIElements.HOME_SCREEN} size="lg">
        <section className={classes.hero}>
          <Stack align="flex-start" gap="xl">
            <Badge color="orange" size="lg" variant="light">
              Простой календарь для звонков
            </Badge>
            <Title className={classes.heroTitle} order={1}>
              Запланируйте звонок <span>без переписки</span>
            </Title>
            <Text c="dimmed" maw={620} size="xl">
              Выберите формат встречи и удобное время по Москве — регистрация не нужна.
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
            className={classes.featurePanel}
            data-testid={UIElements.HOME_FEATURES_PANEL}
            p="xl"
            radius="xl"
          >
            {['Выберите формат', 'Найдите свободное время', 'Подтвердите запись'].map(
              (title, index) => (
                <Group align="center" key={title} mb={index === 2 ? 0 : 'xl'} wrap="nowrap">
                  <ThemeIcon color="orange" radius="xl" size="xl">
                    {index + 1}
                  </ThemeIcon>
                  <Text fw={700}>{title}</Text>
                </Group>
              ),
            )}
          </Paper>
        </section>
      </Container>
    </Page>
  );
}

function MeetingTypeCard({ meetingType }: { readonly meetingType: MeetingType }) {
  return (
    <Card data-testid={UIElements.CATALOG_MEETING_TYPE_CARD} padding="xl" radius="lg" withBorder>
      <Stack h="100%" gap="md">
        <Group justify="space-between">
          <Title order={2}>{meetingType.title}</Title>
          <Badge color="orange" size="lg" variant="light">
            {meetingType.durationMinutes} мин
          </Badge>
        </Group>
        <Text c="dimmed" className={classes.grow}>
          {meetingType.description}
        </Text>
        <Button component={Link} to={bookingPath(meetingType.id)}>
          Выбрать время
        </Button>
      </Stack>
    </Card>
  );
}

function CatalogScreen() {
  const meetingTypes = useListMeetingTypes<MeetingType[]>({
    query: {
      queryKey: getListMeetingTypesQueryKey(),
      select: (response) =>
        response.status === 200 ? response.data : failUnexpectedStatus(response.status),
    },
  });

  return (
    <Page>
      <Container className={classes.main} data-testid={UIElements.CATALOG_SCREEN} size="lg">
        <Title data-testid={UIElements.CATALOG_HEADING} order={1}>
          Выберите тип встречи
        </Title>
        <Text c="dimmed" mt="xs">
          Все доступные форматы календаря Ивана.
        </Text>
        {meetingTypes.isPending ? <Loading testId={UIElements.CATALOG_LOADING} /> : null}
        {meetingTypes.isError ? (
          <Alert color="red" data-testid={UIElements.CATALOG_ERROR_ALERT} mt="xl" title="Ошибка">
            <Group justify="space-between">
              <Text>Не удалось загрузить типы встреч.</Text>
              <Button
                data-testid={UIElements.CATALOG_RETRY_BUTTON}
                onClick={() => meetingTypes.refetch()}
                size="xs"
              >
                Повторить
              </Button>
            </Group>
          </Alert>
        ) : null}
        {meetingTypes.data?.length === 0 ? (
          <Paper
            className={classes.statePanel}
            data-testid={UIElements.CATALOG_EMPTY_STATE}
            mt="xl"
            p="xl"
            ta="center"
            withBorder
          >
            <Title order={2}>Пока нет доступных типов встреч</Title>
            <Text c="dimmed" mt="xs">
              Вернитесь позже — владелец ещё не добавил варианты.
            </Text>
          </Paper>
        ) : null}
        {meetingTypes.data?.length ? (
          <SimpleGrid
            cols={{ base: 1, sm: 2 }}
            data-testid={UIElements.CATALOG_MEETING_TYPE_LIST}
            mt="xl"
          >
            {meetingTypes.data.map((meetingType) => (
              <MeetingTypeCard key={meetingType.id} meetingType={meetingType} />
            ))}
          </SimpleGrid>
        ) : null}
      </Container>
    </Page>
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

  const chooseDate = (date: string) => setSearchParams({ date });
  const chooseSlot = (startsAt: string) =>
    setSearchParams({ date: currentDate?.date ?? '', startsAt });

  if (meetingType.isPending || availability.isPending)
    return (
      <Page>
        <Loading />
      </Page>
    );
  if (meetingType.isError || availability.isError || !meetingType.data || !availability.data) {
    return (
      <Page>
        <Container className={classes.main}>
          <Alert color="red">Не удалось загрузить расписание.</Alert>
        </Container>
      </Page>
    );
  }

  return (
    <Page>
      <Container className={classes.main} data-testid={UIElements.BOOKING_SCREEN} size="lg">
        <Title order={1}>Выберите дату и время</Title>
        <Text c="dimmed" mt="xs">
          Доступны будние дни в ближайшие 14 дней.
        </Text>
        {searchParams.get('conflict') === '1' ? (
          <Alert
            color="orange"
            data-testid={UIElements.BOOKING_CONFLICT_ALERT}
            mt="lg"
            title="Слот уже занят"
          >
            Это время успел выбрать другой гость. Выберите новый свободный слот.
          </Alert>
        ) : null}
        <SimpleGrid cols={{ base: 1, md: 3 }} mt="xl">
          <Paper data-testid={UIElements.BOOKING_SUMMARY} p="lg" radius="lg" withBorder>
            <Stack gap="xs">
              <Title order={2}>{meetingType.data.title}</Title>
              <Text c="dimmed">{meetingType.data.description}</Text>
              <Group gap="xs">
                <IconClock size={17} />
                <Text>{meetingType.data.durationMinutes} минут</Text>
              </Group>
              <Text data-testid={UIElements.BOOKING_TIMEZONE_LABEL} size="sm">
                Время по Москве
              </Text>
            </Stack>
          </Paper>
          <Paper data-testid={UIElements.BOOKING_DATE_CALENDAR} p="lg" radius="lg" withBorder>
            <Text fw={700} mb="md">
              Дата
            </Text>
            <Stack gap="xs">
              {availability.data.dates.map((date) => (
                <Button
                  disabled={!date.bookable}
                  key={date.date}
                  onClick={() => chooseDate(date.date)}
                  variant={date.date === currentDate?.date ? 'filled' : 'light'}
                >
                  {new Intl.DateTimeFormat('ru-RU', {
                    day: 'numeric',
                    month: 'short',
                    timeZone: 'UTC',
                  }).format(new Date(`${date.date}T12:00:00Z`))}
                </Button>
              ))}
            </Stack>
          </Paper>
          <Paper data-testid={UIElements.BOOKING_SLOT_LIST} p="lg" radius="lg" withBorder>
            <Text fw={700} mb="md">
              Свободное время
            </Text>
            {currentDate && currentDate.slots.some((slot) => slot.status === 'available') ? (
              <SimpleGrid cols={2}>
                {currentDate.slots
                  .filter((slot) => slot.status === 'available')
                  .map((slot) => (
                    <Button
                      data-testid={UIElements.BOOKING_SLOT_BUTTON}
                      key={slot.startsAt}
                      onClick={() => chooseSlot(slot.startsAt)}
                      variant={slot.startsAt === selectedSlot?.startsAt ? 'filled' : 'light'}
                    >
                      {formatMoscowTimeRange(slot.startsAt, slot.endsAt)}
                    </Button>
                  ))}
              </SimpleGrid>
            ) : (
              <Text c="dimmed" data-testid={UIElements.BOOKING_NO_SLOTS_STATE}>
                На эту дату свободного времени нет.
              </Text>
            )}
          </Paper>
        </SimpleGrid>
        <Group justify="space-between" mt="xl">
          <Button
            data-testid={UIElements.BOOKING_BACK_BUTTON}
            onClick={() => navigate(APP_PATHS.catalog)}
            variant="default"
          >
            Назад
          </Button>
          <Button
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
      </Container>
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
      form.setErrors(zodFieldErrors(parsed));
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

  if (meetingType.isPending || availability.isPending)
    return (
      <Page>
        <Loading />
      </Page>
    );
  if (!meetingType.data || !slot) return <Navigate replace to={bookingPath(meetingTypeId)} />;

  return (
    <Page>
      <Container className={classes.main} data-testid={UIElements.GUEST_DETAILS_SCREEN} size="md">
        <Title order={1}>Завершите запись</Title>
        <Text c="dimmed" mt="xs">
          Оставьте контакты — аккаунт создавать не нужно.
        </Text>
        {Object.keys(form.errors).length ? (
          <Alert color="red" data-testid={UIElements.GUEST_FORM_ERROR_ALERT} mt="lg">
            Проверьте обязательные поля.
          </Alert>
        ) : null}
        {mutation.isError &&
        !(mutation.error instanceof ApiRequestError && mutation.error.code === 'SLOT_CONFLICT') ? (
          <Alert color="red" data-testid={UIElements.GUEST_SUBMIT_ERROR_ALERT} mt="lg">
            <Group justify="space-between">
              <Text>Не удалось создать запись. Введённые данные сохранены.</Text>
              <Button
                data-testid={UIElements.GUEST_RETRY_BUTTON}
                onClick={() => submit()}
                size="xs"
              >
                Повторить
              </Button>
            </Group>
          </Alert>
        ) : null}
        <SimpleGrid cols={{ base: 1, sm: 2 }} mt="xl">
          <Paper component="form" onSubmit={submit} p="xl" radius="lg" withBorder>
            <Stack>
              <TextInput
                data-testid={UIElements.GUEST_NAME_INPUT}
                label="Имя"
                required
                {...form.getInputProps('name')}
              />
              <TextInput
                data-testid={UIElements.GUEST_EMAIL_INPUT}
                label="Email"
                required
                type="email"
                {...form.getInputProps('email')}
              />
              <Textarea
                data-testid={UIElements.GUEST_NOTE_INPUT}
                label="Заметка"
                {...form.getInputProps('note')}
              />
              <Group justify="space-between" mt="sm">
                <Button
                  data-testid={UIElements.GUEST_BACK_BUTTON}
                  onClick={() => navigate(-1)}
                  type="button"
                  variant="default"
                >
                  Назад
                </Button>
                <Button
                  data-testid={UIElements.GUEST_SUBMIT_BUTTON}
                  loading={mutation.isPending}
                  type="submit"
                >
                  Подтвердить
                </Button>
              </Group>
            </Stack>
          </Paper>
          <Paper data-testid={UIElements.BOOKING_SUMMARY} p="xl" radius="lg" withBorder>
            <Title order={2}>{meetingType.data.title}</Title>
            <Text mt="md">{formatMoscowDate(slot.startsAt)}</Text>
            <Text fw={700}>{formatMoscowTimeRange(slot.startsAt, slot.endsAt)} · Москва</Text>
            <Text c="dimmed" mt="xs">
              {meetingType.data.durationMinutes} минут
            </Text>
          </Paper>
        </SimpleGrid>
      </Container>
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
      <Container className={classes.main} data-testid={UIElements.BOOKING_SUCCESS_SCREEN} size="sm">
        <Paper p={40} radius="xl" ta="center" withBorder>
          <ThemeIcon color="green" radius="xl" size={72} variant="light">
            <IconCheck size={36} />
          </ThemeIcon>
          <Title mt="lg" order={1}>
            Вы записаны
          </Title>
          <Text c="dimmed" mt="xs">
            {booking.guest.name}, встреча сохранена.
          </Text>
          <Paper
            data-testid={UIElements.BOOKING_SUCCESS_DETAILS}
            mt="xl"
            p="lg"
            radius="lg"
            withBorder
          >
            <Text fw={700}>
              {booking.meetingType.title} · {booking.meetingType.durationMinutes} минут
            </Text>
            <Text>
              {formatMoscowDate(booking.startsAt)},{' '}
              {formatMoscowTimeRange(booking.startsAt, booking.endsAt)}
            </Text>
            <Text c="dimmed">
              Гость: {booking.guest.name} · Владелец: {booking.owner.displayName}
            </Text>
          </Paper>
          <Group justify="center" mt="xl">
            <Button
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
        </Paper>
      </Container>
    </Page>
  );
}

function AdminNavigation() {
  return (
    <Paper className={classes.adminNavigation} data-testid={UIElements.ADMIN_SHELL} radius={0}>
      <Container size="lg">
        <Group>
          <NavLink
            component={Link}
            data-testid={UIElements.ADMIN_MEETING_TYPES_TAB}
            label="Типы встреч"
            to={APP_PATHS.adminMeetingTypes}
          />
          <NavLink
            component={Link}
            data-testid={UIElements.ADMIN_BOOKINGS_TAB}
            label="Предстоящие встречи"
            to={APP_PATHS.adminBookings}
          />
        </Group>
      </Container>
    </Paper>
  );
}

function AdminMeetingTypesScreen() {
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
      <AdminNavigation />
      <Container
        className={classes.adminMain}
        data-testid={UIElements.ADMIN_MEETING_TYPES_SCREEN}
        size="lg"
      >
        <Group align="flex-end" justify="space-between">
          <div>
            <Title order={1}>Типы встреч</Title>
            <Text c="dimmed">Форматы из публичного каталога.</Text>
          </div>
          <Button
            component={Link}
            data-testid={UIElements.ADMIN_CREATE_MEETING_TYPE_BUTTON}
            leftSection={<IconPlus size={17} />}
            to={APP_PATHS.adminCreateMeetingType}
          >
            Создать тип встречи
          </Button>
        </Group>
        {searchParams.get('created') === '1' ? (
          <Alert
            color="green"
            data-testid={UIElements.ADMIN_MEETING_TYPE_CREATED_NOTIFICATION}
            mt="lg"
          >
            Тип встречи создан и опубликован.
          </Alert>
        ) : null}
        {query.isPending ? <Loading /> : null}
        {query.data?.length === 0 ? (
          <Paper
            className={classes.statePanel}
            data-testid={UIElements.ADMIN_MEETING_TYPES_EMPTY_STATE}
            mt="xl"
            p="xl"
            ta="center"
            withBorder
          >
            <Title order={2}>Типы встреч ещё не созданы</Title>
          </Paper>
        ) : null}
        {query.data?.length ? (
          <SimpleGrid
            cols={{ base: 1, sm: 2 }}
            data-testid={UIElements.ADMIN_MEETING_TYPES_LIST}
            mt="xl"
          >
            {query.data.map((type) => (
              <Card
                data-testid={UIElements.ADMIN_MEETING_TYPE_CARD}
                key={type.id}
                padding="lg"
                withBorder
              >
                <Group justify="space-between">
                  <Title order={2}>{type.title}</Title>
                  <Badge>{type.durationMinutes} мин</Badge>
                </Group>
                <Text c="dimmed" mt="sm">
                  {type.description}
                </Text>
                <Text mt="md" size="sm">
                  /{type.id}
                </Text>
              </Card>
            ))}
          </SimpleGrid>
        ) : null}
      </Container>
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
      form.setErrors(zodFieldErrors(parsed));
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
      <AdminNavigation />
      <Container
        className={classes.adminMain}
        data-testid={UIElements.ADMIN_CREATE_MEETING_TYPE_SCREEN}
        size="md"
      >
        <Title order={1}>Новый тип встречи</Title>
        <Text c="dimmed">Длительность должна быть кратна 15 минутам.</Text>
        {Object.keys(form.errors).length ? (
          <Alert color="red" data-testid={UIElements.ADMIN_MEETING_TYPE_FORM_ERROR_ALERT} mt="lg">
            Проверьте поля формы.
          </Alert>
        ) : null}
        {duplicate ? (
          <Alert color="red" data-testid={UIElements.ADMIN_MEETING_TYPE_DUPLICATE_ALERT} mt="lg">
            Тип встречи с таким идентификатором уже существует.
          </Alert>
        ) : null}
        <Paper component="form" mt="xl" onSubmit={submit} p="xl" radius="lg" withBorder>
          <Stack>
            <TextInput
              data-testid={UIElements.ADMIN_MEETING_TYPE_ID_INPUT}
              description="Латинские буквы, цифры и дефисы"
              label="Идентификатор"
              required
              {...form.getInputProps('id')}
            />
            <TextInput
              data-testid={UIElements.ADMIN_MEETING_TYPE_TITLE_INPUT}
              label="Название"
              required
              {...form.getInputProps('title')}
            />
            <Textarea
              data-testid={UIElements.ADMIN_MEETING_TYPE_DESCRIPTION_INPUT}
              label="Описание"
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
            <Group justify="space-between">
              <Button
                data-testid={UIElements.ADMIN_MEETING_TYPE_CANCEL_BUTTON}
                onClick={() => navigate(APP_PATHS.adminMeetingTypes)}
                type="button"
                variant="default"
              >
                Отмена
              </Button>
              <Button
                data-testid={UIElements.ADMIN_MEETING_TYPE_SUBMIT_BUTTON}
                loading={mutation.isPending}
                type="submit"
              >
                Создать
              </Button>
            </Group>
          </Stack>
        </Paper>
      </Container>
    </Page>
  );
}

function BookingCard({ booking }: { readonly booking: Booking }) {
  return (
    <Card data-testid={UIElements.ADMIN_BOOKING_CARD} padding="lg" withBorder>
      <Group align="flex-start" justify="space-between">
        <div>
          <Title order={2}>{booking.meetingType.title}</Title>
          <Text c="dimmed">
            {booking.guest.name} · {booking.guest.email}
          </Text>
          {booking.guest.note ? <Text mt="xs">{booking.guest.note}</Text> : null}
        </div>
        <div className={classes.bookingTime}>
          <Text fw={700}>{formatMoscowDate(booking.startsAt)}</Text>
          <Text>{formatMoscowTimeRange(booking.startsAt, booking.endsAt)}</Text>
        </div>
      </Group>
    </Card>
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
      <AdminNavigation />
      <Container
        className={classes.adminMain}
        data-testid={UIElements.ADMIN_BOOKINGS_SCREEN}
        size="lg"
      >
        <Title order={1}>Предстоящие встречи</Title>
        <Text c="dimmed">Все будущие записи по московскому времени.</Text>
        {query.isPending ? <Loading /> : null}
        {query.data?.length === 0 ? (
          <Paper
            className={classes.statePanel}
            data-testid={UIElements.ADMIN_BOOKINGS_EMPTY_STATE}
            mt="xl"
            p="xl"
            ta="center"
            withBorder
          >
            <Title order={2}>Предстоящих встреч пока нет</Title>
          </Paper>
        ) : null}
        {query.data?.length ? (
          <Stack data-testid={UIElements.ADMIN_BOOKINGS_LIST} mt="xl">
            {query.data.map((booking) => (
              <BookingCard booking={booking} key={booking.id} />
            ))}
          </Stack>
        ) : null}
      </Container>
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
