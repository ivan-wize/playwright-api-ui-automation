/**
 * SauceDemo ships several purpose-built accounts that each misbehave in a known
 * way. This spec covers what must hold for a healthy app: the "happy" accounts
 * (problem/error/visual) must still authenticate, and the glitch account must
 * survive its injected latency. The seeded *defects* those accounts exhibit are
 * asserted separately in tests/defect-watch/ (a non-blocking lane), so the day
 * SauceDemo fixes one of them the resulting "unexpected pass" can't turn this
 * blocking suite red.
 */
import { test, expect } from '../../src/fixtures/pages.fixture';
import { users, type SauceUser } from '../../src/data/users';
import { allProducts } from '../../src/data/products';

// These tests authenticate as various seeded accounts, so they start from a
// clean, logged-out state rather than the shared standard-user session.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Special users', () => {
  // The non-glitch, non-locked accounts should all authenticate normally.
  const authenticatableUsers: SauceUser[] = [users.problem, users.error, users.visual];

  for (const user of authenticatableUsers) {
    test(`${user.username} can log in and reach the inventory`, async ({
      loginPage,
      inventoryPage,
    }) => {
      await loginPage.goto();
      await loginPage.loginAs(user);
      await inventoryPage.expectLoaded();
    });
  }

  test.describe('performance_glitch_user (deliberate latency)', () => {
    test('logs in and loads the inventory despite the delay', async ({
      loginPage,
      page,
    }, testInfo) => {
      await loginPage.goto();

      const start = Date.now();
      await loginPage.loginAs(users.performanceGlitch);

      // This account injects artificial latency. We give the navigation generous
      // headroom and lean on auto-retrying assertions instead of a fixed sleep:
      // the whole point is that proper waits absorb the slowness without flaking.
      await expect(page).toHaveURL(/inventory\.html/, { timeout: 20_000 });
      await expect(page.getByTestId('inventory-item')).toHaveCount(allProducts.length, {
        timeout: 20_000,
      });

      // Record the observed login latency in the report instead of stdout.
      await testInfo.attach('login-duration-ms', {
        body: String(Date.now() - start),
        contentType: 'text/plain',
      });
    });
  });
});
