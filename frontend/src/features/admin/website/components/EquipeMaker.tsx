/* eslint-disable */
'use client';

import { useState, useEffect } from 'react';
import {
  CalendarDays,
  Trophy,
  Target,
  UserCheck,
  BarChart3,
  Loader2,
  Save,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SelectionsManager } from '@/features/admin/website/components/content/teamsResults/SelectionsManager.tsx';
import { MatchCard } from '@/features/admin/website/components/content/teamsResults/MatchCard.tsx';
import { SerieSelector } from '@/features/admin/website/components/content/teamsResults/SeriesSelector.tsx';
import { WeekSelector } from '@/features/admin/website/components/content/teamsResults/WeeksSelector.tsx';
import { Saison, Member, Match } from '@/services/type.ts';
import { fetchSaisons, fetchUsers, updateSaisonResults } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AdminResults() {
  const [allSaisons, setAllSaisons] = useState<Saison[]>([]);
  const [saison, setSaison] = useState<Saison | null>(null);
  const [membres, setMembres] = useState<Member[]>([]);
  const [serieSelectionnee, setSerieSelectionnee] = useState<string>('');
  const [semaineSelectionnee, setSemaineSelectionnee] = useState<number>(1);
  const [matchs, setMatchs] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    const chargerDonneesInitiales = async () => {
      setIsLoading(true);
      try {
        const [saisonsData, membresData] = await Promise.all([
          fetchSaisons(),
          fetchUsers(),
        ]);

        setAllSaisons(saisonsData);
        setMembres(membresData);

        const saisonEnCours = saisonsData.find(
          (s: Saison) => s.statut === 'En cours'
        );

        if (saisonEnCours) {
          setSaison(saisonEnCours);
          setMatchs(saisonEnCours.calendrier);
          setIsSelecting(false);
        } else {
          setIsSelecting(true);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        setIsSelecting(true);
      } finally {
        setIsLoading(false);
      }
    };

    chargerDonneesInitiales();
  }, []);

  const updateMatch = (matchId: string, updates: Partial<Match>) => {
    setMatchs((prev) =>
      prev.map((match) => {
        if (match.id === matchId) {
          const updatedMatch = { ...match, ...updates };

          // Synchroniser les deux formats de joueurs pour la compatibilité
          if (updates.joueursDomicile) {
            updatedMatch.joueur_dom = updates.joueursDomicile;
          }
          if (updates.joueursExterieur) {
            updatedMatch.joueur_ext = updates.joueursExterieur;
          }
          if (updates.joueur_dom) {
            updatedMatch.joueursDomicile = updates.joueur_dom;
          }
          if (updates.joueur_ext) {
            updatedMatch.joueursExterieur = updates.joueur_ext;
          }

          // Initialiser le champ scoresIndividuels s'il n'existe pas
          if (!updatedMatch.scoresIndividuels && updates.scoresIndividuels) {
            updatedMatch.scoresIndividuels = updates.scoresIndividuels;
          } else if (updates.scoresIndividuels) {
            // Mettre à jour les scores individuels
            updatedMatch.scoresIndividuels = {
              ...updatedMatch.scoresIndividuels,
              ...updates.scoresIndividuels,
            };
          } else if (!updatedMatch.scoresIndividuels) {
            // S'assurer que le champ existe
            updatedMatch.scoresIndividuels = {};
          }

          return updatedMatch;
        }
        return match;
      })
    );
  };

  const handleSelectionsChange = (newSelections: Record<string, string[]>) => {
    setSelections((prev) => {
      const mergedSelections = { ...prev, ...newSelections };

      // Initialiser les sélections avec les joueurs existants si pas encore fait
      if (Object.keys(prev).length === 0) {
        const matchsSemaine = matchs.filter(
          (m) =>
            m.serieId === serieSelectionnee && m.semaine === semaineSelectionnee
        );

        matchsSemaine.forEach((match) => {
          if (match.domicile.includes('CTT Frameries')) {
            const existingPlayers =
              match.joueursDomicile || match.joueur_dom || [];
            if (existingPlayers.length > 0 && !mergedSelections[match.id]) {
              mergedSelections[match.id] = existingPlayers.map((p) => p.id);
            }
          } else if (match.exterieur.includes('CTT Frameries')) {
            const existingPlayers =
              match.joueursExterieur || match.joueur_ext || [];
            if (existingPlayers.length > 0 && !mergedSelections[match.id]) {
              mergedSelections[match.id] = existingPlayers.map((p) => p.id);
            }
          }
        });
      }

      return mergedSelections;
    });
  };

  const handleSaveData = async () => {
    if (!saison || !serieSelectionnee) return;

    setIsSaving(true);
    try {
      // Préparer les matchs avec les sélections ET les scores pour updateSaisonResults
      const matchsSemaine = matchs.filter(
        (m) =>
          m.serieId === serieSelectionnee && m.semaine === semaineSelectionnee
      );

      const matchesWithUpdatedData = matchsSemaine.map((match) => {
        const selectedPlayerIds = selections[match.id] || [];

        // Convertir les IDs en objets Joueur complets
        const joueurs = selectedPlayerIds.map((playerId) => {
          const membre = membres.find((m) => m.id === playerId);
          return membre
            ? {
                id: playerId,
                nom: `${membre.prenom} ${membre.nom}`,
                prenom: membre.prenom || '',
                classement: membre.classement || 'ZZ',
              }
            : {
                id: playerId,
                nom: playerId,
                prenom: '',
                classement: 'ZZ',
              };
        });

        // Préparer le match avec TOUTES les données mises à jour (score + joueurs + scores individuels)
        let matchWithUpdatedData = {
          ...match,
          // Utiliser le score du match local (qui peut avoir été modifié)
          score: match.score || '',
          // S'assurer que les scores individuels sont inclus
          scoresIndividuels: match.scoresIndividuels || {},
        };

        // Déterminer si CTT Frameries joue à domicile ou à l'extérieur
        if (match.domicile.includes('CTT Frameries')) {
          matchWithUpdatedData = {
            ...matchWithUpdatedData,
            joueursDomicile:
              joueurs.length > 0
                ? joueurs
                : match.joueursDomicile || match.joueur_dom || [],
            joueur_dom:
              joueurs.length > 0
                ? joueurs
                : match.joueursDomicile || match.joueur_dom || [],
          };
        } else if (match.exterieur.includes('CTT Frameries')) {
          matchWithUpdatedData = {
            ...matchWithUpdatedData,
            joueursExterieur:
              joueurs.length > 0
                ? joueurs
                : match.joueursExterieur || match.joueur_ext || [],
            joueur_ext:
              joueurs.length > 0
                ? joueurs
                : match.joueursExterieur || match.joueur_ext || [],
          };
        } else {
          // Pour les matchs sans CTT Frameries, on garde juste le score mis à jour
          matchWithUpdatedData = {
            ...matchWithUpdatedData,
            joueur_dom: match.joueur_dom || [],
            joueur_ext: match.joueur_ext || [],
          };
        }

        return matchWithUpdatedData;
      });

      // Utiliser updateSaisonResults pour sauvegarder
      await updateSaisonResults(saison.id, matchesWithUpdatedData);

      setSaveMessage({
        type: 'success',
        message: 'Sélections et scores sauvegardés avec succès !',
      });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      setSaveMessage({
        type: 'error',
        message: 'Erreur lors de la sauvegarde',
      });
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <span className="text-lg">Chargement des données...</span>
          </div>
        </div>
      </div>
    );
  }

  if (isSelecting || !saison) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-center h-96">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="text-center py-12">
              <Trophy className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Aucune saison en cours
              </h3>
              <p className="text-gray-500">
                Veuillez démarrer une saison pour accéder à cette interface
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const matchsSemaine = matchs.filter(
    (m) => m.serieId === serieSelectionnee && m.semaine === semaineSelectionnee
  );

  const serieSelectionneeData = saison.series.find(
    (s) => s.id === serieSelectionnee
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
            <Badge variant="outline" className="bg-white">
              <CalendarDays className="h-4 w-4 mr-1" />
              {saison.label}
            </Badge>
            <Badge
              variant={saison.statut === 'En cours' ? 'default' : 'secondary'}
            >
              {saison.statut}
            </Badge>
            <Badge variant="outline" className="bg-white">
              22 semaines • {matchs.length} matchs total
            </Badge>
          </div>
        </div>

        {/* Navigation */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Sélection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SerieSelector
                series={saison.series}
                selectedSerie={serieSelectionnee}
                onSerieChange={setSerieSelectionnee}
              />
              <WeekSelector
                selectedWeek={semaineSelectionnee}
                onWeekChange={setSemaineSelectionnee}
                disabled={!serieSelectionnee}
                maxWeeks={22}
              />
              <div className="flex items-end">
                <Button
                  onClick={handleSaveData}
                  disabled={!serieSelectionnee || isSaving}
                  className="w-full"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
                </Button>
              </div>
            </div>

            {saveMessage && (
              <Alert
                variant={
                  saveMessage.type === 'success' ? 'default' : 'destructive'
                }
                className="mt-4"
              >
                {saveMessage.type === 'success' ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertDescription>{saveMessage.message}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Content */}
        {serieSelectionnee && (
          <Tabs defaultValue="selections" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 bg-white/80 backdrop-blur-sm">
              <TabsTrigger
                value="selections"
                className="flex items-center gap-2"
              >
                <UserCheck className="h-4 w-4" />
                Sélections
              </TabsTrigger>
              <TabsTrigger value="results" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Résultats
              </TabsTrigger>
            </TabsList>

            <TabsContent value="selections" className="space-y-4">
              {serieSelectionneeData && (
                <SelectionsManager
                  serie={serieSelectionneeData}
                  semaine={semaineSelectionnee}
                  membres={membres}
                  matchs={matchsSemaine}
                  onSelectionsChange={handleSelectionsChange}
                />
              )}
            </TabsContent>

            <TabsContent value="results" className="space-y-4">
              {serieSelectionneeData && (
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-xl text-center flex items-center justify-center gap-2">
                      <BarChart3 className="h-6 w-6 text-green-600" />
                      {serieSelectionneeData.nom} - Semaine{' '}
                      {semaineSelectionnee}
                    </CardTitle>
                    <p className="text-center text-sm text-gray-600">
                      Encodage des résultats de tous les matchs de la série +
                      scores individuels CTT Frameries
                    </p>
                  </CardHeader>
                  <CardContent>
                    {matchsSemaine.length > 0 ? (
                      <div className="space-y-6">
                        {matchsSemaine.map((match) => (
                          <MatchCard
                            key={match.id}
                            match={match}
                            membres={membres}
                            onUpdateMatch={updateMatch}
                            showIndividualScores
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg">Aucun match programmé</p>
                        <p className="text-sm">pour cette sélection</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}

        {/* État vide */}
        {!serieSelectionnee && (
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="text-center py-12">
              <Target className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Sélectionnez une série
              </h3>
              <p className="text-gray-500">
                Choisissez une série pour commencer l'encodage des résultats
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
