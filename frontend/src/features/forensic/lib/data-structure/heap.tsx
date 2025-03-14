/* eslint-disable */
import { MaxHeap } from '@datastructures-js/heap';
import { ForensicResult } from '../types';

// Number of maximum results to keep
const MAX_RESULTS = 50;

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
    // Avoid duplicates
    if (this.resultMap.has(result.id)) {
      return false;
    }

    // If we haven't reached capacity yet, simply add the new result
    if (this.heap.size() < MAX_RESULTS) {
      this.heap.insert(result);
      this.resultMap.set(result.id, true);
      return true;
    }

    // We're at capacity - need to check if new result is better than our worst one
    // Extract all results and find the lowest score
    const allResults: ForensicResult[] = [];
    const tempHeap = this.heap.clone();

    while (!tempHeap.isEmpty()) {
      const root = tempHeap.extractRoot();
      if (root) {
        allResults.push(root);
      }
    }

    // If there are no results (this shouldn't happen but to be safe)
    if (allResults.length === 0) {
      this.heap.insert(result);
      this.resultMap.set(result.id, true);
      return true;
    }

    // Now allResults is sorted by score in descending order (highest first)
    // So the last element has the lowest score
    const lowestResult = allResults[allResults.length - 1];

    if (!lowestResult || result.score <= lowestResult.score) {
      return false; // New result isn't better than our worst one, don't add it
    }

    // Remove the lowest scoring result from tracking
    this.resultMap.delete(lowestResult.id);

    // Clear heap and rebuild it with the better items plus new one
    this.heap.clear();

    // Add all items except the lowest one back to the heap
    for (let i = 0; i < allResults.length - 1; i++) {
      const item = allResults[i];
      if (item) {
        this.heap.insert(item);
      }
    }

    // Add the new result
    this.heap.insert(result);
    this.resultMap.set(result.id, true);

    return true;
  }

  getBestResults(): ForensicResult[] {
    // Return results sorted by score (highest first)
    return this.heap.clone().sort();
  }

  clear(): void {
    this.heap.clear();
    this.resultMap.clear();
  }
}

const forensicResultsHeap = new ForensicResultsHeap();

export default forensicResultsHeap;
