/* eslint-disable */
import { useState, useEffect, useRef } from 'react';
import { UserCheck, Users, Copy, PlusCircle, X, AlertCircle, Loader2, Ban, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
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
  const [matchsWithPlayers, setMatchsWithPlayers] = useState<
    MatchWithPlayers[]
  >(
    matchs.map((match) => {
      // Initialiser avec les joueurs existants s'ils existent
      let existingPlayers: Joueur[] = [];

      if (match.domicile.includes('CTT Frameries')) {
        existingPlayers = match.joueursDomicile || match.joueur_dom || [];
      } else if (match.exterieur.includes('CTT Frameries')) {
        existingPlayers = match.joueursExterieur || match.joueur_ext || [];
      }

      return { ...match, selectedPlayers: existingPlayers };
    })
  );
  const [joueurSelectionne, setJoueurSelectionne] = useState<string>('');
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

      if (match.domicile.includes('CTT Frameries')) {
        existingPlayers = match.joueursDomicile || match.joueur_dom || [];
      } else if (match.exterieur.includes('CTT Frameries')) {
        existingPlayers = match.joueursExterieur || match.joueur_ext || [];
      }

      return { ...match, selectedPlayers: existingPlayers };
    });

    setMatchsWithPlayers(updatedMatches);

    // Communiquer les sélections au parent, mais seulement si elles ont changé
    const initialSelections: Record<string, string[]> = {};
    matchs.forEach((match) => {
      let players: Joueur[] = [];
      if (match.domicile.includes('CTT Frameries')) {
        players = match.joueursDomicile || match.joueur_dom || [];
      } else if (match.exterieur.includes('CTT Frameries')) {
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

  // Filter CTT Frameries matches only for selections
  const cttFrameriesMatchs = matchsWithPlayers.filter(
    (match) =>
      match.domicile.includes('CTT Frameries') ||
      match.exterieur.includes('CTT Frameries')
  );

  const trierClassements = (a: string, b: string) => {
    const [lettreA, chiffreA] = [a[0], parseInt(a.slice(1)) || 0];
    const [lettreB, chiffreB] = [b[0], parseInt(b.slice(1)) || 0];

    if (lettreA !== lettreB) {
      return lettreA.localeCompare(lettreB);
    }
    return chiffreA - chiffreB;
  };

  const ajouterJoueur = (matchId: string) => {
    if (!joueurSelectionne) return;
    const membre = membres.find((m) => m.id === joueurSelectionne);
    if (!membre) return;

    const newJoueur: Joueur = {
      id: membre.id,
      nom: `${membre.prenom} ${membre.nom}`,
      prenom: membre.prenom || '',
      classement: membre.classement || 'ZZ',
      wo: "n", // Initialiser à "n" par défaut
      indexListeForce: membre.indexListeForce || 0,
    };

    setMatchsWithPlayers((prev) =>
      prev.map((match) => {
        if (match.id === matchId) {
          const currentPlayers = match.selectedPlayers || [];
          // Limiter à 4 joueurs
          if (currentPlayers.length >= 4) return match;

          const nouveauxJoueurs = [...currentPlayers, newJoueur].sort((a, b) =>
            trierClassements(a.classement || 'ZZ', b.classement || 'ZZ')
          );

          const updatedMatch = {
            ...match,
            selectedPlayers: nouveauxJoueurs
          };

          // AJOUT: Déclencher une mise à jour du match parent avec les nouveaux joueurs
          console.log('Envoi événement updateMatch pour ajout joueur');
          if (match.domicile.includes('CTT Frameries')) {
            window.dispatchEvent(new CustomEvent('updateMatch', {
              detail: {
                matchId: matchId,
                updates: {
                  joueursDomicile: nouveauxJoueurs,
                  joueur_dom: nouveauxJoueurs
                }
              }
            }));
          } else if (match.exterieur.includes('CTT Frameries')) {
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
    setJoueurSelectionne('');
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

          // AJOUT: Déclencher une mise à jour du match parent avec les nouveaux joueurs
          console.log('Envoi événement updateMatch pour suppression joueur');
          if (match.domicile.includes('CTT Frameries')) {
            window.dispatchEvent(new CustomEvent('updateMatch', {
              detail: {
                matchId: matchId,
                updates: {
                  joueursDomicile: nouveauxJoueurs,
                  joueur_dom: nouveauxJoueurs
                }
              }
            }));
          } else if (match.exterieur.includes('CTT Frameries')) {
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
          if (match.domicile.includes('CTT Frameries')) {
            updatedMatch.joueursDomicile = nouveauxJoueurs;
            updatedMatch.joueur_dom = nouveauxJoueurs;
            console.log('Mise à jour joueurs domicile CTT Frameries');
          } else if (match.exterieur.includes('CTT Frameries')) {
            updatedMatch.joueursExterieur = nouveauxJoueurs;
            updatedMatch.joueur_ext = nouveauxJoueurs;
            console.log('Mise à jour joueurs extérieur CTT Frameries');
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
          if (matchToUpdate.domicile.includes('CTT Frameries')) {
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
          } else if (matchToUpdate.exterieur.includes('CTT Frameries')) {
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

  // Nouvelle fonction pour mettre à jour les sélections avec les joueurs complets
  const updateSelectionsWithFullPlayers = (matchId: string, joueurs: Joueur[]) => {
    const newSelections: Record<string, string[]> = {};

    // Inclure toutes les sélections existantes
    matchsWithPlayers.forEach((match) => {
      if (match.id === matchId) {
        newSelections[matchId] = joueurs.map((j) => j.id);
      } else if (match.selectedPlayers && match.selectedPlayers.length > 0) {
        newSelections[match.id] = match.selectedPlayers.map((j) => j.id);
      }
    });

    // Convertir en chaîne pour comparer
    const selectionsAsString = JSON.stringify(newSelections);

    // N'envoyer au parent que si les sélections ont changé
    if (lastSelectionsSent.current !== selectionsAsString) {
      lastSelectionsSent.current = selectionsAsString;

      // Informer le parent des changements avec les joueurs complets
      if (onSelectionsChange) {
        // Passer aussi les joueurs mis à jour au parent
        onSelectionsChange(newSelections);

        // Déclencher une mise à jour du match parent avec les nouveaux joueurs
        const matchToUpdate = matchsWithPlayers.find(m => m.id === matchId);
        if (matchToUpdate && matchToUpdate.domicile.includes('CTT Frameries')) {
          // Simuler une mise à jour du match parent
          window.dispatchEvent(new CustomEvent('updateMatch', {
            detail: {
              matchId: matchId,
              updates: {
                joueursDomicile: joueurs,
                joueur_dom: joueurs
              }
            }
          }));
        } else if (matchToUpdate && matchToUpdate.exterieur.includes('CTT Frameries')) {
          window.dispatchEvent(new CustomEvent('updateMatch', {
            detail: {
              matchId: matchId,
              updates: {
                joueursExterieur: joueurs,
                joueur_ext: joueurs
              }
            }
          }));
        }
      }
    }
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

    // Filtrer les membres selon le terme de recherche
    const filteredMembres = membres.filter((membre) => {
      if (!searchTerm) return true;

      const search = searchTerm.toLowerCase();
      const nom = (membre.nom || '').toLowerCase();
      const prenom = (membre.prenom || '').toLowerCase();
      const classement = (membre.classement || '').toLowerCase();

      return nom.includes(search) ||
             prenom.includes(search) ||
             classement.includes(search) ||
             `${prenom} ${nom}`.toLowerCase().includes(search);
    });

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

        <div className="flex flex-col sm:flex-row gap-2">
          <Select
            value={joueurSelectionne}
            onValueChange={setJoueurSelectionne}
          >
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={
                  filteredMembres.length === 0
                    ? searchTerm
                      ? "Aucun résultat trouvé..."
                      : "Choisir un joueur..."
                    : "Choisir un joueur..."
                }
              />
            </SelectTrigger>
            <SelectContent>
              {filteredMembres.length > 0 ? (
                filteredMembres
                  .sort((a, b) =>
                    trierClassements(a.classement || 'ZZ', b.classement || 'ZZ')
                  )
                  .map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.prenom} {m.nom} ({m.classement})
                    </SelectItem>
                  ))
              ) : (
                <SelectItem value="no-results" disabled>
                  <span className="text-gray-400 italic">
                    {searchTerm ? "Aucun joueur trouvé" : "Aucun joueur disponible"}
                  </span>
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          <Button
            onClick={() => ajouterJoueur(match.id)}
            disabled={!joueurSelectionne || joueurs.length >= 4 || filteredMembres.length === 0}
            className="w-full sm:w-auto"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        </div>

        {/* Afficher le nombre de résultats si recherche active */}
        {searchTerm && (
          <p className="text-xs text-gray-500">
            {filteredMembres.length} joueur{filteredMembres.length > 1 ? 's' : ''} trouvé{filteredMembres.length > 1 ? 's' : ''}
          </p>
        )}

        <div className="space-y-2">
          {joueurs.length > 0 ? (
            joueurs.map((joueur) => {
              // Utiliser le classement du joueur en priorité, sinon chercher dans les membres
              const membre = membres.find((m) => m.id === joueur.id);
              const classement =
                joueur.classement || membre?.classement || 'N/A';

              // S'assurer que wo est défini, par défaut "n"
              if (!joueur.wo) {
                joueur.wo = "n";
              }

              // Nettoyer le nom en supprimant les espaces supplémentaires
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
                  className={`flex items-center justify-between py-2 px-3 rounded ${joueur.wo === "y" ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}
                >
                  <span className={`truncate flex-1 mr-2 ${joueur.wo === "y" ? 'text-red-700 line-through' : ''}`}>
                    {nomAffiche} ({classement})
                    {joueur.wo === "y" && <Badge variant="destructive" className="ml-2 text-xs">WO</Badge>}
                  </span>
                  <div className="flex items-center">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={joueur.wo === "y" ? "destructive" : "outline"}
                          size="sm"
                          onClick={() => {
                            console.log(`Clic WO pour ${joueur.nom}, état actuel: ${joueur.wo}`);
                            toggleJoueurWO(match.id, joueur.id);
                          }}
                          className="h-8 w-8 p-0 shrink-0 mr-1"
                        >
                          <Ban className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {joueur.wo === "y" ? "Annuler le forfait (WO)" : "Marquer comme forfait (WO)"}
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
    // Vérifier qu'on n'est pas à la semaine 1
    if (semaine <= 1) {
      setErrorMessage("Impossible de copier : c'est la première semaine");
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    try {
      setIsLoading(true);

      // Récupérer tous les matchs CTT Frameries de la semaine actuelle
      const cttFrameriesMatches = matchsWithPlayers.filter(
        (match) =>
          match.domicile.includes('CTT Frameries') ||
          match.exterieur.includes('CTT Frameries')
      );

      // Extraire l'ID de saison à partir d'un match
      const saisonId = matchs[0]?.saisonId || serie.saisonId;

      console.log("Récupération des joueurs avec les paramètres:", {
        saisonId,
        serieId: serie.id,
        semaine: semaine - 1
      });

      // Pour chaque match de CTT Frameries, récupérer les joueurs de la semaine précédente
      const updatedMatches = await Promise.all(
        cttFrameriesMatches.map(async (match) => {
          // Déterminer quelle équipe de Frameries joue dans ce match
          const equipeFrameries = match.domicile.includes('CTT Frameries')
            ? match.domicile
            : match.exterieur;

          try {
            // Récupérer les joueurs de la semaine précédente pour cette équipe
            const previousPlayers = await fetchJoueursBySemaineAndEquipe(
              saisonId || serie.id,
              serie.id,
              semaine - 1,
              equipeFrameries
            );

            console.log(`Joueurs récupérés pour ${equipeFrameries}:`, previousPlayers);

            // Si on a trouvé des joueurs, les utiliser pour ce match
            if (previousPlayers.length > 0) {
              // AJOUT: Envoyer immédiatement les updates vers EquipeMaker
              if (match.domicile.includes('CTT Frameries')) {
                window.dispatchEvent(new CustomEvent('updateMatch', {
                  detail: {
                    matchId: match.id,
                    updates: {
                      joueursDomicile: previousPlayers,
                      joueur_dom: previousPlayers
                    }
                  }
                }));
              } else if (match.exterieur.includes('CTT Frameries')) {
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

      // Préserver les sélections des matchs qui ne sont pas CTT Frameries
      matchsWithPlayers.forEach((match) => {
        if (!newSelections[match.id] && match.selectedPlayers && match.selectedPlayers.length > 0) {
          newSelections[match.id] = match.selectedPlayers.map(p => p.id);
        }
      });

      // Mettre à jour le parent avec les nouvelles sélections
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

  // Fonction pour formater la date au format européen
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
                          match.domicile.includes('CTT Frameries')
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {match.domicile.includes('CTT Frameries')
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
