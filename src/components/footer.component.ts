import { type Page, type Locator, expect } from '@playwright/test';

/** The site footer: social links and copyright line. */
export class FooterComponent {
  readonly twitterLink: Locator;
  readonly facebookLink: Locator;
  readonly linkedinLink: Locator;
  readonly copyright: Locator;

  constructor(page: Page) {
    this.twitterLink = page.getByTestId('social-twitter');
    this.facebookLink = page.getByTestId('social-facebook');
    this.linkedinLink = page.getByTestId('social-linkedin');
    this.copyright = page.getByTestId('footer-copy');
  }

  /**
   * Assert the social links point at the right platforms. We check href rather
   * than clicking, since these navigate to external sites we don't want to hit.
   */
  async expectSocialLinks(): Promise<void> {
    await expect(this.twitterLink).toHaveAttribute('href', /twitter|x\.com/);
    await expect(this.facebookLink).toHaveAttribute('href', /facebook/);
    await expect(this.linkedinLink).toHaveAttribute('href', /linkedin/);
  }

  async expectCopyright(): Promise<void> {
    // Don't assert the year (it changes); just confirm the brand text is present.
    await expect(this.copyright).toContainText('Sauce Labs');
  }
}
