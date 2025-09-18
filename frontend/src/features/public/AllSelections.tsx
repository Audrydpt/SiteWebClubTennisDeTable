/* eslint-disable */
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Clock, Users, Ban, ArrowLeft, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fetchMergedUIMatchesForClub } from '@/services/tabt';
import { fetchSaisonEnCours, logSelectionsAccess, logAccordionOpen } from '@/services/api';
import { Match, Saison } from '@/services/type';
import supabase from '@/lib/supabaseClient';

export default function AllSelections() {
  const navigate = useNavigate();

  const CLUB_KEYWORD = (import.meta.env.VITE_TABT_CLUB_KEYWORD as string)?.toLowerCase() || 'frameries';
  const isClubTeam = (label?: string) => !!label && label.toLowerCase().includes(CLUB_KEYWORD);
  const hasTeamLetter = (label?: string) => !!label && /\s[A-Z]$/.test(label.trim());
  const isVeteranTeam = (label?: string) => !!label && /(v[ée]t[ée]r?an?s?\.?)/i.test(label);

  const [saison, setSaison] = useState<Saison | null>(null);
  const [matchs, setMatchs] = useState<Match[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [semaine, setSemaine] = useState<number | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [currentUserName, setCurrentUserName] = useState<string>('');

  // --- NEW: parser robuste pour semaines pouvant être sous forme 'V1', 'R02', etc. ---
  const parseWeek = (value: any): number => {
    if (value === null || value === undefined) return 0;
    const direct = Number(value);
    if (!isNaN(direct) && direct > 0) return direct;
    const m = String(value).match(/(\d{1,2})/);
    if (m) {
      const n = Number(m[1]);
      return isNaN(n) ? 0 : n;
    }
    return 0;
  };

  // Récupérer l'utilisateur connecté pour le logging
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          setCurrentUserId(user.id);

          // Récupérer les données complètes du membre depuis l'API
          try {
            const res = await fetch(
              `${import.meta.env.VITE_API_URL}/membres?supabase_uid=${user.id}`
            );
            const membres = await res.json();
            const membre = membres[0];

            if (membre) {
              const fullName = `${membre.prenom} ${membre.nom}`.trim();
              setCurrentUserName(fullName);
              // Logger l'accès à la page avec le nom complet
              await logSelectionsAccess(user.id, fullName);
            } else {
              // Logger l'accès avec ID seulement si pas de données membre
              await logSelectionsAccess(user.id, `User ID: ${user.id}`);
            }
          } catch (error) {
            console.error('Erreur lors de la récupération des données membre:', error);
            // Logger l'accès avec ID seulement en cas d'erreur
            await logSelectionsAccess(user.id, `User ID: ${user.id}`);
          }
        } else {
          // Logger l'accès anonyme
          await logSelectionsAccess(undefined, 'Visiteur anonyme');
        }
      } catch (error) {
        console.error('Erreur lors de la récupération de l\'utilisateur:', error);
        // Logger l'accès en cas d'erreur
        await logSelectionsAccess(undefined, 'Erreur d\'authentification');
      }
    };
    getCurrentUser();
  }, []);

  // Fonction pour logger l'ouverture d'un accordéon
  const handleAccordionValueChange = async (value: string) => {
    if (value) {
      // Extraire le nom de l'équipe depuis la clé
      const equipe = equipesSemaine.find(eq => eq.key === value)?.equipe;
      if (equipe) {
        try {
          await logAccordionOpen(
            equipe,
            currentUserId || undefined,
            currentUserName || (currentUserId ? `User ID: ${currentUserId}` : 'Visiteur anonyme')
          );
        } catch (error) {
          console.error('Erreur lors du logging de l\'accordéon:', error);
        }
      }
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [s, merged] = await Promise.all([
          fetchSaisonEnCours(),
          fetchMergedUIMatchesForClub(),
        ]);
        setSaison(s || null);
        setMatchs(Array.isArray(merged) ? (merged as unknown as Match[]) : []);

        // Déterminer la dernière semaine avec des sélections (côté club)
        const lastWithSel = (Array.isArray(merged) ? merged : [])
          .filter((m: any) => isClubTeam(m.domicile) || isClubTeam(m.exterieur))
          .filter((m: any) => {
            const joueurs = isClubTeam(m.domicile) ? (m.joueur_dom || m.joueursDomicile || []) : (m.joueur_ext || m.joueursExterieur || []);
            return Array.isArray(joueurs) && joueurs.length > 0;
          })
          .reduce((acc: number, m: any) => Math.max(acc, parseWeek(m.semaine)), 0);

        // Fallback: si aucune sélection trouvée, prendre la dernière semaine connue dans les matchs
        const lastWeek = (Array.isArray(merged) ? merged : [])
          .reduce((acc: number, m: any) => Math.max(acc, parseWeek(m.semaine)), 0);

        setSemaine(lastWithSel || lastWeek || 1);
      } catch (e) {
        console.error(e);
        setError("Impossible de charger les sélections.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const maxWeek = useMemo(() => {
    const numbers = (matchs || []).map(m => parseWeek((m as any).semaine));
    const max = numbers.reduce((acc, n) => Math.max(acc, n), 0);
    return max || 22;
  }, [matchs]);

  const hasWeekZero = useMemo(() => (matchs || []).some(m => parseWeek((m as any).semaine) === 0), [matchs]);

  const weeks = useMemo(() => {
    const base = Array.from({ length: maxWeek }, (_, i) => i + 1);
    return hasWeekZero ? [0, ...base] : base;
  }, [maxWeek, hasWeekZero]);

  useEffect(() => {
    if (semaine && semaine > maxWeek) {
      setSemaine(maxWeek);
    }
  }, [maxWeek, semaine]);

  const equipesSemaine = useMemo(() => {
    if (!saison || !semaine) return [] as Array<{ key: string; equipe: string; serie: string; estDomicile: boolean; adversaire: string; date?: string; heure?: string; lieu?: string; joueurs: any[]; veteran?: boolean }>;

    const semaineMatches = (matchs || []).filter(m => parseWeek(m.semaine) === Number(semaine));

    // Utiliser un Map pour dédupliquer par clé unique
    const entriesMap = new Map<string, { key: string; equipe: string; serie: string; estDomicile: boolean; adversaire: string; date?: string; heure?: string; lieu?: string; joueurs: any[]; veteran?: boolean }>();

    semaineMatches.forEach((m) => {
      const clubHome = isClubTeam(m.domicile);
      const clubAway = isClubTeam(m.exterieur);
      if (!clubHome && !clubAway) return;

      const estDomicile = clubHome;
      const equipeBrute = estDomicile ? m.domicile : m.exterieur;
      const dateObj = m.date ? new Date(m.date) : null;
      const isThursday = dateObj ? dateObj.getDay() === 4 : false; // 4 = jeudi
      const veteranHeuristic = /PHV/i.test(m.id || '') || /v[ée]t/i.test(equipeBrute) || isThursday;
      const equipe = veteranHeuristic ? `${equipeBrute} (Vétérans)` : equipeBrute;
      if (!hasTeamLetter(equipeBrute) && !veteranHeuristic && !isVeteranTeam(equipeBrute)) return;

      const serie = saison.series?.find((s) => s.id === m.serieId);
      const serieName = serie ? serie.nom : (/^\d+$/.test(String(m.serieId || '')) ? `Division ${m.serieId}` : String(m.serieId || 'Série'));

      const adversaire = estDomicile ? m.exterieur : m.domicile;
      const joueurs = estDomicile ? (m.joueursDomicile || m.joueur_dom || []) : (m.joueursExterieur || m.joueur_ext || []);

      // Clé unique : équipe + série + date + adversaire
      const uniqueKey = `${equipe}__${serieName}__${m.date || ''}__${adversaire}`;
      if (!entriesMap.has(uniqueKey)) {
        entriesMap.set(uniqueKey, {
          key: uniqueKey,
          equipe,
          serie: serieName,
          estDomicile,
          adversaire,
          date: m.date,
          heure: m.heure,
          lieu: (m as any).lieu,
          joueurs: Array.isArray(joueurs) ? joueurs : [],
          veteran: veteranHeuristic,
        });
      }
    });

    // Ajouter équipes sans match cette semaine (une seule entrée par nom de base qui n a pas déjà une occurrence)
    const existingBaseNames = new Set(Array.from(entriesMap.values()).map(e => e.equipe.replace(/ \(Vétérans\)$/,'')));
    (saison.equipesClub || []).forEach((eq: any) => {
      if (!hasTeamLetter(eq.nom) && !isVeteranTeam(eq.nom)) return;
      if (existingBaseNames.has(eq.nom)) return;
      const serie = saison.series?.find((s) => s.id === eq.serieId);
      const serieName = serie ? serie.nom : 'Série';
      const uniqueKey = `no-match-${eq.nom}__${serieName}`;
      if (!entriesMap.has(uniqueKey)) {
        entriesMap.set(uniqueKey, {
          key: uniqueKey,
          equipe: eq.nom,
          serie: serieName,
          estDomicile: true,
          adversaire: '—',
          date: undefined,
          heure: undefined,
          lieu: undefined,
          joueurs: [],
          veteran: false,
        });
      }
    });

    const entries = Array.from(entriesMap.values());
    const regular = entries.filter(e => !e.veteran && !isVeteranTeam(e.equipe)).sort((a,b)=>a.equipe.localeCompare(b.equipe));
    const veterans = entries.filter(e => e.veteran || isVeteranTeam(e.equipe)).sort((a,b)=>a.equipe.localeCompare(b.equipe));
    return [...regular, ...veterans];
  }, [saison, matchs, semaine]);

  const formatDate = (date?: string) => {
    if (!date || date === 'jj-mm-aaaa') return 'À venir';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return 'À venir';
      return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
    } catch {
      return 'À venir';
    }
  };

  return (
    <div className="space-y-4 p-3 sm:p-6 max-w-5xl mx-auto">
      {/* En-tête adapté mobile */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-lg sm:text-xl font-semibold">Toutes les sélections du club</h1>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Navigation semaines - Stack sur mobile */}
          <div className="flex items-center gap-2 order-2 sm:order-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSemaine((prev) => Math.max(1, Number(prev || 1) - 1))}
              disabled={!semaine || semaine <= 1}
              aria-label="Semaine précédente"
              className="flex-shrink-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Select
              value={String(semaine || (hasWeekZero ? 0 : 1))}
              onValueChange={(v) => setSemaine(Math.min(maxWeek, Math.max(hasWeekZero ? 0 : 1, Number(v))))}
            >
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Semaine" />
              </SelectTrigger>
              <SelectContent>
                {weeks.map((w) => (
                  <SelectItem key={w} value={String(w)}>{w === 0 ? 'Vétérans/Autres' : `Semaine ${w}`}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSemaine((prev) => Math.min(maxWeek, Number(prev || 1) + 1))}
              disabled={!semaine || semaine >= maxWeek}
              aria-label="Semaine suivante"
              className="flex-shrink-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Badge et bouton retour */}
          <div className="flex items-center gap-2 order-1 sm:order-2">
            <Badge variant="outline" className="text-xs">{hasWeekZero ? `0-${maxWeek}` : `sur ${maxWeek}`}</Badge>
            <Button variant="outline" size="sm" onClick={() => navigate('/espace-membre')} className="whitespace-nowrap">
              <ArrowLeft className="h-4 w-4 mr-1" /> Retour
            </Button>
          </div>
        </div>
      </div>

      <Card className="bg-white border">
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Users className="h-4 w-4 sm:h-5 sm:w-5" /> Sélections par équipe
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {loading ? (
            <div className="text-center py-10 text-gray-500">Chargement…</div>
          ) : error ? (
            <div className="text-center py-10 text-red-600">{error}</div>
          ) : equipesSemaine.length === 0 ? (
            <div className="text-center py-10 text-gray-500">Aucune sélection disponible.</div>
          ) : (
            <Accordion
              type="single"
              collapsible
              className="w-full"
              onValueChange={handleAccordionValueChange}
            >
              {equipesSemaine.map((eq) => (
                <AccordionItem key={eq.key} value={eq.key}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex flex-col gap-2 text-left w-full pr-2">
                      {/* Ligne principale - mobile friendly */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-blue-700 text-sm sm:text-base">{eq.equipe}</span>
                          <Badge variant={eq.estDomicile ? 'default' : 'secondary'} className="text-xs">
                            {eq.estDomicile ? 'Domicile' : 'Extérieur'}
                          </Badge>
                          <span className="text-xs sm:text-sm text-gray-600">vs {eq.adversaire}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs self-start sm:self-center">
                          {eq.joueurs.length} joueur{eq.joueurs.length > 1 ? 's' : ''}
                        </Badge>
                      </div>

                      {/* Ligne des détails - empilée sur mobile */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs text-gray-600">
                        {eq.date && (
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays className="h-3 w-3" /> {formatDate(eq.date)}
                          </span>
                        )}
                        {eq.heure && (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {eq.heure}
                          </span>
                        )}
                        {eq.lieu && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {eq.lieu}
                          </span>
                        )}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    {eq.joueurs.length > 0 ? (
                      <div className="grid grid-cols-1 gap-2 sm:gap-3">
                        {eq.joueurs.map((j: any, i: number) => (
                          <div
                            key={`${eq.key}-${j.id}-${i}`}
                            className={`flex items-center justify-between py-2 px-3 rounded text-sm ${
                              j.wo === 'y' ? 'bg-red-50 border border-red-200' : 'bg-gray-50'
                            }`}
                          >
                            <span className={`truncate flex-1 mr-2 ${j.wo === 'y' ? 'text-red-700 line-through' : ''}`}>
                              {j.nom} ({j.classement || 'N/A'})
                            </span>
                            {j.wo === 'y' && (
                              <Badge variant="destructive" className="text-xs inline-flex items-center flex-shrink-0">
                                <Ban className="h-3 w-3 mr-1" /> WO
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-orange-600 bg-orange-50 p-3 rounded border border-orange-200">
                        Aucune composition définie pour cette équipe.
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
