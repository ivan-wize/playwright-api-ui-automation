import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { InventoryPage } from '../pages/inventory.page';
import { ProductDetailPage } from '../pages/product-detail.page';
import { CartPage } from '../pages/cart.page';
import { CheckoutInfoPage } from '../pages/checkout-info.page';
import { CheckoutOverviewPage } from '../pages/checkout-overview.page';
import { CheckoutCompletePage } from '../pages/checkout-complete.page';
import { FooterComponent } from '../components/footer.component';

/**
 * Custom Playwright test fixture: the single entry point every UI spec imports
 * from (`import { test, expect } from '.../pages.fixture'`). Page objects and the
 * shared footer are registered here once, so a spec just names the ones it needs
 * as arguments; Playwright builds a fresh instance per test, bound to that
 * test's `page`. `expect` is re-exported below so specs import both from here.
 */

type Fixtures = {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  productDetailPage: ProductDetailPage;
  cartPage: CartPage;
  checkoutInfoPage: CheckoutInfoPage;
  checkoutOverviewPage: CheckoutOverviewPage;
  checkoutCompletePage: CheckoutCompletePage;
  footer: FooterComponent;
};

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  inventoryPage: async ({ page }, use) => {
    await use(new InventoryPage(page));
  },
  productDetailPage: async ({ page }, use) => {
    await use(new ProductDetailPage(page));
  },
  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },
  checkoutInfoPage: async ({ page }, use) => {
    await use(new CheckoutInfoPage(page));
  },
  checkoutOverviewPage: async ({ page }, use) => {
    await use(new CheckoutOverviewPage(page));
  },
  checkoutCompletePage: async ({ page }, use) => {
    await use(new CheckoutCompletePage(page));
  },
  footer: async ({ page }, use) => {
    await use(new FooterComponent(page));
  },
});

export { expect } from '@playwright/test';
