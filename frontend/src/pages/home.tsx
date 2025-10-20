/* eslint-disable */
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Slider from 'react-slick';

import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

import { Calendar, Loader2, Award } from 'lucide-react';

import {
  fetchActualites,
  fetchSponsors,
  fetchSaisonEnCours,
} from '../services/api';
import { ActualiteData, SponsorData, ResultatData } from '../services/type';
import '../lib/styles/home.css';
import HeroSection from '@/pages/comps/hero.tsx';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert.tsx';
import { fetchMatches } from '@/services/tabt';

// Ajout d'un type minimal pour la saison
type Serie = { id: string; nom: string };
type EquipeClub = { nom: string };
type CalendrierMatch = {
  id: string;
  division?: string;
  serie?: string;
  serieId?: string;
  domicile: string;
  exterieur: string;
  score?: string;
  date: string;
};
type SaisonData = {
  series?: Serie[];
  equipesClub?: EquipeClub[];
  calendrier?: CalendrierMatch[];

};

// Interface pour les props des flèches
interface ArrowProps {
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

function PrevArrow({ onClick }: ArrowProps) {
  return (
    <button
      type="button"
      className="custom-arrow custom-prev"
      onClick={onClick}
      aria-label="Précédent"
    >
      ❮
    </button>
  );
}

function NextArrow({ onClick }: ArrowProps) {
  return (
    <button
      type="button"
      className="custom-arrow custom-next"
      onClick={onClick}
      aria-label="Suivant"
    >
      ❯
    </button>
  );
}

export default function HomePage() {
  const [actualites, setActualites] = useState<ActualiteData[]>([]);
  const [resultatsABC, setResultatsABC] = useState<ResultatData[]>([]);
  const [sponsors, setSponsors] = useState<SponsorData[]>([]);
  // États de chargement indépendants
  const [loadingNews, setLoadingNews] = useState(true);
  const [loadingResults, setLoadingResults] = useState(true);
  const [loadingSponsors, setLoadingSponsors] = useState(true);
  const [saison, setSaison] = useState<SaisonData | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<ActualiteData | null>(null);
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const [divisionNameById, setDivisionNameById] = useState<Record<string, string>>({});

  // Helpers club/équipes
  const CLUB_CODE = (import.meta.env.VITE_TABT_CLUB_CODE as string) || '';
  const CLUB_NAME = (import.meta.env.VITE_TABT_CLUB_NAME as string) || '';
  const CLUB_KEYWORD = ((import.meta.env.VITE_TABT_CLUB_KEYWORD as string) || 'frameries').toLowerCase();

  // Divisions Heren A/B/C (override possible via .env)
  const DIV_A = Number((import.meta.env.VITE_TABT_DIV_A as string) || '') || 9168;
  const DIV_B = Number((import.meta.env.VITE_TABT_DIV_B as string) || '') || 9182;
  const DIV_C = Number((import.meta.env.VITE_TABT_DIV_C as string) || '') || 9196;
  const DIVISION_IDS_ABC = [DIV_A, DIV_B, DIV_C];

  const normalize = (s?: string) => (s || '')
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

  const isClubTeamName = (name?: string) => {
    if (!name) return false;
    const n = normalize(name);
    // Ne tester le code club et le nom que s'ils sont définis/non vides
    if (CLUB_CODE) {
      const code = normalize(CLUB_CODE);
      if (code && n.includes(code)) return true;
    }
    if (CLUB_NAME) {
      const clubName = normalize(CLUB_NAME);
      if (clubName && n.includes(clubName)) return true;
    }
    // Fallback sur le mot-clé ("frameries" par défaut)
    return n.includes(CLUB_KEYWORD);
  };

  const getSerieNom = (serieId?: string) => {
    if (!serieId) return '';
    if (divisionNameById[serieId]) return divisionNameById[serieId];
    if (saison?.series) {
      const s = saison.series.find(x => x.id === serieId);
      if (s?.nom) return s.nom;
    }
    return '';
  };

  const cacheKey = 'home_results_heren_ABC_v4';
  const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

  const readCache = () => {
    try {
      const raw = localStorage.getItem(cacheKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { ts: number; data: ResultatData[] };
      if (!parsed?.ts || Date.now() - parsed.ts > CACHE_TTL_MS) return null;
      return parsed.data || null;
    } catch {
      return null;
    }
  };

  const writeCache = (data: ResultatData[]) => {
    try {
      localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data }));
    } catch {}
  };

  useEffect(() => {
    // Charger les actualités (indépendant)
    (async () => {
      try {
        const data = await fetchActualites();
        let actualitesData: any[] = [];
        if (Array.isArray(data)) actualitesData = data;
        else if (data && (data as any).actualites && Array.isArray((data as any).actualites)) actualitesData = (data as any).actualites;
        const sortedActualites = actualitesData.sort((a: ActualiteData, b: ActualiteData) => (a.order || Infinity) - (b.order || Infinity));
        setActualites(sortedActualites);
      } catch (e) {
        setActualites([]);
      } finally {
        setLoadingNews(false);
      }
    })();

    // Charger les sponsors (indépendant)
    (async () => {
      try {
        const sponsorsData = await fetchSponsors();
        const sortedSponsors = sponsorsData.sort((a: SponsorData, b: SponsorData) => a.order - b.order);
        setSponsors(sortedSponsors);
      } catch (e) {
        setSponsors([]);
      } finally {
        setLoadingSponsors(false);
      }
    })();

    // Charger les résultats A/B/C (indépendant)
    (async () => {
      try {
        const cached = readCache();
        if (cached && cached.length) setResultatsABC(cached);

        const saisonEnCours = await fetchSaisonEnCours();
        setSaison(saisonEnCours);

        // Charger noms de divisions via club pour enrichir l'affichage
        try {
          const clubCode = (import.meta.env.VITE_TABT_CLUB_CODE as string) || undefined;
          const tabt = await fetchMatches({ club: clubCode, showDivisionName: 'short' });
          const map: Record<string, string> = {};
          (tabt?.data || []).forEach((m: any) => {
            const id = String(m.divisionId || '').trim();
            const name = (m.divisionName || '').toString().trim();
            if (id && name && !map[id]) map[id] = name;
          });
          setDivisionNameById(map);
        } catch {}

        // -------- Nouvelle logique basée sur la lettre d'équipe --------
        const clubCode = (import.meta.env.VITE_TABT_CLUB_CODE as string) || '';
        const clubMatchesResp = await fetchMatches({ club: clubCode || undefined, showDivisionName: 'short' });
        const clubMatches: any[] = (clubMatchesResp?.data || []).slice();

        const mkTeamLabel = (m: any, side: 'home'|'away') => `${side==='home'?(m.homeClub||''):(m.awayClub||'')} ${side==='home'?(m.homeTeam||''):(m.awayTeam||'')}`.trim();
        const isClubSide = (m: any, side: 'home'|'away') => {
          const club = side==='home' ? (m.homeClub || '') : (m.awayClub || '');
          if (CLUB_CODE && club) return String(club).trim().toLowerCase() === CLUB_CODE.toLowerCase();
          const label = mkTeamLabel(m, side);
          return isClubTeamName(label);
        };
        const parseDate = (m: any) => new Date(m.date || m.dateTime || '').getTime() || 0;
        const today = new Date(); today.setHours(0,0,0,0);
        const teamLetter = (val: any): string => String(val || '').trim().toUpperCase();
        const extractLetter = (team?: string): string => {
          if (!team) return '';
          const tokens = String(team).trim().split(/\s+/);
          const last = tokens[tokens.length - 1] || '';
          if (/^[A-Za-z]$/.test(last)) return last.toUpperCase();
          const found = tokens.find((t) => /^[A-Za-z]$/.test(t));
          return found ? found.toUpperCase() : '';
        };

        const pickForLetter = (letter: 'A'|'B'|'C'): ResultatData | null => {
          // matches où notre club joue et avec la bonne lettre de team
          const list = clubMatches.filter((m) => {
            const homeIsClub = isClubSide(m,'home');
            const awayIsClub = isClubSide(m,'away');
            if (!homeIsClub && !awayIsClub) return false;
            const ht = extractLetter(m.homeTeam);
            const at = extractLetter(m.awayTeam);
            return (homeIsClub && ht === letter) || (awayIsClub && at === letter);
          });
          if (!list.length) return null;

          const withScore = list.filter((m) => m.score && m.score !== '-').sort((a,b) => parseDate(b) - parseDate(a));
          let chosen: any;
          if (withScore.length) chosen = withScore[0];
          else {
            const upcoming = list.filter((m) => (!m.score || m.score === '-') && parseDate(m) >= today.getTime()).sort((a,b) => parseDate(a) - parseDate(b));
            chosen = upcoming[0] || list.sort((a,b) => parseDate(b)-parseDate(a))[0];
          }
          if (!chosen) return null;

          const homeIsClub = isClubSide(chosen,'home');
          const equipe = mkTeamLabel(chosen, homeIsClub ? 'home' : 'away');
          const adv = mkTeamLabel(chosen, homeIsClub ? 'away' : 'home');

          return {
            id: String(chosen.matchUniqueId || chosen.matchId || `${equipe}-${adv}-${chosen.date}`),
            division: chosen.divisionName || `Division ${chosen.divisionId || ''}`,
            equipe,
            adversaire: adv,
            score: chosen.score || '-',
            date: (chosen.date || chosen.dateTime || '') as string,
            semaine: 0,
            serieId: String(chosen.divisionId || ''),
            domicile: !!homeIsClub,
          } as ResultatData;
        };

        const letters: ('A'|'B'|'C')[] = ['A','B','C'];
        let computed: ResultatData[] = letters
          .map(pickForLetter)
          .filter((x): x is ResultatData => !!x);

        // Fallback sur ancienne méthode par division si rien trouvé
        if (!computed.length) {
          let divisionMatches: any[] = [];
          try {
            const [rA, rB, rC] = await Promise.all(
              DIVISION_IDS_ABC.map((divId) => fetchMatches({ divisionId: divId, showDivisionName: 'short' }))
            );
            divisionMatches = [ ...((rA?.data as any[]) || []), ...((rB?.data as any[]) || []), ...((rC?.data as any[]) || []) ];
          } catch {}

          const computeFromDivisions = (): ResultatData[] => {
            const out: ResultatData[] = [];
            DIVISION_IDS_ABC.forEach((divId) => {
              const list = divisionMatches.filter((m) => Number(m.divisionId) === Number(divId));
              if (!list.length) return;
              const clubMatches = list.filter((m) => isClubSide(m,'home') || isClubSide(m,'away'));
              if (!clubMatches.length) return;
              const withScore = clubMatches.filter((m) => m.score && m.score !== '-').sort((a,b) => parseDate(b) - parseDate(a));
              let chosen: any;
              if (withScore.length) chosen = withScore[0];
              else {
                const upcoming = clubMatches.filter((m) => (!m.score || m.score === '-') && parseDate(m) >= today.getTime()).sort((a,b) => parseDate(a) - parseDate(b));
                chosen = upcoming[0] || clubMatches.sort((a,b) => parseDate(b)-parseDate(a))[0];
              }
              if (!chosen) return;
              const homeIsClub = isClubSide(chosen,'home');
              const equipe = mkTeamLabel(chosen, homeIsClub ? 'home' : 'away');
              const adv = mkTeamLabel(chosen, homeIsClub ? 'away' : 'home');
              out.push({
                id: String(chosen.matchUniqueId || chosen.matchId || `${equipe}-${adv}-${chosen.date}`),
                division: chosen.divisionName || `Division ${chosen.divisionId || ''}`,
                equipe,
                adversaire: adv,
                score: chosen.score || '-',
                date: (chosen.date || chosen.dateTime || '') as string,
                semaine: 0,
                serieId: String(chosen.divisionId || ''),
                domicile: !!homeIsClub,
              } as ResultatData);
            });
            return out;
          };
          computed = computeFromDivisions();
        }

        if (computed.length) {
          setResultatsABC(computed);
          writeCache(computed);
        } else {
          setResultatsABC([]);
        }
      } catch {
        // ignorer
      } finally {
        setLoadingResults(false);
      }
    })();
  }, []);

  // Carrousel: utiliser loadingNews au lieu d'un état global
  const mainCarouselSettings = {
    dots: true,
    infinite: true,
    speed: 600,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 8000,
    arrows: true,
    prevArrow: <PrevArrow />,
    nextArrow: <NextArrow />,
  };

  const getScoreColorClass = (score: string, isDomicile: boolean): string => {
    if (!score || score === '-') return 'text-gray-400';
    const parts = score.split('-');
    if (parts.length !== 2) return 'text-gray-700';
    const home = parseInt(parts[0], 10);
    const away = parseInt(parts[1], 10);
    const clubScore = isDomicile ? home : away;
    const advScore = isDomicile ? away : home;
    if (clubScore > advScore) return 'text-green-600';
    if (clubScore < advScore) return 'text-red-600';
    return 'text-gray-700';
  };

  const renderCarouselContent = () => {
    if (loadingNews) {
      return (
        <div className="flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      );
    }
    if (!actualites || actualites.length === 0) {
      return (
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>
              Impossible de charger les actualités. Veuillez réessayer plus tard.
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return (
      <div className="carousel-container px-4 py-2">
        <Slider {...mainCarouselSettings}>
          {actualites.map((actualite) => (
            <div key={actualite.id} className="px-2">
              <div
                className="relative rounded-lg overflow-hidden h-[400px] bg-black cursor-pointer group"
                onClick={() => setSelectedArticle(actualite)}
              >
                {/* Image floutée en fond */}
                <div className="absolute inset-0">
                  <img
                    src={actualite.imageUrl || '/placeholder.svg'}
                    alt={actualite.title}
                    className="w-full h-full object-cover blur-md opacity-50 transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder.svg';
                    }}
                  />
                </div>

                {/* Image principale centrée sans rognage */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <img
                    src={actualite.imageUrl || '/placeholder.svg'}
                    alt={actualite.title}
                    className="max-h-full max-w-full object-contain z-10 transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder.svg';
                    }}
                  />
                </div>

                {/* Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-20" />

                {/* Bloc texte global */}
                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 text-white z-30 bg-gradient-to-t from-black/80 via-black/50 to-transparent">
                  <div className="flex flex-col gap-2">
                    {/* Titre */}
                    <h3 className="text-lg md:text-2xl font-bold leading-tight drop-shadow-lg">
                      {actualite.title}
                    </h3>

                    {/* Aperçu du contenu avec Voir + après troncature */}
                    <div className="text-sm md:text-base text-gray-200 leading-relaxed drop-shadow-lg">
                      <p className="line-clamp-2 overflow-hidden">
                        {actualite.content.length > 150
                          ? `${actualite.content.substring(0, 150)}... `
                          : `${actualite.content} `
                        }
                        <button
                          className="text-white underline hover:text-gray-300 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedArticle(actualite);
                          }}
                        >
                          Voir +
                        </button>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </Slider>

        {/* MODAL PLEIN ÉCRAN */}
        {selectedArticle && (
          <div
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-2 sm:p-4 animate-fadeIn"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setSelectedArticle(null);
                setIsImageZoomed(false);
              }
            }}
          >
            <div className="relative max-w-4xl w-full bg-white rounded-lg overflow-hidden shadow-lg animate-slideUp max-h-[95vh] sm:max-h-[90vh]">
              {/* Bouton fermer */}
              <button
                className="absolute top-2 right-2 sm:top-4 sm:right-4 text-white text-2xl sm:text-3xl z-50 bg-black/50 rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center hover:bg-black/70"
                onClick={() => {
                  setSelectedArticle(null);
                  setIsImageZoomed(false);
                }}
              >
                ✕
              </button>

              {/* Image - hauteur adaptative selon l'écran avec zoom */}
              <div
                className="w-full h-[200px] sm:h-[300px] md:h-[400px] bg-black overflow-hidden flex items-center justify-center relative cursor-zoom-in group"
                onClick={() => setIsImageZoomed(true)}
              >
                <img
                  src={selectedArticle.imageUrl || '/placeholder.svg'}
                  alt={selectedArticle.title}
                  className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-105"
                />
                {/* Indicateur de zoom */}
                <div className="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                  🔍 Cliquer pour agrandir
                </div>
              </div>

              {/* Contenu - hauteur adapative pour éviter le scroll */}
              <div className="p-3 sm:p-4 md:p-6 text-black h-[250px] sm:h-[300px] md:h-[400px] flex flex-col">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-2 sm:mb-3 md:mb-4 flex-shrink-0 leading-tight">
                  {selectedArticle.title}
                </h2>

                <div className="flex-1 overflow-hidden">
                  <p className="leading-relaxed whitespace-pre-line text-sm sm:text-base">
                    {selectedArticle.content}
                  </p>
                </div>

                {selectedArticle.redirectUrl && selectedArticle.redirectUrl.trim() !== '' && (
                  <div className="mt-2 sm:mt-3 md:mt-4 pt-2 sm:pt-3 md:pt-4 border-t flex-shrink-0">
                    <a
                      href={selectedArticle.redirectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline hover:text-blue-800 visited:text-purple-600 transition-colors block truncate text-sm sm:text-base"
                      title={selectedArticle.redirectUrl}
                    >
                      {selectedArticle.redirectUrl}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Modal de zoom plein écran */}
            {isImageZoomed && (
              <div
                className="fixed inset-0 bg-black/95 z-[60] flex items-center justify-center p-4 animate-fadeIn"
                onClick={() => setIsImageZoomed(false)}
              >
                <button
                  className="absolute top-4 right-4 text-white text-3xl z-[70] bg-black/70 rounded-full w-12 h-12 flex items-center justify-center hover:bg-black/90 transition-colors"
                  onClick={() => setIsImageZoomed(false)}
                >
                  ✕
                </button>
                <img
                  src={selectedArticle.imageUrl || '/placeholder.svg'}
                  alt={selectedArticle.title}
                  className="max-h-[95vh] max-w-[95vw] object-contain cursor-zoom-out"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsImageZoomed(false);
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* Section Hero */}
      <section>
        <HeroSection />
      </section>

      {/* Contenu principal : Carousel et Résultats */}
      <main className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Section Carousel */}
          <div className="lg:col-span-3">
            <div className="bg-white p-6 rounded-xl shadow-lg h-full">
              <h2 className="text-3xl font-bold text-gray-800 mb-4 flex items-center gap-3">
                <Calendar style={{ color: '#F1C40F' }} />À la une
              </h2>
              {renderCarouselContent()}
            </div>
          </div>

          {/* Section Résultats */}
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-xl shadow-lg h-full">
              <h2 className="text-3xl font-bold text-gray-800 mb-4 flex items-center gap-3">
                <Award style={{ color: '#F1C40F' }} />
                {/* Titre dynamique selon le type du plus récent (score total) */}
                {(() => {
                  const resList = resultatsABC.slice(0, 3);
                  const getTypeByScore = (res: any) => {
                    if (!res || !res.score || res.score === '-') return 'inconnu';
                    const parts = res.score
                      .split('-')
                      .map((x: string) => parseInt(x, 10));
                    if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) return 'inconnu';
                    const total = parts[0] + parts[1];
                    if (total === 10) return 'vet';
                    if (total === 16) return 'homme';
                    return 'inconnu';
                  };
                  if (!resList.length) return 'Derniers Résultats';
                  const typeRecent = getTypeByScore(resList[0]);
                  if (typeRecent === 'vet') {
                    return 'Derniers Résultats Vétérans';
                  } else if (typeRecent === 'homme') {
                    return 'Derniers Résultats Hommes';
                  } else {
                    return 'Derniers Résultats';
                  }
                })()}
              </h2>
              <div className="space-y-4">
                {loadingResults ? (
                  <div className="flex items-center justify-center h-80">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    {(() => {
                      // Fonction utilitaire pour formater la date
                      const formatDate = (dateStr: string) => {
                        if (!dateStr) return '';
                        const date = new Date(dateStr);
                        if (isNaN(date.getTime())) return '';
                        return date.toLocaleDateString('fr-BE', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                        });
                      };

                      if (!resultatsABC || resultatsABC.length === 0) {
                        return (
                          <div className="text-center text-gray-500 py-8">
                            Aucun résultat ou match prévu pour les équipes Hommes A, B, C.
                          </div>
                        );
                      }

                      // Nouvelle logique : filtrer selon le type du plus récent (score total)
                      const resList = resultatsABC.slice(0, 3);
                      const getTypeByScore = (res: any) => {
                        if (!res || !res.score || res.score === '-') return 'inconnu';
                        const parts = res.score
                          .split('-')
                          .map((x: string) => parseInt(x, 10));
                        if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) return 'inconnu';
                        const total = parts[0] + parts[1];
                        if (total === 10) return 'vet';
                        if (total === 16) return 'homme';
                        return 'inconnu';
                      };
                      if (!resList.length) return null;
                      const typeRecent = getTypeByScore(resList[0]);
                      const toShow = resList.filter(r => getTypeByScore(r) === typeRecent);

                      return (
                        <>
                          {toShow.map(
                            (res) => (
                              <div
                                key={res.id}
                                className="p-4 border rounded-lg transition-all hover:shadow-md hover:bg-[#F1F1F1]"
                                style={{
                                  backgroundColor: '#F9F9F9',
                                  borderColor: '#E0E0E0',
                                }}
                              >
                                <div className="flex justify-between items-center mb-1">
                                  <p className="text-xs text-gray-500">
                                    Division {getSerieNom(res.serieId || '') || res.division || 'inconnue'}
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    {formatDate(res.date)}
                                  </p>
                                </div>
                                <div className="flex justify-between items-center">
                                  <div className="font-semibold text-gray-800">
                                    <p>{res.equipe}</p>
                                    <p className="text-sm text-gray-600">
                                      vs {res.adversaire}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p
                                      className={`text-2xl font-bold ${
                                        res.score !== '-'
                                          ? getScoreColorClass(
                                            res.score,
                                            res.domicile
                                          )
                                          : 'text-gray-400'
                                      }`}
                                    >
                                      {res.score}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {res.domicile ? '🏠 Domicile' : '✈️ Extérieur'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )
                          )}
                        </>
                      );
                    })()}
                    <div className="text-center mt-6">
                      <Link
                        to="competition/equipes"
                        className="inline-block px-4 py-2 text-white rounded-md transition-colors hover:bg-[#D4AC0D]"
                        style={{
                          backgroundColor: '#F1C40F',
                        }}
                      >
                        Voir plus d&#39;équipes →
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Bande déroulante des sponsors */}
      <section className="py-8 bg-gray-100">
        <div className="container mx-auto">
          <h3 className="text-center text-xl font-bold text-gray-600 mb-6">
            Ils nous soutiennent
          </h3>
          {loadingSponsors ? (
            <div className="flex items-center justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : sponsors.length > 0 ? (
            <div
              className={
                sponsors.length >= 6 ? 'marquee-container' : 'static-sponsors'
              }
            >
              <div
                className={
                  sponsors.length >= 6
                    ? 'marquee-content'
                    : 'flex justify-center'
                }
              >
                {/* Logos des sponsors */}
                {sponsors.map((sponsor) => (
                  <div
                    key={sponsor.id}
                    className={sponsors.length >= 6 ? 'mx-8' : 'mx-8 mb-8'}
                  >
                      <Link to="/sponsors" className="block">
                        <img
                          src={sponsor.logoUrl || '/placeholder.svg'}
                          alt={sponsor.name}
                          className="hover:grayscale"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              '/placeholder.svg';
                          }}
                        />
                      </Link>
                  </div>
                ))}

                {/* Première duplication (existante) */}
                {sponsors.length >= 6 &&
                  sponsors.map((sponsor) => (
                    <div key={`${sponsor.id}-duplicate-1`} className="mx-8">
                      {sponsor.redirectUrl ? (
                        <a
                          href={sponsor.redirectUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <img
                            src={sponsor.logoUrl || '/placeholder.svg'}
                            alt={sponsor.name}
                            className="hover:grayscale"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                '/placeholder.svg';
                            }}
                          />
                        </a>
                      ) : (
                        <Link to="/sponsors" className="block">
                          <img
                            src={sponsor.logoUrl || '/placeholder.svg'}
                            alt={sponsor.name}
                            className="hover:grayscale"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                '/placeholder.svg';
                            }}
                          />
                        </Link>
                      )}
                    </div>
                  ))}

                {/* Deuxième duplication (nouvelle) */}
                {sponsors.length >= 6 &&
                  sponsors.map((sponsor) => (
                    <div key={`${sponsor.id}-duplicate-2`} className="mx-8">
                      {sponsor.redirectUrl ? (
                        <a
                          href={sponsor.redirectUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <img
                            src={sponsor.logoUrl || '/placeholder.svg'}
                            alt={sponsor.name}
                            className="hover:grayscale"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                '/placeholder.svg';
                            }}
                          />
                        </a>
                      ) : (
                        <Link to="/sponsors" className="block">
                          <img
                            src={sponsor.logoUrl || '/placeholder.svg'}
                            alt={sponsor.name}
                            className="hover:grayscale"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                '/placeholder.svg';
                            }}
                          />
                        </Link>
                      )}
                    </div>
                  ))}

                {/* Troisième duplication (nouvelle) */}
                {sponsors.length >= 6 &&
                  sponsors.map((sponsor) => (
                    <div key={`${sponsor.id}-duplicate-3`} className="mx-8">
                      {sponsor.redirectUrl ? (
                        <a
                          href={sponsor.redirectUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <img
                            src={sponsor.logoUrl || '/placeholder.svg'}
                            alt={sponsor.name}
                            className="hover:grayscale"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                '/placeholder.svg';
                            }}
                          />
                        </a>
                      ) : (
                        <Link to="/sponsors" className="block">
                          <img
                            src={sponsor.logoUrl || '/placeholder.svg'}
                            alt={sponsor.name}
                            className="hover:grayscale"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                '/placeholder.svg';
                            }}
                          />
                        </Link>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            <p className="text-center">Aucun sponsor à afficher.</p>
          )}
        </div>
      </section>
    </div>
  );
}
