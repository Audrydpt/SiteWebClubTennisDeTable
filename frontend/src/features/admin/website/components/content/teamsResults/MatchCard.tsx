/* eslint-disable */
'use client';

import type React from 'react';

import { useState, useRef, useEffect } from 'react';
import { Home, Plane, Calendar, Users, X, Target } from 'lucide-react';
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
}

export function MatchCard({
  match,
  membres,
  onUpdateMatch,
  showIndividualScores = false,
}: MatchCardProps) {
  const [score, setScore] = useState(match.score || '');
  const [individualScores, setIndividualScores] = useState<
    Record<string, number>
  >(match.scoresIndividuels || {});

  const scoreInputRef = useRef<HTMLInputElement>(null);
  const individualScoreRefs = useRef<Record<string, HTMLInputElement | null>>(
    {}
  );

  const isFrameriesHome = match.domicile.includes('CTT Frameries');
  const isFrameriesAway = match.exterieur.includes('CTT Frameries');
  const showPlayerManagement = isFrameriesHome || isFrameriesAway;

  // Initialiser les scores individuels quand le match change
  useEffect(() => {
    if (match.scoresIndividuels) {
      setIndividualScores(match.scoresIndividuels);
    }
  }, [match.id, match.scoresIndividuels]);

  const handleScoreChange = (newScore: string) => {
    setScore(newScore);
    // Mettre à jour immédiatement le match parent avec le nouveau score
    onUpdateMatch(match.id, { score: newScore });
  };

  const handleIndividualScoreChange = (playerId: string, score: number) => {
    const newScores = { ...individualScores, [playerId]: score };
    setIndividualScores(newScores);

    // Transmettre les scores individuels au composant parent
    onUpdateMatch(match.id, { scoresIndividuels: newScores });
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

    onUpdateMatch(match.id, updateObject);
  };

  const handleKeyDown = (e: React.KeyboardEvent, currentPlayerId?: string) => {
    if (!showIndividualScores) return;

    const players = isFrameriesHome
      ? match.joueur_dom || []
      : match.joueur_ext || [];
    const frameriePlayers = players.filter(
      () =>
        (isFrameriesHome && match.domicile.includes('CTT Frameries')) ||
        (isFrameriesAway && match.exterieur.includes('CTT Frameries'))
    );

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();

      if (!currentPlayerId) {
        if (frameriePlayers.length > 0) {
          individualScoreRefs.current[frameriePlayers[0].id]?.focus();
        }
        return;
      }

      const currentIndex = frameriePlayers.findIndex(
        (player) => player.id === currentPlayerId
      );
      let nextIndex: number;

      if (e.key === 'ArrowDown') {
        nextIndex = currentIndex + 1;
        if (nextIndex >= frameriePlayers.length) {
          scoreInputRef.current?.focus();
          return;
        }
      } else {
        nextIndex = currentIndex - 1;
        if (nextIndex < 0) {
          scoreInputRef.current?.focus();
          return;
        }
      }

      individualScoreRefs.current[frameriePlayers[nextIndex].id]?.focus();
    }
  };

  return (
    <Card className="bg-white border-0 shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            {match.date}
          </CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-xs">
              Semaine {match.semaine}
            </Badge>
            {showIndividualScores && (
              <Badge variant="secondary" className="text-xs">
                <Target className="h-3 w-3 mr-1" />
                Scores individuels
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Score Section */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-5 gap-4 items-center">
            <div className="col-span-2 text-right">
              <div className="flex items-center justify-end gap-2">
                <Home className="h-4 w-4 text-green-600" />
                <span className="font-medium text-sm md:text-base truncate">
                  {match.domicile}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <Input
                ref={scoreInputRef}
                value={score}
                onChange={(e) => handleScoreChange(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e)}
                placeholder="0-0"
                className="text-center font-bold text-lg w-20 h-12"
              />
            </div>

            <div className="col-span-2 text-left">
              <div className="flex items-center gap-2">
                <Plane className="h-4 w-4 text-orange-600" />
                <span className="font-medium text-sm md:text-base truncate">
                  {match.exterieur}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Player Management */}
        {showPlayerManagement && (
          <div className="space-y-4">
            {isFrameriesHome && isFrameriesAway ? (
              <Tabs defaultValue="home" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="home" className="text-xs md:text-sm">
                    <Home className="h-4 w-4 mr-1" />
                    Domicile
                  </TabsTrigger>
                  <TabsTrigger value="away" className="text-xs md:text-sm">
                    <Plane className="h-4 w-4 mr-1" />
                    Extérieur
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="home">
                  <PlayerManagement
                    players={match.joueursDomicile || match.joueur_dom || []}
                    membres={membres}
                    onAddPlayer={(player) => addPlayer(true, player)}
                    onRemovePlayer={(playerId) => removePlayer(true, playerId)}
                    teamName={match.domicile}
                    showIndividualScores={showIndividualScores}
                    individualScores={individualScores}
                    onIndividualScoreChange={handleIndividualScoreChange}
                    individualScoreRefs={individualScoreRefs}
                    handleKeyDown={handleKeyDown}
                  />
                </TabsContent>
                <TabsContent value="away">
                  <PlayerManagement
                    players={match.joueursExterieur || match.joueur_ext || []}
                    membres={membres}
                    onAddPlayer={(player) => addPlayer(false, player)}
                    onRemovePlayer={(playerId) => removePlayer(false, playerId)}
                    teamName={match.exterieur}
                    showIndividualScores={showIndividualScores}
                    individualScores={individualScores}
                    onIndividualScoreChange={handleIndividualScoreChange}
                    individualScoreRefs={individualScoreRefs}
                    handleKeyDown={handleKeyDown}
                  />
                </TabsContent>
              </Tabs>
            ) : (
              <PlayerManagement
                players={
                  isFrameriesHome
                    ? match.joueursDomicile || match.joueur_dom || []
                    : match.joueursExterieur || match.joueur_ext || []
                }
                membres={membres}
                onAddPlayer={(player) => addPlayer(isFrameriesHome, player)}
                onRemovePlayer={(playerId) =>
                  removePlayer(isFrameriesHome, playerId)
                }
                teamName={isFrameriesHome ? match.domicile : match.exterieur}
                showIndividualScores={showIndividualScores}
                individualScores={individualScores}
                onIndividualScoreChange={handleIndividualScoreChange}
                individualScoreRefs={individualScoreRefs}
                handleKeyDown={handleKeyDown}
              />
            )}
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

      <div className="space-y-2">
        {players.length > 0 ? (
          players.map((player) => {
            // Utiliser le classement du joueur en priorité, sinon chercher dans les membres
            const membre = membres.find((m) => m.id === player.id);
            const classement = player.classement || membre?.classement || 'N/A';

            // Nettoyer le nom en supprimant les espaces supplémentaires
            const nomAffiche = player.nom
              ? player.nom.trim()
              : player.prenom && player.prenom.trim()
                ? `${player.prenom.trim()} ${player.nom || ''}`.trim()
                : membre
                  ? `${membre.prenom || ''} ${membre.nom || ''}`.trim()
                  : 'Joueur inconnu';

            return (
              <div
                key={player.id}
                className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="text-xs">
                    {classement}
                  </Badge>
                  <span className="font-medium">{nomAffiche}</span>
                </div>
                <div className="flex items-center gap-2">
                  {showIndividualScores &&
                    teamName.includes('CTT Frameries') && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Score:</span>
                        <Input
                          ref={(el) => {
                            if (individualScoreRefs) {
                              individualScoreRefs.current[player.id] = el;
                            }
                          }}
                          type="number"
                          min="0"
                          max="4"
                          value={individualScores[player.id] || 0}
                          onChange={(e) =>
                            onIndividualScoreChange?.(
                              player.id,
                              Number.parseInt(e.target.value) || 0
                            )
                          }
                          onKeyDown={(e) => handleKeyDown?.(e, player.id)}
                          className="w-16 h-8 text-center text-sm"
                          placeholder="0"
                        />
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
