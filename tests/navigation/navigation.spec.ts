/**
 * Cross-cutting navigation and the hamburger menu (logout, reset app state, all
 * items, about) plus the footer. These chrome elements appear on every page, so
 * a regression here strands the user; the feature specs assume they work.
 */
import { test, expect } from '../../src/fixtures/pages.fixture';
import { products } from '../../src/data/products';

test.describe('Navigation', () => {
  test.beforeEach(async ({ inventoryPage }) => {
    await inventoryPage.goto();
    await inventoryPage.expectLoaded();
  });

  test('logout returns to the login page', async ({ inventoryPage, loginPage }) => {
    await inventoryPage.header.menu.logout();
    await loginPage.expectLoaded(); // login button is only present on the login page
  });

  test('reset app state clears the cart', async ({ inventoryPage, cartPage }) => {
    await inventoryPage.addToCart(products.backpack.name);
    await inventoryPage.addToCart(products.bikeLight.name);
    await inventoryPage.header.expectCartCount(2);

    await inventoryPage.header.menu.resetAppState();

    // Verify against the cart page itself, which is robust regardless of whether
    // the badge re-renders immediately after a reset.
    await inventoryPage.header.openCart();
    await cartPage.expectLoaded();
    await expect(cartPage.cartItems).toHaveCount(0);
  });

  test('all items returns to the inventory from another page', async ({
    inventoryPage,
    cartPage,
  }) => {
    await inventoryPage.header.openCart();
    await cartPage.expectLoaded();

    await cartPage.header.menu.goToAllItems();
    await inventoryPage.expectLoaded();
  });

  test('about link points to the Sauce Labs site', async ({ inventoryPage }) => {
    await inventoryPage.header.menu.open();
    // Check the href rather than clicking, to avoid leaving for an external site.
    await expect(inventoryPage.header.menu.aboutLink).toHaveAttribute('href', /saucelabs\.com/);
  });

  test('the footer shows social links and copyright', async ({ footer }) => {
    await footer.expectSocialLinks();
    await footer.expectCopyright();
  });
});
