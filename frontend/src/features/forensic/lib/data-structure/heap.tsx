// frontend/src/features/forensic/lib/data-structure/heap.tsx
// eslint-disable-next-line import/no-extraneous-dependencies
import { MaxHeap } from '@datastructures-js/heap';
import { ForensicResult } from '../types';

// Number of maximum results to keep
const MAX_RESULTS = 100;

/**
 * Class to manage the best forensic results using a heap
 */
class ForensicResultsHeap {
  private heap: MaxHeap<ForensicResult>;

  private resultMap: Map<string, boolean>;

  constructor() {
    // Initialize MaxHeap that sorts by score (higher = better)
    this.heap = new MaxHeap<ForensicResult>((result) => result.score);
    this.resultMap = new Map<string, boolean>();
  }

  addResult(result: ForensicResult): boolean {
    if (this.resultMap.has(result.id)) {
      return false;
    }

    this.heap.insert(result);
    this.resultMap.set(result.id, true);

    if (this.heap.size() > MAX_RESULTS) {
      const removed = this.heap.extractRoot();
      if (removed) {
        this.resultMap.delete(removed.id);
      }
    }

    return true;
  }

  getBestResults(): ForensicResult[] {
    return this.heap.clone().sort();
  }

  size(): number {
    return this.heap.size();
  }

  clear(): void {
    this.heap.clear();
    this.resultMap.clear();
  }
}

const forensicResultsHeap = new ForensicResultsHeap();

export default forensicResultsHeap;
