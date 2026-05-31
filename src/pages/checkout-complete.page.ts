import { type Page, type Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Page object for the order-confirmation screen (/checkout-complete.html), the
 * final checkout step. Tests assert the confirmation copy (completeHeader /
 * completeText) to prove an order was placed, then use backHome to return to the
 * inventory.
 */
export class CheckoutCompletePage extends BasePage {
  protected readonly path = '/checkout-complete.html';

  readonly title: Locator;
  readonly completeHeader: Locator;
  readonly completeText: Locator;
  readonly backHomeButton: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.getByTestId('title');
    this.completeHeader = page.getByTestId('complete-header');
    this.completeText = page.getByTestId('complete-text');
    this.backHomeButton = page.getByTestId('back-to-products');
  }

  override async expectLoaded(): Promise<void> {
    await super.expectLoaded(); // URL ends with /checkout-complete.html
    await expect(this.title).toHaveText('Checkout: Complete!');
  }

  async backHome(): Promise<void> {
    await this.backHomeButton.click();
  }
}
