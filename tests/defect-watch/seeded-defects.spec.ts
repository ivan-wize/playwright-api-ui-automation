/**
 * Defect-watch lane: a deliberately NON-BLOCKING suite.
 *
 * SauceDemo seeds problem_user and error_user with intentional bugs. Each test
 * asserts the CORRECT behavior and is marked test.fail(), so while the bug exists
 * the test "fails as expected" and the lane stays green.
 *
 * They're split out because they assert a third party's bugs: the day SauceDemo
 * fixes one, the test flips to an unexpected pass and this lane goes red through
 * no change of ours. Run as its own project (`npm run test:defect-watch`) and a
 * non-blocking CI job, that red surfaces the fix (remove the marker) without
 * blocking the real suite. The accounts' happy paths live in special-users.spec.
 *
 * Chromium-only: account/server behavior, not per-browser rendering.
 */
import { test, expect } from '../../src/fixtures/pages.fixture';
import { users } from '../../src/data/users';
import { allProducts, products } from '../../src/data/products';
import { validCheckoutInfo } from '../../src/data/checkout.data';
import { SortOption } from '../../src/pages/inventory.page';

// Each test authenticates as a seeded account, so they start from a clean,
// logged-out state rather than the shared standard-user session.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Seeded defects', { tag: '@defect-watch' }, () => {
  test.describe('problem_user (seeded UI defects)', () => {
    // Defect: problem_user renders the same image for every product. (See the
    // file header for why this is asserted as the correct behavior under test.fail.)
    test.fail();

    test('each product should have a distinct image', async ({
      loginPage,
      inventoryPage,
      page,
    }) => {
      await loginPage.goto();
      await loginPage.loginAs(users.problem);
      await inventoryPage.expectLoaded();

      const sources = await page
        .locator('.inventory_item_img')
        .evaluateAll((imgs) => imgs.map((img) => (img as HTMLImageElement).src));

      // Correct expectation: 6 products -> 6 unique image URLs.
      expect(new Set(sources).size).toBe(sources.length);
    });
  });

  test.describe('error_user (seeded functional defects)', () => {
    // Defect: error_user silently swallows several actions (the click is accepted
    // but nothing happens). Its happy-path login lives in special-users.spec.
    test.fail();

    test('the sort dropdown should reorder the catalog (Z to A)', async ({
      loginPage,
      inventoryPage,
    }) => {
      await loginPage.goto();
      await loginPage.loginAs(users.error);
      await inventoryPage.expectLoaded();

      await inventoryPage.sortBy(SortOption.NameZToA);

      // Defect: for error_user the dropdown changes but the list never reorders,
      // so it stays in the default A->Z order and this expectation fails.
      const expectedZToA = allProducts
        .map((p) => p.name)
        .sort((a, b) => a.localeCompare(b))
        .reverse();
      expect(await inventoryPage.getProductNames()).toEqual(expectedZToA);
    });

    test('a started order should complete when Finish is clicked', async ({
      loginPage,
      inventoryPage,
      cartPage,
      checkoutInfoPage,
      checkoutOverviewPage,
      checkoutCompletePage,
    }) => {
      await loginPage.goto();
      await loginPage.loginAs(users.error);
      await inventoryPage.expectLoaded();

      await inventoryPage.addToCart(products.backpack.name);
      await inventoryPage.header.openCart();
      await cartPage.checkout();
      await checkoutInfoPage.submit(validCheckoutInfo);
      await checkoutOverviewPage.expectLoaded();

      await checkoutOverviewPage.finish();

      // Defect: error_user's Finish is inert. The order never completes (the page
      // stays on checkout-step-two), so reaching the confirmation fails.
      await checkoutCompletePage.expectLoaded();
    });
  });
});
