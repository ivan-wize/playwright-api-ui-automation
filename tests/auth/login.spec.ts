import { test, expect } from '../../src/fixtures/pages.fixture';
import { users } from '../../src/data/users';

// Login tests must start logged-out, so override the authenticated
// storageState that the UI projects load by default (built once by
// setup/auth.setup.ts). An empty state forces a fresh, unauthenticated session.
test.use({ storageState: { cookies: [], origins: [] } });

const LOGIN_ERRORS = {
  lockedOut: 'Epic sadface: Sorry, this user has been locked out.',
  noMatch: 'Epic sadface: Username and password do not match any user in this service',
  usernameRequired: 'Epic sadface: Username is required',
  passwordRequired: 'Epic sadface: Password is required',
} as const;

/**
 * Login / authentication gate.
 *
 * Protects the front door: a valid user must reach the inventory, while every
 * rejection path (locked-out account, bad credentials, missing fields) must
 * surface the right error and never let an unauthorized session through.
 * Exact error strings are pinned above so a wording/regression change in
 * SauceDemo's messaging fails loudly instead of silently passing.
 */
test.describe('Login', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.expectLoaded();
  });

  test('standard user can log in and reach the inventory', async ({ loginPage, page }) => {
    await loginPage.loginAs(users.standard);
    await expect(page).toHaveURL(/inventory\.html$/);
    await expect(page.getByTestId('title')).toHaveText('Products');
  });

  test('locked-out user is blocked with an error', async ({ loginPage }) => {
    await loginPage.loginAs(users.lockedOut);
    await loginPage.expectError(LOGIN_ERRORS.lockedOut);
  });

  // Wrong password and unknown username both yield the same generic "no match"
  // error by design: SauceDemo won't reveal which field was wrong (anti-enumeration).
  test('invalid password is rejected', async ({ loginPage }) => {
    await loginPage.login(users.standard.username, 'wrong_password');
    await loginPage.expectError(LOGIN_ERRORS.noMatch);
  });

  test('unknown username is rejected', async ({ loginPage }) => {
    await loginPage.login('ghost_user', users.standard.password);
    await loginPage.expectError(LOGIN_ERRORS.noMatch);
  });

  test('missing username shows a validation error', async ({ loginPage }) => {
    await loginPage.login('', users.standard.password);
    await loginPage.expectError(LOGIN_ERRORS.usernameRequired);
  });

  test('missing password shows a validation error', async ({ loginPage }) => {
    await loginPage.login(users.standard.username, '');
    await loginPage.expectError(LOGIN_ERRORS.passwordRequired);
  });

  test('error message can be dismissed', async ({ loginPage }) => {
    await loginPage.loginAs(users.lockedOut);
    await loginPage.expectError(LOGIN_ERRORS.lockedOut);
    await loginPage.errorCloseButton.click();
    await expect(loginPage.errorMessage).toBeHidden();
  });
});
