/**
 * Checkout confirmation page (after Finish). Confirms the user gets the
 * "thank you" acknowledgement and that returning home resets the cart, proving
 * the placed order is committed and not lingering as an editable cart.
 */
import { test, expect } from '../../src/fixtures/pages.fixture';
import { products } from '../../src/data/products';
import { validCheckoutInfo } from '../../src/data/checkout.data';

test.describe('Checkout: completion', () => {
  // Drive the full purchase through Finish to land on the confirmation page.
  test.beforeEach(
    async ({
      inventoryPage,
      cartPage,
      checkoutInfoPage,
      checkoutOverviewPage,
      checkoutCompletePage,
    }) => {
      await inventoryPage.goto();
      await inventoryPage.addToCart(products.backpack.name);
      await inventoryPage.header.openCart();
      await cartPage.checkout();
      await checkoutInfoPage.submit(validCheckoutInfo);
      await checkoutOverviewPage.finish();
      await checkoutCompletePage.expectLoaded();
    },
  );

  test('shows the order confirmation', async ({ checkoutCompletePage }) => {
    await expect(checkoutCompletePage.completeHeader).toHaveText('Thank you for your order!');
    await expect(checkoutCompletePage.completeText).toBeVisible();
  });

  test('back home returns to the inventory with an empty cart', async ({
    checkoutCompletePage,
    inventoryPage,
  }) => {
    await checkoutCompletePage.backHome();
    await inventoryPage.expectLoaded();
    await inventoryPage.header.expectCartCount(0); // order placed, so the cart is cleared
  });
});
