/* eslint-disable */
import axios from 'axios';
import { fetchSaisonEnCours } from '@/services/api';
import type { Match as UIMatch, Joueur } from '@/services/type';

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
const DEFAULT_TTL_MS = 2 * 60 * 1000; // 2 minutes

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

// ---- Clubs & Salles (via script PHP) ----
export type ProvinceCode = 'H' | 'Lx' | 'L' | 'BBW' | 'N';

export type TabtClubVenue = {
  name: string;
  street: string;
  town: string;
  phone: string;
  comment: string;
  fullAddress: string;
};

export type TabtClubWithVenues = {
  clubId: string;
  clubName: string;
  clubLongName: string;
  venueCount: number;
  venues: TabtClubVenue[];
};

export type TabtClubsResponse = {
  success: boolean;
  province: ProvinceCode;
  totalClubsInProvince: number;
  clubsWithVenues: number;
  debug?: any;
  clubs: TabtClubWithVenues[];
};

export async function fetchClubsWithVenues(params: {
  province: ProvinceCode;
  timeoutMs?: number;
}): Promise<TabtClubsResponse> {
  const { province, timeoutMs = 20000 } = params;

  // Validation côté client pour aider l'appelant
  const VALID_PROVINCES: ProvinceCode[] = ['H', 'Lx', 'L', 'BBW', 'N'];
  if (!VALID_PROVINCES.includes(province)) {
    throw new Error(
      `Province invalide: ${province}. Utilisez l'une de: ${VALID_PROVINCES.join(', ')}`
    );
  }

  try {
    const res = await axios.get(`${TABT_API_URL}/venues.php`, {
      params: { province },
      timeout: timeoutMs,
    });
    return res.data as TabtClubsResponse;
  } catch (err: any) {
    const serverMsg = err?.response?.data?.error || err?.message || 'Erreur inconnue';
    throw new Error(`Échec récupération clubs/venues (${province}) : ${serverMsg}`);
  }
}

// ---- Adaptateur: TABT -> Match (app) ----
export type AppMatch = {
  id: string;
  serieId: string;
  semaine: number;
  domicile: string;
  exterieur: string;
  score: string;
  date: string;
  heure?: string;
  lieu?: string;
  saisonId?: string;
  matchUniqueId?: number;
  divisionName?: string; // Ajout pour affichage "Division <nom>"
};

export function mapTabtMatchToAppMatch(m: TabtMatch): AppMatch {
  // Estimation de la semaine si non fournie: extraire numéro de semaine éventuel du label weekName sinon 0
  const week = typeof m?.weekName === 'string'
    ? Number(m.weekName.replace(/\D+/g, '')) || 0
    : 0;

  const score = m.score || '';
  const date = m.date || m.dateTime || '';
  const time = m.time || '';
  const id = String(m.matchUniqueId ?? m.matchId ?? `${m.homeTeam}-${m.awayTeam}-${date}`);
  const serieId = String(m.divisionId ?? '');
  const divisionName = m.divisionName || (serieId ? `Division ${serieId}` : 'Division');

  return {
    id,
    serieId,
    semaine: week,
    domicile: `${m.homeClub ?? ''} ${m.homeTeam ?? ''}`.trim(),
    exterieur: `${m.awayClub ?? ''} ${m.awayTeam ?? ''}`.trim(),
    score,
    date,
    heure: time,
    lieu: m.venueClub ?? undefined,
    matchUniqueId: m.matchUniqueId ?? undefined,
    divisionName,
  };
}

// ---- Helpers fusion TABT + sélections ----
function normalizeTeamName(name: string): string {
  return (name || '')
    .replace(/\s+/g, ' ')
    .replace(/\s+(Dame|Dames|Vét\.|Veteran)$/i, '')
    .trim()
    .toLowerCase();
}

function toUIMatch(app: AppMatch, saisonId?: string): UIMatch {
  return {
    id: app.id,
    saisonId: saisonId || '',
    serieId: app.serieId,
    semaine: app.semaine,
    domicile: app.domicile,
    exterieur: app.exterieur,
    score: app.score,
    date: app.date,
    heure: app.heure,
    lieu: app.lieu,
  };
}

function ensureWo(j: Joueur[] | undefined): Joueur[] | undefined {
  if (!j) return j;
  return j.map((x) => ({ ...x, wo: x.wo || 'n' }));
}

function overlaySelection(app: AppMatch, seasonMatch: UIMatch | undefined, saisonId?: string): UIMatch {
  const base = toUIMatch(app, saisonId);
  if (!seasonMatch) return base;
  return {
    ...base,
    joueursDomicile: ensureWo((seasonMatch as any).joueursDomicile || (seasonMatch as any).joueur_dom),
    joueursExterieur: ensureWo((seasonMatch as any).joueursExterieur || (seasonMatch as any).joueur_ext),
    joueur_dom: ensureWo((seasonMatch as any).joueur_dom),
    joueur_ext: ensureWo((seasonMatch as any).joueur_ext),
    scoresIndividuels: (seasonMatch as any).scoresIndividuels || {},
  } as UIMatch;
}

