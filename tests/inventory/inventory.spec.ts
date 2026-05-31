import { test, expect } from '../../src/fixtures/pages.fixture';
import { allProducts, products } from '../../src/data/products';

/**
 * Inventory (product catalog) page.
 *
 * Guards the shopper's first authenticated screen: the full catalog must render
 * with prices and add-to-cart controls, and the cart badge must track add/remove
 * actions accurately. A broken badge or missing product directly breaks the
 * buying flow downstream.
 */
test.describe('Inventory', () => {
  // No login here: the authenticated session is loaded from storageState, so
  // we navigate straight to the inventory already logged in.
  test.beforeEach(async ({ inventoryPage }) => {
    await inventoryPage.goto();
    await inventoryPage.expectLoaded();
  });

  test('displays the full product catalog', async ({ inventoryPage }) => {
    await expect(inventoryPage.items).toHaveCount(allProducts.length);

    // SauceDemo defaults to Name (A->Z) and allProducts is authored in that
    // order, so assert exact order (which also covers membership).
    expect(await inventoryPage.getProductNames()).toEqual(allProducts.map((p) => p.name));
  });

  test('every product shows a price and an add-to-cart button', async ({ inventoryPage }) => {
    await expect(inventoryPage.itemPrices).toHaveCount(allProducts.length);
    await expect(inventoryPage.addToCartButtons).toHaveCount(allProducts.length);
  });

  test('adding a product updates the cart badge', async ({ inventoryPage }) => {
    await inventoryPage.header.expectCartCount(0);
    await inventoryPage.addToCart(products.backpack.name);
    await inventoryPage.header.expectCartCount(1);
  });

  test('removing a product reverts the cart badge', async ({ inventoryPage }) => {
    await inventoryPage.addToCart(products.backpack.name);
    await inventoryPage.header.expectCartCount(1);
    await inventoryPage.removeFromCart(products.backpack.name);
    await inventoryPage.header.expectCartCount(0);
  });

  test('reflects multiple items in the cart badge', async ({ inventoryPage }) => {
    await inventoryPage.addToCart(products.backpack.name);
    await inventoryPage.addToCart(products.bikeLight.name);
    await inventoryPage.addToCart(products.boltTShirt.name);
    await inventoryPage.header.expectCartCount(3);
  });
});
