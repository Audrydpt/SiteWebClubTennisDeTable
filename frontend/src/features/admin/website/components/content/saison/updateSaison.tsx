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
  X,
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
  const [serieEquipeSelectionnee, setSerieEquipeSelectionnee] = useState('');

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
          setSerieEquipeSelectionnee(saisonEnCours.series[0].id);
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
      setSerieEquipeSelectionnee(saisonTrouvee.series[0]?.id || '');
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
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h2 className="text-xl sm:text-2xl font-bold">
          Modifier: {saison.label}{' '}
          <span className="text-xs sm:text-sm font-medium text-primary block sm:inline">
            ({saison.statut})
          </span>
        </h2>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={() => setIsSelecting(true)}
            className="w-full sm:w-auto text-sm"
          >
            Changer de saison
          </Button>
          <Button onClick={soumettreFormulaire} className="w-full sm:w-auto text-sm">
            <Save className="mr-2 h-4 w-4" />
            Sauvegarder
          </Button>
        </div>
      </div>

      <Tabs defaultValue="infos">
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger value="infos" className="text-xs sm:text-sm px-1 sm:px-3">
            <Info className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Infos Générales</span>
            <span className="sm:hidden">Infos</span>
          </TabsTrigger>
          <TabsTrigger value="equipes" className="text-xs sm:text-sm px-1 sm:px-3">
            <Swords className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Équipes & Séries</span>
            <span className="sm:hidden">Équipes</span>
          </TabsTrigger>
          <TabsTrigger value="calendrier" className="text-xs sm:text-sm px-1 sm:px-3">
            <Calendar className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Calendrier</span>
            <span className="sm:hidden">Cal.</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="infos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Détails de la saison</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 sm:p-6">
              <div>
                <Label htmlFor="saisonNom" className="text-sm">Nom de la saison</Label>
                <Input
                  id="saisonNom"
                  value={saison.label}
                  onChange={(e) => handleUpdate('label', e.target.value)}
                  className="text-sm"
                />
              </div>
              <div>
                <Label htmlFor="saisonStatut" className="text-sm">Statut</Label>
                <Select
                  value={saison.statut}
                  onValueChange={(v: SaisonStatut) => handleUpdate('statut', v)}
                >
                  <SelectTrigger className="text-sm">
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
              <CardTitle className="text-lg sm:text-xl">Équipes du Club</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row gap-2 mb-4">
                <Input
                  value={nouvelleEquipeClub}
                  onChange={(e) => setNouvelleEquipeClub(e.target.value)}
                  placeholder="Nom de la nouvelle équipe du club"
                  className="text-sm"
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
                  className="w-full sm:w-auto text-sm"
                >
                  Ajouter
                </Button>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {saison.equipesClub.map((e) => (
                  <div
                    key={e.id}
                    className="flex justify-between items-center bg-gray-50 p-2 rounded text-sm"
                  >
                    <span className="truncate flex-1 mr-2">{e.nom}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleUpdate(
                          'equipesClub',
                          saison.equipesClub.filter((eq) => eq.id !== e.id)
                        )
                      }
                      className="h-8 w-8 p-0 shrink-0"
                    >
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Séries et Adversaires</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-4">
              {/* Sélecteur de série */}
              <div>
                <Label className="text-sm">Série à gérer</Label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Select
                    value={serieEquipeSelectionnee}
                    onValueChange={setSerieEquipeSelectionnee}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Choisir une série" />
                    </SelectTrigger>
                    <SelectContent>
                      {saison.series.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => {
                      if (nouvelleSerie.trim() === '') return;
                      const newSerie = { id: uuidv4(), nom: nouvelleSerie, equipes: [] };
                      handleUpdate('series', [...saison.series, newSerie]);
                      setSerieEquipeSelectionnee(newSerie.id);
                      setNouvelleSerie('');
                    }}
                    className="w-full sm:w-auto text-sm"
                  >
                    <PlusCircle className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                    Nouvelle série
                  </Button>
                </div>
              </div>

              {/* Champ pour créer une nouvelle série */}
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  value={nouvelleSerie}
                  onChange={(e) => setNouvelleSerie(e.target.value)}
                  placeholder="Nom de la nouvelle série"
                  className="text-sm"
                />
              </div>

              {/* Gestion de la série sélectionnée */}
              {serieEquipeSelectionnee && (
                <>
                  {(() => {
                    const serieActuelle = saison.series.find(s => s.id === serieEquipeSelectionnee);
                    if (!serieActuelle) return null;

                    return (
                      <div className="border rounded-lg p-4 space-y-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                          <h4 className="font-semibold text-base">{serieActuelle.nom}</h4>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              handleUpdate(
                                'series',
                                saison.series.filter((s) => s.id !== serieActuelle.id)
                              );
                              setSerieEquipeSelectionnee('');
                            }}
                            className="w-full sm:w-auto text-sm"
                          >
                            <Trash2 className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                            Supprimer la série
                          </Button>
                        </div>

                        {/* Ajouter équipe adverse */}
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Input
                            value={nouvelleEquipeAdverse}
                            onChange={(e) => setNouvelleEquipeAdverse(e.target.value)}
                            placeholder="Nom équipe adverse"
                            className="text-sm"
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
                                serieId: serieActuelle.id,
                              };

                              const dejaDansSerie = serieActuelle.equipes.some(
                                (eq) => eq.nom === nouvelleEquipeAdverse
                              );

                              if (dejaDansSerie) return;

                              const seriesUpdated = saison.series.map((s) =>
                                s.id === serieActuelle.id
                                  ? { ...s, equipes: [...s.equipes, nouvelleEquipe] }
                                  : s
                              );

                              let equipesClubUpdated = saison.equipesClub;
                              if (equipeClub) {
                                equipesClubUpdated = saison.equipesClub.map((eq) =>
                                  eq.id === equipeClub.id ? { ...eq, serieId: serieActuelle.id } : eq
                                );
                              }

                              setSaison({
                                ...saison,
                                series: seriesUpdated,
                                equipesClub: equipesClubUpdated,
                              });
                              setNouvelleEquipeAdverse('');
                            }}
                            className="w-full sm:w-auto text-sm"
                          >
                            <PlusCircle className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                            Ajouter
                          </Button>
                        </div>

                        {/* Liste des équipes */}
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          <Label className="text-sm font-medium">Équipes de la série ({serieActuelle.equipes.length})</Label>
                          {serieActuelle.equipes.map((e) => (
                            <div
                              key={e.id}
                              className="flex justify-between items-center bg-gray-50 p-2 rounded text-sm"
                            >
                              <span className="truncate flex-1 mr-2">{e.nom}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const seriesUpdated = saison.series.map((s) =>
                                    s.id === serieActuelle.id
                                      ? {
                                          ...s,
                                          equipes: s.equipes.filter((eq) => eq.id !== e.id),
                                        }
                                      : s
                                  );
                                  handleUpdate('series', seriesUpdated);
                                }}
                                className="h-6 w-6 p-0 shrink-0"
                              >
                                <X className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                              </Button>
                            </div>
                          ))}
                          {serieActuelle.equipes.length === 0 && (
                            <p className="text-gray-400 text-xs italic text-center py-2">
                              Aucune équipe dans cette série
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendrier" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Édition du calendrier</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <Label className="text-sm">Sélectionner une série</Label>
              <Select
                value={serieCalendrierSelectionnee}
                onValueChange={setSerieCalendrierSelectionnee}
              >
                <SelectTrigger className="text-sm">
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
            <div className="max-h-[60vh] overflow-y-auto">
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
                      <AccordionTrigger className="text-sm">Semaine {semaine}</AccordionTrigger>
                      <AccordionContent className="space-y-3">
                        {matchsSemaine.map((match) => (
                          <div
                            key={match.id}
                            className="grid grid-cols-1 gap-2"
                          >
                            <div className="grid grid-cols-3 gap-2 items-center">
                              <Select
                                value={match.domicile}
                                onValueChange={(v) =>
                                  handleCalendarUpdate(match.id, 'domicile', v)
                                }
                              >
                                <SelectTrigger className="text-xs sm:text-sm">
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
                              <div className="text-center font-semibold text-xs sm:text-sm">vs</div>
                              <Select
                                value={match.exterieur}
                                onValueChange={(v) =>
                                  handleCalendarUpdate(match.id, 'exterieur', v)
                                }
                              >
                                <SelectTrigger className="text-xs sm:text-sm">
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
                            </div>
                            <div className="flex items-center gap-2">
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
                                className="text-xs sm:text-sm flex-1"
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteMatch(match.id)}
                                className="h-8 w-8 shrink-0"
                              >
                                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
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
                          className="mt-2 w-full text-xs sm:text-sm"
                        >
                          <PlusCircle className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                          Ajouter un match pour la semaine {semaine}
                        </Button>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
