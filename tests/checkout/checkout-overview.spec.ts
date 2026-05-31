/**
 * Checkout step two (order overview). This is the last screen before the user
 * commits, so it protects the highest-value invariants: the right items are
 * listed and the subtotal/tax/total are correct. We recompute the expected
 * money independently (see utils/money) and compare against the page, rather
 * than trusting the page to be consistent with itself.
 */
import { test, expect } from '../../src/fixtures/pages.fixture';
import { products } from '../../src/data/products';
import { validCheckoutInfo } from '../../src/data/checkout.data';
import { sum, tax, total, roundToCents } from '../../src/utils/money';

// Two items so the subtotal is a genuine sum, not a single price.
const ITEMS = [products.backpack, products.bikeLight];

test.describe('Checkout: overview', () => {
  // Drive the full path to step two: add items, cart, checkout, submit info.
  test.beforeEach(async ({ inventoryPage, cartPage, checkoutInfoPage, checkoutOverviewPage }) => {
    await inventoryPage.goto();
    for (const item of ITEMS) {
      await inventoryPage.addToCart(item.name);
    }
    await inventoryPage.header.openCart();
    await cartPage.checkout();
    await checkoutInfoPage.submit(validCheckoutInfo);
    await checkoutOverviewPage.expectLoaded();
  });

  test('lists the items being purchased, with their prices', async ({ checkoutOverviewPage }) => {
    await expect(checkoutOverviewPage.cartItems).toHaveCount(ITEMS.length);

    const names = await checkoutOverviewPage.getItemNames();
    expect([...names].sort()).toEqual(ITEMS.map((i) => i.name).sort());

    // Assert the per-line prices too (as a set, like the names), so a single
    // wrong line price is caught here, not just the aggregate subtotal below.
    const prices = await checkoutOverviewPage.getItemPrices();
    expect([...prices].sort((a, b) => a - b)).toEqual(
      ITEMS.map((i) => i.price).sort((a, b) => a - b),
    );
  });

  test('item total, tax, and grand total are calculated correctly', async ({
    checkoutOverviewPage,
  }) => {
    const expectedSubtotal = sum(ITEMS.map((i) => i.price));

    const subtotal = await checkoutOverviewPage.getDisplayedSubtotal();
    const displayedTax = await checkoutOverviewPage.getDisplayedTax();
    const displayedTotal = await checkoutOverviewPage.getDisplayedTotal();

    // Item total equals the sum of the catalog prices.
    expect(subtotal).toBe(expectedSubtotal);
    // Tax is 8% of the subtotal, rounded to cents.
    expect(displayedTax).toBe(tax(expectedSubtotal));
    // Grand total equals subtotal + tax.
    expect(displayedTotal).toBe(total(expectedSubtotal));
    // And the page is internally consistent with its own displayed numbers.
    expect(displayedTotal).toBe(roundToCents(subtotal + displayedTax));
  });

  test('finish completes the order', async ({ checkoutOverviewPage, checkoutCompletePage }) => {
    await checkoutOverviewPage.finish();
    await checkoutCompletePage.expectLoaded();
  });

  test('cancel returns to the inventory', async ({ checkoutOverviewPage, inventoryPage }) => {
    // On step two, Cancel goes back to the products page (step one went to the cart).
    await checkoutOverviewPage.cancel();
    await inventoryPage.expectLoaded();
  });
});
