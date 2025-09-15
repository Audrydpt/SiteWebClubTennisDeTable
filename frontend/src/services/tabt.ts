/* eslint-disable */
import axios from 'axios';

export type TabtRankingEntry = {
  position: number;
  team: string;
  teamClub: string;
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  gamesDraw: number;
  individualMatchesWon: number;
  individualMatchesLost: number;
  individualSetsWon: number;
  individualSetsLost: number;
  points: number;
};

export type TabtDivisionRanking = {
  divisionId: number;
  divisionName: string;
  divisionCategory: number;
  matchType: number;
  ranking: TabtRankingEntry[];
};

export type TabtRankingResponse = {
  success: boolean;
  clubId: string;
  count: number;
  data: TabtDivisionRanking[];
};

const TABT_API_URL = import.meta.env.VITE_API_TABT_URL;
const CACHE_KEY = 'tabt_all_rankings_cache_v1';
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

function normalizeResponse(resp: TabtRankingResponse): TabtRankingResponse {
  const seen = new Map<number, TabtDivisionRanking>();
  for (const div of resp.data || []) {
    if (!seen.has(div.divisionId)) {
      seen.set(div.divisionId, div);
    }
  }
  const unique = Array.from(seen.values());
  return {
    ...resp,
    count: unique.length,
    data: unique,
  };
}

export function getCachedAllRankings(): TabtRankingResponse | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { ts: number; data: TabtRankingResponse };
    return parsed.data || null;
  } catch {
    return null;
  }
}

function isCacheFresh(ttlMs: number = DEFAULT_TTL_MS): boolean {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { ts: number };
    return Date.now() - parsed.ts < ttlMs;
  } catch {
    return false;
  }
}

function saveCache(data: TabtRankingResponse) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ ts: Date.now(), data })
    );
  } catch {
    // ignore quota errors
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldRetry(err: any): boolean {
  if (!err) return false;
  const code = err?.code || err?.response?.status;
  // Retry sur timeouts, erreurs réseau, 429/5xx
  return (
    code === 'ECONNABORTED' ||
    code === 'ERR_NETWORK' ||
    code === 429 ||
    (typeof code === 'number' && code >= 500)
  );
}

export const fetchAllRankings = async (
  options?: { force?: boolean; ttlMs?: number; timeoutMs?: number; maxRetries?: number }
): Promise<TabtRankingResponse> => {
  const { force = false, ttlMs = DEFAULT_TTL_MS, timeoutMs = 20000, maxRetries = 2 } = options || {};

  if (!force && isCacheFresh(ttlMs)) {
    const cached = getCachedAllRankings();
    if (cached) return cached;
  }

  let attempt = 0;
  let lastError: any = null;

  while (attempt <= maxRetries) {
    try {
      const res = await axios.get(`${TABT_API_URL}/ranking.php?all=true`, {
        timeout: timeoutMs,
        // Pas d'entêtes custom pour éviter CORS
      });
      const normalized = normalizeResponse(res.data as TabtRankingResponse);
      saveCache(normalized);
      return normalized;
    } catch (err: any) {
      lastError = err;
      if (attempt === maxRetries || !shouldRetry(err)) {
        break;
      }
      // Backoff exponentiel avec jitter (300ms * 2^attempt)
      const backoff = 300 * Math.pow(2, attempt) + Math.floor(Math.random() * 200);
      await sleep(backoff);
      attempt++;
    }
  }

  // En cas d'échec, si un cache existe, le renvoyer pour éviter un hard fail
  const cached = getCachedAllRankings();
  if (cached) return cached;

  throw lastError || new Error('Échec de récupération des classements');
};
