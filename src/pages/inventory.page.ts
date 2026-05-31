import { type Page, type Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';
import { HeaderComponent } from '../components/header.component';
import { parseMoneyList } from '../utils/money';

/**
 * The values SauceDemo's sort dropdown accepts (the <option> `value`s).
 * Exported so specs can refer to SortOption.PriceLowToHigh instead of 'lohi'.
 */
export const SortOption = {
  NameAToZ: 'az',
  NameZToA: 'za',
  PriceLowToHigh: 'lohi',
  PriceHighToLow: 'hilo',
} as const;
export type SortOption = (typeof SortOption)[keyof typeof SortOption];

/**
 * Page object for the products listing (the landing page after login). Covers
 * the catalog itself: add/remove from a card, open a product's detail page,
 * sort, and read the on-screen names/prices used to verify ordering. Cart-badge
 * and menu interactions live on the shared `header`.
 */
export class InventoryPage extends BasePage {
  protected readonly path = '/inventory.html';

  /** Shared header (cart badge/link, menu trigger). */
  readonly header: HeaderComponent;

  readonly title: Locator;
  readonly items: Locator;
  readonly itemNames: Locator;
  readonly itemPrices: Locator;
  readonly addToCartButtons: Locator;
  readonly sortDropdown: Locator;

  constructor(page: Page) {
    super(page);
    this.header = new HeaderComponent(page);
    this.title = page.getByTestId('title');
    this.items = page.getByTestId('inventory-item');
    this.itemNames = page.getByTestId('inventory-item-name');
    this.itemPrices = page.getByTestId('inventory-item-price');
    // Before anything is added, every product's button reads "Add to cart".
    this.addToCartButtons = page.getByRole('button', { name: 'Add to cart' });
    this.sortDropdown = page.getByTestId('product-sort-container');
  }

  override async expectLoaded(): Promise<void> {
    await super.expectLoaded(); // URL ends with /inventory.html
    await expect(this.title).toHaveText('Products');
  }

  /** Scope to a single product card by its (catalog-unique) name. */
  private itemByName(name: string): Locator {
    return this.items.filter({ hasText: name });
  }

  async addToCart(productName: string): Promise<void> {
    await this.itemByName(productName).getByRole('button', { name: 'Add to cart' }).click();
  }

  async removeFromCart(productName: string): Promise<void> {
    // After adding, that card's button toggles from "Add to cart" to "Remove".
    await this.itemByName(productName).getByRole('button', { name: 'Remove' }).click();
  }

  /** Open a product's detail page by clicking its name. */
  async openProduct(productName: string): Promise<void> {
    await this.itemByName(productName).getByTestId('inventory-item-name').click();
  }

  async sortBy(option: SortOption): Promise<void> {
    await this.sortDropdown.selectOption(option);
  }

  /** Product names in their current on-screen order. */
  async getProductNames(): Promise<string[]> {
    return this.itemNames.allTextContents();
  }

  /** Product prices as numbers, in their current on-screen order. */
  async getProductPrices(): Promise<number[]> {
    return parseMoneyList(await this.itemPrices.allTextContents());
  }
}
