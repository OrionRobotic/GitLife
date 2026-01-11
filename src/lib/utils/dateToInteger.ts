/**
 * Convert a Date object to integer format (YYYYMMDD)
 * @param date - Date object to convert
 * @returns Integer representation of the date (YYYYMMDD)
 * @example
 * // returns 20231225 for December 25, 2023
 * dateToInteger(new Date(2023, 11, 25))
 */
export function dateToInteger(date: Date): number {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
  const day = String(date.getDate()).padStart(2, "0");

  return parseInt(`${year}${month}${day}`, 10);
}
