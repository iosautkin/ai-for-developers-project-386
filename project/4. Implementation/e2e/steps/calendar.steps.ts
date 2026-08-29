import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';

import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

import { UIElements } from '../../../2. Spec, UX and Test Cases/UIElements';
import { buildApp } from '../../backend/dist/app.js';
import { openDatabase } from '../../backend/dist/database.js';
import { OWNER_ID, bookings, meetingTypes } from '../../backend/dist/database.contract.js';

const { After, Before, Given, Then, When } = createBdd();
const FIXED_NOW = new Date('2026-08-11T12:07:00+03:00');

let conflictStartsAt = '';
let concurrentStatuses: number[] = [];
let catalogUnavailable = false;
let restartedApp: Awaited<ReturnType<typeof buildApp>> | undefined;
let restartedAddress = '';

const databasePath = () => {
  const path = process.env.E2E_DATABASE_PATH;
  if (!path) throw new Error('E2E_DATABASE_PATH is not configured by global setup.');
  return path;
};

const withDatabase = (action: (database: ReturnType<typeof openDatabase>) => void) => {
  const database = openDatabase(
    databasePath(),
    resolve(import.meta.dirname, '../../backend/drizzle'),
  );
  try {
    action(database);
  } finally {
    database.close();
  }
};

const insertMeetingType = (
  id: string,
  title: string,
  durationMinutes = 30,
  description = 'Описание типа встречи.',
) =>
  withDatabase((database) => {
    database.orm
      .insert(meetingTypes)
      .values({
        id,
        ownerId: OWNER_ID,
        title,
        description,
        durationMinutes,
        createdAtMs: FIXED_NOW.getTime(),
      })
      .run();
  });

const insertBooking = ({
  endsAt,
  guestEmail = 'guest@example.ru',
  guestName = 'Гость',
  guestNote,
  id = randomUUID(),
  meetingTypeId = 'consultation',
  startsAt,
}: {
  startsAt: string;
  endsAt: string;
  id?: string;
  meetingTypeId?: string;
  guestName?: string;
  guestEmail?: string;
  guestNote?: string;
}) =>
  withDatabase((database) => {
    database.orm
      .insert(bookings)
      .values({
        id,
        ownerId: OWNER_ID,
        meetingTypeId,
        guestName,
        guestEmail,
        guestNote: guestNote ?? null,
        startsAtMs: new Date(startsAt).getTime(),
        endsAtMs: new Date(endsAt).getTime(),
        createdAtMs: FIXED_NOW.getTime(),
      })
      .run();
  });

const resetDatabase = (includeDefaultMeetingType = true) =>
  withDatabase((database) => {
    database.orm.transaction((transaction) => {
      transaction.delete(bookings).run();
      transaction.delete(meetingTypes).run();
      if (includeDefaultMeetingType) {
        transaction
          .insert(meetingTypes)
          .values({
            id: 'consultation',
            ownerId: OWNER_ID,
            title: 'Консультация',
            description: 'Обсудим ваш вопрос и определим следующие шаги.',
            durationMinutes: 30,
            createdAtMs: 0,
          })
          .run();
      }
    });
  });

const openBooking = async (page: Page, date = '12 августа 2026') => {
  await page.goto('/book');
  await page.getByTestId(UIElements.CATALOG_MEETING_TYPE_CARD).first().click();
  await page.getByRole('button', { name: date, exact: true }).click();
  await expect(page.getByTestId(UIElements.BOOKING_SLOT_LIST)).toBeVisible();
};

const openGuestDetails = async (page: Page) => {
  await openBooking(page);
  await page
    .getByTestId(UIElements.BOOKING_SLOT_BUTTON)
    .filter({ hasText: 'Свободно' })
    .first()
    .click();
  await page.getByTestId(UIElements.BOOKING_CONTINUE_BUTTON).click();
  await expect(page.getByTestId(UIElements.GUEST_DETAILS_SCREEN)).toBeVisible();
};

