/* eslint-disable */
import { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Loader2, MapPin, Building2, Phone, Calendar, Info, Trash2, Download } from 'lucide-react';
import {  fetchSaisonEnCours, upsertInfosPersonnalisees, deleteInfosPersonnalisees, updateSaison } from '@/services/api';
import { fetchClubsWithVenues, fetchMatches } from '@/services/tabt';
import type { Saison, ClubInfo, VenueInfo } from '@/services/type';

export default function VenuesAndMatchInfos() {
  const [isLoading, setIsLoading] = useState(true);
  const [venues, setVenues] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [saison, setSaison] = useState<Saison | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState('');
  // Inclure la semaine pour pouvoir trier/filtrer
  const [matchesOptions, setMatchesOptions] = useState<{ id: string; label: string; semaine: number }[]>([]);
  const [form, setForm] = useState({
    salle: '',
    adresse: '',
    telephone: '',
    email: '',
    horaire: '',
    commentaire: '',
  });
  const [saving, setSaving] = useState(false);
  const [province, setProvince] = useState<'H' | 'Lx' | 'L' | 'BBW' | 'N'>('H');
  const [updatingTabt, setUpdatingTabt] = useState(false);
  // Nouveau: filtre par semaine (0 = toutes)
  const [selectedWeek, setSelectedWeek] = useState<number>(0);
  // Map pour afficher le NOM de la division au lieu de l'ID
  const [divisionNameById, setDivisionNameById] = useState<Record<string, string>>({});

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [clubsRes, s] = await Promise.all([
          fetchClubsWithVenues({ province }),
          fetchSaisonEnCours(),
        ]);
        setVenues(Array.isArray(clubsRes?.clubs) ? clubsRes.clubs : []);
        const saisonActive = s || null;
        setSaison(saisonActive);

        // Charger les noms de division via TABT pour enrichir les libellés
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
        } catch (e) {
          // Non bloquant si l'appel échoue
          console.warn('Impossible de charger les noms de divisions depuis TABT:', e);
        }

        // Construire la liste des matchs: priorité calendrier saison
        if (saisonActive && Array.isArray(saisonActive.calendrier) && saisonActive.calendrier.length > 0) {
          const getSerieName = (serieId: string) => {
            // 1) Nom depuis TABT si dispo
            if (divisionNameById[serieId]) return divisionNameById[serieId];
            // 2) Nom depuis saison.series
            const fromSaison = saisonActive.series.find((ss: { id: string; nom?: string }) => ss.id === serieId)?.nom;
            if (fromSaison) return fromSaison;
            // 3) Fallback: Division <ID>
            return `Division ${serieId}`;
          };
          const fmtDate = (d?: string) => {
            if (!d) return '';
            const t = d.split('T')[0];
            try { return new Date(t).toLocaleDateString('fr-FR'); } catch { return t; }
          };
          const list = saisonActive.calendrier
            .slice()
            .sort(
              (a: { semaine: number }, b: { semaine: number }) =>
                a.semaine - b.semaine
            );
          setMatchesOptions(
            list.map(
              (m: {
                id: any;
                serieId: string;
                semaine: number;
                domicile: any;
                exterieur: any;
                date: string | undefined;
              }) => ({
                id: m.id,
                semaine: m.semaine,
                label: `${getSerieName(m.serieId)} • Semaine ${m.semaine} • ${m.domicile} vs ${m.exterieur}${m.date ? ' • ' + fmtDate(m.date) : ''}`,
              })
            )
          );
        }
      } catch (e) {
        console.error('Erreur chargement venues/saison', e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [province]);

  // Recalculer les options si les noms de division arrivent après le premier rendu
  useEffect(() => {
    if (!saison || !Array.isArray(saison.calendrier) || saison.calendrier.length === 0) return;
    const getSerieName = (serieId: string) => {
      if (divisionNameById[serieId]) return divisionNameById[serieId];
      const fromSaison = saison.series.find((ss: { id: string; nom?: string }) => ss.id === serieId)?.nom;
      if (fromSaison) return fromSaison;
      return `Division ${serieId}`;
    };
    const fmtDate = (d?: string) => {
      if (!d) return '';
      const t = d.split('T')[0];
      try { return new Date(t).toLocaleDateString('fr-FR'); } catch { return t; }
    };
    const list = saison.calendrier.slice().sort((a: any, b: any) => a.semaine - b.semaine);
    setMatchesOptions(list.map((m: any) => ({
      id: m.id,
      semaine: m.semaine,
      label: `${getSerieName(m.serieId)} • Semaine ${m.semaine} • ${m.domicile} vs ${m.exterieur}${m.date ? ' • ' + fmtDate(m.date) : ''}`,
    })));
  }, [divisionNameById, saison]);

  const filteredVenues = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return venues;
    return venues.filter((c: any) =>
      [c.clubName, c.clubLongName, ...(c.venues?.map((v: any) => v.fullAddress) || [])]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [venues, filter]);

  // Extraire la liste des semaines disponibles à partir des options, triée croissante
  const availableWeeks = useMemo(() => {
    const set = new Set<number>();
    matchesOptions.forEach((o) => set.add(o.semaine));
    return Array.from(set).sort((a, b) => a - b);
  }, [matchesOptions]);

  // Si la semaine sélectionnée n'existe plus (changement de saison/province), réinitialiser
  useEffect(() => {
    if (selectedWeek !== 0 && !availableWeeks.includes(selectedWeek)) {
      setSelectedWeek(0);
    }
  }, [availableWeeks, selectedWeek]);

  useEffect(() => {
    if (!saison || !selectedMatchId) return;
    const existing = saison.infosPersonnalisees?.find(i => i.matchId === selectedMatchId);
    setForm({
      salle: existing?.salle || '',
      adresse: existing?.adresse || '',
      telephone: existing?.telephone || '',
      email: existing?.email || '',
      horaire: existing?.horaire || '',
      commentaire: existing?.commentaire || '',
    });
  }, [saison, selectedMatchId]);

  const onSave = async () => {
    if (!saison || !selectedMatchId) return;
    setSaving(true);
    try {
      await upsertInfosPersonnalisees(saison.id, {
        matchId: selectedMatchId,
        clubAdverse: deriveAdverseClubName(selectedMatchId, saison),
        ...form,
      });
      const refreshed = await fetchSaisonEnCours();
      setSaison(refreshed);
    } catch (e) {
      console.error('Erreur sauvegarde infos perso', e);
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!saison || !selectedMatchId) return;
    setSaving(true);
    try {
      await deleteInfosPersonnalisees(saison.id, selectedMatchId);
      const refreshed = await fetchSaisonEnCours();
      setSaison(refreshed);
      setForm({ salle: '', adresse: '', telephone: '', email: '', horaire: '', commentaire: '' });
    } catch (e) {
      console.error('Erreur suppression infos perso', e);
    } finally {
      setSaving(false);
    }
  };

  const onUpdateFromTabt = async () => {
    if (!saison) return;
    setUpdatingTabt(true);
    try {
      const res = await fetchClubsWithVenues({ province });
      const nowIso = new Date().toISOString();

      const mapped: ClubInfo[] = (res?.clubs || []).map((c: any) => ({
        id: c.clubId,
        nom: c.clubName,
        clubId: c.clubId,
        clubLongName: c.clubLongName,
        venues: (c.venues || []).map((v: any) => ({
          name: v.name,
          fullAddress: v.fullAddress,
          phone: v.phone,
          comment: v.comment,
        })) as VenueInfo[],
      }));

      const updated = {
        ...saison,
        clubsTabt: mapped,
        dateMAJClubsTabt: nowIso,
      } as Saison;

      const saved = await updateSaison(saison.id, updated);
      setSaison(saved);
    } catch (e) {
      console.error('Erreur MAJ clubs TABT', e);
    } finally {
      setUpdatingTabt(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px] sm:min-h-[300px]">
        <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
      {/* Venues */}
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-base sm:text-lg">
              <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">Adresses des clubs (Province {province})</span>
              <span className="sm:hidden">Clubs ({province})</span>
            </span>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Select value={province} onValueChange={(v) => setProvince(v as any)}>
                <SelectTrigger className="w-full sm:w-[120px] text-sm">
                  <SelectValue placeholder="Province" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="H">Hainaut</SelectItem>
                  <SelectItem value="Lx">Luxembourg</SelectItem>
                  <SelectItem value="L">Liège</SelectItem>
                  <SelectItem value="BBW">Brabant WB</SelectItem>
                  <SelectItem value="N">Namur</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={onUpdateFromTabt} disabled={updatingTabt} className="text-xs sm:text-sm">
                {updatingTabt ? <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" /> : <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />}
                <span className="hidden sm:inline">Mettre à jour depuis TABT</span>
                <span className="sm:hidden">MAJ TABT</span>
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          <Input
            placeholder="Rechercher club, ville ou adresse..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-sm"
          />
          <div className="space-y-3 max-h-[50vh] sm:max-h-[60vh] overflow-y-auto">
            {filteredVenues.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-4">Aucun résultat</div>
            )}
            {filteredVenues.map((club: any) => (
              <div key={club.clubId} className="p-3 border rounded-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm sm:text-base truncate">{club.clubName}</div>
                    <div className="text-xs text-muted-foreground truncate">{club.clubLongName}</div>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">{club.venueCount} salle(s)</Badge>
                </div>
                <div className="mt-2 space-y-2">
                  {(club.venues || []).map((v: any, idx: number) => (
                    <div key={idx} className="text-sm grid grid-cols-1 gap-1">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                        <span className="truncate">{v.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                        <span className="truncate">{v.fullAddress}</span>
                      </div>
                      {v.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                          <span className="truncate">{v.phone}</span>
                        </div>
                      )}
                      {v.comment && (
                        <div className="flex items-center gap-2">
                          <Info className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                          <span className="truncate">{v.comment}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Infos exceptionnelles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">Infos exceptionnelles par match</span>
            <span className="sm:hidden">Infos match</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          {/* Sélecteur de semaine pour trier/filtrer les matchs */}
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm">Semaine</Label>
            <Select value={String(selectedWeek)} onValueChange={(v) => setSelectedWeek(Number(v))}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Toutes les semaines" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Toutes</SelectItem>
                {availableWeeks.map((w) => (
                  <SelectItem key={w} value={String(w)}>Semaine {w}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs sm:text-sm">Match</Label>
            <Select value={selectedMatchId} onValueChange={setSelectedMatchId}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Choisir un match" />
              </SelectTrigger>
              <SelectContent className="max-h-[40vh] sm:max-h-[50vh]">
                {matchesOptions
                  .filter((m) => selectedWeek === 0 || m.semaine === selectedWeek)
                  .map((m) => (
                    <SelectItem key={m.id} value={m.id} className="text-xs sm:text-sm">{m.label}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {selectedMatchId && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs sm:text-sm">Salle</Label>
                <Input value={form.salle} onChange={(e) => setForm({ ...form, salle: e.target.value })} className="text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs sm:text-sm">Horaire spécial</Label>
                <Input value={form.horaire} onChange={(e) => setForm({ ...form, horaire: e.target.value })} className="text-sm" />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs sm:text-sm">Adresse</Label>
                <Input value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} className="text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs sm:text-sm">Téléphone</Label>
                <Input value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} className="text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs sm:text-sm">Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="text-sm" />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs sm:text-sm">Commentaire</Label>
                <Input value={form.commentaire} onChange={(e) => setForm({ ...form, commentaire: e.target.value })} className="text-sm" />
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:col-span-2 sm:justify-end">
                <Button variant="destructive" onClick={onDelete} disabled={saving} className="text-sm w-full sm:w-auto">
                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Supprimer</span>
                  <span className="sm:hidden">Suppr.</span>
                </Button>
                <Button onClick={onSave} disabled={saving} className="text-sm w-full sm:w-auto">
                  {saving ? <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" /> : null}
                  <span className="hidden sm:inline">Enregistrer</span>
                  <span className="sm:hidden">Save</span>
                </Button>
              </div>
            </div>
          )}

          {!selectedMatchId && (
            <div className="text-sm text-muted-foreground text-center py-4">
              <span className="hidden sm:inline">Sélectionnez un match pour encoder des infos exceptionnelles.</span>
              <span className="sm:hidden">Choisir un match</span>
            </div>
          )}

          {/* Aide */}
          <div className="mt-2 text-xs text-muted-foreground bg-blue-50 p-2 sm:p-3 rounded">
            <span className="hidden sm:inline">Ces informations s'afficheront automatiquement dans l'espace membre (HomeLogged) pour le match sélectionné.</span>
            <span className="sm:hidden">Infos visibles dans l'espace membre</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function deriveAdverseClubName(matchId: string, saison: Saison): string {
  const m = saison.calendrier.find(mm => mm.id === matchId);
  if (!m) return '';
  const isHome = (m.domicile || '').toLowerCase().includes(((import.meta.env.VITE_TABT_CLUB_KEYWORD as string) || 'frameries').toLowerCase());
  const team = isHome ? m.exterieur : m.domicile;
  return team
    .replace(/\s+[A-Z]$/, '')
    .replace(/\s+\d+$/, '')
    .replace(/\s+(Dame|Dames)$/i, '')
    .replace(/\s+(Vét\.|Veteran)$/i, '')
    .trim();
}
