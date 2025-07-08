/* eslint-disable no-plusplus,no-return-assign,@typescript-eslint/no-explicit-any,no-case-declarations,no-alert,no-console */
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  Trash2,
  PlusCircle,
  Users,
  Swords,
  Calendar,
  Info,
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
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { createSaison } from '@/services/api';
import { Saison, Match, Serie, Equipe } from '@/services/type';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CreateSaison() {
  const [etape, setEtape] = useState(1);
  const [saison, setSaison] = useState<Saison>({
    id: uuidv4(),
    label: '',
    statut: 'En cours',
    equipesClub: [],
    series: [],
    calendrier: [],
  });

  const [nbHommes, setNbHommes] = useState(0);
  const [nbDames, setNbDames] = useState(0);
  const [nbVeterans, setNbVeterans] = useState(0);

  const [newSerieName, setNewSerieName] = useState('');
  const [newOpponentsList, setNewOpponentsList] = useState('');
  const [newSerieClubTeamIds, setNewSerieClubTeamIds] = useState<string[]>([]); // MODIFIÉ: pour multi-sélection

  const [serieSelectionnee, setSerieSelectionnee] = useState('');

  const toChar = (i: number) => String.fromCharCode(65 + i);

  const genererEquipesClub = () => {
    const equipes: { id: string; nom: string; serieId: string }[] = [];
    for (let i = 0; i < nbHommes; i++)
      equipes.push({ id: uuidv4(), nom: `Hommes ${toChar(i)}`, serieId: '' });
    for (let i = 0; i < nbDames; i++)
      equipes.push({ id: uuidv4(), nom: `Dames ${toChar(i)}`, serieId: '' });
    for (let i = 0; i < nbVeterans; i++)
      equipes.push({ id: uuidv4(), nom: `Vétérans ${toChar(i)}`, serieId: '' });
    setSaison((prev) => ({ ...prev, equipesClub: equipes }));
  };

  const ajouterSerieEtEquipes = () => {
    if (newSerieName.trim() === '' || newSerieClubTeamIds.length === 0) {
      alert('Veuillez nommer la série et choisir au moins une équipe du club.');
      return;
    }

    const clubTeams = saison.equipesClub.filter((e) =>
      newSerieClubTeamIds.includes(e.id)
    );
    const adversaires: Equipe[] = newOpponentsList
      .split('\n')
      .map((nom) => nom.trim())
      .filter((nom) => nom !== '')
      .map((nom) => ({ id: uuidv4(), nom, serieId: '' }));

    const nouvelleSerie: Serie = {
      id: uuidv4(),
      nom: newSerieName,
      equipes: [...clubTeams, ...adversaires],
    };
    nouvelleSerie.equipes.forEach((e) => (e.serieId = nouvelleSerie.id));

    setSaison((prev) => ({ ...prev, series: [...prev.series, nouvelleSerie] }));
    setNewSerieName('');
    setNewOpponentsList('');
    setNewSerieClubTeamIds([]);
  };

  const genererCalendrierVide = () => {
    const nouveauCalendrier: Match[] = [];
    saison.series.forEach((serie) => {
      for (let semaine = 1; semaine <= 22; semaine++) {
        for (let i = 0; i < 6; i++) {
          nouveauCalendrier.push({
            id: uuidv4(),
            serieId: serie.id,
            semaine,
            domicile: '',
            exterieur: '',
            score: '',
            date: '',
          });
        }
      }
    });
    setSaison((prev) => ({ ...prev, calendrier: nouveauCalendrier }));
  };

  const etapeSuivante = () => {
    if (etape === 3) {
      genererCalendrierVide();
    }
    setEtape(etape + 1);
  };

  const supprimerEquipeClub = (id: string) => {
    setSaison((prev) => ({
      ...prev,
      equipesClub: prev.equipesClub.filter((equipe) => equipe.id !== id),
    }));
  };

  const supprimerSerie = (id: string) => {
    setSaison((prev) => ({
      ...prev,
      series: prev.series.filter((serie) => serie.id !== id),
    }));
  };

  const ajouterMatch = (serieId: string, semaine: number) => {
    const nouveauMatch: Match = {
      id: uuidv4(),
      serieId,
      semaine,
      domicile: '',
      exterieur: '',
      score: '',
      date: '',
    };
    setSaison((prev) => ({
      ...prev,
      calendrier: [...prev.calendrier, nouveauMatch],
    }));
  };

  const mettreAJourMatch = (
    matchId: string,
    champ: 'domicile' | 'exterieur',
    valeur: string
  ) => {
    setSaison((prev) => ({
      ...prev,
      calendrier: prev.calendrier.map((m) =>
        m.id === matchId ? { ...m, [champ]: valeur } : m
      ),
    }));
  };

  const supprimerMatch = (matchId: string) => {
    setSaison((prev) => ({
      ...prev,
      calendrier: prev.calendrier.filter((m) => m.id !== matchId),
    }));
  };

  const soumettreFormulaire = async () => {
    try {
      await createSaison(saison);
      alert('Saison créée avec succès !');

      // Ajout d'une option pour réinitialiser le formulaire
      if (window.confirm('Voulez-vous créer une autre saison ?')) {
        // Réinitialise le formulaire
        setSaison({
          id: uuidv4(),
          label: '',
          statut: 'En cours',
          equipesClub: [],
          series: [],
          calendrier: [],
        });
        setEtape(1);
      } else {
        // Revenir au menu principal (optionnel)
        // Vous pourriez ajouter une prop onCreated pour notifier le composant parent
      }
    } catch (error) {
      console.error('Erreur lors de la création de la saison:', error);
      alert('Erreur lors de la création de la saison');
    }
  };

  const renderEtape = () => {
    switch (etape) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info /> Étape 1: Informations générales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="saisonNom">Nom de la saison</Label>
                  <Input
                    id="saisonNom"
                    value={saison.label}
                    onChange={(e) =>
                      setSaison({ ...saison, label: e.target.value })
                    }
                    placeholder="Ex: Saison 2024-2025"
                  />
                </div>
                <div>
                  <Label htmlFor="saisonStatut">Statut</Label>
                  <Select
                    value={saison.statut}
                    onValueChange={(value: any) =>
                      setSaison({ ...saison, statut: value })
                    }
                  >
                    <SelectTrigger id="saisonStatut">
                      <SelectValue placeholder="Choisir un statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="En cours">En cours</SelectItem>
                      <SelectItem value="Terminée">Terminée</SelectItem>
                      <SelectItem value="Archivée">Archivée</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={() => setEtape(2)}>Suivant</Button>
            </CardContent>
          </Card>
        );
      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users /> Étape 2: Équipes du club (Générateur)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
                <div>
                  <Label htmlFor="nbHommes">Nombre d&#39;équipes Hommes</Label>
                  <Input
                    id="nbHommes"
                    type="number"
                    min="0"
                    value={nbHommes}
                    onChange={(e) =>
                      setNbHommes(Number.parseInt(e.target.value, 10) || 0)
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="nbDames">Nombre d&#39;équipes Dames</Label>
                  <Input
                    id="nbDames"
                    type="number"
                    min="0"
                    value={nbDames}
                    onChange={(e) =>
                      setNbDames(Number.parseInt(e.target.value, 10) || 0)
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="nbVeterans">
                    Nombre d&#39;équipes Vétérans
                  </Label>
                  <Input
                    id="nbVeterans"
                    type="number"
                    min="0"
                    value={nbVeterans}
                    onChange={(e) =>
                      setNbVeterans(Number.parseInt(e.target.value, 10) || 0)
                    }
                  />
                </div>
              </div>
              <Button onClick={genererEquipesClub}>Générer les équipes</Button>
              <div className="space-y-2">
                <h4 className="font-medium">Équipes générées :</h4>
                {saison.equipesClub.map((equipe) => (
                  <div
                    key={equipe.id}
                    className="flex justify-between items-center bg-gray-100 p-2 rounded"
                  >
                    <span>{equipe.nom}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => supprimerEquipeClub(equipe.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setEtape(etape - 1)}>
                  Précédent
                </Button>
                <Button onClick={() => setEtape(3)}>Suivant</Button>
              </div>
            </CardContent>
          </Card>
        );
      case 3:
        const assignedClubTeamIds = saison.series.flatMap((s) =>
          s.equipes.map((e) => e.id)
        );
        const unassignedClubTeams = saison.equipesClub.filter(
          (e) => !assignedClubTeamIds.includes(e.id)
        );

        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Swords /> Étape 3: Séries et Adversaires
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 border rounded-lg space-y-3">
                <h4 className="font-semibold">Ajouter une nouvelle série</h4>
                <div>
                  <Label htmlFor="newSerieName">Nom de la série</Label>
                  <Input
                    id="newSerieName"
                    value={newSerieName}
                    onChange={(e) => setNewSerieName(e.target.value)}
                    placeholder="Ex: P1 Messieurs"
                  />
                </div>
                <div>
                  <Label>Équipes du club pour cette série</Label>
                  <div className="p-2 border rounded-md space-y-2">
                    {unassignedClubTeams.map((team) => (
                      <div
                        key={team.id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`team-${team.id}`}
                          checked={newSerieClubTeamIds.includes(team.id)}
                          onCheckedChange={(checked) => {
                            setNewSerieClubTeamIds((prev) =>
                              checked
                                ? [...prev, team.id]
                                : prev.filter((id) => id !== team.id)
                            );
                          }}
                        />
                        <label htmlFor={`team-${team.id}`}>{team.nom}</label>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="newOpponentsList">
                    Liste des équipes adverses (une par ligne)
                  </Label>
                  <Textarea
                    id="newOpponentsList"
                    value={newOpponentsList}
                    onChange={(e) => setNewOpponentsList(e.target.value)}
                    placeholder={'Adversaire A\nAdversaire B\nAdversaire C'}
                    rows={5}
                  />
                </div>
                <Button onClick={ajouterSerieEtEquipes}>
                  Ajouter la série et ses équipes
                </Button>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Séries créées :</h4>
                <Accordion type="multiple" className="w-full">
                  {saison.series.map((serie) => (
                    <AccordionItem value={serie.id} key={serie.id}>
                      <AccordionTrigger className="flex justify-between">
                        {serie.nom}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mr-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            supprimerSerie(serie.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </AccordionTrigger>
                      <AccordionContent>
                        <ul className="list-disc pl-5">
                          {serie.equipes.map((eq) => (
                            <li key={eq.id}>{eq.nom}</li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setEtape(etape - 1)}>
                  Précédent
                </Button>
                <Button onClick={etapeSuivante}>
                  Générer le calendrier et continuer
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      case 4:
        const serieActuelle = saison.series.find(
          (s) => s.id === serieSelectionnee
        );
        const equipesPourCalendrier = serieActuelle
          ? serieActuelle.equipes
          : [];

        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar /> Étape 4: Calendrier Manuel
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Label>Sélectionner une série pour définir son calendrier</Label>
              <Select
                value={serieSelectionnee}
                onValueChange={setSerieSelectionnee}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une série" />
                </SelectTrigger>
                <SelectContent>
                  {saison.series.map((serie) => (
                    <SelectItem key={serie.id} value={serie.id}>
                      {serie.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {serieSelectionnee && (
                <Accordion type="multiple" className="w-full">
                  {Array.from({ length: 22 }, (_, i) => i + 1).map(
                    (semaine) => (
                      <AccordionItem value={`semaine-${semaine}`} key={semaine}>
                        <AccordionTrigger>Semaine {semaine}</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2">
                            {saison.calendrier
                              .filter(
                                (m) =>
                                  m.serieId === serieSelectionnee &&
                                  m.semaine === semaine
                              )
                              .map((match) => (
                                <div
                                  key={match.id}
                                  className="flex items-center gap-2"
                                >
                                  <Select
                                    value={match.domicile}
                                    onValueChange={(val) =>
                                      mettreAJourMatch(
                                        match.id,
                                        'domicile',
                                        val
                                      )
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Domicile" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {equipesPourCalendrier.map((e) => (
                                        <SelectItem key={e.id} value={e.nom}>
                                          {e.nom}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <span>vs</span>
                                  <Select
                                    value={match.exterieur}
                                    onValueChange={(val) =>
                                      mettreAJourMatch(
                                        match.id,
                                        'exterieur',
                                        val
                                      )
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Extérieur" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {equipesPourCalendrier.map((e) => (
                                        <SelectItem key={e.id} value={e.nom}>
                                          {e.nom}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => supprimerMatch(match.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              ))}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                ajouterMatch(serieSelectionnee, semaine)
                              }
                            >
                              <PlusCircle className="mr-2 h-4 w-4" />
                              Ajouter un match
                            </Button>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    )
                  )}
                </Accordion>
              )}

              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setEtape(etape - 1)}>
                  Précédent
                </Button>
                <Button onClick={soumettreFormulaire}>
                  Enregistrer la saison
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Création d&#39;une nouvelle saison</h2>
      {renderEtape()}
    </div>
  );
}
