import { test, expect } from '../../src/fixtures/pages.fixture';
import { products } from '../../src/data/products';
import { users } from '../../src/data/users';

/**
 * Cart (review step between inventory and checkout).
 *
 * Protects what the shopper is about to pay for: the cart must list exactly the
 * items added (with correct prices/quantities), reflect removals in both the
 * list and the badge, and hand off to checkout. Wrong contents here means a
 * customer buys the wrong thing.
 */
test.describe('Cart', () => {
  // Start on the inventory (already authenticated via storageState); each test
  // adds what it needs through the UI before opening the cart.
  test.beforeEach(async ({ inventoryPage }) => {
    await inventoryPage.goto();
    await inventoryPage.expectLoaded();
  });

  test('shows the items that were added, with their prices', async ({
    inventoryPage,
    cartPage,
  }) => {
    await inventoryPage.addToCart(products.backpack.name);
    await inventoryPage.addToCart(products.bikeLight.name);

    await inventoryPage.header.openCart();
    await cartPage.expectLoaded();

    await expect(cartPage.cartItems).toHaveCount(2);

    // Compare as sets so the test doesn't depend on cart ordering.
    const names = await cartPage.getItemNames();
    expect([...names].sort()).toEqual([products.backpack.name, products.bikeLight.name].sort());

    const prices = await cartPage.getItemPrices();
    expect([...prices].sort((a, b) => a - b)).toEqual(
      [products.backpack.price, products.bikeLight.price].sort((a, b) => a - b),
    );
  });

  test('every cart line has a quantity of 1', async ({ inventoryPage, cartPage }) => {
    // SauceDemo only lets a product be added once, so every line's quantity is 1.
    // Add two so the "each line" invariant is exercised across multiple lines.
    await inventoryPage.addToCart(products.backpack.name);
    await inventoryPage.addToCart(products.bikeLight.name);
    await inventoryPage.header.openCart();

    // Gate the one-shot allTextContents() read on an auto-retrying count, so we
    // never read quantities before both lines have rendered.
    await expect(cartPage.cartItems).toHaveCount(2);
    expect(await cartPage.getItemQuantities()).toEqual([1, 1]);
  });

  test('removing an item updates the cart and the badge', async ({ inventoryPage, cartPage }) => {
    await inventoryPage.addToCart(products.backpack.name);
    await inventoryPage.addToCart(products.bikeLight.name);
    await inventoryPage.header.openCart();

    await cartPage.removeItem(products.backpack.name);

    await expect(cartPage.cartItems).toHaveCount(1);
    expect(await cartPage.getItemNames()).toEqual([products.bikeLight.name]);
    await cartPage.header.expectCartCount(1);
  });

  test('continue shopping returns to the inventory with the cart intact', async ({
    inventoryPage,
    cartPage,
  }) => {
    await inventoryPage.addToCart(products.backpack.name);
    await inventoryPage.header.openCart();

    await cartPage.continueShopping();

    await inventoryPage.expectLoaded();
    await inventoryPage.header.expectCartCount(1); // cart survived the round trip
  });

  test('the cart is restored after logging out and back in', async ({
    inventoryPage,
    cartPage,
    loginPage,
  }) => {
    await inventoryPage.addToCart(products.backpack.name);
    await inventoryPage.addToCart(products.bikeLight.name);
    await inventoryPage.header.expectCartCount(2);

    // SauceDemo persists the cart in localStorage, so logging out and back in as
    // the same user should restore it (verified against the live site). This is
    // easy to regress, so we assert both the badge and the cart contents return.
    await inventoryPage.header.menu.logout();
    await loginPage.expectLoaded();
    await loginPage.loginAs(users.standard);
    await inventoryPage.expectLoaded();

    await inventoryPage.header.expectCartCount(2);
    await inventoryPage.header.openCart();
    await cartPage.expectLoaded();
    await expect(cartPage.cartItems).toHaveCount(2);
    const names = await cartPage.getItemNames();
    expect([...names].sort()).toEqual([products.backpack.name, products.bikeLight.name].sort());
  });

  test('checkout proceeds to the customer information step', async ({
    inventoryPage,
    cartPage,
    page,
  }) => {
    await inventoryPage.addToCart(products.backpack.name);
    await inventoryPage.header.openCart();

    await cartPage.checkout();

    // This is a cart-scoped test, so we only confirm the hand-off lands on the
    // customer-info step (checkout-step-one); the contents of that page are
    // exercised by the checkout specs, not here.
    await expect(page).toHaveURL(/checkout-step-one\.html$/);
  });
});
