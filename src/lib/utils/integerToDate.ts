/**
 * Convert integer date (YYYYMMDD) back to Date object
 * @param integerDate - Integer date in YYYYMMDD format
 * @returns Date object
 * @example
 * // returns Date object for December 25, 2023
 * integerToDate(20231225)
 */
export function integerToDate(integerDate: number): Date {
  const dateString = String(integerDate);
  const year = parseInt(dateString.substring(0, 4), 10);
  const month = parseInt(dateString.substring(4, 6), 10) - 1; // Months are 0-indexed in JS
  const day = parseInt(dateString.substring(6, 8), 10);

  return new Date(year, month, day);
}
