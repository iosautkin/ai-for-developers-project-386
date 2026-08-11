import {
  Badge,
  Button,
  Center,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { IconArrowRight, IconCalendarCheck, IconCheck, IconClock } from '@tabler/icons-react';

import { UIElements } from '../../../UIElements';
import type { MeetingTypeFixture, SlotFixture } from '../fixtures';
import {
  BookingCalendar,
  BookingSummary,
  GuestDetailsForm,
  MeetingTypeGrid,
  SlotList,
  type GuestFormValues,
} from '../components/BookingComponents';
import { AppHeader, EmptyState, StatusAlert } from '../components/Shell';

import classes from './screens.module.css';

interface PublicShellProps {
  readonly children: React.ReactNode;
  readonly active?: 'public' | undefined;
  readonly onHome?: (() => void) | undefined;
  readonly onBook?: (() => void) | undefined;
  readonly onAdmin?: (() => void) | undefined;
}

function PublicShell({ active, children, onAdmin, onBook, onHome }: PublicShellProps) {
  return (
    <div className={classes.page}>
      <AppHeader active={active} onAdmin={onAdmin} onBook={onBook} onHome={onHome} />
      {children}
    </div>
  );
}

export interface HomeScreenProps {
  readonly onBook?: (() => void) | undefined;
  readonly onAdmin?: (() => void) | undefined;
}

export function HomeScreen({ onAdmin, onBook }: HomeScreenProps) {
  const steps = [
    ['1', 'Выберите формат', 'От короткого знакомства до подробной консультации.'],
    ['2', 'Найдите время', 'Свободные интервалы показаны по Москве.'],
    ['3', 'Подтвердите запись', 'Оставьте имя и email — без регистрации.'],
  ] as const;

  return (
    <PublicShell onAdmin={onAdmin} onBook={onBook} onHome={() => undefined}>
      <main className={classes.main} data-testid={UIElements.HOME_SCREEN}>
        <section className={classes.hero}>
          <Stack align="flex-start" gap="xl">
            <Badge color="blue" size="lg" variant="light">
              Простой календарь для звонков
            </Badge>
            <Title className={classes.heroTitle} order={1}>
              Запланируйте звонок <span className={classes.heroAccent}>без переписки</span>
            </Title>
            <Text c="dimmed" maw={620} size="xl">
              Выберите формат встречи и удобное время по Москве.
            </Text>
            <Button
              color="orange"
              data-testid={UIElements.HOME_BOOK_BUTTON}
              onClick={onBook}
              rightSection={<IconArrowRight size={19} />}
              size="lg"
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
            <Stack gap="xl">
              {steps.map(([number, title, description]) => (
                <Group align="flex-start" key={number} wrap="nowrap">
                  <ThemeIcon className={classes.stepNumber} color="orange" radius="xl" size="xl">
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
    </PublicShell>
  );
}

export interface CatalogScreenProps {
  readonly state?: 'loaded' | 'empty' | 'loading' | 'error' | undefined;
  readonly meetingTypes: readonly MeetingTypeFixture[];
  readonly onSelect?: ((meetingType: MeetingTypeFixture) => void) | undefined;
  readonly onRetry?: (() => void) | undefined;
  readonly onHome?: (() => void) | undefined;
  readonly onAdmin?: (() => void) | undefined;
}

export function CatalogScreen({
  meetingTypes,
  onAdmin,
  onHome,
  onRetry,
  onSelect,
  state = 'loaded',
}: CatalogScreenProps) {
  return (
    <PublicShell active="public" onAdmin={onAdmin} onBook={() => undefined} onHome={onHome}>
      <main className={classes.main} data-testid={UIElements.CATALOG_SCREEN}>
        <div className={classes.sectionHeader}>
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
        {state === 'loading' ? (
          <Center className={classes.loadingPanel} data-testid={UIElements.CATALOG_LOADING}>
            <Stack align="center" gap="sm">
              <Loader color="orange" />
              <Text c="dimmed">Загружаем типы встреч…</Text>
            </Stack>
          </Center>
        ) : null}
        {state === 'error' ? (
          <StatusAlert
            actionLabel="Повторить"
            actionTestId={UIElements.CATALOG_RETRY_BUTTON}
            kind="error"
            message="Не удалось загрузить данные"
            onAction={onRetry}
            testId={UIElements.CATALOG_ERROR_ALERT}
          />
        ) : null}
        {state === 'empty' ? (
          <EmptyState
            description="Вернитесь позже — владелец календаря ещё не добавил варианты."
            testId={UIElements.CATALOG_EMPTY_STATE}
            title="Пока нет доступных типов встреч"
          />
        ) : null}
        {state === 'loaded' ? (
          <MeetingTypeGrid meetingTypes={meetingTypes} onSelect={onSelect} />
        ) : null}
      </main>
    </PublicShell>
  );
}

export interface BookingScreenProps {
  readonly meetingType: MeetingTypeFixture;
  readonly date: string | null;
  readonly selectedSlot?: SlotFixture | undefined;
  readonly slots: readonly SlotFixture[];
  readonly conflict?: boolean | undefined;
  readonly noSlots?: boolean | undefined;
  readonly onDateChange?: ((date: string | null) => void) | undefined;
  readonly onSlotSelect?: ((slot: SlotFixture) => void) | undefined;
  readonly onBack?: (() => void) | undefined;
  readonly onContinue?: (() => void) | undefined;
}

export function BookingScreen({
  conflict,
  date,
  meetingType,
  noSlots,
  onBack,
  onContinue,
  onDateChange,
  onSlotSelect,
  selectedSlot,
  slots,
}: BookingScreenProps) {
  return (
    <PublicShell active="public" onBook={() => undefined}>
      <main className={classes.main} data-testid={UIElements.BOOKING_SCREEN}>
        <div className={classes.sectionHeader}>
          <Title order={1}>Выберите дату и время</Title>
          <Text c="dimmed" mt={6}>
            Доступны будние дни в ближайшие 14 дней.
          </Text>
        </div>
        <Stack gap="md">
          {conflict ? (
            <StatusAlert
              kind="conflict"
              message="Это время уже заняли. Выберите другой слот"
              testId={UIElements.BOOKING_CONFLICT_ALERT}
            />
          ) : null}
          <div className={classes.bookingGrid}>
            <BookingSummary
              dateLabel={date ? '11 августа 2026, вторник' : undefined}
              meetingType={meetingType}
              timeLabel={selectedSlot?.label}
            />
            <BookingCalendar onChange={onDateChange} value={date} />
            {noSlots ? (
              <EmptyState
                description="Попробуйте выбрать другой день."
                testId={UIElements.BOOKING_NO_SLOTS_STATE}
                title="На эту дату свободного времени нет"
              />
            ) : (
              <SlotList onSelect={onSlotSelect} selectedSlotId={selectedSlot?.id} slots={slots} />
            )}
          </div>
          <Group justify="space-between" mt="sm">
            <Button data-testid={UIElements.BOOKING_BACK_BUTTON} onClick={onBack} variant="default">
              Назад
            </Button>
            <Button
              color="orange"
              data-testid={UIElements.BOOKING_CONTINUE_BUTTON}
              disabled={!selectedSlot}
              onClick={onContinue}
              rightSection={<IconArrowRight size={17} />}
            >
              Продолжить
            </Button>
          </Group>
        </Stack>
      </main>
    </PublicShell>
  );
}

export interface GuestDetailsScreenProps {
  readonly meetingType: MeetingTypeFixture;
  readonly values: GuestFormValues;
  readonly selectedSlot: SlotFixture;
  readonly errors?: Partial<Record<keyof GuestFormValues, string>> | undefined;
  readonly submitError?: boolean | undefined;
  readonly onChange?: ((field: keyof GuestFormValues, value: string) => void) | undefined;
  readonly onBack?: (() => void) | undefined;
  readonly onSubmit?: (() => void) | undefined;
}

export function GuestDetailsScreen({
  errors,
  meetingType,
  onBack,
  onChange,
  onSubmit,
  selectedSlot,
  submitError,
  values,
}: GuestDetailsScreenProps) {
  return (
    <PublicShell active="public" onBook={() => undefined}>
      <main className={classes.main} data-testid={UIElements.GUEST_DETAILS_SCREEN}>
        <div className={classes.sectionHeader}>
          <Title order={1}>Завершите запись</Title>
          <Text c="dimmed" mt={6}>
            Проверьте время и представьтесь владельцу календаря.
          </Text>
        </div>
        <Stack gap="md">
          {Object.keys(errors ?? {}).length > 0 ? (
            <StatusAlert
              kind="error"
              message="Проверьте обязательные поля"
              testId={UIElements.GUEST_FORM_ERROR_ALERT}
            />
          ) : null}
          {submitError ? (
            <StatusAlert
              actionLabel="Повторить"
              actionTestId={UIElements.GUEST_RETRY_BUTTON}
              kind="error"
              message="Не удалось создать запись. Попробуйте ещё раз"
              onAction={onSubmit}
              testId={UIElements.GUEST_SUBMIT_ERROR_ALERT}
            />
          ) : null}
          <div className={classes.formGrid}>
            <GuestDetailsForm
              errors={errors}
              onBack={onBack}
              onChange={onChange}
              onSubmit={onSubmit}
              values={values}
            />
            <BookingSummary
              dateLabel="11 августа 2026, вторник"
              meetingType={meetingType}
              timeLabel={selectedSlot.label}
            />
          </div>
        </Stack>
      </main>
    </PublicShell>
  );
}

export interface BookingSuccessScreenProps {
  readonly meetingType: MeetingTypeFixture;
  readonly selectedSlot: SlotFixture;
  readonly guestName: string;
  readonly onBookAgain?: (() => void) | undefined;
  readonly onHome?: (() => void) | undefined;
}

export function BookingSuccessScreen({
  guestName,
  meetingType,
  onBookAgain,
  onHome,
  selectedSlot,
}: BookingSuccessScreenProps) {
  return (
    <PublicShell active="public" onBook={onBookAgain} onHome={onHome}>
      <main className={classes.main} data-testid={UIElements.BOOKING_SUCCESS_SCREEN}>
        <Paper className={classes.successCard} p={40} radius="xl" withBorder>
          <Stack align="center" gap="lg" ta="center">
            <ThemeIcon className={classes.successIcon} radius="xl" size={72} variant="light">
              <IconCheck size={36} stroke={2.5} />
            </ThemeIcon>
            <div>
              <Title order={1}>Вы записаны</Title>
              <Text c="dimmed" mt={8}>
                {guestName}, встреча добавлена в календарь.
              </Text>
            </div>
            <Paper data-testid={UIElements.BOOKING_SUCCESS_DETAILS} p="lg" radius="lg" withBorder>
              <Stack gap="xs">
                <Group gap="xs" justify="center">
                  <IconCalendarCheck size={18} />
                  <Text fw={700}>{meetingType.title}</Text>
                </Group>
                <Group c="dimmed" gap="xs" justify="center">
                  <IconClock size={17} />
                  <Text>11 августа 2026, {selectedSlot.label} · Москва</Text>
                </Group>
              </Stack>
            </Paper>
            <Group justify="center">
              <Button
                color="orange"
                data-testid={UIElements.SUCCESS_BOOK_AGAIN_BUTTON}
                onClick={onBookAgain}
              >
                Записаться ещё
              </Button>
              <Button data-testid={UIElements.SUCCESS_HOME_LINK} onClick={onHome} variant="default">
                На главную
              </Button>
            </Group>
          </Stack>
        </Paper>
      </main>
    </PublicShell>
  );
}
