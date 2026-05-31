/**
 * Headline end-to-end smoke test: one standard user logging in, shopping, and
 * completing a purchase. The feature specs cover each step in isolation; this
 * proves the whole flow connects, which is the journey a broken release would
 * hurt first. Keep it lean; it should stay a fast, reliable confidence check.
 */
import { test, expect } from '../../src/fixtures/pages.fixture';
import { users } from '../../src/data/users';
import { products } from '../../src/data/products';
import { validCheckoutInfo } from '../../src/data/checkout.data';
import { sum, tax, total } from '../../src/utils/money';

// Unlike the feature specs, the headline journey includes login, so it starts
// from a clean logged-out state instead of the shared authenticated session.
test.use({ storageState: { cookies: [], origins: [] } });

const ITEMS = [products.backpack, products.boltTShirt, products.fleeceJacket];

test.describe('End-to-end purchase journey', () => {
  test('a standard user can log in, add items, and complete a purchase', async ({
    loginPage,
    inventoryPage,
    cartPage,
    checkoutInfoPage,
    checkoutOverviewPage,
    checkoutCompletePage,
  }) => {
    // test.step groups the flow into labeled stages, each collapsible in the HTML
    // report and trace, which makes a long journey easy to read/debug.
    await test.step('Log in', async () => {
      await loginPage.goto();
      await loginPage.loginAs(users.standard);
      await inventoryPage.expectLoaded();
    });

    await test.step('Add items to the cart', async () => {
      for (const item of ITEMS) {
        await inventoryPage.addToCart(item.name);
      }
      await inventoryPage.header.expectCartCount(ITEMS.length);
    });

    await test.step('Review the cart', async () => {
      await inventoryPage.header.openCart();
      await cartPage.expectLoaded();
      await expect(cartPage.cartItems).toHaveCount(ITEMS.length);

      const names = await cartPage.getItemNames();
      expect([...names].sort()).toEqual(ITEMS.map((i) => i.name).sort());
    });

    await test.step('Enter checkout information', async () => {
      await cartPage.checkout();
      await checkoutInfoPage.expectLoaded();
      await checkoutInfoPage.submit(validCheckoutInfo);
    });

    await test.step('Verify the order summary', async () => {
      await checkoutOverviewPage.expectLoaded();

      const expectedSubtotal = sum(ITEMS.map((i) => i.price));
      expect(await checkoutOverviewPage.getDisplayedSubtotal()).toBe(expectedSubtotal);
      expect(await checkoutOverviewPage.getDisplayedTax()).toBe(tax(expectedSubtotal));
      expect(await checkoutOverviewPage.getDisplayedTotal()).toBe(total(expectedSubtotal));
    });

    await test.step('Complete the order', async () => {
      await checkoutOverviewPage.finish();
      await checkoutCompletePage.expectLoaded();
      await expect(checkoutCompletePage.completeHeader).toHaveText('Thank you for your order!');
    });

    await test.step('Return home with an empty cart', async () => {
      await checkoutCompletePage.backHome();
      await inventoryPage.expectLoaded();
      await inventoryPage.header.expectCartCount(0); // order placed, cart cleared
    });
  });
});
