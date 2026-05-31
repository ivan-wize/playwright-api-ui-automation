/**
 * Checkout step one (customer information). Covers the happy path plus the three
 * required-field validations, which protect the user from submitting an order
 * with missing shipping details. SauceDemo validates one field at a time and
 * surfaces only the first missing field, so each negative test omits exactly one
 * field to pin the specific error message.
 */
import { test, expect } from '../../src/fixtures/pages.fixture';
import { products } from '../../src/data/products';
import { validCheckoutInfo } from '../../src/data/checkout.data';

const CHECKOUT_ERRORS = {
  firstNameRequired: 'Error: First Name is required',
  lastNameRequired: 'Error: Last Name is required',
  postalCodeRequired: 'Error: Postal Code is required',
} as const;

test.describe('Checkout: customer information', () => {
  // Reach step one the way a user would: add an item, open the cart, check out.
  test.beforeEach(async ({ inventoryPage, cartPage, checkoutInfoPage }) => {
    await inventoryPage.goto();
    await inventoryPage.addToCart(products.backpack.name);
    await inventoryPage.header.openCart();
    await cartPage.checkout();
    await checkoutInfoPage.expectLoaded();
  });

  test('valid information advances to the overview step', async ({ checkoutInfoPage, page }) => {
    await checkoutInfoPage.submit(validCheckoutInfo);
    await expect(page).toHaveURL(/checkout-step-two\.html$/);
  });

  test('missing first name is rejected', async ({ checkoutInfoPage }) => {
    await checkoutInfoPage.fillInfo({
      lastName: validCheckoutInfo.lastName,
      postalCode: validCheckoutInfo.postalCode,
    });
    await checkoutInfoPage.continue();
    await checkoutInfoPage.expectError(CHECKOUT_ERRORS.firstNameRequired);
  });

  test('missing last name is rejected', async ({ checkoutInfoPage }) => {
    await checkoutInfoPage.fillInfo({
      firstName: validCheckoutInfo.firstName,
      postalCode: validCheckoutInfo.postalCode,
    });
    await checkoutInfoPage.continue();
    await checkoutInfoPage.expectError(CHECKOUT_ERRORS.lastNameRequired);
  });

  test('missing postal code is rejected', async ({ checkoutInfoPage }) => {
    await checkoutInfoPage.fillInfo({
      firstName: validCheckoutInfo.firstName,
      lastName: validCheckoutInfo.lastName,
    });
    await checkoutInfoPage.continue();
    await checkoutInfoPage.expectError(CHECKOUT_ERRORS.postalCodeRequired);
  });

  test('cancel returns to the cart', async ({ checkoutInfoPage, cartPage }) => {
    // On step one, Cancel goes back to the cart (on step two it goes to inventory).
    await checkoutInfoPage.cancel();
    await cartPage.expectLoaded();
  });
});
