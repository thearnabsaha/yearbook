/**
 * Date Utility Functions for PixelForge
 * Ensures 100% accurate local calendar dates without UTC timezone shift bugs.
 */

export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getLocalTodayString(): string {
  return formatLocalDate(new Date());
}

export function parseLocalDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  const parts = dateStr.split('-');
  const y = parseInt(parts[0], 10) || new Date().getFullYear();
  const m = parseInt(parts[1], 10) || 1;
  const d = parseInt(parts[2], 10) || 1;
  // Noon (12:00:00) avoids DST edge-cases in local timezone
  return new Date(y, m - 1, d, 12, 0, 0);
}

export function formatDisplayDate(
  dateStr: string,
  options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }
): string {
  if (!dateStr) return '';
  const date = parseLocalDate(dateStr);
  return date.toLocaleDateString(undefined, options);
}
