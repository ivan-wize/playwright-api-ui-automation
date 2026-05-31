import { test, expect } from '../../src/fixtures/pages.fixture';
import { SortOption } from '../../src/pages/inventory.page';
import { allProducts } from '../../src/data/products';

// Expected orders derived from the known catalog. Comparing the on-screen list
// to a sorted copy of itself is a tautology for name A->Z (SauceDemo already
// defaults to A->Z, so a no-op sort would still pass); anchoring to the catalog
// makes every sort test fail if the dropdown stops working. allProducts is
// authored in the default A->Z order, so a stable sort by price reproduces
// SauceDemo's tie-break for the two $15.99 items.
const namesAsc = allProducts.map((p) => p.name).sort((a, b) => a.localeCompare(b));
const byPriceLowToHigh = [...allProducts].sort((a, b) => a.price - b.price);
const byPriceHighToLow = [...allProducts].sort((a, b) => b.price - a.price);

/**
 * Inventory sort dropdown (name A-Z/Z-A, price low-high/high-low).
 *
 * Protects the shopper's ability to reorder the catalog. Each test compares the
 * on-screen order against an order derived from the catalog (not from the page
 * itself) so a dead/no-op dropdown can't pass (see the note above on why).
 */
test.describe('Product sorting', () => {
  test.beforeEach(async ({ inventoryPage }) => {
    await inventoryPage.goto();
    await inventoryPage.expectLoaded();
  });

  test('sorts by name A to Z', async ({ inventoryPage }) => {
    await inventoryPage.sortBy(SortOption.NameAToZ);
    expect(await inventoryPage.getProductNames()).toEqual(namesAsc);
  });

  test('sorts by name Z to A', async ({ inventoryPage }) => {
    await inventoryPage.sortBy(SortOption.NameZToA);
    expect(await inventoryPage.getProductNames()).toEqual([...namesAsc].reverse());
  });

  test('sorts by price low to high', async ({ inventoryPage }) => {
    await inventoryPage.sortBy(SortOption.PriceLowToHigh);
    // Assert names too, so the order of the two equal-priced $15.99 items is verified.
    expect(await inventoryPage.getProductNames()).toEqual(byPriceLowToHigh.map((p) => p.name));
    expect(await inventoryPage.getProductPrices()).toEqual(byPriceLowToHigh.map((p) => p.price));
  });

  test('sorts by price high to low', async ({ inventoryPage }) => {
    await inventoryPage.sortBy(SortOption.PriceHighToLow);
    expect(await inventoryPage.getProductNames()).toEqual(byPriceHighToLow.map((p) => p.name));
    expect(await inventoryPage.getProductPrices()).toEqual(byPriceHighToLow.map((p) => p.price));
  });
});
