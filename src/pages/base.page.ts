import { type Page, expect } from '@playwright/test';

/**
 * Base class shared by all page objects. Holds the Playwright Page and the
 * primitives every page reuses (navigation + a load assertion).
 */
export abstract class BasePage {
  /** Path appended to baseURL for this page, e.g. '/inventory.html'. */
  protected abstract readonly path: string;

  constructor(protected readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto(this.path);
  }

  /**
   * Default "am I on this page?" assertion: the URL ends with `path`. Pages with
   * a more reliable signal (a visible element, a query-string URL) override this.
   */
  async expectLoaded(): Promise<void> {
    // Escape every regex metacharacter in the path (not just dots) and anchor to
    // the end of the URL.
    const escaped = this.path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    await expect(this.page).toHaveURL(new RegExp(`${escaped}$`));
  }
}
