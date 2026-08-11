import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

const { Then, When } = createBdd();

When('the technical shell is opened', async ({ page }) => {
  await page.goto('/');
});

Then('the shell reports that the infrastructure is healthy', async ({ page }) => {
  await expect(page.getByText('API и SQLite готовы.')).toBeVisible();
});
