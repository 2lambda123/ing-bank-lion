import { getDecimalSeparator } from '@lion/localize';

/**
 * Determines the best possible parsing mode.
 *
 * Parsemode depends mostely on the last 4 chars.
 * - 1234 => xxx1234 (heuristic)
 * - 1,23 => xxx1.23 (heuristic)
 * - [space]123 => xxx123 (heuristic)
 * - ,123 => unclear
 *   - if 1.000,123 (we find a different separator) => 1000.123 (heuristic)
 *   - if 1,000,123 (we find only same separators) => 1000123 (unparseable)
 *   - if 100,123 (we find no more separators) => unclear
 *     - if en => 100123 (withLocale)
 *     - if nl => 100.123 (withLocale)
 *
 * See also {@link parseAmount}
 *
 * @example
 * getParseMode('1.234') => 'withLocale'
 *
 * @param {string} value Clean number (only [0-9 ,.]) to be parsed
 * @return {string} unparseable|withLocale|heuristic
 */
function getParseMode(value) {
  const nonDigits = value.match(/[^0-9]/g);

  // If there are separators, and they are all the same char... use locale
  if (nonDigits && nonDigits.every(v => v === nonDigits[0])) {
    return 'withLocale';
  }
  return 'heuristic';
}

/**
 * Parses numbers by considering the locale.
 * Useful for numbers with an ending pair of 3 number chars as in this case you can not be
 * certain if it is a group or comma separator. e.g. 1.234; 1,234; 1234.567;
 * Taking into consideration the locale we make the best possible assumption.
 *
 * @example
 * parseWithLocale('1.234', { locale: 'en-GB' }) => 1.234
 * parseWithLocale('1,234', { locale: 'en-GB' }) => 1234
 *
 * @param {string} value Number to be parsed
 * @param {object} options Locale Options
 */
function parseWithLocale(value, options) {
  const locale = options && options.locale ? options.locale : null;
  const separator = getDecimalSeparator(locale);
  const regexNumberAndLocaleSeparator = new RegExp(`[0-9${separator}-]`, 'g');
  let numberAndLocaleSeparator = value.match(regexNumberAndLocaleSeparator).join('');
  if (separator === ',') {
    numberAndLocaleSeparator = numberAndLocaleSeparator.replace(',', '.');
  }
  return parseFloat(numberAndLocaleSeparator);
}

/**
 * Parses numbers by considering all separators.
 * It only keeps the last separator and uses it as decimal separator.
 *
 * Warning: This function works only with numbers that can be heuristically parsed.
 *
 * @param {string} value Number that can be heuristically parsed
 * @return {float} parsed javascript number
 */
function parseHeuristic(value) {
  if (value.match(/[0-9., ]/g)) {
    // 1. put placeholder at decimal separator
    const numberString = value
      .replace(/(,|\.)([^,|.]*)$/g, '_decSep_$2')
      .replace(/(,|\.| )/g, '') // 2. remove all thousand separators
      .replace(/_decSep_/, '.'); // 3. restore decimal separator
    return parseFloat(numberString);
  }
  return 0;
}

/**
 * Parses a number string and returns the best possible javascript number.
 * For edge cases it may use locale to give the best possible assumption.
 *
 * It has 3 "methods" of returning numbers
 * - 'unparseable': becomes just numbers
 * - 'withLocale': result depends on given or global locale
 * - 'heuristic': result depends on considering separators
 *
 * @example
 * parseAmount('1.234.567'); // method: unparseable => 1234567
 * parseAmount('1.234'); // method: withLocale => depending on locale 1234 or 1.234
 * parseAmount('1.234,56'); // method: heuristic => 1234.56
 * parseAmount('1 234.56'); // method: heuristic => 1234.56
 * parseAmount('1,234.56'); // method: heuristic => 1234.56
 *
 * @param {string} value Number to be parsed
 * @param {object} options Locale Options
 */
export function parseAmount(value, options) {
  const containsNumbers = value.match(/\d/g);
  if (!containsNumbers) {
    return undefined;
  }
  const matchedInput = value.match(/[0-9,.\- ]/g);
  if (!matchedInput) {
    return undefined;
  }
  const cleanedInput = matchedInput.join('');
  const parseMode = getParseMode(cleanedInput);
  switch (parseMode) {
    case 'unparseable':
      return parseFloat(cleanedInput.match(/[0-9]/g).join(''));
    case 'withLocale':
      return parseWithLocale(cleanedInput, options);
    case 'heuristic':
      return parseHeuristic(cleanedInput);
    default:
      return 0;
  }
}
