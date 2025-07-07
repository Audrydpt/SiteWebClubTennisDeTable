/* eslint-disable no-case-declarations */
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Trash2, PlusCircle } from 'lucide-react';
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
import { createSaison } from '@/services/api';
import { Saison, Match } from '@/services/type.ts';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export default function CreateSaison() {
  const [etape, setEtape] = useState(1);
  const [saison, setSaison] = useState<Saison>({
    id: uuidv4(),
    label: '',
    equipesClub: [],
    series: [],
    calendrier: [],
  });

  const [nouvelleEquipe, setNouvelleEquipe] = useState('');
  const [nouvelleSerie, setNouvelleSerie] = useState('');
  const [equipeAdverse, setEquipeAdverse] = useState('');
  const [serieSelectionnee, setSerieSelectionnee] = useState('');

  const ajouterEquipeClub = () => {
    if (nouvelleEquipe.trim() === '') return;
    setSaison((prev) => ({
      ...prev,
      equipesClub: [
        ...prev.equipesClub,
        { id: uuidv4(), nom: nouvelleEquipe, serieId: '' },
      ],
    }));
    setNouvelleEquipe('');
  };

  const supprimerEquipeClub = (id: string) => {
    setSaison((prev) => ({
      ...prev,
      equipesClub: prev.equipesClub.filter((equipe) => equipe.id !== id),
    }));
  };

  const ajouterSerie = () => {
    if (nouvelleSerie.trim() === '') return;
    setSaison((prev) => ({
      ...prev,
      series: [
        ...prev.series,
        { id: uuidv4(), nom: nouvelleSerie, equipes: [] },
      ],
    }));
    setNouvelleSerie('');
  };

  const supprimerSerie = (id: string) => {
    setSaison((prev) => ({
      ...prev,
      series: prev.series.filter((serie) => serie.id !== id),
    }));
  };

  const ajouterEquipeAdverse = () => {
    if (equipeAdverse.trim() === '' || !serieSelectionnee) return;
    setSaison((prev) => ({
      ...prev,
      series: prev.series.map((serie) => {
        if (serie.id === serieSelectionnee) {
          return {
            ...serie,
            equipes: [
              ...serie.equipes,
              { id: uuidv4(), nom: equipeAdverse, serieId: serie.id },
            ],
          };
        }
        return serie;
      }),
    }));
    setEquipeAdverse('');
  };

  const supprimerEquipeAdverse = (serieId: string, equipeId: string) => {
    setSaison((prev) => ({
      ...prev,
      series: prev.series.map((serie) => {
        if (serie.id === serieId) {
          return {
            ...serie,
            equipes: serie.equipes.filter((equipe) => equipe.id !== equipeId),
          };
        }
        return serie;
      }),
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
      // Reset state or redirect
    } catch (error) {
      console.error('Erreur lors de la création de la saison:', error);
      alert('Erreur lors de la création de la saison');
    }
  };

  const etapeSuivante = () => {
    if (etape === 1 && !saison.label) {
      alert('Veuillez saisir le nom de la saison');
      return;
    }
    if (etape === 2 && saison.equipesClub.length === 0) {
      alert('Veuillez ajouter au moins une équipe du club');
      return;
    }
    if (etape === 3 && saison.series.length === 0) {
      alert('Veuillez ajouter au moins une série');
      return;
    }
    if (etape === 4) {
      const seriesSansEquipes = saison.series.some(
        (serie) => serie.equipes.length === 0
      );
      if (seriesSansEquipes) {
        alert('Veuillez ajouter des équipes dans toutes les séries');
        return;
      }
    }
    setEtape(etape + 1);
  };

  const renderEtape = () => {
    switch (etape) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-medium">
              Étape 1: Informations générales
            </h3>
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
            <Button onClick={etapeSuivante}>Suivant</Button>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-medium">Étape 2: Équipes du club</h3>
            <div className="flex gap-2">
              <Input
                value={nouvelleEquipe}
                onChange={(e) => setNouvelleEquipe(e.target.value)}
                placeholder="Nom de l'équipe (ex: CTTF 1)"
              />
              <Button onClick={ajouterEquipeClub}>Ajouter</Button>
            </div>
            <div className="space-y-2">
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
              <Button onClick={etapeSuivante}>Suivant</Button>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-medium">Étape 3: Séries / Divisions</h3>
            <div className="flex gap-2">
              <Input
                value={nouvelleSerie}
                onChange={(e) => setNouvelleSerie(e.target.value)}
                placeholder="Nom de la série (ex: P2 Messieurs)"
              />
              <Button onClick={ajouterSerie}>Ajouter</Button>
            </div>
            <div className="space-y-2">
              {saison.series.map((serie) => (
                <div
                  key={serie.id}
                  className="flex justify-between items-center bg-gray-100 p-2 rounded"
                >
                  <span>{serie.nom}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => supprimerSerie(serie.id)}
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
              <Button onClick={etapeSuivante}>Suivant</Button>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-medium">Étape 4: Équipes par série</h3>
            <Label>Sélectionner une série</Label>
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
              <>
                <div className="flex gap-2">
                  <Input
                    value={equipeAdverse}
                    onChange={(e) => setEquipeAdverse(e.target.value)}
                    placeholder="Nom de l'équipe adverse"
                  />
                  <Button onClick={ajouterEquipeAdverse}>Ajouter</Button>
                </div>
                <div className="space-y-2">
                  {saison.series
                    .find((s) => s.id === serieSelectionnee)
                    ?.equipes.map((equipe) => (
                      <div
                        key={equipe.id}
                        className="flex justify-between items-center bg-gray-100 p-2 rounded"
                      >
                        <span>{equipe.nom}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            supprimerEquipeAdverse(serieSelectionnee, equipe.id)
                          }
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                </div>
              </>
            )}
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setEtape(etape - 1)}>
                Précédent
              </Button>
              <Button onClick={etapeSuivante}>Suivant</Button>
            </div>
          </div>
        );
      case 5:
        const equipesSerie =
          saison.series.find((s) => s.id === serieSelectionnee)?.equipes || [];
        const toutesEquipes = [...saison.equipesClub, ...equipesSerie];
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-medium">Étape 5: Calendrier Manuel</h3>
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
                {Array.from({ length: 22 }, (_, i) => i + 1).map((semaine) => (
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
                                  mettreAJourMatch(match.id, 'domicile', val)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Domicile" />
                                </SelectTrigger>
                                <SelectContent>
                                  {toutesEquipes.map((e) => (
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
                                  mettreAJourMatch(match.id, 'exterieur', val)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Extérieur" />
                                </SelectTrigger>
                                <SelectContent>
                                  {toutesEquipes.map((e) => (
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
                ))}
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
          </div>
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
