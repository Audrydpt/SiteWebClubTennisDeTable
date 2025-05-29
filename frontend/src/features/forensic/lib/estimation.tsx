import { DateTime } from 'luxon';
import { SourceProgress } from './types';

/**
 * Formats a time duration in milliseconds into a human-readable string
 */
export function formatTimeRemaining(timeMs: number): string {
  if (timeMs < 60000) {
    return "moins d'une minute";
  }
  if (timeMs < 3600000) {
    const minutes = Math.ceil(timeMs / 60000);
    return `environ ${minutes} minute${minutes > 1 ? 's' : ''}`;
  }
  const hours = Math.floor(timeMs / 3600000);
  const minutes = Math.ceil((timeMs % 3600000) / 60000);
  return `environ ${hours} heure${hours > 1 ? 's' : ''}${
    minutes > 0 ? ` et ${minutes} minute${minutes > 1 ? 's' : ''}` : ''
  }`;
}

/**
 * Safely converts a Date or string to UTC timestamp in milliseconds
 */
function toUtcTimestamp(dateInput: Date | string): number {
  // If it's already a Date object, assume it's in the correct timezone
  if (dateInput instanceof Date) {
    return dateInput.getTime();
  }

  // If it's a string, parse it as UTC (API dates are in UTC)
  const dt = DateTime.fromISO(dateInput, { zone: 'utc' });
  if (!dt.isValid) {
    throw new Error(`Invalid date format: ${dateInput}`);
  }

  return dt.toMillis();
}

/**
 * Gets current UTC timestamp in milliseconds
 */
function getCurrentUtcTimestamp(): number {
  return DateTime.utc().toMillis();
}

/**
 * Calculates estimated time remaining for a single source using linear interpolation
 */
function calculateSourceETA(
  progress: number,
  startTime: Date | string
): number | null {
  if (progress <= 0 || progress >= 100) {
    return null;
  }

  const startTimeMs = toUtcTimestamp(startTime);
  const currentTimeMs = getCurrentUtcTimestamp();
  const elapsedTime = currentTimeMs - startTimeMs;

  // Need at least 5 seconds elapsed for reliable estimation
  if (elapsedTime <= 5000) {
    return null;
  }

  const remainingProgress = 100 - progress;
  const progressRate = progress / elapsedTime;
  const remainingTime = remainingProgress / progressRate;

  return remainingTime > 0 ? remainingTime : null;
}

/**
 * Estimates combined completion time using simple heuristics
 */
function estimateCombinedCompletion(
  sourcesProgress: SourceProgress[]
): number | null {
  const activeSources = sourcesProgress.filter(
    (s) => s.progress > 0 && s.progress < 100
  );
  const pendingSources = sourcesProgress.filter((s) => s.progress === 0);

  if (activeSources.length === 0 && pendingSources.length === 0) {
    return null;
  }

  // Calculate ETAs for active sources
  const activeETAs: number[] = [];
  activeSources.forEach((source) => {
    if (source.startTime) {
      const eta = calculateSourceETA(source.progress, source.startTime);
      if (eta) {
        activeETAs.push(eta);
      }
    }
  });

  if (activeETAs.length === 0 && pendingSources.length > 0) {
    return null; // Can't estimate without active sources
  }

  // Simple estimation: longest active source + time for pending sources
  const longestActiveETA = activeETAs.length > 0 ? Math.max(...activeETAs) : 0;

  if (pendingSources.length === 0) {
    return longestActiveETA;
  }

  // Estimate pending sources based on average rate of active sources
  const currentTimeMs = getCurrentUtcTimestamp();
  const averageRate =
    activeSources.reduce((sum, source) => {
      if (!source.startTime) return sum;
      const startTimeMs = toUtcTimestamp(source.startTime);
      const elapsedTime = currentTimeMs - startTimeMs;
      return sum + source.progress / elapsedTime;
    }, 0) / activeSources.length;

  const pendingEstimate = pendingSources.length * (100 / averageRate);

  return longestActiveETA + pendingEstimate;
}

/**
 * Calculates the estimated time remaining for each source and for the combined search
 */
export function calculateTimeRemaining(sourcesProgress: SourceProgress[]): {
  combined: string | null;
  individual: Record<string, string | null>;
} {
  if (sourcesProgress.length === 0) {
    return { combined: null, individual: {} };
  }

  // Calculate individual times
  const individual: Record<string, string | null> = {};
  sourcesProgress.forEach((source) => {
    if (source.progress <= 0 || source.progress >= 100 || !source.startTime) {
      individual[source.sourceId] = null;
      return;
    }

    const remainingMs = calculateSourceETA(source.progress, source.startTime);
    individual[source.sourceId] = remainingMs
      ? formatTimeRemaining(remainingMs)
      : null;
  });

  // Calculate combined estimate
  const combinedRemainingMs = estimateCombinedCompletion(sourcesProgress);
  const combined = combinedRemainingMs
    ? formatTimeRemaining(combinedRemainingMs)
    : null;

  return { combined, individual };
}
