// src/utils/dateUtils.js

/**
 * Отримує дату понеділка для тижня, що містить задану дату.
 * @param {Date} date - Вхідна дата.
 * @returns {Date} - Дата понеділка (початок дня).
 */
export function getStartOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Нд, 1 = Пн, ..., 6 = Сб
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Корекція для неділі
  d.setDate(diff);
  d.setHours(0, 0, 0, 0); // Нормалізація до початку дня
  return d;
}

/**
 * Додає вказану кількість днів до дати.
 * @param {Date} date - Вхідна дата.
 * @param {number} days - Кількість днів для додавання (може бути від'ємною).
 * @returns {Date} - Нова дата.
 */
export function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Перевіряє, чи є дата сьогоднішньою.
 * @param {Date} date - Дата для перевірки.
 * @returns {boolean} - true, якщо дата сьогоднішня.
 */
export function isToday(date) {
  if (!date) return false;
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Перевіряє, чи дві дати є одним і тим же днем.
 * @param {Date} date1 - Перша дата.
 * @param {Date} date2 - Друга дата.
 * @returns {boolean} - true, якщо дати однакові.
 */
export function isSameDay(date1, date2) {
  if (!date1 || !date2) return false;
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
}

/**
 * Форматує назву дня тижня.
 * @param {Date} date - Дата.
 * @param {'short' | 'long' | 'narrow'} format - Формат ('short', 'long', 'narrow').
 * @param {string} locale - Локаль (наприклад, 'uk-UA' або 'en-US').
 * @returns {string} - Назва дня тижня.
 */
export function getDayName(date, format = "short", locale = "en-US") {
  const options = { weekday: format };
  let dayName = date.toLocaleDateString(locale, options);
  return dayName.charAt(0).toUpperCase() + dayName.slice(1);
}

/**
 * Форматує місяць та рік для заголовка тижневої смужки.
 * @param {Date} date - Дата (зазвичай початок тижня).
 * @param {string} locale - Локаль.
 * @returns {string} - Місяць та рік.
 */
export function getMonthYear(date, locale = "en-US") {
  const options = { month: "long", year: "numeric" };
  return date.toLocaleDateString(locale, options);
}

/**
 * Форматує діапазон дат тижня для заголовка.
 * @param {Date} startDate - Початок тижня (понеділок).
 * @returns {string} - Форматований діапазон, наприклад "20 - 26 May, 2024".
 */
export function formatWeekRange(startDate, locale = "en-US") {
  const endDate = addDays(startDate, 6);
  const startMonth = startDate.toLocaleDateString(locale, { month: "short" });
  const endMonth = endDate.toLocaleDateString(locale, { month: "short" });

  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();

  if (startYear !== endYear) {
    return `${startDate.getDate()} ${startMonth}, ${startYear} - ${endDate.getDate()} ${endMonth}, ${endYear}`;
  } else if (startMonth === endMonth) {
    return `${startDate.getDate()} - ${endDate.getDate()} ${startMonth}, ${startYear}`;
  } else {
    return `${startDate.getDate()} ${startMonth} - ${endDate.getDate()} ${endMonth}, ${startYear}`;
  }
}
