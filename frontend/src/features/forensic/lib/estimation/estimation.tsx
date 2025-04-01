// frontend/src/features/forensic/lib/estimation/estimation.tsx
import { SourceProgress } from '../types';

/**
 * Formats a time duration in milliseconds into a human-readable string
 */
export function formatTimeRemaining(timeMs: number): string {
  // Keep formatting function unchanged
  if (timeMs < 60000) {
    return "moins d'une minute";
  }
  if (timeMs < 3600000) {
    const minutes = Math.ceil(timeMs / 60000);
    return `environ ${minutes} minute${minutes > 1 ? 's' : ''}`;
  }
  const hours = Math.floor(timeMs / 3600000);
  const minutes = Math.ceil((timeMs % 3600000) / 60000);
  return `environ ${hours} heure${hours > 1 ? 's' : ''} ${
    minutes > 0 ? `et ${minutes} minute${minutes > 1 ? 's' : ''}` : ''
  }`;
}

/**
 * Calculates the estimated time remaining for each source and for the combined search
 * Uses the progress rate from the first 2% to estimate the total time
 */
// frontend/src/features/forensic/lib/estimation/estimation.tsx
export function calculateTimeRemaining(sourcesProgress: SourceProgress[]): {
  combined: string | null;
  individual: Record<string, string | null>;
} {
  console.log('calculateTimeRemaining called with:', sourcesProgress);

  // Filter sources that have progress > 0 but < 100
  const activeSources = sourcesProgress.filter(
    (source) => source.progress > 0 && source.progress < 100
  );

  console.log('Active sources:', activeSources);

  const result = {
    combined: null as string | null,
    individual: {} as Record<string, string | null>,
  };

  if (activeSources.length === 0) {
    return result;
  }

  // Set threshold for early estimation
  const ESTIMATE_THRESHOLD = 2; // 2%

  // Calculate individual times
  activeSources.forEach((source) => {
    console.log(`Processing source ${source.sourceId}:`, source);

    // Check if source has no progress
    if (source.progress <= 0) {
      console.log(`Source ${source.sourceId} has no valid progress`);
      result.individual[source.sourceId] = null;
      return;
    }

    // Get effective start time (use current time if not available)
    const effectiveStartTime = source.startTime
      ? new Date(source.startTime).getTime()
      : Date.now();

    console.log(
      `Source ${source.sourceId} has ${source.startTime ? 'a valid' : 'no'} startTime`
    );

    // Calculate elapsed time since source started
    const now = Date.now();
    const elapsedMs = now - effectiveStartTime;

    console.log(
      `Source ${source.sourceId} - elapsed time: ${elapsedMs}ms, progress: ${source.progress}%`
    );

    // Skip if elapsed time is too small or invalid
    if (elapsedMs <= 0) {
      console.log(`Source ${source.sourceId} has invalid elapsed time`);
      result.individual[source.sourceId] = null;
      return;
    }

    // If we haven't reached 2% yet, show "calcul en cours..."
    if (source.progress < ESTIMATE_THRESHOLD) {
      console.log(
        `Source ${source.sourceId} below threshold (${ESTIMATE_THRESHOLD}%)`
      );
      result.individual[source.sourceId] = 'calcul en cours...';
      return;
    }

    // Calculate time taken to reach 2%
    const timeForThresholdMs =
      (elapsedMs / source.progress) * ESTIMATE_THRESHOLD;

    // Multiply by 50 to get the total time (100% / 2% = 50)
    const estimatedTotalTimeMs = timeForThresholdMs * 50;

    // Calculate remaining time
    const remainingMs = estimatedTotalTimeMs - elapsedMs;

    console.log(
      `Source ${source.sourceId} - estimated total: ${estimatedTotalTimeMs}ms, remaining: ${remainingMs}ms`
    );

    if (remainingMs > 0) {
      result.individual[source.sourceId] = formatTimeRemaining(remainingMs);
    } else {
      result.individual[source.sourceId] = null;
    }
  });

  // Calculate combined estimate based on the first source that reached 2%
  const sourcesAboveThreshold = activeSources.filter(
    (source) => source.progress >= ESTIMATE_THRESHOLD && source.startTime
  );

  console.log('Sources above threshold:', sourcesAboveThreshold);

  if (sourcesAboveThreshold.length > 0) {
    // Use the first source that passed the threshold as reference
    const referenceSource = sourcesAboveThreshold[0];
    console.log('Using reference source:', referenceSource);

    // Get startTime safely
    if (!referenceSource.startTime) {
      console.log(
        'Reference source has no startTime, cannot calculate combined estimate'
      );
      result.combined = 'calcul en cours...';
      return result;
    }

    const startTime = new Date(referenceSource.startTime).getTime();
    const elapsedMs = Date.now() - startTime;
    console.log(
      `Reference source - elapsed time: ${elapsedMs}ms, progress: ${referenceSource.progress}%`
    );

    // Calculate time to reach 2%
    const timeForThresholdMs =
      (elapsedMs / referenceSource.progress) * ESTIMATE_THRESHOLD;
    console.log(`Time for threshold: ${timeForThresholdMs}ms`);

    // Calculate total time for a single source (2% * 50 = 100%)
    const singleSourceEstimatedTotalMs = timeForThresholdMs * 50;
    console.log(
      `Single source estimated total: ${singleSourceEstimatedTotalMs}ms`
    );

    // Multiply by the number of active sources to get global estimate
    const totalSourcesCount = activeSources.length;
    const globalEstimatedTotalMs =
      singleSourceEstimatedTotalMs * totalSourcesCount;
    console.log(
      `Global estimated total: ${globalEstimatedTotalMs}ms, sources: ${totalSourcesCount}`
    );

    // Calculate what percentage of total work is done across all sources
    const averageProgress =
      activeSources.reduce((sum, source) => sum + source.progress, 0) /
      totalSourcesCount;
    console.log(`Average progress: ${averageProgress}%`);

    // Calculate remaining time based on average progress
    const percentComplete = averageProgress / 100;
    const globalRemainingMs = globalEstimatedTotalMs * (1 - percentComplete);
    console.log(`Global remaining: ${globalRemainingMs}ms`);

    if (globalRemainingMs > 0) {
      result.combined = formatTimeRemaining(globalRemainingMs);
      console.log(`Formatted global remaining time: ${result.combined}`);
    }
  } else {
    console.log("No sources above threshold, displaying 'calcul en cours...'");
    result.combined = 'calcul en cours...';
  }

  console.log('Final result:', result);
  return result;
}
