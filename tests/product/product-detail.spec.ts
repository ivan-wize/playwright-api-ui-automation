import { test, expect } from '../../src/fixtures/pages.fixture';
import { products } from '../../src/data/products';

/**
 * Product detail page (PDP).
 *
 * Verifies the single-product view shows correct name/price/description, that
 * add/remove works from here as well as the list, and (the key risk) that
 * cart state survives navigating PDP -> back to inventory (a classic place for
 * client-side state to be dropped).
 *
 * Each test enters via the inventory because the PDP has no stable deep link:
 * its URL carries an "?id=N" query string, so we click through from the catalog
 * rather than navigating directly.
 */
test.describe('Product detail', () => {
  test.beforeEach(async ({ inventoryPage }) => {
    await inventoryPage.goto();
    await inventoryPage.expectLoaded();
  });

  test('shows the correct product details', async ({ inventoryPage, productDetailPage }) => {
    await inventoryPage.openProduct(products.backpack.name);
    await productDetailPage.expectLoaded();

    expect(await productDetailPage.getName()).toBe(products.backpack.name);
    expect(await productDetailPage.getPrice()).toBe(products.backpack.price);
    await expect(productDetailPage.description).toBeVisible();
  });

  test('adds the product to the cart from the detail page', async ({
    inventoryPage,
    productDetailPage,
  }) => {
    await inventoryPage.openProduct(products.backpack.name);
    await productDetailPage.expectLoaded();

    await productDetailPage.header.expectCartCount(0);
    await productDetailPage.addToCart();
    await productDetailPage.header.expectCartCount(1);
  });

  test('removes the product from the cart from the detail page', async ({
    inventoryPage,
    productDetailPage,
  }) => {
    await inventoryPage.openProduct(products.backpack.name);
    await productDetailPage.expectLoaded();

    await productDetailPage.addToCart();
    await productDetailPage.header.expectCartCount(1);
    await productDetailPage.removeFromCart();
    await productDetailPage.header.expectCartCount(0);
  });

  test('back to products returns to the inventory', async ({
    inventoryPage,
    productDetailPage,
  }) => {
    await inventoryPage.openProduct(products.backpack.name);
    await productDetailPage.expectLoaded();

    await productDetailPage.backToProducts();
    await inventoryPage.expectLoaded();
  });

  test('an added item stays in the cart after returning to the inventory', async ({
    inventoryPage,
    productDetailPage,
  }) => {
    await inventoryPage.openProduct(products.backpack.name);
    await productDetailPage.expectLoaded();
    await productDetailPage.addToCart();
    await productDetailPage.header.expectCartCount(1);

    await productDetailPage.backToProducts();
    await inventoryPage.expectLoaded();
    await inventoryPage.header.expectCartCount(1); // cart survived the round trip
  });
});
