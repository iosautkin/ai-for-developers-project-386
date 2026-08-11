import {
  Alert,
  Box,
  Button,
  Center,
  Group,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconCalendarEvent,
  IconCircleCheck,
  IconInbox,
} from '@tabler/icons-react';

import { UIElements } from '../../../UIElements';

import classes from './components.module.css';

export interface AppHeaderProps {
  readonly active?: 'public' | 'admin' | undefined;
  readonly onHome?: (() => void) | undefined;
  readonly onBook?: (() => void) | undefined;
  readonly onAdmin?: (() => void) | undefined;
}

export function AppHeader({ active, onAdmin, onBook, onHome }: AppHeaderProps) {
  return (
    <Box component="header" className={classes.header} data-testid={UIElements.APP_HEADER}>
      <div className={classes.headerInner}>
        <Button
          className={classes.brand}
          color="dark"
          data-testid={UIElements.APP_LOGO_LINK}
          leftSection={<IconCalendarEvent size={21} stroke={2.2} />}
          onClick={onHome}
          variant="transparent"
        >
          <span>
            Календарь<span className={classes.brandSuffix}> звонков</span>
          </span>
        </Button>
        <Group gap="xs" wrap="nowrap">
          <Button
            color={active === 'public' ? 'orange' : 'gray'}
            data-testid={UIElements.PUBLIC_BOOK_NAV_LINK}
            onClick={onBook}
            variant={active === 'public' ? 'light' : 'subtle'}
          >
            Записаться
          </Button>
          <Button
            color={active === 'admin' ? 'orange' : 'gray'}
            data-testid={UIElements.ADMIN_NAV_LINK}
            onClick={onAdmin}
            variant={active === 'admin' ? 'light' : 'subtle'}
          >
            Админка
          </Button>
        </Group>
      </div>
    </Box>
  );
}

export interface EmptyStateProps {
  readonly title: string;
  readonly description?: string | undefined;
  readonly testId: UIElements;
  readonly actionLabel?: string | undefined;
  readonly onAction?: (() => void) | undefined;
}

export function EmptyState({ actionLabel, description, onAction, testId, title }: EmptyStateProps) {
  return (
    <Paper className={classes.emptyState} data-testid={testId} p="xl" radius="lg">
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

export interface StatusAlertProps {
  readonly kind: 'success' | 'error' | 'conflict';
  readonly message: string;
  readonly testId: UIElements;
  readonly actionLabel?: string | undefined;
  readonly actionTestId?: UIElements | undefined;
  readonly onAction?: (() => void) | undefined;
}

export function StatusAlert({
  actionLabel,
  actionTestId,
  kind,
  message,
  onAction,
  testId,
}: StatusAlertProps) {
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

export interface AdminNavigationProps {
  readonly active: 'meeting-types' | 'bookings';
  readonly onMeetingTypes?: (() => void) | undefined;
  readonly onBookings?: (() => void) | undefined;
}

export function AdminNavigation({ active, onBookings, onMeetingTypes }: AdminNavigationProps) {
  return (
    <Box className={classes.adminNav} data-testid={UIElements.ADMIN_SHELL}>
      <Group gap="xs" maw="var(--calendar-content-width)" mx="auto" px="md" py="sm">
        <Button
          color="orange"
          data-testid={UIElements.ADMIN_MEETING_TYPES_TAB}
          onClick={onMeetingTypes}
          variant={active === 'meeting-types' ? 'filled' : 'subtle'}
        >
          Типы встреч
        </Button>
        <Button
          color="orange"
          data-testid={UIElements.ADMIN_BOOKINGS_TAB}
          onClick={onBookings}
          variant={active === 'bookings' ? 'filled' : 'subtle'}
        >
          Предстоящие встречи
        </Button>
      </Group>
    </Box>
  );
}
