/* eslint-disable */
import type React from 'react';

import { useState, useRef, useEffect } from 'react';
import { Home, Plane, Calendar, Users, X, Target, AlertCircle, CheckCircle, PlusCircle, MinusCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Match, Member, Joueur } from '@/services/type.ts';
import { PlayerSelector } from '@/features/admin/website/components/content/teamsResults/PlayerSelector.tsx';

interface MatchCardProps {
  match: Match;
  membres: Member[];
  onUpdateMatch: (matchId: string, updates: Partial<Match>) => void;
  showIndividualScores?: boolean;
  // Nouvelles props pour la navigation par flèches
  scoreInputRef?: (el: HTMLInputElement | null) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

export function MatchCard({
  match,
  membres,
  onUpdateMatch,
  showIndividualScores = false,
  scoreInputRef, // Pour obtenir une référence depuis le parent
  onKeyDown, // Pour la navigation entre les matchs
}: MatchCardProps) {
  const [score, setScore] = useState(match.score || '');
  const [individualScores, setIndividualScores] = useState<
    Record<string, number>
  >({});

  const internalScoreInputRef = useRef<HTMLInputElement>(null);
  const individualScoreRefs = useRef<Record<string, HTMLInputElement | null>>(
    {}
  );

  const isFrameriesHome = match.domicile.includes('CTT Frameries');
  const isFrameriesAway = match.exterieur.includes('CTT Frameries');
  const showPlayerManagement = isFrameriesHome || isFrameriesAway;
  const isFrameriesMatch = isFrameriesHome || isFrameriesAway;

  // Mise à jour du score quand match change
  useEffect(() => {
    setScore(match.score || '');
  }, [match.id, match.score]);

  // Mise à jour des scores individuels quand match change avec plus de debug
  useEffect(() => {
    console.log(`Match ${match.id} - Initialisation des scores individuels:`, match.scoresIndividuels);

    if (match.scoresIndividuels) {
      // Convertir tous les scores en nombres
      const formattedScores: Record<string, number> = {};
      Object.entries(match.scoresIndividuels).forEach(([id, score]) => {
        formattedScores[id] = typeof score === 'number' ? score : parseInt(String(score), 10) || 0;
      });

      setIndividualScores(formattedScores);
      console.log(`Match ${match.id} - Scores individuels formatés:`, formattedScores);
    } else {
      setIndividualScores({});
    }
  }, [match.id, match.scoresIndividuels]);

  // Debug pour vérifier l'état des scores après leur initialisation
  useEffect(() => {
    console.log(`Match ${match.id} - État individualScores actuel:`, individualScores);
    console.log(`Match ${match.id} - Total actuel:`, getTotalIndividualScores());
  }, [individualScores, match.id]);

  // Calculer le score de l'équipe CTT Frameries
  const getFrameriesScore = (): number => {
    if (!score) return 0;

    const [scoreHome, scoreAway] = score.split('-').map(s => parseInt(s, 10) || 0);
    return isFrameriesHome ? scoreHome : scoreAway;
  };

  // Calculer la somme des scores individuels
  const getTotalIndividualScores = (): number => {
    return Object.values(individualScores).reduce((sum, val) => sum + val, 0);
  };

  const isValidScoreTotal = (): boolean => {
    const frameriesScore = getFrameriesScore();
    const totalIndividual = getTotalIndividualScores();

    return frameriesScore === totalIndividual;
  };

  const handleScoreChange = (newScore: string) => {
    setScore(newScore);
    // Mettre à jour immédiatement le match parent avec le nouveau score
    onUpdateMatch(match.id, { score: newScore });

    // Réinitialiser les scores individuels si le score de l'équipe change
    if (score !== newScore) {
      const resetScores: Record<string, number> = {};
      setIndividualScores(resetScores);
      onUpdateMatch(match.id, { scoresIndividuels: resetScores });
    }
  };

  const handleIndividualScoreChange = (playerId: string, scoreValue: number) => {
    // S'assurer que le score est un nombre valide entre 0 et 4
    const score = Math.min(Math.max(0, scoreValue), 4);
    console.log(`Changement de score pour ${playerId}: ${score}`);

    // Calculer le score de Frameries basé sur le score actuel du match
    const frameriesScore = getFrameriesScore();

    // Calculer la somme actuelle des scores individuels (en excluant le joueur courant)
    const currentTotalExcludingPlayer = Object.entries(individualScores)
      .reduce((sum, [id, val]) => id !== playerId ? sum + val : sum, 0);

    // Vérifier si le nouveau score total dépasserait le score de l'équipe
    if (currentTotalExcludingPlayer + score > frameriesScore) {
      // Limiter le score au maximum possible
      const maxAllowed = Math.max(0, frameriesScore - currentTotalExcludingPlayer);
      const newScores = { ...individualScores, [playerId]: maxAllowed };
      setIndividualScores(newScores);
      onUpdateMatch(match.id, { scoresIndividuels: newScores });
      console.log(`Score limité à ${maxAllowed} pour ne pas dépasser le total`);
    } else {
      // Le score est valide
      const newScores = { ...individualScores, [playerId]: score };
      setIndividualScores(newScores);
      onUpdateMatch(match.id, { scoresIndividuels: newScores });
      console.log(`Nouveau total après modification: ${currentTotalExcludingPlayer + score}/${frameriesScore}`);
    }
  };

  // Ajuster automatiquement les scores pour atteindre le total de l'équipe
  const adjustScoresToMatchTotal = () => {
    const frameriesScore = getFrameriesScore();
    const totalIndividual = getTotalIndividualScores();
    const players = (isFrameriesHome
      ? match.joueursDomicile || match.joueur_dom
      : match.joueursExterieur || match.joueur_ext) || [];

    if (players.length === 0) return;

    // Si le total actuel est inférieur au score attendu
    if (totalIndividual < frameriesScore) {
      // Calculer combien de points restants à distribuer
      let pointsToAdd = frameriesScore - totalIndividual;

      // Commencer par le premier joueur et distribuer les points (max 4 par joueur)
      const newScores = { ...individualScores };

      // Essayer d'abord de combler avec les joueurs qui ont déjà des points
      let i = 0;
      while (pointsToAdd > 0 && i < players.length) {
        const playerId = players[i].id;
        const currentScore = newScores[playerId] || 0;
        if (currentScore < 4) {
          const canAdd = Math.min(pointsToAdd, 4 - currentScore);
          newScores[playerId] = currentScore + canAdd;
          pointsToAdd -= canAdd;
        }
        i++;
      }

      // Si on a encore des points à distribuer, recommencer avec les joueurs à 0
      if (pointsToAdd > 0) {
        i = 0;
        while (pointsToAdd > 0 && i < players.length) {
          const playerId = players[i].id;
          if (!newScores[playerId]) {
            const canAdd = Math.min(pointsToAdd, 4);
            newScores[playerId] = canAdd;
            pointsToAdd -= canAdd;
          }
          i++;
        }
      }

      console.log("Nouveaux scores après ajustement:", newScores);
      setIndividualScores(newScores);
      onUpdateMatch(match.id, { scoresIndividuels: newScores });
    }
  };

  // Réinitialiser tous les scores individuels à zéro
  const resetIndividualScores = () => {
    // Récupérer tous les joueurs du match (domicile + extérieur)
    const allPlayers = [
      ...(match.joueursDomicile || match.joueur_dom || []),
      ...(match.joueursExterieur || match.joueur_ext || [])
    ];

    // Créer un objet avec seulement les scores des joueurs de ce match remis à 0
    const resetScores: Record<string, number> = {};
    allPlayers.forEach(player => {
      resetScores[player.id] = 0;
    });

    // Mettre à jour seulement les scores de ce match spécifique
    onUpdateMatch(match.id, {
      scoresIndividuels: {
        ...match.scoresIndividuels, // Conserver les autres scores s'il y en a
        ...resetScores // Écraser seulement les scores des joueurs de ce match
      }
    });
  };

  const trierClassements = (a: string, b: string) => {
    const [lettreA, chiffreA] = [a[0], parseInt(a.slice(1)) || 0];
    const [lettreB, chiffreB] = [b[0], parseInt(b.slice(1)) || 0];

    if (lettreA !== lettreB) {
      return lettreA.localeCompare(lettreB);
    }
    return chiffreA - chiffreB;
  };

  const addPlayer = (isHome: boolean, player: Member) => {
    const newPlayer: Joueur = {
      id: player.id,
      nom: `${player.prenom} ${player.nom}`,
      prenom: player.prenom || '',
      classement: player.classement || 'ZZ',
      wo: "n" // Initialiser à "n" par défaut
    };

    // Récupérer les joueurs existants en gérant les deux formats
    const currentPlayers = isHome
      ? match.joueursDomicile || match.joueur_dom || []
      : match.joueursExterieur || match.joueur_ext || [];

    if (currentPlayers.length >= 4) return;

    const updatedPlayers = [...currentPlayers, newPlayer].sort((a, b) =>
      trierClassements(a.classement || 'ZZ', b.classement || 'ZZ')
    );

    // Mettre à jour les deux formats pour la compatibilité
    const updateObject = isHome
      ? {
          joueursDomicile: updatedPlayers,
          joueur_dom: updatedPlayers,
        }
      : {
          joueursExterieur: updatedPlayers,
          joueur_ext: updatedPlayers,
        };

    onUpdateMatch(match.id, updateObject);
  };

  const removePlayer = (isHome: boolean, playerId: string) => {
    // Récupérer les joueurs existants en gérant les deux formats
    const currentPlayers = isHome
      ? match.joueursDomicile || match.joueur_dom || []
      : match.joueursExterieur || match.joueur_ext || [];

    const updatedPlayers = currentPlayers.filter((p) => p.id !== playerId);

    // Mettre à jour les deux formats pour la compatibilité
    const updateObject = isHome
      ? {
          joueursDomicile: updatedPlayers,
          joueur_dom: updatedPlayers,
        }
      : {
          joueursExterieur: updatedPlayers,
          joueur_ext: updatedPlayers,
        };

    // Supprimer également le score individuel de ce joueur
    const updatedScores = { ...individualScores };
    delete updatedScores[playerId];

    onUpdateMatch(match.id, {
      ...updateObject,
      scoresIndividuels: updatedScores
    });

    setIndividualScores(updatedScores);
  };

  // Gérer la navigation interne (entre les scores individuels) et externe (entre les matchs)
  const handleInternalKeyDown = (e: React.KeyboardEvent, currentPlayerId?: string) => {
    if (showIndividualScores) {
      // Si on utilise les flèches verticales pour naviguer entre les joueurs
      if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && currentPlayerId) {
        e.preventDefault();

        const players = isFrameriesHome
          ? match.joueursDomicile || match.joueur_dom || []
          : match.joueursExterieur || match.joueur_ext || [];
        const frameriePlayers = players.filter(
          () =>
            (isFrameriesHome && match.domicile.includes('CTT Frameries')) ||
            (isFrameriesAway && match.exterieur.includes('CTT Frameries'))
        );

        const currentIndex = frameriePlayers.findIndex(
          (player) => player.id === currentPlayerId
        );

        let nextIndex: number;
        if (e.key === 'ArrowDown') {
          nextIndex = currentIndex + 1;
          if (nextIndex >= frameriePlayers.length) {
            // Dernier joueur, revenir au champ de score du match
            internalScoreInputRef.current?.focus();
            return;
          }
        } else { // ArrowUp
          nextIndex = currentIndex - 1;
          if (nextIndex < 0) {
            // Premier joueur, aller au champ de score du match
            internalScoreInputRef.current?.focus();
            return;
          }
        }

        // Aller au score du prochain joueur
        individualScoreRefs.current[frameriePlayers[nextIndex].id]?.focus();
        return;
      }
    }

    // Déléguer au parent pour la navigation entre matchs
    if (onKeyDown && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      onKeyDown(e);
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
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="font-semibold text-lg">
              {match.domicile} vs {match.exterieur}
            </h3>
            <p className="text-sm text-gray-600">{formatDateEuropean(match.date)}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              Semaine {match.semaine}
            </Badge>
            {/* Afficher le badge CTT Frameries si applicable */}
            {isFrameriesMatch && (
              <Badge variant={isFrameriesHome ? 'default' : 'secondary'}>
                {isFrameriesHome ? 'Domicile' : 'Extérieur'}
              </Badge>
            )}
            {/* Score global du match */}
            <div className="flex items-center gap-2">
              <Input
                ref={(el) => {
                  if (scoreInputRef) scoreInputRef(el);
                  internalScoreInputRef.current = el;
                }}
                type="text"
                placeholder="0-0"
                value={match.score || ''}
                onChange={(e) => handleScoreChange(e.target.value)}
                onKeyDown={onKeyDown}
                className="w-16 h-8 text-center text-sm"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isFrameriesMatch ? (
          /* Afficher la gestion des joueurs pour CTT Frameries */
          <div className="max-w-2xl mx-auto">
            {isFrameriesHome ? (
              /* Équipe domicile CTT Frameries */
              <PlayerManagement
                players={match.joueursDomicile || match.joueur_dom || []}
                membres={membres}
                onAddPlayer={(player) => addPlayer(true, player)}
                onRemovePlayer={(playerId) => removePlayer(true, playerId)}
                teamName={match.domicile}
                showIndividualScores={showIndividualScores}
                individualScores={match.scoresIndividuels || {}}
                onIndividualScoreChange={handleIndividualScoreChange}
                individualScoreRefs={individualScoreRefs}
                handleKeyDown={handleInternalKeyDown}
                expectedTotalScore={getFrameriesScore()}
                currentTotalScore={getTotalIndividualScores()}
                isValidTotal={isValidScoreTotal()}
                onAdjustScores={adjustScoresToMatchTotal}
                onResetScores={resetIndividualScores}
              />
            ) : (
              /* Équipe extérieur CTT Frameries */
              <PlayerManagement
                players={match.joueursExterieur || match.joueur_ext || []}
                membres={membres}
                onAddPlayer={(player) => addPlayer(false, player)}
                onRemovePlayer={(playerId) => removePlayer(false, playerId)}
                teamName={match.exterieur}
                showIndividualScores={showIndividualScores}
                individualScores={match.scoresIndividuels || {}}
                onIndividualScoreChange={handleIndividualScoreChange}
                individualScoreRefs={individualScoreRefs}
                handleKeyDown={handleInternalKeyDown}
                expectedTotalScore={getFrameriesScore()}
                currentTotalScore={getTotalIndividualScores()}
                isValidTotal={isValidScoreTotal()}
                onAdjustScores={adjustScoresToMatchTotal}
                onResetScores={resetIndividualScores}
              />
            )}
          </div>
        ) : (
          /* Afficher seulement les infos du match pour les autres équipes */
          <div className="text-center py-8">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="text-center">
                <h4 className="font-medium text-lg">{match.domicile}</h4>
                <Badge variant="outline" className="mt-1">Domicile</Badge>
              </div>
              <div className="text-2xl font-bold text-gray-400">vs</div>
              <div className="text-center">
                <h4 className="font-medium text-lg">{match.exterieur}</h4>
                <Badge variant="outline" className="mt-1">Extérieur</Badge>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Match entre équipes externes - Saisie du score uniquement
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface PlayerManagementProps {
  players: Joueur[];
  membres: Member[];
  onAddPlayer: (player: Member) => void;
  onRemovePlayer: (playerId: string) => void;
  teamName: string;
  showIndividualScores?: boolean;
  individualScores?: Record<string, number>;
  onIndividualScoreChange?: (playerId: string, score: number) => void;
  individualScoreRefs?: React.MutableRefObject<
    Record<string, HTMLInputElement | null>
  >;
  handleKeyDown?: (e: React.KeyboardEvent, playerId?: string) => void;
  expectedTotalScore?: number;
  currentTotalScore?: number;
  isValidTotal?: boolean;
  onAdjustScores?: () => void;
  onResetScores?: () => void;
}

function PlayerManagement({
  players,
  membres,
  onAddPlayer,
  onRemovePlayer,
  teamName,
  showIndividualScores = false,
  individualScores = {},
  onIndividualScoreChange,
  individualScoreRefs,
  handleKeyDown,
  expectedTotalScore = 0,
  currentTotalScore = 0,
  isValidTotal = true,
  onResetScores,
}: PlayerManagementProps) {
  const trierClassements = (a: string, b: string) => {
    const [lettreA, chiffreA] = [a[0], parseInt(a.slice(1)) || 0];
    const [lettreB, chiffreB] = [b[0], parseInt(b.slice(1)) || 0];

    if (lettreA !== lettreB) {
      return lettreA.localeCompare(lettreB);
    }
    return chiffreA - chiffreB;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium flex items-center gap-2">
          <Users className="h-4 w-4" />
          Composition - {teamName.split(' ').slice(-1)[0]}
        </h4>
        <Badge variant="outline" className="text-xs">
          {players.length}/4 joueurs
        </Badge>
      </div>

      {!showIndividualScores && (
        <PlayerSelector
          membres={membres.sort((a, b) =>
            trierClassements(a.classement || 'ZZ', b.classement || 'ZZ')
          )}
          onPlayerSelect={onAddPlayer}
          disabled={players.length >= 4}
        />
      )}

      {showIndividualScores && teamName.includes('CTT Frameries') && (
        <div className={`p-2 rounded-md ${
          isValidTotal ? 'bg-green-50' : 'bg-amber-50'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {isValidTotal ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-amber-500" />
              )}
              <span className="text-sm font-medium">
                Total des scores: {currentTotalScore}/{expectedTotalScore}
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={onResetScores}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Réinitialiser
              </Button>
            </div>
          </div>

          {!isValidTotal && (
            <div className="text-xs text-amber-600 flex items-center gap-1 mt-1">
              <AlertCircle className="h-3 w-3" />
              <span>Le total des scores individuels doit être égal au score de l'équipe</span>
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        {players.length > 0 ? (
          players.map((player) => {
            // Utiliser le classement du joueur en priorité, sinon chercher dans les membres
            const membre = membres.find((m) => m.id === player.id);
            const classement = player.classement || membre?.classement || 'N/A';

            // S'assurer que wo est défini, par défaut "n"
            if (!player.wo) {
              player.wo = "n";
            }

            // Nettoyer le nom en supprimant les espaces supplémentaires
            const nomAffiche = player.nom
              ? player.nom.trim()
              : player.prenom && player.prenom.trim()
                ? `${player.prenom.trim()} ${player.nom || ''}`.trim()
                : membre
                  ? `${membre.prenom || ''} ${membre.nom || ''}`.trim()
                  : 'Joueur inconnu';

            // Récupérer le score ou définir à 0 si joueur WO
            const playerScore = player.wo === "y" ? 0 : individualScores[player.id] || 0;

            // Si le joueur est WO, s'assurer que son score est à 0
            if (player.wo === "y" && individualScores[player.id] !== 0 && onIndividualScoreChange) {
              onIndividualScoreChange(player.id, 0);
            }

            return (
              <div
                key={player.id}
                className={`flex items-center justify-between ${player.wo === "y" ? 'bg-red-50' : 'bg-gray-50'} p-3 rounded-lg`}
              >
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="text-xs">
                    {classement}
                  </Badge>
                  <span className={`font-medium ${player.wo === "y" ? 'line-through text-red-700' : ''}`}>
                    {nomAffiche}
                    {player.wo === "y" &&
                      <Badge variant="destructive" className="ml-2 text-xs">WO</Badge>
                    }
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {showIndividualScores &&
                    teamName.includes('CTT Frameries') && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Score:</span>
                        <div className="flex items-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            disabled={playerScore === 0 || player.wo === "y"}
                            onClick={() => onIndividualScoreChange?.(player.id, playerScore - 1)}
                          >
                            <MinusCircle className="h-3 w-3" />
                          </Button>

                          <Input
                            ref={(el) => {
                              if (individualScoreRefs) {
                                individualScoreRefs.current[player.id] = el;
                              }
                            }}
                            type="number"
                            min="0"
                            max={player.wo === "y" ? "0" : "4"}
                            value={playerScore}
                            onChange={(e) => {
                              if (player.wo === "y") {
                                // Forcer la valeur à 0 pour les joueurs WO
                                onIndividualScoreChange?.(player.id, 0);
                              } else {
                                onIndividualScoreChange?.(
                                  player.id,
                                  Number.parseInt(e.target.value) || 0
                                );
                              }
                            }}
                            onKeyDown={(e) => handleKeyDown?.(e, player.id)}
                            className={`w-12 h-8 text-center text-sm mx-1 ${player.wo === "y" ? 'bg-red-50 cursor-not-allowed' : ''}`}
                            placeholder="0"
                            disabled={player.wo === "y"}
                          />

                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            disabled={playerScore >= 4 ||
                                    currentTotalScore >= expectedTotalScore ||
                                    player.wo === "y"}
                            onClick={() => onIndividualScoreChange?.(player.id, playerScore + 1)}
                          >
                            <PlusCircle className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                  )}
                  {!showIndividualScores && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemovePlayer(player.id)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-6 text-gray-500">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Aucun joueur sélectionné</p>
          </div>
        )}
      </div>
    </div>
  );
}
