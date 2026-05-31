import { type Page, type Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';
import { HeaderComponent } from '../components/header.component';
import { parseMoneyList } from '../utils/money';

/**
 * Page object for SauceDemo's cart (/cart.html): the review step between the
 * inventory and checkout. Tests use it to assert which products/quantities/prices
 * the cart holds and to drive the Remove / Continue Shopping / Checkout actions.
 */
export class CartPage extends BasePage {
  protected readonly path = '/cart.html';

  /** Shared header (cart badge/link, menu trigger). */
  readonly header: HeaderComponent;

  readonly title: Locator;
  readonly cartItems: Locator;
  readonly itemNames: Locator;
  readonly itemPrices: Locator;
  readonly itemQuantities: Locator;
  readonly continueShoppingButton: Locator;
  readonly checkoutButton: Locator;

  constructor(page: Page) {
    super(page);
    this.header = new HeaderComponent(page);
    this.title = page.getByTestId('title');
    // The cart-line wrapper. SauceDemo puts data-test attributes on the inner
    // fields (name/price/qty) but not on this container, so we use its class.
    this.cartItems = page.locator('.cart_item');
    this.itemNames = page.getByTestId('inventory-item-name');
    this.itemPrices = page.getByTestId('inventory-item-price');
    this.itemQuantities = page.getByTestId('item-quantity');
    this.continueShoppingButton = page.getByTestId('continue-shopping');
    this.checkoutButton = page.getByTestId('checkout');
  }

  override async expectLoaded(): Promise<void> {
    await super.expectLoaded(); // URL ends with /cart.html
    await expect(this.title).toHaveText('Your Cart');
  }

  /** Scope to a single cart line by its (catalog-unique) product name. */
  private itemByName(name: string): Locator {
    return this.cartItems.filter({ hasText: name });
  }

  async removeItem(productName: string): Promise<void> {
    await this.itemByName(productName).getByRole('button', { name: 'Remove' }).click();
  }

  async continueShopping(): Promise<void> {
    await this.continueShoppingButton.click();
  }

  async checkout(): Promise<void> {
    await this.checkoutButton.click();
  }

  async getItemNames(): Promise<string[]> {
    return this.itemNames.allTextContents();
  }

  async getItemPrices(): Promise<number[]> {
    return parseMoneyList(await this.itemPrices.allTextContents());
  }

  async getItemQuantities(): Promise<number[]> {
    const raw = await this.itemQuantities.allTextContents();
    return raw.map((qty) => Number(qty));
  }
}
