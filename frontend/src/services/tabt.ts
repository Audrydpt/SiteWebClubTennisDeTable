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

// Base URL TABT avec fallback si la variable d'environnement n'est pas définie
const TABT_API_URL: string = import.meta.env.VITE_API_TABT_URL as string

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

export type TabtProgressPhase = 'contact' | 'reception' | 'tri' | 'cache' | 'done';

export const fetchAllRankings = async (
  options?: {
    force?: boolean;
    ttlMs?: number;
    timeoutMs?: number;
    maxRetries?: number;
    onProgress?: (phase: TabtProgressPhase, percent?: number) => void;
  }
): Promise<TabtRankingResponse> => {
  const {
    force = false,
    ttlMs = DEFAULT_TTL_MS,
    timeoutMs = 20000,
    maxRetries = 2,
    onProgress,
  } = options || {};

  if (!force && isCacheFresh(ttlMs)) {
    const cached = getCachedAllRankings();
    if (cached) return cached;
  }

  let attempt = 0;
  let lastError: any = null;

  // Progression simulée avec des délais pour chaque phase
  const simulateProgress = async () => {
    // Phase 1: Contact avec AFTT
    onProgress?.('contact', 10);
    await sleep(800); // Simuler le temps de connexion

    onProgress?.('contact', 25);
    await sleep(600);
  };

  // Démarrer la simulation
  await simulateProgress();

  while (attempt <= maxRetries) {
    try {
      // Phase 2: Début de la réception
      onProgress?.('reception', 40);
      await sleep(300);

      const res = await axios.get(`${TABT_API_URL}/ranking.php?all=true`, {
        timeout: timeoutMs,
      });

      // Phase 3: Fin de réception
      onProgress?.('reception', 65);
      await sleep(400);

      // Phase 4: Traitement/tri des données
      onProgress?.('tri', 75);
      await sleep(500);

      const normalized = normalizeResponse(res.data as TabtRankingResponse);

      onProgress?.('tri', 85);
      await sleep(300);

      // Phase 5: Mise en cache
      onProgress?.('cache', 92);
      await sleep(200);

      saveCache(normalized);

      onProgress?.('cache', 97);
      await sleep(200);

      // Phase 6: Finalisation
      onProgress?.('done', 100);
      await sleep(300);

      return normalized;
    } catch (err: any) {
      lastError = err;
      if (attempt === maxRetries || !shouldRetry(err)) {
        break;
      }

      // En cas d'erreur, on simule un petit délai avant retry
      onProgress?.('contact', Math.max(10, 30 - attempt * 10));
      const backoff = 300 * Math.pow(2, attempt) + Math.floor(Math.random() * 200);
      await sleep(backoff);
      attempt++;
    }
  }

  const cached = getCachedAllRankings();
  if (cached) return cached;

  throw lastError || new Error('Échec de récupération des classements');
};

// ---- Matches (AFTT) ----
export type TabtMatch = {
  matchId?: string | null;
  weekName?: string | null;
  date?: string | null;
  time?: string | null;
  dateTime?: string | null;
  venue?: number | null;
  homeClub?: string | null;
  homeTeam?: string | null;
  awayClub?: string | null;
  awayTeam?: string | null;
  score?: string | null;
  previousWeekName?: string | null;
  nextWeekName?: string | null;
  divisionId?: number | null;
  divisionCategory?: number | null;
  homeWithdrawn?: string | null;
  awayWithdrawn?: string | null;
  venueClub?: string | null;
  divisionName?: string | null;
  matchUniqueId?: number | null;
};

export type TabtMatchesResponse = {
  success: boolean;
  filters: Record<string, any>;
  count: number;
  returned: number;
  data: TabtMatch[];
};

export async function fetchMatches(params?: {
  club?: string;
  divisionId?: number;
  season?: string;
  showDivisionName?: 'yes' | 'no' | 'short';
  team?: string; // label complet ou lettre (ex: "A")
  divisionCategory?: number;
  timeoutMs?: number;
}): Promise<TabtMatchesResponse> {
  const { timeoutMs = 20000, ...query } = params || {};
  const res = await axios.get(`${TABT_API_URL}/matches.php`, {
    params: query,
    timeout: timeoutMs,
  });
  return res.data as TabtMatchesResponse;
}
