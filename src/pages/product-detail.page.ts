import { type Page, type Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';
import { HeaderComponent } from '../components/header.component';
import { parseMoney } from '../utils/money';

/**
 * Page object for a single product's detail view, reached by clicking a product
 * on the inventory page. Use it to read the product's name/description/price and
 * to add/remove that one item. Cart-badge and menu live on the shared `header`.
 */
export class ProductDetailPage extends BasePage {
  // Reached only by clicking through from the inventory page, never by direct
  // navigation: the URL carries an "?id=N" query string, so goto(path) wouldn't
  // resolve to a real product. expectLoaded is overridden to match a URL
  // substring (and the back button) rather than the full anchored path.
  protected readonly path = '/inventory-item.html';

  /** Shared header (cart badge/link, menu trigger). */
  readonly header: HeaderComponent;

  readonly name: Locator;
  readonly description: Locator;
  readonly price: Locator;
  readonly addToCartButton: Locator;
  readonly removeButton: Locator;
  readonly backButton: Locator;

  constructor(page: Page) {
    super(page);
    this.header = new HeaderComponent(page);
    this.name = page.getByTestId('inventory-item-name');
    this.description = page.getByTestId('inventory-item-desc');
    this.price = page.getByTestId('inventory-item-price');
    // The single product's button toggles between these two labels. We target
    // by role/text so we don't depend on SauceDemo's per-product button ids.
    this.addToCartButton = page.getByRole('button', { name: 'Add to cart' });
    this.removeButton = page.getByRole('button', { name: 'Remove' });
    this.backButton = page.getByTestId('back-to-products');
  }

  override async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/inventory-item\.html/);
    await expect(this.backButton).toBeVisible();
  }

  async getName(): Promise<string> {
    return (await this.name.textContent()) ?? '';
  }

  async getPrice(): Promise<number> {
    // parseMoney throws on a blank/missing label, so a broken price fails loudly
    // instead of silently coercing to 0.
    return parseMoney((await this.price.textContent()) ?? '');
  }

  async addToCart(): Promise<void> {
    await this.addToCartButton.click();
  }

  async removeFromCart(): Promise<void> {
    await this.removeButton.click();
  }

  async backToProducts(): Promise<void> {
    await this.backButton.click();
  }
}
