/** Customer details for the checkout information form. */
export type CheckoutInfo = {
  firstName: string;
  lastName: string;
  postalCode: string;
};

export const validCheckoutInfo: CheckoutInfo = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  postalCode: '94016',
};