const fillValidGuest = async (page: Page) => {
  await page.getByTestId(UIElements.GUEST_NAME_INPUT).fill('Анна');
  await page.getByTestId(UIElements.GUEST_EMAIL_INPUT).fill('anna@example.ru');
};

Before(() => {
  conflictStartsAt = '';
  concurrentStatuses = [];
  catalogUnavailable = false;
  resetDatabase();
});

After(async () => {
  if (restartedApp) {
    await restartedApp.close();
    restartedApp = undefined;
    restartedAddress = '';
  }
});

Given('существует предустановленный владелец {string}', ({ page }, ownerName: string) => {
  void page;
  expect(ownerName).toBe('Иван');
});

Given('гость находится на UIElements.HOME_SCREEN', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId(UIElements.HOME_SCREEN)).toBeVisible();
});

When('гость нажимает UIElements.HOME_BOOK_BUTTON', async ({ page }) => {
  await page.getByTestId(UIElements.HOME_BOOK_BUTTON).click();
});

Then('открывается UIElements.CATALOG_SCREEN', async ({ page }) => {
  await expect(page.getByTestId(UIElements.CATALOG_SCREEN)).toBeVisible();
});

Given('владелец создал несколько типов встреч', () => {
  insertMeetingType('intro-call', 'Знакомство', 15);
  insertMeetingType('deep-dive', 'Подробная консультация', 60);
});

When('гость открывает UIElements.CATALOG_SCREEN', async ({ page }) => {
  await page.goto('/book');
  await expect(page.getByTestId(UIElements.CATALOG_SCREEN)).toBeVisible();
});

Then('UIElements.CATALOG_MEETING_TYPE_LIST показывает все типы встреч', async ({ page }) => {
  await expect(page.getByTestId(UIElements.CATALOG_MEETING_TYPE_CARD)).toHaveCount(3);
});

Then(
  'каждая UIElements.CATALOG_MEETING_TYPE_CARD показывает название, описание и длительность',
  async ({ page }) => {
    const expectedCards = [
      ['Консультация', 'Обсудим ваш вопрос и определим следующие шаги.', '30 мин'],
      ['Знакомство', 'Описание типа встречи.', '15 мин'],
      ['Подробная консультация', 'Описание типа встречи.', '60 мин'],
    ] as const;
    for (const [title, description, duration] of expectedCards) {
      const card = page
        .getByTestId(UIElements.CATALOG_MEETING_TYPE_CARD)
        .filter({ has: page.getByRole('heading', { exact: true, name: title }) });
      await expect(card).toContainText(description);
      await expect(card).toContainText(duration);
    }
  },
);

Given('типы встреч отсутствуют', () => resetDatabase(false));
Given('в тестовой базе нет типов встреч', () => resetDatabase(false));

Then('отображается UIElements.CATALOG_EMPTY_STATE', async ({ page }) => {
  await expect(page.getByTestId(UIElements.CATALOG_EMPTY_STATE)).toBeVisible();
});

Then('ссылка на административную часть в пустом состоянии отсутствует', async ({ page }) => {
  await expect(
    page.getByTestId(UIElements.CATALOG_EMPTY_STATE).getByTestId(UIElements.ADMIN_NAV_LINK),
  ).toHaveCount(0);
});

