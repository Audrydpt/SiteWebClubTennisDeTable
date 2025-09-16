/* eslint-disable */
import { useState, useEffect, useRef } from 'react';
import { UserCheck, Users, Copy, PlusCircle, X, AlertCircle, Loader2, Ban, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import MultiSelect from '@/components/multi-select';
import { Serie, Match, Member, Joueur } from '@/services/type.ts';
import { fetchJoueursBySemaineAndEquipe } from '@/services/api';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SelectionsManagerProps {
  serie: Serie;
  semaine: number;
  membres: Member[];
  matchs: Match[];
  onSelectionsChange?: (selections: Record<string, string[]>) => void;
}

interface MatchWithPlayers extends Match {
  selectedPlayers?: Joueur[];
}

export function SelectionsManager({
  serie,
  semaine,
  membres,
  matchs,
  onSelectionsChange,
}: SelectionsManagerProps) {
  // Détection robuste du club
  const CLUB_KEYWORD = (import.meta.env.VITE_TABT_CLUB_KEYWORD as string)?.toLowerCase() || 'frameries';
  const isClubTeam = (label?: string) => !!label && label.toLowerCase().includes(CLUB_KEYWORD);

  const [matchsWithPlayers, setMatchsWithPlayers] = useState<
    MatchWithPlayers[]
  >(
    matchs.map((match) => {
      // Initialiser avec les joueurs existants s'ils existent
      let existingPlayers: Joueur[] = [];

      if (isClubTeam(match.domicile)) {
        existingPlayers = match.joueursDomicile || match.joueur_dom || [];
      } else if (isClubTeam(match.exterieur)) {
        existingPlayers = match.joueursExterieur || match.joueur_ext || [];
      }

      return { ...match, selectedPlayers: existingPlayers };
    })
  );
  // Remplace l'ancien joueurSelectionne (string) par une sélection multiple
  const [selectedJoueurIds, setSelectedJoueurIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Référence pour stocker la dernière sélection envoyée au parent
  const lastSelectionsSent = useRef<string>('');

  // Effet pour réagir aux changements de matchs/filtres
  useEffect(() => {
    // Mettre à jour l'état local quand les matchs changent
    const updatedMatches = matchs.map((match) => {
      let existingPlayers: Joueur[] = [];

      if (isClubTeam(match.domicile)) {
        existingPlayers = match.joueursDomicile || match.joueur_dom || [];
      } else if (isClubTeam(match.exterieur)) {
        existingPlayers = match.joueursExterieur || match.joueur_ext || [];
      }

      return { ...match, selectedPlayers: existingPlayers };
    });

    setMatchsWithPlayers(updatedMatches);

    // Communiquer les sélections au parent, mais seulement si elles ont changé
    const initialSelections: Record<string, string[]> = {};
    matchs.forEach((match) => {
      let players: Joueur[] = [];
      if (isClubTeam(match.domicile)) {
        players = match.joueursDomicile || match.joueur_dom || [];
      } else if (isClubTeam(match.exterieur)) {
        players = match.joueursExterieur || match.joueur_ext || [];
      }
      if (players.length > 0) {
        initialSelections[match.id] = players.map(p => p.id);
      }
    });

    // Convertir en chaîne pour comparer facilement
    const selectionsAsString = JSON.stringify(initialSelections);

    // N'envoyer au parent que si les sélections ont changé
    if (onSelectionsChange &&
        Object.keys(initialSelections).length > 0 &&
        lastSelectionsSent.current !== selectionsAsString) {

      // Mettre à jour la référence avec les nouvelles sélections
      lastSelectionsSent.current = selectionsAsString;

      onSelectionsChange(initialSelections);
    }
  }, [matchs, onSelectionsChange, serie.id, semaine]);

  // Filter matches du club uniquement pour les sélections
  const cttFrameriesMatchs = matchsWithPlayers.filter(
    (match) => isClubTeam(match.domicile) || isClubTeam(match.exterieur)
  );

  const trierClassements = (a: string, b: string) => {
    const [lettreA, chiffreA] = [a[0], parseInt(a.slice(1)) || 0];
    const [lettreB, chiffreB] = [b[0], parseInt(b.slice(1)) || 0];

    if (lettreA !== lettreB) {
      return lettreA.localeCompare(lettreB);
    }
    return chiffreA - chiffreB;
  };

  // Nouveau: ajouter plusieurs joueurs d'un coup (jusqu'à 4 max par match)
  const ajouterJoueurs = (matchId: string) => {
    if (!selectedJoueurIds.length) return;

    setMatchsWithPlayers((prev) =>
      prev.map((match) => {
        if (match.id !== matchId) return match;

        const currentPlayers = match.selectedPlayers || [];
        const currentIds = new Set(currentPlayers.map((p) => p.id));
        const availableSlots = Math.max(0, 4 - currentPlayers.length);
        if (availableSlots <= 0) return match;

        // Construire la liste des nouveaux joueurs à ajouter (sans doublons)
        const toAddIds = selectedJoueurIds.filter((id) => !currentIds.has(id)).slice(0, availableSlots);
        if (toAddIds.length === 0) return match;

        const nouveauxJoueurs: Joueur[] = toAddIds.map((id) => {
          const membre = membres.find((m) => m.id === id)!;
          return {
            id: membre.id,
            nom: `${membre.prenom} ${membre.nom}`,
            prenom: membre.prenom || '',
            classement: membre.classement || 'ZZ',
            wo: 'n',
            indexListeForce: membre.indexListeForce || 0,
          } as Joueur;
        });

        const updatedList = [...currentPlayers, ...nouveauxJoueurs].sort((a, b) =>
          trierClassements(a.classement || 'ZZ', b.classement || 'ZZ')
        );

        const updatedMatch: MatchWithPlayers = { ...match, selectedPlayers: updatedList };

        // Déclencher la mise à jour du parent et l’événement
        if (isClubTeam(match.domicile)) {
          updatedMatch.joueursDomicile = updatedList;
          updatedMatch.joueur_dom = updatedList;
          window.dispatchEvent(new CustomEvent('updateMatch', {
            detail: {
              matchId: match.id,
              updates: { joueursDomicile: updatedList, joueur_dom: updatedList },
            },
          }));
        } else if (isClubTeam(match.exterieur)) {
          updatedMatch.joueursExterieur = updatedList;
          updatedMatch.joueur_ext = updatedList;
          window.dispatchEvent(new CustomEvent('updateMatch', {
            detail: {
              matchId: match.id,
              updates: { joueursExterieur: updatedList, joueur_ext: updatedList },
            },
          }));
        }

        // Mettre à jour les sélections pour le parent
        updateSelections(match.id, updatedList.map((j) => j.id));

        // Vider la sélection multiple après ajout
        setSelectedJoueurIds([]);

        return updatedMatch;
      })
    );
  };

  const supprimerJoueur = (matchId: string, joueurId: string) => {
    setMatchsWithPlayers((prev) =>
      prev.map((match) => {
        if (match.id === matchId) {
          const nouveauxJoueurs = (match.selectedPlayers || []).filter(
            (j) => j.id !== joueurId
          );

          const updatedMatch = {
            ...match,
            selectedPlayers: nouveauxJoueurs
          };

          // Déclencher une mise à jour du match parent avec les nouveaux joueurs
          console.log('Envoi événement updateMatch pour suppression joueur');
          if (isClubTeam(match.domicile)) {
            window.dispatchEvent(new CustomEvent('updateMatch', {
              detail: {
                matchId: matchId,
                updates: {
                  joueursDomicile: nouveauxJoueurs,
                  joueur_dom: nouveauxJoueurs
                }
              }
            }));
          } else if (isClubTeam(match.exterieur)) {
            window.dispatchEvent(new CustomEvent('updateMatch', {
              detail: {
                matchId: matchId,
                updates: {
                  joueursExterieur: nouveauxJoueurs,
                  joueur_ext: nouveauxJoueurs
                }
              }
            }));
          }

          // Mettre à jour les sélections pour le parent
          updateSelections(
            matchId,
            nouveauxJoueurs.map((j) => j.id)
          );

          return updatedMatch;
        }
        return match;
      })
    );
  };

  const toggleJoueurWO = (matchId: string, joueurId: string) => {
    console.log(`=== DÉBUT toggleJoueurWO ===`);
    console.log(`Match ID: ${matchId}, Joueur ID: ${joueurId}`);

    setMatchsWithPlayers((prev) =>
      prev.map((match) => {
        if (match.id === matchId) {
          console.log('Match trouvé, joueurs avant modification:', match.selectedPlayers);

          const nouveauxJoueurs = (match.selectedPlayers || []).map(
            (j) => {
              if (j.id === joueurId) {
                // Inverser l'état WO du joueur : "y" <-> "n"
                const newWoState = j.wo === "y" ? "n" : "y";
                console.log(`Changement WO pour ${j.nom}: ${j.wo} -> ${newWoState}`);
                return { ...j, wo: newWoState };
              }
              return j;
            }
          );

          console.log('Nouveaux joueurs après modification:', nouveauxJoueurs);

          const updatedMatch = {
            ...match,
            selectedPlayers: nouveauxJoueurs
          };

          // Mettre à jour les sélections pour le parent avec les nouveaux états WO
          if (isClubTeam(match.domicile)) {
            updatedMatch.joueursDomicile = nouveauxJoueurs;
            updatedMatch.joueur_dom = nouveauxJoueurs;
            console.log('Mise à jour joueurs domicile (club)');
          } else if (isClubTeam(match.exterieur)) {
            updatedMatch.joueursExterieur = nouveauxJoueurs;
            updatedMatch.joueur_ext = nouveauxJoueurs;
            console.log('Mise à jour joueurs extérieur (club)');
          }

          // S'assurer que les scores individuels des joueurs WO sont à 0
          if (updatedMatch.scoresIndividuels) {
            nouveauxJoueurs.forEach(joueur => {
              if (joueur.wo === "y") {
                updatedMatch.scoresIndividuels![joueur.id] = 0;
                console.log(`Score mis à 0 pour joueur WO: ${joueur.nom}`);
              }
            });
          }

          // Déclencher une mise à jour du match parent avec les nouveaux joueurs
          console.log('Envoi événement updateMatch vers EquipeMaker');
          const matchToUpdate = match;
          if (isClubTeam(matchToUpdate.domicile)) {
            window.dispatchEvent(new CustomEvent('updateMatch', {
              detail: {
                matchId: matchId,
                updates: {
                  joueursDomicile: nouveauxJoueurs,
                  joueur_dom: nouveauxJoueurs,
                  scoresIndividuels: updatedMatch.scoresIndividuels
                }
              }
            }));
          } else if (isClubTeam(matchToUpdate.exterieur)) {
            window.dispatchEvent(new CustomEvent('updateMatch', {
              detail: {
                matchId: matchId,
                updates: {
                  joueursExterieur: nouveauxJoueurs,
                  joueur_ext: nouveauxJoueurs,
                  scoresIndividuels: updatedMatch.scoresIndividuels
                }
              }
            }));
          }

          // Mettre à jour les sélections normalement aussi
          updateSelections(
            matchId,
            nouveauxJoueurs.map((j) => j.id)
          );

          console.log('=== FIN toggleJoueurWO ===');
          return updatedMatch;
        }
        return match;
      })
    );
  };

  const updateSelections = (matchId: string, joueurIds: string[]) => {
    const newSelections: Record<string, string[]> = {};

    // Inclure toutes les sélections existantes
    matchsWithPlayers.forEach((match) => {
      if (match.id === matchId) {
        newSelections[matchId] = joueurIds;
      } else if (match.selectedPlayers && match.selectedPlayers.length > 0) {
        newSelections[match.id] = match.selectedPlayers.map((j) => j.id);
      }
    });

    // Convertir en chaîne pour comparer
    const selectionsAsString = JSON.stringify(newSelections);

    // N'envoyer au parent que si les sélections ont changé
    if (lastSelectionsSent.current !== selectionsAsString) {
      lastSelectionsSent.current = selectionsAsString;
      onSelectionsChange?.(newSelections);
    }
  };

  const renderJoueursList = (match: MatchWithPlayers) => {
    const joueurs = match.selectedPlayers || [];

    // Filtrer les membres selon le terme de recherche et exclure ceux déjà sélectionnés (éviter doublons)
    const selectedIdsSet = new Set(joueurs.map((j) => j.id));
    const filteredMembres = membres.filter((membre) => {
      const notAlready = !selectedIdsSet.has(membre.id);
      if (!notAlready) return false;
      if (!searchTerm) return true;
      const search = searchTerm.toLowerCase();
      const nom = (membre.nom || '').toLowerCase();
      const prenom = (membre.prenom || '').toLowerCase();
      const classement = (membre.classement || '').toLowerCase();
      return nom.includes(search) || prenom.includes(search) || classement.includes(search) || `${prenom} ${nom}`.toLowerCase().includes(search);
    });

    const availableSlots = Math.max(0, 4 - joueurs.length);

    return (
      <div className="mt-4 space-y-4">
        {/* Barre de recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Rechercher par nom, prénom ou classement..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Sélecteur multiple des membres */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 items-center">
          <div className="min-w-[240px]">
            <MultiSelect
              options={filteredMembres
                .sort((a, b) => trierClassements(a.classement || 'ZZ', b.classement || 'ZZ'))
                .map((m) => ({ value: m.id, label: `${m.prenom} ${m.nom} (${m.classement || 'N/A'})` }))}
              selected={selectedJoueurIds}
              onChange={setSelectedJoueurIds}
              placeholder={filteredMembres.length === 0 ? (searchTerm ? 'Aucun résultat...' : 'Aucun joueur disponible') : 'Choisir des joueurs...'}
              maxSelected={availableSlots > 0 ? availableSlots : 0}
            />
          </div>
          <Button
            onClick={() => ajouterJoueurs(match.id)}
            disabled={selectedJoueurIds.length === 0 || joueurs.length >= 4 || filteredMembres.length === 0}
            className="w-full sm:w-auto"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Ajouter {selectedJoueurIds.length > 0 ? `(${selectedJoueurIds.length})` : ''}
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-1">{availableSlots} place(s) restante(s)</p>

        {/* Afficher le nombre de résultats si recherche active */}
        {searchTerm && (
          <p className="text-xs text-gray-500">
            {filteredMembres.length} joueur{filteredMembres.length > 1 ? 's' : ''} trouvé{filteredMembres.length > 1 ? 's' : ''}
          </p>
        )}

        {/* Liste des joueurs sélectionnés */}
        <div className="space-y-2">
          {joueurs.length > 0 ? (
            joueurs.map((joueur) => {
              const membre = membres.find((m) => m.id === joueur.id);
              const classement = joueur.classement || membre?.classement || 'N/A';
              if (!joueur.wo) joueur.wo = 'n';
              const nomAffiche = joueur.nom
                ? joueur.nom.trim()
                : joueur.prenom && joueur.prenom.trim()
                  ? `${joueur.prenom.trim()} ${joueur.nom || ''}`.trim()
                  : membre
                    ? `${membre.prenom || ''} ${membre.nom || ''}`.trim()
                    : 'Joueur inconnu';
              return (
                <div
                  key={joueur.id}
                  className={`flex items-center justify-between py-2 px-3 rounded ${joueur.wo === 'y' ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}
                >
                  <span className={`truncate flex-1 mr-2 ${joueur.wo === 'y' ? 'text-red-700 line-through' : ''}`}>
                    {nomAffiche} ({classement})
                    {joueur.wo === 'y' && <Badge variant="destructive" className="ml-2 text-xs">WO</Badge>}
                  </span>
                  <div className="flex items-center">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={joueur.wo === 'y' ? 'destructive' : 'outline'}
                          size="sm"
                          onClick={() => toggleJoueurWO(match.id, joueur.id)}
                          className="h-8 w-8 p-0 shrink-0 mr-1"
                        >
                          <Ban className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {joueur.wo === 'y' ? 'Annuler le forfait (WO)' : 'Marquer comme forfait (WO)'}
                      </TooltipContent>
                    </Tooltip>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => supprimerJoueur(match.id, joueur.id)}
                      className="h-8 w-8 p-0 shrink-0"
                    >
                      <X className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-gray-400 text-sm italic text-center py-4">
              Aucun joueur sélectionné
            </p>
          )}
        </div>

        <div className="text-xs text-gray-500 text-center">
          {joueurs.length}/4 joueurs sélectionnés
        </div>
      </div>
    );
  };

  const copyFromPreviousWeek = async () => {
    if (semaine <= 1) {
      setErrorMessage("Impossible de copier : c'est la première semaine");
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    try {
      setIsLoading(true);

      // Récupérer tous les matchs du club de la semaine actuelle
      const cttFrameriesMatches = matchsWithPlayers.filter(
        (match) =>
          isClubTeam(match.domicile) ||
          isClubTeam(match.exterieur)
      );

      // Extraire l'ID de saison à partir d'un match
      const saisonId = matchs[0]?.saisonId || serie.saisonId;

      console.log("Récupération des joueurs avec les paramètres:", {
        saisonId,
        serieId: serie.id,
        semaine: semaine - 1
      });

      // Pour chaque match du club, récupérer les joueurs de la semaine précédente
      const updatedMatches = await Promise.all(
        cttFrameriesMatches.map(async (match) => {
          const equipeFrameries = isClubTeam(match.domicile)
            ? match.domicile
            : match.exterieur;

          try {
            const previousPlayers = await fetchJoueursBySemaineAndEquipe(
              saisonId || serie.id,
              serie.id,
              semaine - 1,
              equipeFrameries
            );

            console.log(`Joueurs récupérés pour ${equipeFrameries}:`, previousPlayers);

            if (previousPlayers.length > 0) {
              if (isClubTeam(match.domicile)) {
                window.dispatchEvent(new CustomEvent('updateMatch', {
                  detail: {
                    matchId: match.id,
                    updates: {
                      joueursDomicile: previousPlayers,
                      joueur_dom: previousPlayers
                    }
                  }
                }));
              } else if (isClubTeam(match.exterieur)) {
                window.dispatchEvent(new CustomEvent('updateMatch', {
                  detail: {
                    matchId: match.id,
                    updates: {
                      joueursExterieur: previousPlayers,
                      joueur_ext: previousPlayers
                    }
                  }
                }));
              }

              return {
                ...match,
                selectedPlayers: previousPlayers
              };
            }
            return match;
          } catch (error) {
            console.error('Erreur lors de la récupération des joueurs:', error);
            return match;
          }
        })
      );

      // Mettre à jour l'état local avec les nouvelles compositions
      setMatchsWithPlayers(prev =>
        prev.map(existingMatch => {
          const updatedMatch = updatedMatches.find(m => m.id === existingMatch.id);
          return updatedMatch || existingMatch;
        })
      );

      // Préparer les nouvelles sélections pour le parent
      const newSelections: Record<string, string[]> = {};

      updatedMatches.forEach((match) => {
        if (match.selectedPlayers && match.selectedPlayers.length > 0) {
          newSelections[match.id] = match.selectedPlayers.map(p => p.id);
        }
      });

      // Préserver les sélections des autres matchs
      matchsWithPlayers.forEach((match) => {
        if (!newSelections[match.id] && match.selectedPlayers && match.selectedPlayers.length > 0) {
          newSelections[match.id] = match.selectedPlayers.map(p => p.id);
        }
      });

      const selectionsAsString = JSON.stringify(newSelections);
      if (lastSelectionsSent.current !== selectionsAsString) {
        lastSelectionsSent.current = selectionsAsString;
        onSelectionsChange?.(newSelections);
      }

      setErrorMessage(null);
      console.log('Compositions de la semaine précédente copiées avec succès !');
    } catch (error) {
      console.error('Erreur lors de la copie des compositions:', error);
      setErrorMessage('Erreur lors de la récupération des compositions précédentes');
      setTimeout(() => setErrorMessage(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateEuropean = (dateString: string): string => {
    if (!dateString || dateString === 'jj-mm-aaaa') return dateString;

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;

      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();

      return `${day}/${month}/${year}`;
    } catch {
      return dateString;
    }
  };

  return (
    <TooltipProvider>
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl flex items-center gap-2">
              <UserCheck className="h-6 w-6 text-blue-600" />
              Sélections - {serie.nom} - Semaine {semaine}
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copyFromPreviousWeek}
                disabled={isLoading || semaine <= 1}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Copy className="h-4 w-4 mr-2" />
                )}
                {isLoading ? "Chargement..." : "Copier semaine précédente"}
              </Button>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Sélection des compositions d'équipe pour les matchs de CTT Frameries uniquement
          </p>
        </CardHeader>
        <CardContent>
          {errorMessage && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {cttFrameriesMatchs.length > 0 ? (
            <div className="space-y-6">
              {cttFrameriesMatchs.map((match) => (
                <Card key={match.id} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {match.domicile} vs {match.exterieur}
                        </h3>
                        <p className="text-sm text-gray-600">{formatDateEuropean(match.date)}</p>
                      </div>
                      <Badge
                        variant={
                          isClubTeam(match.domicile)
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {isClubTeam(match.domicile)
                          ? 'Domicile'
                          : 'Extérieur'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>{renderJoueursList(match)}</CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Aucun match CTT Frameries</p>
              <p className="text-sm">pour cette semaine</p>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
