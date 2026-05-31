/** SauceDemo applies a flat 8% sales tax at checkout. */
export const TAX_RATE = 0.08;

/**
 * Round to whole cents. Money math in JS drifts (e.g. 39.98 + 3.2 may not be
 * exactly 43.18), so we normalize to 2 decimals before comparing.
 */
export function roundToCents(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/** Sum a list of prices, rounded to cents. */
export function sum(prices: number[]): number {
  return roundToCents(prices.reduce((acc, price) => acc + price, 0));
}

/** Tax on a subtotal (8%), rounded to cents. */
export function tax(subtotal: number): number {
  return roundToCents(subtotal * TAX_RATE);
}

/** Grand total = subtotal + tax, rounded to cents. */
export function total(subtotal: number): number {
  return roundToCents(subtotal + tax(subtotal));
}

/**
 * Pull a dollar amount out of a label like "Item total: $39.98" -> 39.98.
 * Handles optional thousands separators ("$1,234.56" -> 1234.56). Throws when no
 * $-amount is present so a missing/blank label fails loudly instead of silently
 * parsing to 0/NaN.
 */
export function parseMoney(text: string): number {
  const match = text.match(/\$(\d{1,3}(?:,\d{3})*|\d+)(?:\.(\d{1,2}))?/);
  if (!match) {
    throw new Error(`No dollar amount found in: "${text}"`);
  }
  const dollars = match[1].replace(/,/g, '');
  const cents = match[2] ?? '0';
  return Number(`${dollars}.${cents}`);
}

/** parseMoney over a list of labels (e.g. every cart-line price). */
export function parseMoneyList(texts: string[]): number[] {
  return texts.map(parseMoney);
}