Given('каталог временно недоступен', async ({ page }) => {
  catalogUnavailable = true;
  await page.route('**/api/meeting-types', async (route) => {
    if (catalogUnavailable) {
      await route.fulfill({
        body: JSON.stringify({ code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка сервера.' }),
        contentType: 'application/json',
        status: 500,
      });
      return;
    }
    await route.continue();
  });
});

Then('отображается UIElements.CATALOG_ERROR_ALERT', async ({ page }) => {
  await expect(page.getByTestId(UIElements.CATALOG_ERROR_ALERT)).toBeVisible();
});

Then('гость может нажать UIElements.CATALOG_RETRY_BUTTON', async ({ page }) => {
  catalogUnavailable = false;
  await page.getByTestId(UIElements.CATALOG_RETRY_BUTTON).click();
  await expect(page.getByTestId(UIElements.CATALOG_MEETING_TYPE_LIST)).toBeVisible();
});

Given(
  'гость выбрал UIElements.CATALOG_MEETING_TYPE_CARD типа {string}',
  async ({ page }, meetingTypeTitle: string) => {
    await page.goto('/book');
    await page
      .getByTestId(UIElements.CATALOG_MEETING_TYPE_CARD)
      .filter({ hasText: meetingTypeTitle })
      .click();
  },
);

Given('выбрал доступную дату в UIElements.BOOKING_DATE_CALENDAR', async ({ page }) => {
  await page.getByRole('button', { name: '12 августа 2026', exact: true }).click();
});

Given('выбрал свободный UIElements.BOOKING_SLOT_BUTTON', async ({ page }) => {
  await page
    .getByTestId(UIElements.BOOKING_SLOT_BUTTON)
    .filter({ hasText: 'Свободно' })
    .first()
    .click();
});

When('гость нажимает UIElements.BOOKING_CONTINUE_BUTTON', async ({ page }) => {
  await page.getByTestId(UIElements.BOOKING_CONTINUE_BUTTON).click();
});

When('вводит имя в UIElements.GUEST_NAME_INPUT', async ({ page }) => {
  await page.getByTestId(UIElements.GUEST_NAME_INPUT).fill('Анна');
});

When('вводит корректный email в UIElements.GUEST_EMAIL_INPUT', async ({ page }) => {
  await page.getByTestId(UIElements.GUEST_EMAIL_INPUT).fill('anna@example.ru');
});

When('нажимает UIElements.GUEST_SUBMIT_BUTTON', async ({ page }) => {
  await page.getByTestId(UIElements.GUEST_SUBMIT_BUTTON).click();
});

When('гость нажимает UIElements.GUEST_SUBMIT_BUTTON', async ({ page }) => {
  await page.getByTestId(UIElements.GUEST_SUBMIT_BUTTON).click();
});

Then('отображается UIElements.BOOKING_SUCCESS_SCREEN', async ({ page }) => {
  await expect(page.getByTestId(UIElements.BOOKING_SUCCESS_SCREEN)).toBeVisible();
});

Then(
  'UIElements.BOOKING_SUCCESS_DETAILS показывает тип, длительность, дату, начало, окончание, гостя и владельца',
  async ({ page }) => {
    const details = page.getByTestId(UIElements.BOOKING_SUCCESS_DETAILS);
    await expect(details).toContainText('Консультация');
    await expect(details).toContainText('30 минут');
    await expect(details).toContainText('12 августа 2026');
    await expect(details).toContainText('Анна');
    await expect(details).toContainText('Иван');
    await expect(details).toContainText(/\d{2}:\d{2}–\d{2}:\d{2}/);
  },
);

Given('гость находится на UIElements.GUEST_DETAILS_SCREEN', async ({ page }) => {
  await openGuestDetails(page);
});

When('гость вводит {string} в UIElements.GUEST_NAME_INPUT', async ({ page }, name: string) => {
  await page.getByTestId(UIElements.GUEST_NAME_INPUT).fill(name);
});

When('вводит {string} в UIElements.GUEST_EMAIL_INPUT', async ({ page }, email: string) => {
  await page.getByTestId(UIElements.GUEST_EMAIL_INPUT).fill(email);
});

Then('UIElements.GUEST_FORM_ERROR_ALERT сообщает {string}', async ({ page }, message: string) => {
  await expect(page.getByTestId(UIElements.GUEST_FORM_ERROR_ALERT)).toContainText(message);
});

Given('гость заполнил UIElements.GUEST_NAME_INPUT', async ({ page }) => {
  await openGuestDetails(page);
  await page.getByTestId(UIElements.GUEST_NAME_INPUT).fill('Анна');
});

Given('заполнил UIElements.GUEST_EMAIL_INPUT', async ({ page }) => {
  await page.getByTestId(UIElements.GUEST_EMAIL_INPUT).fill('anna@example.ru');
});

Given('оставил UIElements.GUEST_NOTE_INPUT пустым', async ({ page }) => {
  await page.getByTestId(UIElements.GUEST_NOTE_INPUT).fill('');
});

Then('бронирование создаётся без заметки', async ({ request }) => {
  const response = await request.get('/api/bookings/upcoming');
  const body = (await response.json()) as Array<{ guest: { note?: string } }>;
  expect(body).toHaveLength(1);
  expect(body[0]?.guest).not.toHaveProperty('note');
});

Given('гость выбрал свободный UIElements.BOOKING_SLOT_BUTTON', async ({ page }) => {
  await openGuestDetails(page);
  await fillValidGuest(page);
});

Given('другой гость занял этот интервал', async ({ page, request }) => {
  const url = new URL(page.url());
  conflictStartsAt = url.searchParams.get('startsAt') ?? '';
  const response = await request.post('/api/bookings', {
    data: {
      meetingTypeId: 'consultation',
      startsAt: conflictStartsAt,
      guest: { name: 'Другой гость', email: 'other@example.ru' },
    },
  });
  expect(response.status()).toBe(201);
});

Then('бронирование не создаётся', async ({ request }) => {
  const response = await request.get('/api/bookings/upcoming');
  const body = (await response.json()) as Array<{ guest: { name: string } }>;
  expect(body.map((booking) => booking.guest.name)).toEqual(['Другой гость']);
});

Then('гость возвращается на UIElements.BOOKING_SCREEN', async ({ page }) => {
  await expect(page.getByTestId(UIElements.BOOKING_SCREEN)).toBeVisible();
});

Then('UIElements.BOOKING_CONFLICT_ALERT объясняет конфликт', async ({ page }) => {
  await expect(page.getByTestId(UIElements.BOOKING_CONFLICT_ALERT)).toContainText(
    'Это время уже заняли',
  );
});

Then(
  'выбранная дата сохраняется, слот очищается, а список интервалов обновляется',
  async ({ page }) => {
    expect(new URL(page.url()).searchParams.get('date')).toBe('2026-08-12');
    expect(new URL(page.url()).searchParams.has('startsAt')).toBe(false);
    await expect(page.getByTestId(UIElements.BOOKING_CONTINUE_BUTTON)).toBeDisabled();
    const occupiedTime = new Intl.DateTimeFormat('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Moscow',
    }).format(new Date(conflictStartsAt));
    await expect(
      page.getByTestId(UIElements.BOOKING_SLOT_BUTTON).filter({ hasText: occupiedTime }),
    ).toBeDisabled();
  },
);

Given('гость корректно заполнил UIElements.GUEST_DETAILS_SCREEN', async ({ page }) => {
  await openGuestDetails(page);
  await fillValidGuest(page);
});

Given('сервис бронирования временно недоступен', async ({ page }) => {
  let attempts = 0;
  await page.route('**/api/bookings', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    attempts += 1;
    if (attempts === 1) {
      await route.fulfill({
        body: JSON.stringify({ code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка сервера.' }),
        contentType: 'application/json',
        status: 500,
      });
      return;
    }
    await route.continue();
  });
});

Then('введённые данные сохраняются', async ({ page }) => {
  await expect(page.getByTestId(UIElements.GUEST_NAME_INPUT)).toHaveValue('Анна');
  await expect(page.getByTestId(UIElements.GUEST_EMAIL_INPUT)).toHaveValue('anna@example.ru');
});

Then('отображается UIElements.GUEST_SUBMIT_ERROR_ALERT', async ({ page }) => {
  await expect(page.getByTestId(UIElements.GUEST_SUBMIT_ERROR_ALERT)).toBeVisible();
});

Then('гость может нажать UIElements.GUEST_RETRY_BUTTON', async ({ page }) => {
  await page.getByTestId(UIElements.GUEST_RETRY_BUTTON).click();
  await expect(page.getByTestId(UIElements.BOOKING_SUCCESS_SCREEN)).toBeVisible();
});

Given('текущая дата по Москве — 11 августа 2026 года', () => {
  expect(FIXED_NOW.toISOString()).toBe('2026-08-11T09:07:00.000Z');
});

When('гость открывает UIElements.BOOKING_DATE_CALENDAR', async ({ page }) => {
  await page.goto('/book/consultation');
  await expect(page.getByTestId(UIElements.BOOKING_DATE_CALENDAR)).toBeVisible();
});

Then('доступны даты с 11 по 24 августа 2026 года включительно', async ({ page }) => {
  await expect(page.getByRole('button', { name: '11 августа 2026', exact: true })).toBeEnabled();
  await expect(page.getByRole('button', { name: '24 августа 2026', exact: true })).toBeEnabled();
});

Then('даты вне этого окна недоступны', async ({ page }) => {
  await expect(page.getByRole('button', { name: '10 августа 2026', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: '25 августа 2026', exact: true })).toBeDisabled();
});

Then('субботы и воскресенья в окне записи недоступны', async ({ page }) => {
  await expect(page.getByRole('button', { name: '15 августа 2026', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: '16 августа 2026', exact: true })).toBeDisabled();
});

Given('текущее московское время — 11 августа 2026 года 12:07', () => {
  expect(FIXED_NOW.toISOString()).toBe('2026-08-11T09:07:00.000Z');
});

When('гость выбирает 11 августа в UIElements.BOOKING_DATE_CALENDAR', async ({ page }) => {
  await page.goto('/book/consultation');
  await page.getByRole('button', { name: '11 августа 2026', exact: true }).click();
});

Then('интервалы с началом до 12:15 недоступны', async ({ page }) => {
  const slots = await page.getByTestId(UIElements.BOOKING_SLOT_BUTTON).allTextContents();
  expect(slots.some((slot) => /^(09|10|11):|^12:00/.test(slot))).toBe(false);
  expect(slots.some((slot) => slot.startsWith('12:15'))).toBe(true);
});

Given('выбран тип встречи длительностью 30 минут', () => {
  /* The default meeting type has the duration required by the scenario. */
});

When('гость просматривает UIElements.BOOKING_SLOT_LIST', async ({ page }) => {
  await openBooking(page);
});

Then('слот 17:30–18:00 доступен', async ({ page }) => {
  await expect(
    page.getByTestId(UIElements.BOOKING_SLOT_BUTTON).filter({ hasText: '17:30–18:00' }),
  ).toBeEnabled();
});

Then('слот 17:45–18:15 отсутствует', async ({ page }) => {
  await expect(
    page.getByTestId(UIElements.BOOKING_SLOT_BUTTON).filter({ hasText: '17:45–18:15' }),
  ).toHaveCount(0);
});

Given('существует бронирование другого типа на 10:00–10:30', () => {
  insertMeetingType('other-type', 'Другой тип');
  insertBooking({
    startsAt: '2026-08-12T07:00:00Z',
    endsAt: '2026-08-12T07:30:00Z',
    meetingTypeId: 'other-type',
  });
});

Then('пересекающиеся UIElements.BOOKING_SLOT_BUTTON недоступны', async ({ page }) => {
  for (const time of ['09:45–10:15', '10:00–10:30', '10:15–10:45']) {
    await expect(
      page.getByTestId(UIElements.BOOKING_SLOT_BUTTON).filter({ hasText: time }),
    ).toBeDisabled();
  }
});

Given('существует бронирование на 10:00–10:30', () => {
  insertBooking({
    startsAt: '2026-08-12T07:00:00Z',
    endsAt: '2026-08-12T07:30:00Z',
  });
});

When('гость выбирает встречу на 10:30–11:00', async ({ page }) => {
  await openBooking(page);
});

Then('соответствующий UIElements.BOOKING_SLOT_BUTTON доступен', async ({ page }) => {
  await expect(
    page.getByTestId(UIElements.BOOKING_SLOT_BUTTON).filter({ hasText: '10:30–11:00' }),
  ).toBeEnabled();
});

Given('два гостя выбрали один свободный интервал', () => {
  concurrentStatuses = [];
});

When('оба гостя одновременно подтверждают бронирование', async ({ request }) => {
  const payload = {
    meetingTypeId: 'consultation',
    startsAt: '2026-08-12T07:00:00Z',
    guest: { name: 'Анна', email: 'anna@example.ru' },
  };
  const responses = await Promise.all([
    request.post('/api/bookings', { data: payload }),
    request.post('/api/bookings', {
      data: { ...payload, guest: { name: 'Борис', email: 'boris@example.ru' } },
    }),
  ]);
  concurrentStatuses = responses.map((response) => response.status());
});

Then('успешно создаётся не более одного бронирования', () => {
  expect(concurrentStatuses.filter((status) => status === 201)).toHaveLength(1);
  expect(concurrentStatuses.sort()).toEqual([201, 409]);
});

Given('владелец находится на UIElements.ADMIN_MEETING_TYPES_SCREEN', async ({ page }) => {
  resetDatabase(false);
  await page.goto('/admin');
  await expect(page.getByTestId(UIElements.ADMIN_MEETING_TYPES_SCREEN)).toBeVisible();
});

When('владелец нажимает UIElements.ADMIN_CREATE_MEETING_TYPE_BUTTON', async ({ page }) => {
  await page.getByTestId(UIElements.ADMIN_CREATE_MEETING_TYPE_BUTTON).click();
});

When('вводит {string} в UIElements.ADMIN_MEETING_TYPE_ID_INPUT', async ({ page }, id: string) => {
  await page.getByTestId(UIElements.ADMIN_MEETING_TYPE_ID_INPUT).fill(id);
});

When(
  'вводит {string} в UIElements.ADMIN_MEETING_TYPE_TITLE_INPUT',
  async ({ page }, title: string) => {
    await page.getByTestId(UIElements.ADMIN_MEETING_TYPE_TITLE_INPUT).fill(title);
  },
);

When('вводит описание в UIElements.ADMIN_MEETING_TYPE_DESCRIPTION_INPUT', async ({ page }) => {
  await page
    .getByTestId(UIElements.ADMIN_MEETING_TYPE_DESCRIPTION_INPUT)
    .fill('Описание консультации.');
});

When(
  'выбирает {int} минут в UIElements.ADMIN_MEETING_TYPE_DURATION_SELECT',
  async ({ page }, duration: number) => {
    await page.getByTestId(UIElements.ADMIN_MEETING_TYPE_DURATION_SELECT).fill(String(duration));
  },
);

When('нажимает UIElements.ADMIN_MEETING_TYPE_SUBMIT_BUTTON', async ({ page }) => {
  await page.getByTestId(UIElements.ADMIN_MEETING_TYPE_SUBMIT_BUTTON).click();
});

Then('отображается UIElements.ADMIN_MEETING_TYPE_CREATED_NOTIFICATION', async ({ page }) => {
  await expect(page.getByTestId(UIElements.ADMIN_MEETING_TYPE_CREATED_NOTIFICATION)).toBeVisible();
});

Then('UIElements.ADMIN_MEETING_TYPES_LIST содержит созданный тип', async ({ page }) => {
  await expect(page.getByTestId(UIElements.ADMIN_MEETING_TYPES_LIST)).toContainText('Консультация');
});

Given('владелец находится на UIElements.ADMIN_CREATE_MEETING_TYPE_SCREEN', async ({ page }) => {
  await page.goto('/admin/meeting-types/new');
  await expect(page.getByTestId(UIElements.ADMIN_CREATE_MEETING_TYPE_SCREEN)).toBeVisible();
});

When(
  'владелец вводит {string} в UIElements.ADMIN_MEETING_TYPE_ID_INPUT',
  async ({ page }, id: string) => {
    await page.getByTestId(UIElements.ADMIN_MEETING_TYPE_ID_INPUT).fill(id);
  },
);

When(
  'вводит {string} в UIElements.ADMIN_MEETING_TYPE_DESCRIPTION_INPUT',
  async ({ page }, description: string) => {
    await page.getByTestId(UIElements.ADMIN_MEETING_TYPE_DESCRIPTION_INPUT).fill(description);
  },
);

When(
  'выбирает {string} в UIElements.ADMIN_MEETING_TYPE_DURATION_SELECT',
  async ({ page }, duration: string) => {
    await page.getByTestId(UIElements.ADMIN_MEETING_TYPE_DURATION_SELECT).fill(duration);
  },
);

Then(
  'UIElements.ADMIN_MEETING_TYPE_FORM_ERROR_ALERT сообщает {string}',
  async ({ page }, message: string) => {
    await expect(page.getByTestId(UIElements.ADMIN_MEETING_TYPE_FORM_ERROR_ALERT)).toContainText(
      message,
    );
  },
);

Given('владелец успешно создал тип встречи', async ({ request }) => {
  const response = await request.post('/api/meeting-types', {
    data: {
      id: 'intro-call',
      title: 'Вводный звонок',
      description: 'Коротко познакомимся и обсудим задачу.',
      durationMinutes: 30,
    },
  });
  expect(response.status()).toBe(201);
});

Then('UIElements.CATALOG_MEETING_TYPE_LIST содержит новый тип встречи', async ({ page }) => {
  await expect(page.getByTestId(UIElements.CATALOG_MEETING_TYPE_LIST)).toContainText(
    'Вводный звонок',
  );
});

Given('тип встречи с идентификатором {string} уже существует', async ({ page }, id: string) => {
  expect(id).toBe('consultation');
  await page.goto('/admin/meeting-types/new');
  await page.getByTestId(UIElements.ADMIN_MEETING_TYPE_TITLE_INPUT).fill('Дубликат');
  await page.getByTestId(UIElements.ADMIN_MEETING_TYPE_DESCRIPTION_INPUT).fill('Описание');
  await page.getByTestId(UIElements.ADMIN_MEETING_TYPE_DURATION_SELECT).fill('30');
});

Then('новый тип не создаётся', async ({ request }) => {
  const response = await request.get('/api/meeting-types');
  const body = (await response.json()) as Array<unknown>;
  expect(body).toHaveLength(1);
});

Then('отображается UIElements.ADMIN_MEETING_TYPE_DUPLICATE_ALERT', async ({ page }) => {
  await expect(page.getByTestId(UIElements.ADMIN_MEETING_TYPE_DUPLICATE_ALERT)).toBeVisible();
});

Given('существуют будущие бронирования разных типов', () => {
  insertMeetingType('intro-call', 'Знакомство', 15);
  insertBooking({
    id: 'future-later',
    meetingTypeId: 'consultation',
    startsAt: '2026-08-13T11:30:00Z',
    endsAt: '2026-08-13T12:00:00Z',
    guestName: 'Михаил',
    guestEmail: 'mikhail@example.ru',
  });
  insertBooking({
    id: 'future-earlier',
    meetingTypeId: 'intro-call',
    startsAt: '2026-08-12T07:00:00Z',
    endsAt: '2026-08-12T07:15:00Z',
    guestName: 'Анна',
    guestEmail: 'anna@example.ru',
    guestNote: 'Обсудим задачу.',
  });
});

Given('существует прошедшее бронирование', () => {
  insertBooking({
    id: 'past',
    startsAt: '2026-08-11T05:00:00Z',
    endsAt: '2026-08-11T05:30:00Z',
    guestName: 'Прошлый гость',
  });
});

When('владелец нажимает UIElements.ADMIN_BOOKINGS_TAB', async ({ page }) => {
  await page.goto('/admin');
  await page.getByTestId(UIElements.ADMIN_BOOKINGS_TAB).click();
});

Then('открывается UIElements.ADMIN_BOOKINGS_SCREEN', async ({ page }) => {
  await expect(page.getByTestId(UIElements.ADMIN_BOOKINGS_SCREEN)).toBeVisible();
});

Then('UIElements.ADMIN_BOOKINGS_LIST показывает только будущие бронирования', async ({ page }) => {
  await expect(page.getByTestId(UIElements.ADMIN_BOOKING_CARD)).toHaveCount(2);
  await expect(page.getByTestId(UIElements.ADMIN_BOOKINGS_LIST)).not.toContainText('Прошлый гость');
});

Then('UIElements.ADMIN_BOOKING_CARD отсортированы по возрастанию начала', async ({ page }) => {
  const cards = page.getByTestId(UIElements.ADMIN_BOOKING_CARD);
  await expect(cards.nth(0)).toContainText('Анна');
  await expect(cards.nth(1)).toContainText('Михаил');
});

Then(
  'каждая карточка показывает тип, дату, начало, окончание, имя, email и заметку',
  async ({ page }) => {
    const first = page.getByTestId(UIElements.ADMIN_BOOKING_CARD).first();
    await expect(first).toContainText('Знакомство');
    await expect(first).toContainText('12 августа 2026');
    await expect(first).toContainText('10:00–10:15');
    await expect(first).toContainText('Анна');
    await expect(first).toContainText('anna@example.ru');
    await expect(first).toContainText('Обсудим задачу.');
  },
);

Given('будущие бронирования отсутствуют', () => {
  /* Before hook already leaves the booking table empty. */
});

When('владелец открывает UIElements.ADMIN_BOOKINGS_SCREEN', async ({ page }) => {
  await page.goto('/admin/bookings');
});

Then('отображается UIElements.ADMIN_BOOKINGS_EMPTY_STATE', async ({ page }) => {
  await expect(page.getByTestId(UIElements.ADMIN_BOOKINGS_EMPTY_STATE)).toBeVisible();
});

Given('существуют профиль владельца, тип встречи и бронирование', () => {
  insertBooking({
    startsAt: '2026-08-12T07:00:00Z',
    endsAt: '2026-08-12T07:30:00Z',
    guestName: 'Анна',
    guestEmail: 'anna@example.ru',
  });
});

When('приложение перезапущено', async ({ page }) => {
  restartedApp = await buildApp({
    databasePath: databasePath(),
    migrationsDirectory: resolve(import.meta.dirname, '../../backend/drizzle'),
    now: () => FIXED_NOW,
    staticDirectory: resolve(import.meta.dirname, '../../frontend/dist'),
  });
  restartedAddress = await restartedApp.listen({ host: '127.0.0.1', port: 0 });
  await page.goto(`${restartedAddress}/admin/bookings`);
});

Then('профиль владельца сохранён', async ({ request }) => {
  const response = await request.get(`${restartedAddress}/api/bookings/upcoming`);
  const body = (await response.json()) as Array<{ owner: { displayName: string } }>;
  expect(body[0]?.owner.displayName).toBe('Иван');
});

Then('тип встречи сохранён', async ({ page }) => {
  await page.goto(`${restartedAddress}/book`);
  await expect(page.getByTestId(UIElements.CATALOG_MEETING_TYPE_LIST)).toContainText(
    'Консультация',
  );
});

Then('бронирование отображается в UIElements.ADMIN_BOOKINGS_LIST', async ({ page }) => {
  await page.goto(`${restartedAddress}/admin/bookings`);
  await expect(page.getByTestId(UIElements.ADMIN_BOOKINGS_LIST)).toContainText('Анна');
});
