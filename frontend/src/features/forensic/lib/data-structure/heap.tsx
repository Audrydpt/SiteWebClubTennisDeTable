import { MinHeap } from '@datastructures-js/heap';

import { ForensicResult } from '../types';

// Number of maximum results to keep
const MAX_RESULTS = 100;

class ForensicResultsHeap {
  private minHeap: MinHeap<ForensicResult>;

  private resultMap: Map<string, boolean>;

  constructor() {
    // the lowest scoring result is always at the root
    this.minHeap = new MinHeap<ForensicResult>((result) => result.score);
    this.resultMap = new Map<string, boolean>();
  }

  addResult(result: ForensicResult): boolean {
    // Avoid duplicates
    if (this.resultMap.has(result.id)) {
      return false;
    }

    // If we haven't reached capacity yet, simply add the new result
    if (this.minHeap.size() < MAX_RESULTS) {
      this.minHeap.insert(result);
      this.resultMap.set(result.id, true);
      return true;
    }

    // We're at capacity - the root of min heap is always the lowest scoring result
    const lowestResult = this.minHeap.root();

    // If the new result doesn't beat our lowest score, reject it
    if (!lowestResult || result.score <= lowestResult.score) {
      return false;
    }

    // Remove the lowest scoring result from tracking
    this.resultMap.delete(lowestResult.id);

    // Extract root (removes lowest scoring result)
    this.minHeap.extractRoot();

    // Add the new result
    this.minHeap.insert(result);
    this.resultMap.set(result.id, true);

    return true;
  }

  getBestResults(): ForensicResult[] {
    // Convert to array and sort by score in descending order
    const results: ForensicResult[] = [];
    const tempHeap = this.minHeap.clone();

    while (!tempHeap.isEmpty()) {
      const item = tempHeap.extractRoot();
      if (item) {
        results.push(item);
      }
    }

    // Sort in descending order (highest score first)
    return results.sort((a, b) => b.score - a.score);
  }

  clear(): void {
    this.minHeap.clear();
    this.resultMap.clear();
  }
}

const forensicResultsHeap = new ForensicResultsHeap();

export default forensicResultsHeap;
