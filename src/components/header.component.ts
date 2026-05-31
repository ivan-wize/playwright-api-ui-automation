import { type Page, type Locator, expect } from '@playwright/test';
import { BurgerMenuComponent } from './burger-menu.component';

/**
 * Shared header component (cart link/badge + burger menu).
 * Pages own an instance of this via composition, e.g. inventoryPage.header.
 */
export class HeaderComponent {
  readonly cartLink: Locator;
  readonly cartBadge: Locator;
  /** Slide-out burger menu (Logout, Reset App State, All Items, About). */
  readonly menu: BurgerMenuComponent;

  constructor(page: Page) {
    this.cartLink = page.getByTestId('shopping-cart-link');
    this.cartBadge = page.getByTestId('shopping-cart-badge');
    this.menu = new BurgerMenuComponent(page);
  }

  /** Go to the cart by clicking the cart icon. */
  async openCart(): Promise<void> {
    await this.cartLink.click();
  }

  /**
   * Assert the badge reflects the given count. SauceDemo removes the badge
   * entirely when the cart is empty, so a count of 0 means the badge is hidden.
   */
  async expectCartCount(count: number): Promise<void> {
    if (count === 0) {
      await expect(this.cartBadge).toBeHidden();
    } else {
      await expect(this.cartBadge).toHaveText(String(count));
    }
  }
}
