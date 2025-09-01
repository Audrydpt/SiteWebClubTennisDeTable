/* eslint-disable */
import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Trash2, PlusCircle, Save, Loader2, Calendar, Info, Swords, X, ArrowLeft, Building, Edit } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { fetchSaisons, updateSaison, fetchSaisonEnCours } from '@/services/api';
import type { Saison, SaisonStatut, Match } from '@/services/type.ts';

export default function UpdateSaison() {
  // États principaux
  const [allSaisons, setAllSaisons] = useState<Saison[]>([]);
  const [saison, setSaison] = useState<Saison | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSelecting, setIsSelecting] = useState(false);

  // États pour les formulaires
  const [nouvelleEquipeClub, setNouvelleEquipeClub] = useState('');
  const [nouvelleSerie, setNouvelleSerie] = useState('');
  const [nouvelleEquipeAdverse, setNouvelleEquipeAdverse] = useState('');
  const [serieCalendrierSelectionnee, setSerieCalendrierSelectionnee] = useState('');
  const [serieEquipeSelectionnee, setSerieEquipeSelectionnee] = useState('');

  // États pour la gestion des infos clubs
  const [clubSelectionne, setClubSelectionne] = useState('');
  const [infosClub, setInfosClub] = useState({
    nom: '',
    localite: '',
    salle: '',
    adresse: '',
    telephone: '',
    email: '',
    site: '',
  });

  // Chargement initial des données
  useEffect(() => {
    const chargerDonneesInitiales = async () => {
      setIsLoading(true);
      try {
        const data = await fetchSaisons();
        setAllSaisons(data);

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
      } catch (error) {
        console.error('Erreur lors du chargement:', error);
      } finally {
        setIsLoading(false);
      }
    };
    chargerDonneesInitiales();
  }, []);

  // Gestionnaires d'événements
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

  const handleCalendarUpdate = (matchId: string, field: keyof Match, value: any) => {
    if (!saison) return;
    const updatedCalendar = saison.calendrier.map((m) => (m.id === matchId ? { ...m, [field]: value } : m));
    handleUpdate('calendrier', updatedCalendar);
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

  // Fonctions utilitaires pour les équipes et séries
  const ajouterEquipeClub = () => {
    if (!saison || nouvelleEquipeClub.trim() === '') return;
    handleUpdate('equipesClub', [...saison.equipesClub, { id: uuidv4(), nom: nouvelleEquipeClub, serieId: '' }]);
    setNouvelleEquipeClub('');
  };

  const supprimerEquipeClub = (equipeId: string) => {
    if (!saison) return;
    handleUpdate(
      'equipesClub',
      saison.equipesClub.filter((eq) => eq.id !== equipeId),
    );
  };

  const creerNouvelleSerie = () => {
    if (!saison || nouvelleSerie.trim() === '') return;
    const newSerie = {
      id: uuidv4(),
      nom: nouvelleSerie,
      equipes: [],
      saisonId: saison.id,
    };
    handleUpdate('series', [...saison.series, newSerie]);
    setSerieEquipeSelectionnee(newSerie.id);
    setNouvelleSerie('');
  };

  const ajouterEquipeAdverse = (serieId: string) => {
    if (!saison || nouvelleEquipeAdverse.trim() === '') return;

    const serieActuelle = saison.series.find((s) => s.id === serieId);
    if (!serieActuelle) return;

    const equipeClub = saison.equipesClub.find((eq) => eq.nom === nouvelleEquipeAdverse);
    const dejaDansSerie = serieActuelle.equipes.some((eq) => eq.nom === nouvelleEquipeAdverse);

    if (dejaDansSerie) return;

    const nouvelleEquipe = {
      id: equipeClub ? equipeClub.id : uuidv4(),
      nom: nouvelleEquipeAdverse,
      serieId: serieActuelle.id,
    };

    const seriesUpdated = saison.series.map((s) =>
      s.id === serieActuelle.id ? { ...s, equipes: [...s.equipes, nouvelleEquipe] } : s,
    );

    let equipesClubUpdated = saison.equipesClub;
    if (equipeClub) {
      equipesClubUpdated = saison.equipesClub.map((eq) =>
        eq.id === equipeClub.id ? { ...eq, serieId: serieActuelle.id } : eq,
      );
    }

    setSaison({ ...saison, series: seriesUpdated, equipesClub: equipesClubUpdated });
    setNouvelleEquipeAdverse('');
  };

  const ajouterMatch = (serieId: string, semaine: number) => {
    if (!saison) return;
    const newMatch: Match = {
      id: uuidv4(),
      serieId,
      semaine,
      domicile: '',
      exterieur: '',
      score: '',
      date: '',
      saisonId: saison.id,
    };
    handleUpdate('calendrier', [...saison.calendrier, newMatch]);
  };

  const supprimerMatch = (matchId: string) => {
    if (!saison) return;
    handleUpdate(
      'calendrier',
      saison.calendrier.filter((m) => m.id !== matchId),
    );
  };


  // Fonction pour obtenir les clubs adverses uniques
  const getClubsAdversesUniques = () => {
    if (!saison) return [];

    const clubsMap = new Map<string, string[]>();

    // Grouper les équipes par nom de club (en extrayant le nom du club à partir du nom de l'équipe)
    saison.series.forEach(serie => {
      serie.equipes
        .filter(equipe => !saison.equipesClub.some(clubTeam => clubTeam.nom === equipe.nom))
        .forEach(equipe => {
          // Extraire le nom du club (enlever les suffixes comme "A", "B", "1", "2", etc.)
          const nomClub = extraireNomClub(equipe.nom);

          if (!clubsMap.has(nomClub)) {
            clubsMap.set(nomClub, []);
          }
          clubsMap.get(nomClub)!.push(equipe.nom);
        });
    });

    return Array.from(clubsMap.entries()).map(([nomClub, equipes]) => ({
      nom: nomClub,
      equipes,
    }));
  };

  // Fonction utilitaire pour extraire le nom du club
  const extraireNomClub = (nomEquipe: string): string => {
    // Enlever les suffixes communs (A, B, C, 1, 2, 3, Dame, Dames, Vét., etc.)
    return nomEquipe
      .replace(/\s+[A-Z]$/, '') // Enlever " A", " B", etc.
      .replace(/\s+\d+$/, '') // Enlever " 1", " 2", etc.
      .replace(/\s+(Dame|Dames)$/, '') // Enlever " Dame" ou " Dames"
      .replace(/\s+(Vét\.|Veteran)$/, '') // Enlever " Vét." ou " Veteran"
      .trim();
  };

  // Nouvelle fonction pour mettre à jour les infos d'un club
  const mettreAJourInfosClub = () => {
    if (!saison || !clubSelectionne) return;

    // Initialiser le tableau clubs s'il n'existe pas
    const clubsExistants = saison.clubs || [];

    // Vérifier si le club existe déjà
    const clubExistant = clubsExistants.find(c => c.nom === clubSelectionne);

    let clubsUpdated;
    if (clubExistant) {
      // Mettre à jour le club existant
      clubsUpdated = clubsExistants.map(club =>
        club.nom === clubSelectionne
          ? {
              ...club,
              nom: clubSelectionne,
              localite: infosClub.localite,
              salle: infosClub.salle,
              adresse: infosClub.adresse,
              telephone: infosClub.telephone,
              email: infosClub.email,
              site: infosClub.site,
            }
          : club
      );
    } else {
      // Ajouter un nouveau club
      clubsUpdated = [...clubsExistants, {
        id: uuidv4(),
        nom: clubSelectionne,
        localite: infosClub.localite,
        salle: infosClub.salle,
        adresse: infosClub.adresse,
        telephone: infosClub.telephone,
        email: infosClub.email,
        site: infosClub.site,
      }];
    }

    setSaison({ ...saison, clubs: clubsUpdated });

    // Réinitialiser le formulaire
    setInfosClub({
      nom: '',
      localite: '',
      salle: '',
      adresse: '',
      telephone: '',
      email: '',
      site: '',
    });
    setClubSelectionne('');

    alert('Informations du club mises à jour avec succès !');
  };

  // Fonction pour charger les infos d'un club
  const chargerInfosClub = (nomClub: string) => {
    if (!saison) return;

    const club = saison.clubs?.find(c => c.nom === nomClub);
    if (club) {
      setInfosClub({
        nom: club.nom,
        localite: club.localite || '',
        salle: club.salle || '',
        adresse: club.adresse || '',
        telephone: club.telephone || '',
        email: club.email || '',
        site: club.site || '',
      });
    } else {
      // Si pas d'infos existantes, réinitialiser avec le nom du club
      setInfosClub({
        nom: nomClub,
        localite: '',
        salle: '',
        adresse: '',
        telephone: '',
        email: '',
        site: '',
      });
    }
  };

  // Écrans de chargement et sélection
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-lg font-medium">Chargement de la saison en cours...</p>
        </div>
      </div>
    );
  }

  if (isSelecting || !saison) {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Modifier une saison</h1>
          <p className="text-muted-foreground text-lg">
            {allSaisons.length > 0
              ? "Aucune saison n'est 'En cours'. Veuillez en sélectionner une."
              : "Aucune saison n'a été créée."}
          </p>
        </div>

        {allSaisons.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Sélectionner une saison</CardTitle>
            </CardHeader>
            <CardContent>
              <Select onValueChange={handleSelectSaison}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choisir une saison à modifier" />
                </SelectTrigger>
                <SelectContent>
                  {allSaisons.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      <div className="flex justify-between items-center w-full">
                        <span>{s.label}</span>
                        <span className="text-sm text-muted-foreground ml-2">({s.statut})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Interface principale
  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{saison.label}</h1>
          <p className="text-muted-foreground">
            Statut: <span className="font-medium text-primary">{saison.statut}</span>
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={() => setIsSelecting(true)} className="w-full sm:w-auto">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Changer de saison
          </Button>
          <Button onClick={soumettreFormulaire} className="w-full sm:w-auto">
            <Save className="mr-2 h-4 w-4" />
            Sauvegarder
          </Button>
        </div>
      </div>

      {/* Onglets principaux */}
      <Tabs defaultValue="infos" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="infos" className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            <span className="hidden sm:inline">Informations</span>
            <span className="sm:hidden">Infos</span>
          </TabsTrigger>
          <TabsTrigger value="equipes" className="flex items-center gap-2">
            <Swords className="h-4 w-4" />
            <span className="hidden sm:inline">Équipes & Séries</span>
            <span className="sm:hidden">Équipes</span>
          </TabsTrigger>
          <TabsTrigger value="clubs" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            <span className="hidden sm:inline">Infos Clubs</span>
            <span className="sm:hidden">Clubs</span>
          </TabsTrigger>
          <TabsTrigger value="calendrier" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Calendrier</span>
            <span className="sm:hidden">Cal.</span>
          </TabsTrigger>
        </TabsList>

        {/* Onglet Informations */}
        <TabsContent value="infos">
          <Card>
            <CardHeader>
              <CardTitle>Détails de la saison</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="saisonNom">Nom de la saison</Label>
                <Input
                  id="saisonNom"
                  value={saison.label}
                  onChange={(e) => handleUpdate('label', e.target.value)}
                  placeholder="Ex: Saison 2024-2025"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="saisonStatut">Statut de la saison</Label>
                <Select value={saison.statut} onValueChange={(v: SaisonStatut) => handleUpdate('statut', v)}>
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

        {/* Onglet Équipes */}
        <TabsContent value="equipes" className="space-y-6">
          {/* Équipes du Club */}
          <Card>
            <CardHeader>
              <CardTitle>Équipes du Club ({saison.equipesClub.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={nouvelleEquipeClub}
                  onChange={(e) => setNouvelleEquipeClub(e.target.value)}
                  placeholder="Nom de la nouvelle équipe du club"
                  onKeyPress={(e) => e.key === 'Enter' && ajouterEquipeClub()}
                />
                <Button onClick={ajouterEquipeClub}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
              </div>

              <div className="grid gap-2 max-h-60 overflow-y-auto">
                {saison.equipesClub.map((equipe) => (
                  <div key={equipe.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="font-medium">{equipe.nom}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => supprimerEquipeClub(equipe.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {saison.equipesClub.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">Aucune équipe du club ajoutée</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Gestion des Séries */}
          <Card>
            <CardHeader>
              <CardTitle>Séries et Adversaires</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Création de nouvelle série */}
              <div className="flex gap-2">
                <Input
                  value={nouvelleSerie}
                  onChange={(e) => setNouvelleSerie(e.target.value)}
                  placeholder="Nom de la nouvelle série"
                  onKeyPress={(e) => e.key === 'Enter' && creerNouvelleSerie()}
                />
                <Button onClick={creerNouvelleSerie}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Créer série
                </Button>
              </div>

              {/* Sélection de série à gérer */}
              {saison.series.length > 0 && (
                <div className="space-y-2">
                  <Label>Série à gérer</Label>
                  <Select value={serieEquipeSelectionnee} onValueChange={setSerieEquipeSelectionnee}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir une série" />
                    </SelectTrigger>
                    <SelectContent>
                      {saison.series.map((serie) => (
                        <SelectItem key={serie.id} value={serie.id}>
                          {serie.nom} ({serie.equipes.length} équipes)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Gestion de la série sélectionnée */}
              {serieEquipeSelectionnee &&
                (() => {
                  const serieActuelle = saison.series.find((s) => s.id === serieEquipeSelectionnee);
                  if (!serieActuelle) return null;

                  return (
                    <Card>
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-lg">{serieActuelle.nom}</CardTitle>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              handleUpdate(
                                'series',
                                saison.series.filter((s) => s.id !== serieActuelle.id),
                              );
                              setSerieEquipeSelectionnee('');
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Ajouter équipe adverse */}
                        <div className="flex gap-2">
                          <Input
                            value={nouvelleEquipeAdverse}
                            onChange={(e) => setNouvelleEquipeAdverse(e.target.value)}
                            placeholder="Nom équipe adverse"
                            onKeyPress={(e) => e.key === 'Enter' && ajouterEquipeAdverse(serieActuelle.id)}
                          />
                          <Button onClick={() => ajouterEquipeAdverse(serieActuelle.id)}>
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Ajouter
                          </Button>
                        </div>

                        {/* Liste des équipes */}
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {serieActuelle.equipes.map((equipe) => (
                            <div key={equipe.id} className="flex justify-between items-center p-2 bg-muted rounded">
                              <span>{equipe.nom}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const seriesUpdated = saison.series.map((s) =>
                                    s.id === serieActuelle.id
                                      ? { ...s, equipes: s.equipes.filter((eq) => eq.id !== equipe.id) }
                                      : s,
                                  );
                                  handleUpdate('series', seriesUpdated);
                                }}
                                className="text-destructive hover:text-destructive"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          {serieActuelle.equipes.length === 0 && (
                            <p className="text-center text-muted-foreground py-4">Aucune équipe dans cette série</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })()}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Nouvel onglet Informations des Clubs */}
        <TabsContent value="clubs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations des Clubs Adverses</CardTitle>
              <CardDescription>
                Ajoutez ou modifiez les informations des clubs adverses (localité, salle, contact, etc.)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Sélection du club */}
              <div className="space-y-2">
                <Label>Sélectionner un club adverse</Label>
                <Select
                  value={clubSelectionne}
                  onValueChange={(value) => {
                    setClubSelectionne(value);
                    chargerInfosClub(value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un club adverse" />
                  </SelectTrigger>
                  <SelectContent>
                    {getClubsAdversesUniques().map((club) => (
                      <SelectItem key={club.nom} value={club.nom}>
                        {club.nom} ({club.equipes.length} équipe{club.equipes.length > 1 ? 's' : ''})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Formulaire d'informations */}
              {clubSelectionne && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Informations - {clubSelectionne}</CardTitle>
                    <CardDescription>
                      Ces informations s'appliqueront à toutes les équipes de ce club
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="club-localite">Localité</Label>
                        <Input
                          id="club-localite"
                          value={infosClub.localite}
                          onChange={(e) => setInfosClub({ ...infosClub, localite: e.target.value })}
                          placeholder="Ex: Mons"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="club-salle">Nom de la salle</Label>
                        <Input
                          id="club-salle"
                          value={infosClub.salle}
                          onChange={(e) => setInfosClub({ ...infosClub, salle: e.target.value })}
                          placeholder="Ex: Salle communale"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="club-adresse">Adresse complète</Label>
                        <Input
                          id="club-adresse"
                          value={infosClub.adresse}
                          onChange={(e) => setInfosClub({ ...infosClub, adresse: e.target.value })}
                          placeholder="Ex: Rue de la Paix 123, 7000 Mons"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="club-telephone">Téléphone</Label>
                        <Input
                          id="club-telephone"
                          value={infosClub.telephone}
                          onChange={(e) => setInfosClub({ ...infosClub, telephone: e.target.value })}
                          placeholder="Ex: +32 65 12 34 56"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="club-email">Email</Label>
                        <Input
                          id="club-email"
                          type="email"
                          value={infosClub.email}
                          onChange={(e) => setInfosClub({ ...infosClub, email: e.target.value })}
                          placeholder="Ex: contact@club.be"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="club-site">Site web</Label>
                        <Input
                          id="club-site"
                          type="url"
                          value={infosClub.site}
                          onChange={(e) => setInfosClub({ ...infosClub, site: e.target.value })}
                          placeholder="Ex: https://www.club.be"
                        />
                      </div>
                    </div>

                    {/* Aperçu des équipes de ce club */}
                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2">Équipes de ce club :</h4>
                      <div className="flex flex-wrap gap-2">
                        {getClubsAdversesUniques()
                          .find(c => c.nom === clubSelectionne)
                          ?.equipes.map((equipe, index) => (
                            <span key={index} className="px-2 py-1 bg-background rounded text-sm">
                              {equipe}
                            </span>
                          ))}
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setClubSelectionne('');
                          setInfosClub({
                            nom: '',
                            localite: '',
                            salle: '',
                            adresse: '',
                            telephone: '',
                            email: '',
                            site: '',
                          });
                        }}
                      >
                        Annuler
                      </Button>
                      <Button onClick={mettreAJourInfosClub}>
                        <Save className="h-4 w-4 mr-2" />
                        Sauvegarder les informations
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Aperçu des clubs avec informations */}
              <Card>
                <CardHeader>
                  <CardTitle>Clubs avec informations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {saison.clubs && saison.clubs.length > 0 ? (
                      saison.clubs.map((club) => (
                        <div key={club.id} className="p-3 bg-muted rounded-lg">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-medium">{club.nom}</h4>
                              <p className="text-sm text-muted-foreground">
                                {club.localite && `${club.localite} • `}
                                {club.salle}
                              </p>
                              <div className="mt-2 flex flex-wrap gap-1">
                                {getClubsAdversesUniques()
                                  .find(c => c.nom === club.nom)
                                  ?.equipes.map((equipe, index) => (
                                    <span key={index} className="px-1 py-0.5 bg-background rounded text-xs">
                                      {equipe}
                                    </span>
                                  ))}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setClubSelectionne(club.nom);
                                chargerInfosClub(club.nom);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        Aucun club adverse n'a encore d'informations
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Calendrier */}
        <TabsContent value="calendrier" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Édition du calendrier</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Sélectionner une série</Label>
                <Select value={serieCalendrierSelectionnee} onValueChange={setSerieCalendrierSelectionnee}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une série à éditer" />
                  </SelectTrigger>
                  <SelectContent>
                    {saison.series.map((serie) => (
                      <SelectItem key={serie.id} value={serie.id}>
                        {serie.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Calendrier par semaines */}
          {serieCalendrierSelectionnee && (
            <div className="max-h-[70vh] overflow-y-auto">
              <Accordion type="multiple" className="space-y-2">
                {Array.from({ length: 22 }, (_, i) => i + 1).map((semaine) => {
                  const matchsSemaine = saison.calendrier.filter(
                    (m) => m.serieId === serieCalendrierSelectionnee && m.semaine === semaine,
                  );
                  const equipesSerie = saison.series.find((s) => s.id === serieCalendrierSelectionnee)?.equipes || [];

                  return (
                    <AccordionItem value={`semaine-${semaine}`} key={semaine}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex justify-between items-center w-full pr-4">
                          <span>Semaine {semaine}</span>
                          <span className="text-sm text-muted-foreground">
                            {matchsSemaine.length} match{matchsSemaine.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4">
                        {matchsSemaine.map((match) => (
                          <Card key={match.id}>
                            <CardContent className="p-4 space-y-3">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                                <Select
                                  value={match.domicile}
                                  onValueChange={(v) => handleCalendarUpdate(match.id, 'domicile', v)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Équipe domicile" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {equipesSerie.map((equipe) => (
                                      <SelectItem key={equipe.id} value={equipe.nom}>
                                        {equipe.nom}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>

                                <div className="text-center font-semibold text-lg">VS</div>

                                <Select
                                  value={match.exterieur}
                                  onValueChange={(v) => handleCalendarUpdate(match.id, 'exterieur', v)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Équipe extérieur" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {equipesSerie.map((equipe) => (
                                      <SelectItem key={equipe.id} value={equipe.nom}>
                                        {equipe.nom}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="flex gap-2">
                                <Input
                                  type="date"
                                  value={match.date}
                                  onChange={(e) => handleCalendarUpdate(match.id, 'date', e.target.value)}
                                  className="flex-1"
                                />
                                <Button variant="destructive" size="icon" onClick={() => supprimerMatch(match.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}

                        <Button
                          variant="outline"
                          onClick={() => ajouterMatch(serieCalendrierSelectionnee, semaine)}
                          className="w-full"
                        >
                          <PlusCircle className="h-4 w-4 mr-2" />
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
