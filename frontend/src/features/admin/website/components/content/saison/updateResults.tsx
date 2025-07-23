/* eslint-disable */
import { useState, useEffect, useRef } from 'react';
import {
  CheckCircle,
  Loader2,
  PlusCircle,
  X,
  ClipboardCopy,
  Save,
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import {
  fetchJoueursBySemaineAndEquipe,
  fetchSaisons,
  updateSaisonResults,
} from '@/services/api';
import { Joueur, Match, Saison } from '@/services/type.ts';

interface MatchWithExtraFields extends Match {
  joueur_dom?: Joueur[];
  joueur_ext?: Joueur[];
  joueursDomicile?: Joueur[];
  joueursExterieur?: Joueur[];
}

export default function UpdateResults() {
  const [allSaisons, setAllSaisons] = useState<Saison[]>([]);
  const [saison, setSaison] = useState<Saison | null>(null);
  const [serieSelectionnee, setSerieSelectionnee] = useState<string>('');
  const [semaineSelectionnee, setSemaineSelectionnee] = useState<number>(1);
  const [message, setMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSelecting, setIsSelecting] = useState(false);
  const [nouveauJoueurNom, setNouveauJoueurNom] = useState<string>('');
  const scoreRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const chargerDonneesInitiales = async () => {
      setIsLoading(true);
      const data = await fetchSaisons();
      setAllSaisons(data);
      const saisonEnCours = data.find((s: Saison) => s.statut === 'En cours');

      if (saisonEnCours) {
        const saisonMiseAJour = {
          ...saisonEnCours,
          calendrier: saisonEnCours.calendrier.map(
            (match: MatchWithExtraFields) => ({
              ...match,
              joueursDomicile: match.joueur_dom || [],
              joueursExterieur: match.joueur_ext || [],
            })
          ),
        };
        setSaison(JSON.parse(JSON.stringify(saisonMiseAJour)));
        setIsSelecting(false);
      } else {
        setIsSelecting(true);
      }
      setIsLoading(false);
    };
    chargerDonneesInitiales();
  }, []);

  const handleSelectSaison = (id: string) => {
    const saisonTrouvee = allSaisons.find((s: Saison) => s.id === id);
    if (saisonTrouvee) {
      const saisonMiseAJour = {
        ...saisonTrouvee,
        calendrier: saisonTrouvee.calendrier.map(
          (match: MatchWithExtraFields) => ({
            ...match,
            joueursDomicile: match.joueur_dom || [],
            joueursExterieur: match.joueur_ext || [],
          })
        ),
      };
      setSaison(JSON.parse(JSON.stringify(saisonMiseAJour)));
      setSerieSelectionnee('');
      setSemaineSelectionnee(1);
      setIsSelecting(false);
    }
  };

  const mettreAJourScoreMatch = (matchId: string, score: string) => {
    if (!saison) return;
    setSaison({
      ...saison,
      calendrier: saison.calendrier.map((match) =>
        match.id === matchId ? { ...match, score } : match
      ),
    });
  };

  const estEquipeDeFrameries = (nomEquipe: string) =>
    nomEquipe.includes('CTT Frameries');

  const ajouterJoueur = (matchId: string, estDomicile: boolean) => {
    if (!saison || !nouveauJoueurNom.trim()) return;
    setSaison({
      ...saison,
      calendrier: saison.calendrier.map((match) => {
        if (match.id === matchId) {
          const newJoueur = { id: uuidv4(), nom: nouveauJoueurNom };
          if (estDomicile) {
            return {
              ...match,
              joueursDomicile: [...(match.joueursDomicile || []), newJoueur],
            };
          }
          return {
            ...match,
            joueursExterieur: [...(match.joueursExterieur || []), newJoueur],
          };
        }
        return match;
      }),
    });
    setNouveauJoueurNom('');
  };

  const supprimerJoueur = (
    matchId: string,
    joueurId: string,
    estDomicile: boolean
  ) => {
    if (!saison) return;
    setSaison({
      ...saison,
      calendrier: saison.calendrier.map((match) => {
        if (match.id === matchId) {
          if (estDomicile) {
            return {
              ...match,
              joueursDomicile:
                match.joueursDomicile?.filter((j) => j.id !== joueurId) || [],
            };
          }
          return {
            ...match,
            joueursExterieur:
              match.joueursExterieur?.filter((j) => j.id !== joueurId) || [],
          };
        }
        return match;
      }),
    });
  };

  const copierCompoSemainePrecedente = async () => {
    if (!saison || semaineSelectionnee <= 1) {
      setMessage("Impossible de copier : c'est la première semaine");
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      setIsLoading(true);
      const matchsSemaine = saison.calendrier.filter(
        (m) =>
          m.serieId === serieSelectionnee && m.semaine === semaineSelectionnee
      );

      // Pour chaque match de la semaine actuelle
      const matchsAvecJoueurs = await Promise.all(
        matchsSemaine.map(async (match) => {
          // Équipes concernées dans ce match
          const equipesDomicile = estEquipeDeFrameries(match.domicile)
            ? match.domicile
            : null;
          const equipesExterieur = estEquipeDeFrameries(match.exterieur)
            ? match.exterieur
            : null;

          // Récupérer les joueurs de la semaine précédente pour chaque équipe
          const joueursDomicile = equipesDomicile
            ? await fetchJoueursBySemaineAndEquipe(
              saison.id,
              serieSelectionnee,
              semaineSelectionnee - 1,
              equipesDomicile
            )
            : [];

          const joueursExterieur = equipesExterieur
            ? await fetchJoueursBySemaineAndEquipe(
              saison.id,
              serieSelectionnee,
              semaineSelectionnee - 1,
              equipesExterieur
            )
            : [];

          return {
            ...match,
            joueursDomicile,
            joueursExterieur,
          };
        })
      );

      // Mise à jour du state avec les nouvelles compositions
      setSaison({
        ...saison,
        calendrier: saison.calendrier.map(
          (match) => matchsAvecJoueurs.find((m) => m.id === match.id) || match
        ),
      });

      setMessage('Compositions de la semaine précédente copiées avec succès !');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Erreur lors de la récupération des joueurs:', error);
      setMessage('Erreur lors de la récupération des compositions précédentes');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const enregistrerResultats = async () => {
    if (!saison) return;
    try {
      const matchsFiltres = saison.calendrier.filter(
        (m) =>
          m.serieId === serieSelectionnee && m.semaine === semaineSelectionnee
      );
      const matchsAvecScores = matchsFiltres.map((match) => ({
        ...match,
        joueur_dom: match.joueursDomicile || [],
        joueur_ext: match.joueursExterieur || [],
      }));
      await updateSaisonResults(saison.id, matchsAvecScores);
      setMessage('Résultats et joueurs enregistrés avec succès !');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      setMessage("Erreur lors de l'enregistrement");
    }
  };

  const renderJoueursList = (
    match: MatchWithExtraFields,
    estDomicile: boolean
  ) => {
    const joueurs = estDomicile
      ? match.joueursDomicile || []
      : match.joueursExterieur || [];
    const equipe = estDomicile ? match.domicile : match.exterieur;

    return (
      <div className="mt-2 border-t pt-2">
        <p className="text-sm font-medium mb-2">Joueurs {equipe}</p>
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Nom du joueur"
              value={nouveauJoueurNom}
              onChange={(e) => setNouveauJoueurNom(e.target.value)}
              className="flex-grow"
            />
            <Button
              size="sm"
              onClick={() => ajouterJoueur(match.id, estDomicile)}
            >
              <PlusCircle className="h-4 w-4 mr-1" /> Ajouter
            </Button>
          </div>

          <div className="space-y-1">
            {joueurs && joueurs.length > 0 ? (
              joueurs.map((joueur) => (
                <div
                  key={joueur.id}
                  className="flex items-center justify-between bg-gray-50 py-1 px-2 rounded"
                >
                  <span>{joueur.nom}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      supprimerJoueur(match.id, joueur.id, estDomicile)
                    }
                  >
                    <X className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-sm italic">
                Aucun joueur encodé
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowDown' && scoreRefs.current[index + 1]) {
      scoreRefs.current[index + 1]?.focus();
    } else if (e.key === 'ArrowUp' && scoreRefs.current[index - 1]) {
      scoreRefs.current[index - 1]?.focus();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-lg">Chargement des données...</span>
      </div>
    );
  }

  if (isSelecting || !saison) {
    return <div>Pas de saison en cours</div>;
  }

  const semaines = Array.from({ length: 22 }, (_, i) => i + 1);
  const matchsSemaine = saison.calendrier.filter(
    (m) => m.serieId === serieSelectionnee && m.semaine === semaineSelectionnee
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          Résultats: {saison.label}{' '}
          <span className="text-sm font-medium text-primary">
            ({saison.statut})
          </span>
        </h2>
      </div>

      {message && (
        <Alert variant="default" className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Succès</AlertTitle>
          <AlertDescription className="text-green-700">
            {message}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Colonne 1 : Série */}
        <div>
          <Label>Série</Label>
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
        </div>

        {/* Colonne 2 : Semaine + Bouton aligné à droite */}
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <Label>Semaine</Label>
            <Select
              value={semaineSelectionnee.toString()}
              onValueChange={(v) => setSemaineSelectionnee(parseInt(v, 10))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choisir une semaine" />
              </SelectTrigger>
              <SelectContent>
                {semaines.map((s) => (
                  <SelectItem key={s} value={s.toString()}>
                    Semaine {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Bouton à droite du champ Semaine */}
          <Button onClick={enregistrerResultats}>
            <Save className="mr-2 h-4 w-4" />
            Sauvegarder
          </Button>
        </div>
      </div>

      {serieSelectionnee && (
        <div className="border p-4 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">
              Matchs de la semaine {semaineSelectionnee}
            </h3>
            <Button
              size="sm"
              onClick={copierCompoSemainePrecedente}
              disabled={semaineSelectionnee === 1}
            >
              <ClipboardCopy className="w-4 h-4 mr-2" /> Copier la compo
              précédente
            </Button>
          </div>

          {matchsSemaine.length > 0 ? (
            <div className="space-y-6">
              {matchsSemaine.map((match, index) => {
                const domicileIsFrameries = estEquipeDeFrameries(
                  match.domicile
                );
                const exterieurIsFrameries = estEquipeDeFrameries(
                  match.exterieur
                );

                return (
                  <div
                    key={match.id}
                    className="border-b pb-6 mb-6 last:border-0 last:mb-0 last:pb-0"
                  >
                    <div className="grid grid-cols-3 items-center gap-2 text-center mb-4">
                      <span className="text-right font-medium">
                        {match.domicile}
                      </span>
                      <Input
                        value={match.score}
                        onChange={(e) =>
                          mettreAJourScoreMatch(match.id, e.target.value)
                        }
                        placeholder="0-0"
                        className="max-w-24 mx-auto text-center"
                        ref={(el) => {
                          scoreRefs.current[index] = el;
                        }}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                      />
                      <span className="text-left font-medium">
                        {match.exterieur}
                      </span>
                    </div>

                    {(() => {
                      if (domicileIsFrameries && exterieurIsFrameries) {
                        return (
                          <Tabs defaultValue="domicile">
                            <TabsList className="w-full grid grid-cols-2 mb-2">
                              <TabsTrigger value="domicile">
                                Joueurs {match.domicile}
                              </TabsTrigger>
                              <TabsTrigger value="exterieur">
                                Joueurs {match.exterieur}
                              </TabsTrigger>
                            </TabsList>
                            <TabsContent value="domicile">
                              {renderJoueursList(match, true)}
                            </TabsContent>
                            <TabsContent value="exterieur">
                              {renderJoueursList(match, false)}
                            </TabsContent>
                          </Tabs>
                        );
                      }
                      if (domicileIsFrameries) {
                        return renderJoueursList(match, true);
                      }
                      if (exterieurIsFrameries) {
                        return renderJoueursList(match, false);
                      }
                      return null;
                    })()}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 italic mt-4 text-center">
              Aucun match programmé pour cette sélection.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
