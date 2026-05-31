import { type Page, type Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';
import { type CheckoutInfo } from '../data/checkout.data';

/**
 * Page object for checkout step one (/checkout-step-one.html): the shipping-info
 * form. Drives both the happy path (submit valid info to reach the overview) and
 * the validation cases (each blank field surfaces its own "Error: ..." message).
 * Note: Cancel here returns to the cart, whereas Cancel on step two returns to
 * the inventory.
 */
export class CheckoutInfoPage extends BasePage {
  protected readonly path = '/checkout-step-one.html';

  readonly title: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly postalCodeInput: Locator;
  readonly continueButton: Locator;
  readonly cancelButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.getByTestId('title');
    this.firstNameInput = page.getByTestId('firstName');
    this.lastNameInput = page.getByTestId('lastName');
    this.postalCodeInput = page.getByTestId('postalCode');
    this.continueButton = page.getByTestId('continue');
    this.cancelButton = page.getByTestId('cancel');
    // Same error element as login, but the message text uses an "Error:" prefix
    // here rather than login's "Epic sadface:".
    this.errorMessage = page.getByTestId('error');
  }

  override async expectLoaded(): Promise<void> {
    await super.expectLoaded(); // URL ends with /checkout-step-one.html
    await expect(this.title).toHaveText('Checkout: Your Information');
  }

  /**
   * Fill the form. Accepts partial info so validation tests can deliberately
   * leave a field blank (any omitted field is cleared to an empty string).
   */
  async fillInfo(info: Partial<CheckoutInfo>): Promise<void> {
    await this.firstNameInput.fill(info.firstName ?? '');
    await this.lastNameInput.fill(info.lastName ?? '');
    await this.postalCodeInput.fill(info.postalCode ?? '');
  }

  async continue(): Promise<void> {
    await this.continueButton.click();
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }

  /** Happy-path convenience: fill valid info and advance to the overview. */
  async submit(info: CheckoutInfo): Promise<void> {
    await this.fillInfo(info);
    await this.continue();
  }

  async expectError(message: string): Promise<void> {
    await expect(this.errorMessage).toBeVisible();
    await expect(this.errorMessage).toHaveText(message);
  }
}
