import { DateTime } from 'luxon';

export interface DateRange {
  start: DateTime;
  end: DateTime;
}

export const dateUtils = {
  /**
   * Get a date range for the last N minutes
   */
  getLastMinutes(minutes: number): DateRange {
    const end = DateTime.now();
    const start = end.minus({ minutes });
    return { start, end };
  },

  /**
   * Get a date range for the last N hours
   */
  getLastHours(hours: number): DateRange {
    const end = DateTime.now();
    const start = end.minus({ hours });
    return { start, end };
  },

  /**
   * Format a date for display in logs or UI
   */
  formatDateTime(date: DateTime | string): string {
    const dt = typeof date === 'string' ? DateTime.fromISO(date) : date;
    return dt.toFormat('yyyy-MM-dd HH:mm:ss');
  },

  /**
   * Check if a date is within a specific range
   */
  isDateInRange(date: DateTime, range: DateRange): boolean {
    return date >= range.start && date <= range.end;
  },

  /**
   * Get a human-readable duration
   */
  getHumanDuration(start: DateTime, end: DateTime): string {
    const diff = end.diff(start, ['hours', 'minutes', 'seconds']).toObject();
    const parts = [];

    if (diff.hours) parts.push(`${Math.floor(diff.hours)}h`);
    if (diff.minutes) parts.push(`${Math.floor(diff.minutes)}m`);
    if (diff.seconds) parts.push(`${Math.floor(diff.seconds)}s`);

    return parts.join(' ');
  },

  /**
   * Convert a duration in milliseconds to a readable format
   */
  formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  },
};
