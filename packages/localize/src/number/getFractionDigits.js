import { formatNumberToParts } from './formatNumberToParts.js';

/**
 * @example
 * getFractionDigits('JOD'); // return 3
 *
 * @param {string} currency Currency code e.g. EUR
 * @return {number} fraction for the given currency
 */
export function getFractionDigits(currency = 'EUR') {
  const parts = formatNumberToParts(123, {
    style: 'currency',
    currency,
  });
  const [fractionPart] = parts.filter(part => part.type === 'fraction');
  return fractionPart ? fractionPart.value.length : 0;
}
