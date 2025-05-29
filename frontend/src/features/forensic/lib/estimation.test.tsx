import { describe, expect, it, vi } from 'vitest';

import { calculateTimeRemaining, formatTimeRemaining } from './estimation';
import { SourceProgress } from './types';

// Mock Date.now for consistent testing
const mockNow = 1000000; // Fixed timestamp
vi.spyOn(Date, 'now').mockReturnValue(mockNow);

describe('formatTimeRemaining', () => {
  it('should format time less than 1 minute', () => {
    expect(formatTimeRemaining(30000)).toBe("moins d'une minute");
  });

  it('should format time in minutes', () => {
    expect(formatTimeRemaining(120000)).toBe('environ 2 minutes');
    expect(formatTimeRemaining(60000)).toBe('environ 1 minute');
  });

  it('should format time in hours and minutes', () => {
    expect(formatTimeRemaining(3660000)).toBe('environ 1 heure et 1 minute');
    expect(formatTimeRemaining(7200000)).toBe('environ 2 heures');
  });
});

describe('calculateTimeRemaining', () => {
  const createMockSource = (
    sourceId: string,
    progress: number,
    startTime?: Date
  ): SourceProgress => ({
    sourceId,
    progress,
    timestamp: new Date(mockNow),
    startTime,
  });

  describe('Individual source estimation', () => {
    it('should calculate individual ETA for active sources', () => {
      const startTime = new Date(mockNow - 60000); // Started 1 minute ago
      const sources: SourceProgress[] = [
        createMockSource('source1', 50, startTime), // 50% in 1 minute = 1 minute remaining
      ];

      const result = calculateTimeRemaining(sources);

      expect(result.individual.source1).toBe("moins d'une minute");
    });

    it('should return null for completed sources', () => {
      const sources: SourceProgress[] = [
        createMockSource('source1', 100, new Date(mockNow - 60000)),
      ];

      const result = calculateTimeRemaining(sources);

      expect(result.individual.source1).toBeNull();
    });

    it('should return null for pending sources', () => {
      const sources: SourceProgress[] = [createMockSource('source1', 0)];

      const result = calculateTimeRemaining(sources);

      expect(result.individual.source1).toBeNull();
    });

    it('should return null for sources without start time', () => {
      const sources: SourceProgress[] = [createMockSource('source1', 50)];

      const result = calculateTimeRemaining(sources);

      expect(result.individual.source1).toBeNull();
    });
  });

  describe('Combined estimation with concurrent processing', () => {
    it('should handle 2 active sources (within worker limit)', () => {
      const startTime1 = new Date(mockNow - 60000); // 50% in 1 minute = 1 minute remaining
      const startTime2 = new Date(mockNow - 30000); // 25% in 30 seconds = 1.5 minutes remaining

      const sources: SourceProgress[] = [
        createMockSource('source1', 50, startTime1),
        createMockSource('source2', 25, startTime2),
      ];

      const result = calculateTimeRemaining(sources);

      // Should finish when the slowest worker finishes (source2 at ~1.5 minutes)
      expect(result.combined).toBe('environ 2 minutes');
    });

    it('should handle more sources than workers (queue scenario)', () => {
      const startTime = new Date(mockNow - 60000); // All started 1 minute ago

      const sources: SourceProgress[] = [
        createMockSource('source1', 50, startTime), // 1 minute remaining
        createMockSource('source2', 75, startTime), // 20 seconds remaining
        createMockSource('source3', 0), // Pending
        createMockSource('source4', 0), // Pending
      ];

      const result = calculateTimeRemaining(sources);

      // Should account for sequential processing of pending sources
      expect(result.combined).toBeTruthy();
      expect(result.individual.source1).toBe("moins d'une minute");
      expect(result.individual.source2).toBe("moins d'une minute");
      expect(result.individual.source3).toBeNull();
      expect(result.individual.source4).toBeNull();
    });

    it('should handle mixed active and pending sources', () => {
      const startTime = new Date(mockNow - 30000); // Started 30 seconds ago

      const sources: SourceProgress[] = [
        createMockSource('source1', 25, startTime), // 25% in 30s = 1.5 minutes remaining
        createMockSource('source2', 0), // Pending
      ];

      const result = calculateTimeRemaining(sources);

      expect(result.combined).toBeTruthy();
      expect(result.individual.source1).toBe('environ 2 minutes');
      expect(result.individual.source2).toBeNull();
    });

    it('should return null when all sources are completed', () => {
      const sources: SourceProgress[] = [
        createMockSource('source1', 100, new Date(mockNow - 60000)),
        createMockSource('source2', 100, new Date(mockNow - 30000)),
      ];

      const result = calculateTimeRemaining(sources);

      expect(result.combined).toBeNull();
      expect(result.individual.source1).toBeNull();
      expect(result.individual.source2).toBeNull();
    });

    it('should handle empty sources array', () => {
      const result = calculateTimeRemaining([]);

      expect(result.combined).toBeNull();
      expect(Object.keys(result.individual)).toHaveLength(0);
    });

    it('should handle only pending sources', () => {
      const sources: SourceProgress[] = [
        createMockSource('source1', 0),
        createMockSource('source2', 0),
      ];

      const result = calculateTimeRemaining(sources);

      // Should return null for combined since no active sources to estimate rate
      expect(result.combined).toBeNull();
      expect(result.individual.source1).toBeNull();
      expect(result.individual.source2).toBeNull();
    });
  });

  describe('Edge cases', () => {
    it('should handle sources with very slow progress', () => {
      const startTime = new Date(mockNow - 3600000); // Started 1 hour ago
      const sources: SourceProgress[] = [
        createMockSource('source1', 1, startTime), // 1% in 1 hour = very slow
      ];

      const result = calculateTimeRemaining(sources);

      expect(result.individual.source1).toBeTruthy();
      expect(result.combined).toBeTruthy();
    });

    it('should handle sources with different speeds', () => {
      const sources: SourceProgress[] = [
        createMockSource('source1', 80, new Date(mockNow - 60000)), // Fast: 80% in 1 minute
        createMockSource('source2', 20, new Date(mockNow - 60000)), // Slow: 20% in 1 minute
      ];

      const result = calculateTimeRemaining(sources);

      expect(result.individual.source1).toBe("moins d'une minute"); // ~15 seconds
      expect(result.individual.source2).toBe('environ 4 minutes'); // ~4 minutes
      expect(result.combined).toBe('environ 4 minutes'); // Limited by slowest
    });
  });
});
