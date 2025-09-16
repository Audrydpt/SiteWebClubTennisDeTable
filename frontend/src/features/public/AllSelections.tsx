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
import { fetchSaisonEnCours } from '@/services/api';
import { Match, Saison } from '@/services/type';

export default function AllSelections() {
  const navigate = useNavigate();

  const CLUB_KEYWORD = (import.meta.env.VITE_TABT_CLUB_KEYWORD as string)?.toLowerCase() || 'frameries';
  const isClubTeam = (label?: string) => !!label && label.toLowerCase().includes(CLUB_KEYWORD);
  const hasTeamLetter = (label?: string) => !!label && /\s[A-Z]$/.test(label.trim());
  const isVeteranTeam = (label?: string) => !!label && /(vét|vet|veteran|vétéran)/i.test(label);

  const [saison, setSaison] = useState<Saison | null>(null);
  const [matchs, setMatchs] = useState<Match[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [semaine, setSemaine] = useState<number | null>(null);

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
          .reduce((acc: number, m: any) => Math.max(acc, Number(m.semaine || 0)), 0);

        // Fallback: si aucune sélection trouvée, prendre la dernière semaine connue dans les matchs
        const lastWeek = (Array.isArray(merged) ? merged : [])
          .reduce((acc: number, m: any) => Math.max(acc, Number(m.semaine || 0)), 0);

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
    const max = (matchs || []).reduce((acc, m: any) => Math.max(acc, Number(m.semaine || 0)), 0);
    return max || 22;
  }, [matchs]);

  const weeks = useMemo(() => Array.from({ length: maxWeek }, (_, i) => i + 1), [maxWeek]);

  useEffect(() => {
    if (semaine && semaine > maxWeek) {
      setSemaine(maxWeek);
    }
  }, [maxWeek, semaine]);

  const equipesSemaine = useMemo(() => {
    if (!saison || !semaine) return [] as Array<{ key: string; equipe: string; serie: string; estDomicile: boolean; adversaire: string; date?: string; heure?: string; lieu?: string; joueurs: any[] }>;

    const semaineMatches = (matchs || []).filter(m => Number(m.semaine) === Number(semaine));

    const map = new Map<string, { equipe: string; serie: string; estDomicile: boolean; adversaire: string; date?: string; heure?: string; lieu?: string; joueurs: any[] }>();

    semaineMatches.forEach((m) => {
      const clubHome = isClubTeam(m.domicile);
      const clubAway = isClubTeam(m.exterieur);
      if (!clubHome && !clubAway) return;

      const estDomicile = clubHome;
      const equipe = estDomicile ? m.domicile : m.exterieur;
      if (!hasTeamLetter(equipe) && !isVeteranTeam(equipe)) return; // inclure vétérans même sans lettre

      const serie = saison.series?.find((s) => s.id === m.serieId);
      const serieName = serie ? serie.nom : (/^\d+$/.test(String(m.serieId || '')) ? `Division ${m.serieId}` : String(m.serieId || 'Série'));

      const adversaire = estDomicile ? m.exterieur : m.domicile;
      const joueurs = estDomicile ? (m.joueursDomicile || m.joueur_dom || []) : (m.joueursExterieur || m.joueur_ext || []);

      map.set(equipe, {
        equipe,
        serie: serieName,
        estDomicile,
        adversaire,
        date: m.date,
        heure: m.heure,
        lieu: (m as any).lieu,
        joueurs: Array.isArray(joueurs) ? joueurs : [],
      });
    });

    // Ajouter les équipes du club (même sans match cette semaine) mais inclure vétérans sans lettre
    (saison.equipesClub || []).forEach((eq: any) => {
      if (!hasTeamLetter(eq.nom) && !isVeteranTeam(eq.nom)) return;
      if (map.has(eq.nom)) return;
      const serie = saison.series?.find((s) => s.id === eq.serieId);
      const serieName = serie ? serie.nom : 'Série';
      map.set(eq.nom, {
        equipe: eq.nom,
        serie: serieName,
        estDomicile: true,
        adversaire: '—',
        date: undefined,
        heure: undefined,
        lieu: undefined,
        joueurs: [],
      });
    });

    const all = Array.from(map.values());
    const regular = all.filter(e => !isVeteranTeam(e.equipe)).sort((a, b) => a.equipe.localeCompare(b.equipe));
    const veterans = all.filter(e => isVeteranTeam(e.equipe)).sort((a, b) => a.equipe.localeCompare(b.equipe));
    const ordered = [...regular, ...veterans];

    return ordered.map((e, idx) => ({ key: `${idx}-${e.equipe}`, ...e }));
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
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Toutes les sélections du club</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSemaine((prev) => Math.max(1, Number(prev || 1) - 1))}
            disabled={!semaine || semaine <= 1}
            aria-label="Semaine précédente"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Select
            value={String(semaine || 1)}
            onValueChange={(v) => setSemaine(Math.min(maxWeek, Math.max(1, Number(v))))}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Semaine" />
            </SelectTrigger>
            <SelectContent>
              {weeks.map((w) => (
                <SelectItem key={w} value={String(w)}>Semaine {w}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSemaine((prev) => Math.min(maxWeek, Number(prev || 1) + 1))}
            disabled={!semaine || semaine >= maxWeek}
            aria-label="Semaine suivante"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Badge variant="outline">sur {maxWeek}</Badge>
          <Button variant="outline" size="sm" onClick={() => navigate('/espace-membre')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Retour
          </Button>
        </div>
      </div>

      <Card className="bg-white border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5" /> Sélections par équipe
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-10 text-gray-500">Chargement…</div>
          ) : error ? (
            <div className="text-center py-10 text-red-600">{error}</div>
          ) : equipesSemaine.length === 0 ? (
            <div className="text-center py-10 text-gray-500">Aucune sélection disponible.</div>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {equipesSemaine.map((eq) => (
                <AccordionItem key={eq.key} value={eq.key}>
                  <AccordionTrigger>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-2 text-left">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-blue-700">{eq.equipe}</span>
                        <Badge variant="outline" className="text-xs">{eq.serie}</Badge>
                        <Badge variant={eq.estDomicile ? 'default' : 'secondary'} className="text-xs">
                          {eq.estDomicile ? 'Domicile' : 'Extérieur'}
                        </Badge>
                        <span className="text-sm text-gray-600">vs {eq.adversaire}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-600">
                        {eq.date && (
                          <span className="inline-flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {formatDate(eq.date)}</span>
                        )}
                        {eq.heure && (
                          <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {eq.heure}</span>
                        )}
                        {eq.lieu && (
                          <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {eq.lieu}</span>
                        )}
                        <Badge variant="secondary" className="text-xs">{eq.joueurs.length} joueur{eq.joueurs.length > 1 ? 's' : ''}</Badge>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    {eq.joueurs.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {eq.joueurs.map((j: any, i: number) => (
                          <div key={`${eq.key}-${j.id}-${i}`} className={`flex items-center justify-between py-2 px-3 rounded ${j.wo === 'y' ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
                            <span className={`truncate flex-1 mr-2 ${j.wo === 'y' ? 'text-red-700 line-through' : ''}`}>
                              {j.nom} ({j.classement || 'N/A'})
                            </span>
                            {j.wo === 'y' && (
                              <Badge variant="destructive" className="text-xs inline-flex items-center"><Ban className="h-3 w-3 mr-1" /> WO</Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-orange-600 bg-orange-50 p-3 rounded border border-orange-200">Aucune composition définie pour cette équipe.</div>
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
