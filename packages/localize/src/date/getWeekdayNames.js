import { normalizeIntlDate } from './normalizeIntlDate.js';

const weekdayNamesCache = {};

/**
 * @desc Return cached weekday names for locale for all styles ('long', 'short', 'narrow')
 * @param {string} locale locale
 * @returns {Object} like { long: ['Sunday', 'Monday'...], short: ['Sun', ...], narrow: ['S', ...] }
 */
function getCachedWeekdayNames(locale) {
  let weekdays = weekdayNamesCache[locale];

  if (weekdays) {
    return weekdays;
  }

  weekdayNamesCache[locale] = { long: [], short: [], narrow: [] };

  ['long', 'short', 'narrow'].forEach(style => {
    weekdays = weekdayNamesCache[locale][style];
    const formatter = new Intl.DateTimeFormat(locale, { weekday: style });

    const date = new Date('2019/04/07'); // start from Sunday
    for (let i = 0; i < 7; i += 1) {
      const weekday = formatter.format(date);
      const normalizedWeekday = normalizeIntlDate(weekday);
      weekdays.push(normalizedWeekday);
      date.setDate(date.getDate() + 1);
    }
  });

  return weekdayNamesCache[locale];
}

/**
 * @desc Returns weekday names for locale
 * @param {string} options.locale locale
 * @param {string} [options.style=long] long, short or narrow
 * @param {number} [options.firstDayOfWeek=0] 0 (Sunday), 1 (Monday), etc...
 * @returns {Array} like: ['Sunday', 'Monday', 'Tuesday', ...etc].
 */
export function getWeekdayNames({ locale, style = 'long', firstDayOfWeek = 0 } = {}) {
  const weekdays = getCachedWeekdayNames(locale)[style];
  const orderedWeekdays = [];
  for (let i = firstDayOfWeek; i < firstDayOfWeek + 7; i += 1) {
    orderedWeekdays.push(weekdays[i % 7]);
  }
  return orderedWeekdays;
}
