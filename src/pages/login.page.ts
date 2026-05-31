import { type Page, type Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';
import { type SauceUser } from '../data/users';

/**
 * Page object for SauceDemo's login screen, the entry point of every UI flow.
 * Use it to authenticate (login/loginAs) and to assert credential-rejection
 * errors (locked-out user, bad password). Lives at the site root, so path is '/'.
 */
export class LoginPage extends BasePage {
  protected readonly path = '/';

  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;
  readonly errorCloseButton: Locator;

  constructor(page: Page) {
    super(page);
    this.usernameInput = page.getByTestId('username');
    this.passwordInput = page.getByTestId('password');
    this.loginButton = page.getByTestId('login-button');
    this.errorMessage = page.getByTestId('error');
    this.errorCloseButton = page.getByTestId('error-button');
  }

  override async expectLoaded(): Promise<void> {
    // The login form sits at '/', so a URL check can't distinguish it from a
    // post-logout redirect; assert the login button is present instead.
    await expect(this.loginButton).toBeVisible();
  }

  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  /** Convenience overload that takes a user from the catalog. */
  async loginAs(user: SauceUser): Promise<void> {
    await this.login(user.username, user.password);
  }

  async expectError(message: string): Promise<void> {
    await expect(this.errorMessage).toBeVisible();
    await expect(this.errorMessage).toHaveText(message);
  }
}
