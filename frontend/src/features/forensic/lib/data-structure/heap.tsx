import { MinHeap } from '@datastructures-js/heap';

import { ForensicResult } from '../types';

// Number of maximum results to keep
const MAX_RESULTS = 5000;

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
    // Si les scores sont identiques, trier par date la plus récente
    return results.sort((a, b) => {
      if (Math.abs(b.score - a.score) < 0.0000001) {
        const dateA =
          typeof a.timestamp === 'string' ? new Date(a.timestamp).getTime() : 0;
        const dateB =
          typeof b.timestamp === 'string' ? new Date(b.timestamp).getTime() : 0;

        return dateB - dateA;
      }
      return b.score - a.score;
    });
  }

  clear(): void {
    this.minHeap.clear();
    this.resultMap.clear();
  }

  getPageResults(page: number, pageSize: number = 12) {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return this.getBestResults().slice(startIndex, endIndex);
  }

  shouldAddResult(
    newResult: ForensicResult,
    currentPage: number,
    pageSize: number = 12
  ) {
    if (currentPage === 1) {
      // En première page, on vérifie si le résultat est meilleur que le moins bon affiché
      const pageResults = this.getPageResults(currentPage, pageSize);
      if (pageResults.length < pageSize) return true;

      const minScore = Math.min(...pageResults.map((r) => r.score));
      return newResult.score > minScore;
    }

    // Pour les autres pages, il faut vérifier si le nouveau résultat serait dans cette page
    const allResults = this.getBestResults();
    const pageStartRank = (currentPage - 1) * pageSize;

    // Si on a moins de résultats que l'indice de début de la page actuelle
    if (allResults.length <= pageStartRank) return false;

    // On simule l'ajout du résultat pour voir s'il se placerait dans cette page
    const wouldBeBetterThan = allResults.findIndex(
      (r) => newResult.score > r.score
    );
    return wouldBeBetterThan >= 0 && wouldBeBetterThan < currentPage * pageSize;
  }

  getCount(): number {
    return this.minHeap.size();
  }
}

const forensicResultsHeap = new ForensicResultsHeap();

export default forensicResultsHeap;
