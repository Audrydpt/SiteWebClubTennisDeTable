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
  fetchUsers,
} from '@/services/api';
import { Joueur, Match, Saison, Member } from '@/services/type';

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
  const [joueurSelectionne, setJoueurSelectionne] = useState<string>('');
  const [membres, setMembres] = useState<Member[]>([]);
  const scoreRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const chargerDonneesInitiales = async () => {
      setIsLoading(true);
      const [data, membresData] = await Promise.all([
        fetchSaisons(),
        fetchUsers(),
      ]);
      setAllSaisons(data);
      setMembres(membresData);

      const saisonEnCours = data.find((s: Saison) => s.statut === 'En cours');

      if (saisonEnCours) {
        const saisonMiseAJour = {
          ...saisonEnCours,
          calendrier: saisonEnCours.calendrier.map((match: MatchWithExtraFields) => ({
            ...match,
            joueursDomicile: (match.joueur_dom || []).map((joueur) => ({
              ...joueur,
              prenom: joueur.prenom || '', // Ajout d'une valeur par défaut pour 'prenom'
              indexListeForce: joueur.indexListeForce || 0, // Ajout d'une valeur par défaut pour 'indexListeForce'
            })),
            joueursExterieur: (match.joueur_ext || []).map((joueur) => ({
              ...joueur,
              prenom: joueur.prenom || '', // Ajout d'une valeur par défaut pour 'prenom'
              indexListeForce: joueur.indexListeForce || 0, // Ajout d'une valeur par défaut pour 'indexListeForce'
            })),
          })),
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

  const trierClassements = (a: string, b: string) => {
    const [lettreA, chiffreA] = [a[0], parseInt(a.slice(1)) || 0];
    const [lettreB, chiffreB] = [b[0], parseInt(b.slice(1)) || 0];

    if (lettreA !== lettreB) {
      return lettreA.localeCompare(lettreB); // Tri par lettre
    }
    return chiffreA - chiffreB; // Tri par chiffre
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
    if (!saison || !joueurSelectionne) return;
    const membre = membres.find((m) => m.id === joueurSelectionne);
    if (!membre) return;

    const newJoueur = {
      id: membre.id,
      nom: `${membre.prenom} ${membre.nom}`,
      prenom: membre.prenom || '',
      classement: membre.classement || 'ZZ',
      indexListeForce: membre.indexListeForce || 0,
    };

    setSaison({
      ...saison,
      calendrier: saison.calendrier.map((match) => {
        if (match.id === matchId) {
          const joueurs = estDomicile
            ? match.joueursDomicile || []
            : match.joueursExterieur || [];

          // Limiter à 4 joueurs
          if (joueurs.length >= 4) return match;

          const joueursMisAJour = [...joueurs, newJoueur].sort((a, b) =>
            trierClassements(a.classement || 'ZZ', b.classement || 'ZZ')
          );

          if (estDomicile) {
            return {
              ...match,
              joueursDomicile: joueursMisAJour,
            };
          }
          return {
            ...match,
            joueursExterieur: joueursMisAJour,
          };
        }
        return match;
      }),
    });
    setJoueurSelectionne('');
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

      const matchsAvecJoueurs = await Promise.all(
        matchsSemaine.map(async (match) => {
          const equipesDomicile = estEquipeDeFrameries(match.domicile)
            ? match.domicile
            : null;
          const equipesExterieur = estEquipeDeFrameries(match.exterieur)
            ? match.exterieur
            : null;

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
        <p className="text-xs sm:text-sm font-medium mb-2 truncate">Joueurs {equipe}</p>
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <Select
              value={joueurSelectionne}
              onValueChange={setJoueurSelectionne}
            >
              <SelectTrigger className="w-full text-xs sm:text-sm">
                <SelectValue placeholder="Choisir un joueur" />
              </SelectTrigger>
              <SelectContent>
                {membres
                  .sort((a, b) =>
                    trierClassements(a.classement || 'ZZ', b.classement || 'ZZ')
                  )
                  .map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.prenom} {m.nom} ({m.classement})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              onClick={() => ajouterJoueur(match.id, estDomicile)}
              disabled={!joueurSelectionne}
              className="w-full sm:w-auto text-xs"
            >
              <PlusCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span className="hidden sm:inline">Ajouter</span>
              <span className="sm:hidden">+</span>
            </Button>
          </div>

          <div className="space-y-1">
            {joueurs.length > 0 ? (
              joueurs.map((joueur) => {
                // Utiliser le classement du joueur en priorité, sinon chercher dans les membres
                const membre = membres.find((m) => m.id === joueur.id);
                const classement = joueur.classement || membre?.classement || 'N/A';

                // Nettoyer le nom en supprimant les espaces supplémentaires
                const nomAffiche = joueur.nom ? joueur.nom.trim() :
                  (joueur.prenom && joueur.prenom.trim() ?
                    `${joueur.prenom.trim()} ${joueur.nom || ''}`.trim() :
                    membre ? `${membre.prenom || ''} ${membre.nom || ''}`.trim() : 'Joueur inconnu');

                return (
                  <div
                    key={joueur.id}
                    className="flex items-center justify-between bg-gray-50 py-2 px-2 rounded text-xs sm:text-sm"
                  >
                    <span className="truncate flex-1 mr-2">
                      {nomAffiche} ({classement})
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        supprimerJoueur(match.id, joueur.id, estDomicile)
                      }
                      className="h-6 w-6 p-0 shrink-0"
                    >
                      <X className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                    </Button>
                  </div>
                );
              })
            ) : (
              <p className="text-gray-400 text-xs italic">
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
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h2 className="text-xl sm:text-2xl font-bold">
          Résultats: {saison.label}{' '}
          <span className="text-xs sm:text-sm font-medium text-primary block sm:inline">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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

        {/* Colonne 2 : Semaine + Bouton */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3 sm:gap-4">
          <div className="flex-1 w-full">
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

          {/* Bouton responsive */}
          <Button onClick={enregistrerResultats} className="w-full sm:w-auto">
            <Save className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Sauvegarder</span>
            <span className="sm:hidden">Sauver</span>
          </Button>
        </div>
      </div>

      {serieSelectionnee && (
        <div className="border p-3 sm:p-4 rounded-lg">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
            <h3 className="font-medium text-sm sm:text-base">
              Matchs de la semaine {semaineSelectionnee}
            </h3>
            <Button
              size="sm"
              onClick={copierCompoSemainePrecedente}
              disabled={semaineSelectionnee === 1}
              className="flex items-center w-full sm:w-auto text-xs sm:text-sm"
            >
              <ClipboardCopy className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="truncate">Copier compo précédente</span>
            </Button>
          </div>

          {matchsSemaine.length > 0 ? (
            <div className="space-y-4 sm:space-y-6">
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
                    className="border-b pb-4 sm:pb-6 mb-4 sm:mb-6 last:border-0 last:mb-0 last:pb-0"
                  >
                    {/* Match info - mobile friendly */}
                    <div className="space-y-3 mb-4">
                      <div className="grid grid-cols-5 gap-2 items-center text-center">
                        <span className="col-span-2 text-xs sm:text-base font-medium text-right truncate">
                          {match.domicile}
                        </span>
                        <Input
                          value={match.score}
                          onChange={(e) =>
                            mettreAJourScoreMatch(match.id, e.target.value)
                          }
                          placeholder="0-0"
                          className="text-center text-xs sm:text-sm h-8 sm:h-10"
                          ref={(el) => {
                            scoreRefs.current[index] = el;
                          }}
                          onKeyDown={(e) => handleKeyDown(e, index)}
                        />
                        <span className="col-span-2 text-xs sm:text-base font-medium text-left truncate">
                          {match.exterieur}
                        </span>
                      </div>
                    </div>

                    {(() => {
                      if (domicileIsFrameries && exterieurIsFrameries) {
                        return (
                          <Tabs defaultValue="domicile">
                            <TabsList className="w-full grid grid-cols-2 mb-2 h-8 sm:h-10">
                              <TabsTrigger value="domicile" className="text-xs sm:text-sm px-1 sm:px-3">
                                Joueurs {match.domicile.split(' ').slice(-1)[0]}
                              </TabsTrigger>
                              <TabsTrigger value="exterieur" className="text-xs sm:text-sm px-1 sm:px-3">
                                Joueurs {match.exterieur.split(' ').slice(-1)[0]}
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
            <p className="text-gray-500 italic mt-4 text-center text-sm">
              Aucun match programmé pour cette sélection.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
