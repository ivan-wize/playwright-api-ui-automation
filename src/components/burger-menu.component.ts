import { type Page, type Locator, expect } from '@playwright/test';

/**
 * The slide-out burger menu (Logout, Reset App State, All Items, About).
 * It's composed inside HeaderComponent, so tests reach it via header.menu.
 */
export class BurgerMenuComponent {
  readonly openButton: Locator;
  readonly closeButton: Locator;
  readonly allItemsLink: Locator;
  readonly aboutLink: Locator;
  readonly logoutLink: Locator;
  readonly resetLink: Locator;

  constructor(page: Page) {
    // The open/close buttons come from a third-party menu library (no data-test),
    // so we use their stable ids. The menu links do expose data-test.
    this.openButton = page.locator('#react-burger-menu-btn');
    this.closeButton = page.locator('#react-burger-cross-btn');
    this.allItemsLink = page.getByTestId('inventory-sidebar-link');
    this.aboutLink = page.getByTestId('about-sidebar-link');
    this.logoutLink = page.getByTestId('logout-sidebar-link');
    this.resetLink = page.getByTestId('reset-sidebar-link');
  }

  /**
   * Open the menu and wait for it to finish animating in.
   *
   * The links live in the DOM even while the menu is closed, just translated
   * off-screen, so a closed link still reports as "visible" — visibility is a
   * false-positive signal and a click on it fails with "element is outside of
   * the viewport". The reliable signal is whether the link is actually on-screen
   * (in the viewport). The open button is a toggle, and it can misbehave: a tap
   * may race (open then immediately re-close), or the menu library occasionally
   * reports the menu open while leaving the panel stuck off-screen. Both leave
   * the link off-screen, so we re-toggle until it is genuinely in the viewport
   * rather than trust a single click.
   */
  async open(): Promise<void> {
    await expect(async () => {
      if (!(await this.isOnScreen(this.logoutLink))) {
        await this.openButton.click();
      }
      await expect(this.logoutLink).toBeInViewport({ timeout: 2_000 });
    }).toPass({ timeout: 10_000 });
  }

  /** Whether the element's box currently intersects the viewport (no waiting). */
  private async isOnScreen(target: Locator): Promise<boolean> {
    return target
      .evaluate((el) => {
        const r = el.getBoundingClientRect();
        return (
          r.bottom > 0 && r.right > 0 && r.top < window.innerHeight && r.left < window.innerWidth
        );
      })
      .catch(() => false);
  }

  /**
   * Close the menu (idempotent) and wait for it to finish animating out.
   *
   * Mirrors the open path's raciness: the menu may already be closed (some link
   * clicks dismiss it), leaving the close button off-screen so a blind click on
   * it hangs. So we only click when the menu is actually open, then wait for the
   * slide-out, retrying until the links are genuinely off-screen.
   */
  async close(): Promise<void> {
    await expect(async () => {
      if (await this.isOnScreen(this.logoutLink)) {
        await this.closeButton.click();
      }
      await expect.poll(() => this.isOnScreen(this.logoutLink), { timeout: 2_000 }).toBe(false);
    }).toPass({ timeout: 10_000 });
  }

  /**
   * Open the menu and click one of its links.
   *
   * The slide animation is racy: the open button is a toggle (a tap can open
   * then immediately re-close), and the panel can pass through a transient
   * on-screen frame while actually animating closed. So a separate "is it open?"
   * check can succeed against an unsettled menu, and the click that follows then
   * lands on a closing, off-screen link and times out. Instead we retry
   * "ensure on-screen, then click" as a single unit until the click lands on a
   * settled link — the click's own actionability wait absorbs the animation.
   */
  private async openAndClick(link: Locator): Promise<void> {
    await expect(async () => {
      if (!(await this.isOnScreen(link))) {
        await this.openButton.click();
      }
      await link.click({ timeout: 2_000 });
    }).toPass({ timeout: 15_000 });
  }

  async logout(): Promise<void> {
    await this.openAndClick(this.logoutLink);
  }

  async resetAppState(): Promise<void> {
    await this.openAndClick(this.resetLink);
    // Reset App State doesn't navigate or close the menu, so close it ourselves.
    // Otherwise the still-open menu overlay intercepts later clicks (e.g. the
    // cart link). That's exactly what failed on the narrow mobile viewport.
    await this.close();
  }

  async goToAllItems(): Promise<void> {
    await this.openAndClick(this.allItemsLink);
  }
}
