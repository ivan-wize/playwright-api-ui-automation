/**
 * Auth setup project: logs in as the standard user ONCE and persists the
 * session to .auth/standard.json. The browser projects in playwright.config.ts
 * depend on this and load that storageState, so the bulk of the UI specs start
 * already authenticated and never repeat login, which is faster and less flaky.
 * Specs that test login itself (e2e journey, special-users) opt out by clearing
 * storageState. Keep this path in sync with STORAGE_STATE in the config.
 */
import { test as setup, expect } from '@playwright/test';
import { LoginPage } from '../src/pages/login.page';
import { standardUser } from '../src/data/users';

const STORAGE_STATE = '.auth/standard.json';

setup('authenticate as standard user', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.loginAs(standardUser);

  // Confirm we actually reached the inventory before persisting the session.
  await expect(page).toHaveURL(/inventory\.html$/);
  await expect(page.getByTestId('title')).toHaveText('Products');

  await page.context().storageState({ path: STORAGE_STATE });
});
