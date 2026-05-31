import { type Page, type Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';
import { parseMoney, parseMoneyList } from '../utils/money';

/**
 * Page object for checkout step two (/checkout-step-two.html): the order summary.
 * The getDisplayed* getters expose SauceDemo's rendered subtotal/tax/total so a
 * test can verify them against locally computed figures (see utils/money); this
 * is the page that guards the order's pricing math. Cancel here returns to the
 * inventory (step one's Cancel returns to the cart); Finish places the order.
 */
export class CheckoutOverviewPage extends BasePage {
  protected readonly path = '/checkout-step-two.html';

  readonly title: Locator;
  readonly cartItems: Locator;
  readonly itemNames: Locator;
  readonly itemPrices: Locator;
  readonly subtotalLabel: Locator;
  readonly taxLabel: Locator;
  readonly totalLabel: Locator;
  readonly finishButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.getByTestId('title');
    this.cartItems = page.locator('.cart_item');
    this.itemNames = page.getByTestId('inventory-item-name');
    this.itemPrices = page.getByTestId('inventory-item-price');
    this.subtotalLabel = page.getByTestId('subtotal-label'); // "Item total: $X.XX"
    this.taxLabel = page.getByTestId('tax-label'); // "Tax: $X.XX"
    this.totalLabel = page.getByTestId('total-label'); // "Total: $X.XX"
    this.finishButton = page.getByTestId('finish');
    this.cancelButton = page.getByTestId('cancel');
  }

  override async expectLoaded(): Promise<void> {
    await super.expectLoaded(); // URL ends with /checkout-step-two.html
    await expect(this.title).toHaveText('Checkout: Overview');
  }

  async finish(): Promise<void> {
    await this.finishButton.click();
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }

  async getItemNames(): Promise<string[]> {
    return this.itemNames.allTextContents();
  }

  async getItemPrices(): Promise<number[]> {
    return parseMoneyList(await this.itemPrices.allTextContents());
  }

  /** The displayed "Item total", as a number. */
  async getDisplayedSubtotal(): Promise<number> {
    return parseMoney((await this.subtotalLabel.textContent()) ?? '');
  }

  /** The displayed tax, as a number. */
  async getDisplayedTax(): Promise<number> {
    return parseMoney((await this.taxLabel.textContent()) ?? '');
  }

  /** The displayed grand total, as a number. */
  async getDisplayedTotal(): Promise<number> {
    return parseMoney((await this.totalLabel.textContent()) ?? '');
  }
}
