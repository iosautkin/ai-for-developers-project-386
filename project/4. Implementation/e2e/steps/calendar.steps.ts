import { resolve } from 'node:path';

import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

import { UIElements } from '../../../2. Spec, UX and Test Cases/UIElements';
import { openDatabase } from '../../backend/dist/database.js';
import { OWNER_ID, bookings, meetingTypes } from '../../backend/dist/database.contract.js';

const { Before, Given, Then, When } = createBdd();

const resetDatabase = (includeDefaultMeetingType = true) => {
  const databasePath = process.env.E2E_DATABASE_PATH;
  if (!databasePath) throw new Error('E2E_DATABASE_PATH is not configured by global setup.');
  const database = openDatabase(
    databasePath,
    resolve(import.meta.dirname, '../../backend/drizzle'),
  );
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
  database.close();
};

Before(() => resetDatabase());

const openGuestDetails = async (page: Page) => {
  await page.goto('/book');
  await page
    .getByTestId(UIElements.CATALOG_MEETING_TYPE_CARD)
    .first()
    .getByRole('link', { name: 'Выбрать время' })
    .click();
  await page.getByTestId(UIElements.BOOKING_SLOT_BUTTON).first().click();
  await page.getByTestId(UIElements.BOOKING_CONTINUE_BUTTON).click();
  await expect(page.getByTestId(UIElements.GUEST_DETAILS_SCREEN)).toBeVisible();
};

Given('гость открыл UIElements.HOME_SCREEN', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId(UIElements.HOME_SCREEN)).toBeVisible();
});

When('гость проходит к первому UIElements.CATALOG_MEETING_TYPE_CARD', async ({ page }) => {
  await page.getByTestId(UIElements.HOME_BOOK_BUTTON).click();
  await page
    .getByTestId(UIElements.CATALOG_MEETING_TYPE_CARD)
    .first()
    .getByRole('link', { name: 'Выбрать время' })
    .click();
});

When('выбирает первый UIElements.BOOKING_SLOT_BUTTON', async ({ page }) => {
  await page.getByTestId(UIElements.BOOKING_SLOT_BUTTON).first().click();
  await page.getByTestId(UIElements.BOOKING_CONTINUE_BUTTON).click();
});

When(
  'заполняет UIElements.GUEST_DETAILS_SCREEN именем {string} и email {string}',
  async ({ page }, name: string, email: string) => {
    await page.getByTestId(UIElements.GUEST_NAME_INPUT).fill(name);
    await page.getByTestId(UIElements.GUEST_EMAIL_INPUT).fill(email);
    await page.getByTestId(UIElements.GUEST_SUBMIT_BUTTON).click();
  },
);

Then('отображается UIElements.BOOKING_SUCCESS_SCREEN', async ({ page }) => {
  await expect(page.getByTestId(UIElements.BOOKING_SUCCESS_SCREEN)).toBeVisible();
});

When('владелец открывает UIElements.ADMIN_BOOKINGS_SCREEN', async ({ page }) => {
  await page.goto('/admin/bookings');
  await expect(page.getByTestId(UIElements.ADMIN_BOOKINGS_SCREEN)).toBeVisible();
});

Then(
  'UIElements.ADMIN_BOOKING_CARD содержит гостя {string}',
  async ({ page }, guestName: string) => {
    await expect(page.getByTestId(UIElements.ADMIN_BOOKING_CARD)).toContainText(guestName);
  },
);

Given('гость дошёл до UIElements.GUEST_DETAILS_SCREEN с выбранным слотом', async ({ page }) =>
  openGuestDetails(page),
);

Given('другой гость занял выбранный слот через API', async ({ page, request }) => {
  const url = new URL(page.url());
  const startsAt = url.searchParams.get('startsAt');
  const meetingTypeId = url.pathname.split('/')[2];
  if (!startsAt || !meetingTypeId) throw new Error('Selected slot is absent from the details URL.');
  const response = await request.post('/api/bookings', {
    data: {
      meetingTypeId,
      startsAt,
      guest: { name: 'Другой гость', email: 'other@example.ru' },
    },
  });
  expect(response.status()).toBe(201);
});

When('гость подтверждает UIElements.GUEST_DETAILS_SCREEN', async ({ page }) => {
  await page.getByTestId(UIElements.GUEST_NAME_INPUT).fill('Анна');
  await page.getByTestId(UIElements.GUEST_EMAIL_INPUT).fill('anna@example.ru');
  await page.getByTestId(UIElements.GUEST_SUBMIT_BUTTON).click();
});

Then('отображается UIElements.BOOKING_CONFLICT_ALERT', async ({ page }) => {
  await expect(page.getByTestId(UIElements.BOOKING_CONFLICT_ALERT)).toBeVisible();
});

Given('владелец открыл UIElements.ADMIN_MEETING_TYPES_SCREEN', async ({ page }) => {
  await page.goto('/admin');
  await expect(page.getByTestId(UIElements.ADMIN_MEETING_TYPES_SCREEN)).toBeVisible();
});

When('владелец создаёт тип встречи {string}', async ({ page }, title: string) => {
  await page.getByTestId(UIElements.ADMIN_CREATE_MEETING_TYPE_BUTTON).click();
  await page.getByTestId(UIElements.ADMIN_MEETING_TYPE_ID_INPUT).fill('intro-call');
  await page.getByTestId(UIElements.ADMIN_MEETING_TYPE_TITLE_INPUT).fill(title);
  await page
    .getByTestId(UIElements.ADMIN_MEETING_TYPE_DESCRIPTION_INPUT)
    .fill('Коротко познакомимся и обсудим задачу.');
  await page.getByTestId(UIElements.ADMIN_MEETING_TYPE_DURATION_SELECT).fill('30');
  await page.getByTestId(UIElements.ADMIN_MEETING_TYPE_SUBMIT_BUTTON).click();
});

Then('отображается UIElements.ADMIN_MEETING_TYPE_CREATED_NOTIFICATION', async ({ page }) => {
  await expect(page.getByTestId(UIElements.ADMIN_MEETING_TYPE_CREATED_NOTIFICATION)).toBeVisible();
});

Then(
  'публичный UIElements.CATALOG_MEETING_TYPE_LIST содержит {string}',
  async ({ page }, title: string) => {
    await page.goto('/book');
    await expect(page.getByTestId(UIElements.CATALOG_MEETING_TYPE_LIST)).toContainText(title);
  },
);

Given('в тестовой базе нет типов встреч', () => resetDatabase(false));

When('гость открывает UIElements.CATALOG_SCREEN', async ({ page }) => {
  await page.goto('/book');
  await expect(page.getByTestId(UIElements.CATALOG_SCREEN)).toBeVisible();
});

Then('отображается UIElements.CATALOG_EMPTY_STATE', async ({ page }) => {
  await expect(page.getByTestId(UIElements.CATALOG_EMPTY_STATE)).toBeVisible();
});