function findSelectionMatch(app: AppMatch, seasonList: UIMatch[]): UIMatch | undefined {
  // 1) Match par ID exact
  let found = seasonList.find((m) => m.id === app.id);
  if (found) return found;

  // 2) Match par équipes normalisées (+ date si disponible)
  const d1 = normalizeTeamName(app.domicile);
  const e1 = normalizeTeamName(app.exterieur);
  const date1 = (app.date || '').split('T')[0];

  found = seasonList.find((m) => {
    const d2 = normalizeTeamName(m.domicile);
    const e2 = normalizeTeamName(m.exterieur);
    const date2 = (m.date || '').split('T')[0];
    const teamMatch = d1 === d2 && e1 === e2;
    if (!teamMatch) return false;
    // Si une date existe des deux côtés, la comparer; sinon ignorer la date
    if (date1 && date2) return date1 === date2;
    return true;
  });
  return found;
}

/**
 * Récupère les matches TABT du club, puis fusionne avec les sélections stockées dans la saison en cours.
 * Retour: Match[] (type UI) avec éventuelles compositions (joueur_dom/joueur_ext) et scores individuels.
 */
export async function fetchMergedUIMatchesForClub(options?: {
  clubName?: string;
  season?: string;
  timeoutMs?: number;
}): Promise<UIMatch[]> {
  const saison = await fetchSaisonEnCours();
  const tabt = await fetchClubMatchesMapped(options);
  const seasonList: UIMatch[] = Array.isArray(saison?.calendrier) ? saison.calendrier : [];

  const overlayed = tabt.map((m) => overlaySelection(m, findSelectionMatch(m, seasonList), saison?.id));

  // DEBUG: log tailles initiales
  try {
    // eslint-disable-next-line no-console
    console.log('[TABT] Matches TABT:', tabt.length, 'Season calendrier:', seasonList.length, 'Overlayed:', overlayed.length);
  } catch {}

  // Ajouter les matchs présents dans le calendrier de la saison mais absents de TABT (ex: vétérans si non retournés par l API)
  const tabtIds = new Set(overlayed.map(m => m.id));
  const seasonOnly: UIMatch[] = seasonList
    .filter(m => !tabtIds.has(m.id))
    .map(m => ({ ...m }));

  if (seasonOnly.length) {
    try {
      console.log('[TABT] Ajout de', seasonOnly.length, 'match(s) uniquement saison (probablement vétérans ou spéciaux)');
      // Log spécifique vétérans: heuristique sur date en semaine (jeudi) ou identifiants type PHV
      const veteransGuess = seasonOnly.filter(m => /v[ée]t|PHV/i.test(JSON.stringify(m)) || [/thu/i, /jeudi/i].some(rx => rx.test(new Date(m.date || '').toString())));
      if (veteransGuess.length) {
        console.log('[TABT] Saison-only potentiels vétérans:', veteransGuess.map(v => ({ id: v.id, eq: v.domicile + ' vs ' + v.exterieur, semaine: v.semaine })));
      }
    } catch {}
  }

  return [...overlayed, ...seasonOnly];
}

/**
 * Récupère les matches TABT d'un club (nom) et les mappe au type AppMatch
 * VITE_TABT_CLUB_NAME peut définir le nom du club; fallback: "CTT Frameries".
 */
export async function fetchClubMatchesMapped(options?: {
  clubName?: string;
  season?: string;
  timeoutMs?: number;
  clubCode?: string; // ex: H442
}): Promise<AppMatch[]> {
  // 1) Code club prioritaire (plus fiable côté API PHP)
  const clubCode = options?.clubCode || (import.meta.env.VITE_TABT_CLUB_CODE as string) || '';
  // 2) Fallback sur le nom du club
  const clubName = options?.clubName || (import.meta.env.VITE_TABT_CLUB_NAME as string) || '';
  const timeoutMs = options?.timeoutMs ?? 20000;
  const season = options?.season;

  const clubParam = clubCode || clubName || 'H442';

  const res = await fetchMatches({ club: clubParam, season, timeoutMs });
  const list = res?.data || [];
  return list.map(mapTabtMatchToAppMatch);
}

// ---- Venues externes (API PHP) ----
export const fetchExternalVenues = async (province: string = 'H') => {
  const response = await axios.get(`${TABT_API_URL}/venues.php`, {
    params: { province },
  });
  return response.data;
};
