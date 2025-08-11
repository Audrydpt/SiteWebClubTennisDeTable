/* eslint-disable @typescript-eslint/no-explicit-any,prettier/prettier,@stylistic/indent,no-alert,no-console */
import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  Trash2,
  PlusCircle,
  Save,
  Loader2,
  Calendar,
  Info,
  Swords,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { fetchSaisons, updateSaison, fetchSaisonEnCours } from '@/services/api';
import { Saison, SaisonStatut, Match } from '@/services/type.ts';

export default function UpdateSaison() {
  const [allSaisons, setAllSaisons] = useState<Saison[]>([]);
  const [saison, setSaison] = useState<Saison | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSelecting, setIsSelecting] = useState(false);

  const [nouvelleEquipeClub, setNouvelleEquipeClub] = useState('');
  const [nouvelleSerie, setNouvelleSerie] = useState('');
  const [nouvelleEquipeAdverse, setNouvelleEquipeAdverse] = useState('');

  const [serieCalendrierSelectionnee, setSerieCalendrierSelectionnee] =
    useState('');

  useEffect(() => {
    const chargerDonneesInitiales = async () => {
      setIsLoading(true);
      const data = await fetchSaisons();
      setAllSaisons(data);

      // Utilisons l'API spécifique pour obtenir la saison en cours
      const saisonEnCours = await fetchSaisonEnCours();

      if (saisonEnCours) {
        setSaison(JSON.parse(JSON.stringify(saisonEnCours)));
        if (saisonEnCours.series.length > 0) {
          setSerieCalendrierSelectionnee(saisonEnCours.series[0].id);
        }
        setIsSelecting(false);
      } else {
        setIsSelecting(true);
      }
      setIsLoading(false);
    };
    chargerDonneesInitiales();
  }, []);

  const handleSelectSaison = (id: string) => {
    const saisonTrouvee = allSaisons.find((s) => s.id === id);
    if (saisonTrouvee) {
      setSaison(JSON.parse(JSON.stringify(saisonTrouvee)));
      setSerieCalendrierSelectionnee(saisonTrouvee.series[0]?.id || '');
      setIsSelecting(false);
    }
  };

  const handleUpdate = (champ: keyof Saison, valeur: any) => {
    if (!saison) return;
    setSaison({ ...saison, [champ]: valeur });
  };

  const handleCalendarUpdate = (
    matchId: string,
    field: keyof Match,
    value: any
  ) => {
    if (!saison) return;
    const updatedCalendar = saison.calendrier.map((m) =>
      m.id === matchId ? { ...m, [field]: value } : m
    );
    handleUpdate('calendrier', updatedCalendar);
  };

  const handleAddMatch = (serieId: string, semaine: number) => {
    if (!saison) return;
    const newMatch: Match = {
      id: uuidv4(),
      serieId,
      semaine,
      domicile: '',
      exterieur: '',
      score: '',
      date: '',
    };
    handleUpdate('calendrier', [...saison.calendrier, newMatch]);
  };

  const handleDeleteMatch = (matchId: string) => {
    if (!saison) return;
    handleUpdate(
      'calendrier',
      saison.calendrier.filter((m) => m.id !== matchId)
    );
  };

  const soumettreFormulaire = async () => {
    if (!saison) return;
    try {
      await updateSaison(saison.id, saison);
      alert('Saison mise à jour avec succès !');
      const data = await fetchSaisons();
      setAllSaisons(data);
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-lg">
          Chargement de la saison en cours...
        </span>
      </div>
    );
  }

  if (isSelecting || !saison) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Modifier une saison</h2>
        <p className="text-muted-foreground">
          {allSaisons.length > 0
            ? "Aucune saison n'est 'En cours'. Veuillez en sélectionner une."
            : "Aucune saison n'a été créée."}
        </p>
        <div className="max-w-md">
          <Label>Sélectionnez une saison à modifier</Label>
          <Select onValueChange={handleSelectSaison}>
            <SelectTrigger>
              <SelectValue placeholder="Choisir une saison" />
            </SelectTrigger>
            <SelectContent>
              {allSaisons.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.label} ({s.statut})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          Modifier: {saison.label}{' '}
          <span className="text-sm font-medium text-primary">
            ({saison.statut})
          </span>
        </h2>
        <div>
          <Button
            variant="outline"
            onClick={() => setIsSelecting(true)}
            className="mr-2"
          >
            Changer de saison
          </Button>
          <Button onClick={soumettreFormulaire}>
            <Save className="mr-2 h-4 w-4" />
            Sauvegarder
          </Button>
        </div>
      </div>

      <Tabs defaultValue="infos">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="infos">
            <Info className="mr-2 h-4 w-4" /> Infos Générales
          </TabsTrigger>
          <TabsTrigger value="equipes">
            <Swords className="mr-2 h-4 w-4" /> Équipes & Séries
          </TabsTrigger>
          <TabsTrigger value="calendrier">
            <Calendar className="mr-2 h-4 w-4" /> Calendrier
          </TabsTrigger>
        </TabsList>

        <TabsContent value="infos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Détails de la saison</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="saisonNom">Nom de la saison</Label>
                <Input
                  id="saisonNom"
                  value={saison.label}
                  onChange={(e) => handleUpdate('label', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="saisonStatut">Statut</Label>
                <Select
                  value={saison.statut}
                  onValueChange={(v: SaisonStatut) => handleUpdate('statut', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="En cours">En cours</SelectItem>
                    <SelectItem value="Terminée">Terminée</SelectItem>
                    <SelectItem value="Archivée">Archivée</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="equipes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Équipes du Club</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Input
                  value={nouvelleEquipeClub}
                  onChange={(e) => setNouvelleEquipeClub(e.target.value)}
                  placeholder="Nom de la nouvelle équipe du club"
                />
                <Button
                  onClick={() => {
                    if (nouvelleEquipeClub.trim() === '') return;
                    handleUpdate('equipesClub', [
                      ...saison.equipesClub,
                      { id: uuidv4(), nom: nouvelleEquipeClub, serieId: '' },
                    ]);
                    setNouvelleEquipeClub('');
                  }}
                >
                  Ajouter
                </Button>
              </div>
              <ul className="space-y-2">
                {saison.equipesClub.map((e) => (
                  <li
                    key={e.id}
                    className="flex justify-between items-center bg-gray-50 p-2 rounded"
                  >
                    {e.nom}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleUpdate(
                          'equipesClub',
                          saison.equipesClub.filter((eq) => eq.id !== e.id)
                        )
                      }
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Séries et Adversaires</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={saison.series[0]?.id || 'new-serie'}>
                <TabsList>
                  {saison.series.map((s) => (
                    <TabsTrigger key={s.id} value={s.id}>
                      {s.nom}
                    </TabsTrigger>
                  ))}
                  <TabsTrigger value="new-serie">
                    <PlusCircle className="h-4 w-4" />
                  </TabsTrigger>
                </TabsList>
                {saison.series.map((serie) => (
                  <TabsContent
                    key={serie.id}
                    value={serie.id}
                    className="space-y-4 pt-4"
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold">{serie.nom}</h3>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() =>
                          handleUpdate(
                            'series',
                            saison.series.filter((s) => s.id !== serie.id)
                          )
                        }
                      >
                        Supprimer la série
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={nouvelleEquipeAdverse}
                        onChange={(e) =>
                          setNouvelleEquipeAdverse(e.target.value)
                        }
                        placeholder="Nom équipe adverse"
                      />
                      <Button
                        onClick={() => {
                          if (nouvelleEquipeAdverse.trim() === '') return;

                          const equipeClub = saison.equipesClub.find(
                            (eq) => eq.nom === nouvelleEquipeAdverse
                          );

                          const nouvelleEquipe = {
                            id: equipeClub ? equipeClub.id : uuidv4(),
                            nom: nouvelleEquipeAdverse,
                            serieId: serie.id,
                          };

                          const dejaDansSerie = serie.equipes.some(
                            (eq) => eq.nom === nouvelleEquipeAdverse
                          );

                          const seriesUpdated = saison.series.map((s) =>
                            s.id === serie.id
                              ? {
                                ...s,
                                equipes: dejaDansSerie
                                  ? s.equipes
                                  : [...s.equipes, nouvelleEquipe],
                              }
                              : s
                          );

                          let equipesClubUpdated = saison.equipesClub;
                          if (equipeClub) {
                            equipesClubUpdated = saison.equipesClub.map((eq) =>
                              eq.id === equipeClub.id ? { ...eq, serieId: serie.id } : eq
                            );
                          }

                          // Un seul setSaison pour appliquer les deux modifications
                          setSaison({
                            ...saison,
                            series: seriesUpdated,
                            equipesClub: equipesClubUpdated,
                          });
                          setNouvelleEquipeAdverse('');
                        }}
                      >
                        Ajouter Adversaire
                      </Button>
                    </div>
                    <ul className="space-y-2">
                      {serie.equipes.map((e) => (
                        <li
                          key={e.id}
                          className="flex justify-between items-center bg-gray-50 p-2 rounded"
                        >
                          {e.nom}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const seriesUpdated = saison.series.map((s) =>
                                s.id === serie.id
                                  ? {
                                    ...s,
                                    equipes: s.equipes.filter(
                                      (eq) => eq.id !== e.id
                                    ),
                                  }
                                  : s
                              );
                              handleUpdate('series', seriesUpdated);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </TabsContent>
                ))}
                <TabsContent value="new-serie" className="space-y-4 pt-4">
                  <h3 className="font-semibold">Ajouter une nouvelle série</h3>
                  <div className="flex gap-2">
                    <Input
                      value={nouvelleSerie}
                      onChange={(e) => setNouvelleSerie(e.target.value)}
                      placeholder="Nom de la nouvelle série"
                    />
                    <Button
                      onClick={() => {
                        if (nouvelleSerie.trim() === '') return;
                        handleUpdate('series', [
                          ...saison.series,
                          { id: uuidv4(), nom: nouvelleSerie, equipes: [] },
                        ]);
                        setNouvelleSerie('');
                      }}
                    >
                      Créer Série
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendrier" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Édition du calendrier</CardTitle>
            </CardHeader>
            <CardContent>
              <Label>Sélectionner une série</Label>
              <Select
                value={serieCalendrierSelectionnee}
                onValueChange={setSerieCalendrierSelectionnee}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une série à éditer" />
                </SelectTrigger>
                <SelectContent>
                  {saison.series.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {serieCalendrierSelectionnee && (
            <Accordion type="multiple" className="w-full">
              {Array.from({ length: 22 }, (_, i) => i + 1).map((semaine) => {
                const matchsSemaine = saison.calendrier.filter(
                  (m) =>
                    m.serieId === serieCalendrierSelectionnee &&
                    m.semaine === semaine
                );
                const equipesSerie =
                  saison.series.find(
                    (s) => s.id === serieCalendrierSelectionnee
                  )?.equipes || [];

                return (
                  <AccordionItem value={`semaine-${semaine}`} key={semaine}>
                    <AccordionTrigger>Semaine {semaine}</AccordionTrigger>
                    <AccordionContent className="space-y-3">
                      {matchsSemaine.map((match) => (
                        <div
                          key={match.id}
                          className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center"
                        >
                          <Select
                            value={match.domicile}
                            onValueChange={(v) =>
                              handleCalendarUpdate(match.id, 'domicile', v)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Domicile" />
                            </SelectTrigger>
                            <SelectContent>
                              {equipesSerie.map((e) => (
                                <SelectItem key={e.id} value={e.nom}>
                                  {e.nom}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <div className="text-center font-semibold">vs</div>
                          <Select
                            value={match.exterieur}
                            onValueChange={(v) =>
                              handleCalendarUpdate(match.id, 'exterieur', v)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Extérieur" />
                            </SelectTrigger>
                            <SelectContent>
                              {equipesSerie.map((e) => (
                                <SelectItem key={e.id} value={e.nom}>
                                  {e.nom}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <div className="flex items-center gap-1">
                            <Input
                              type="date"
                              value={match.date}
                              onChange={(e) =>
                                handleCalendarUpdate(
                                  match.id,
                                  'date',
                                  e.target.value
                                )
                              }
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteMatch(match.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleAddMatch(serieCalendrierSelectionnee, semaine)
                        }
                        className="mt-2"
                      >
                        <PlusCircle className="mr-2 h-4 w-4" /> Ajouter un match
                        pour la semaine {semaine}
                      </Button>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
