/* eslint-disable */

import { useState, useEffect } from 'react';
import { Loader2, Trophy, Users, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchAllRankings, getCachedAllRankings, type TabtDivisionRanking, type TabtRankingEntry, type TabtRankingResponse } from '@/services/tabt';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

const getRankColor = (position: number) => {
  switch (position) {
    case 1:
      return 'bg-yellow-400 text-white ring-2 ring-yellow-500/50';
    case 2:
      return 'bg-gray-400 text-white ring-2 ring-gray-500/50';
    case 3:
      return 'bg-orange-500 text-white ring-2 ring-orange-600/50';
    default:
      return 'bg-gray-200 text-gray-700';
  }
};

type CategorieFiltre = 'tous' | 'homme' | 'veteran' | 'femme';

const getCategorieFromDivisionNom = (
  nom: string
): 'homme' | 'femme' | 'veteran' => {
  const nomLower = nom.toLowerCase();
  if (
    nomLower.includes('dame') ||
    nomLower.includes('femme') ||
    nomLower.includes('féminin') ||
    nomLower.includes('dames') ||
    nomLower.includes('women')
  ) {
    return 'femme';
  }
  if (
    nomLower.includes('vétéran') ||
    nomLower.includes('veteran') ||
    nomLower.includes('vét') ||
    nomLower.includes('veteranen')
  ) {
    return 'veteran';
  }
  // Heren / Hommes par défaut
  if (nomLower.includes('heren') || nomLower.includes('homme')) {
    return 'homme';
  }
  return 'homme';
};

export default function EquipesPage() {
  const [tabtData, setTabtData] = useState<TabtRankingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filtreCategorie, setFiltreCategorie] =
    useState<CategorieFiltre>('tous');
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    // 1) Afficher immédiatement le cache s'il existe
    const cached = getCachedAllRankings();
    if (cached && !cancelled) {
      setTabtData(cached);
      setIsLoading(false);
    }

    // 2) Revalidation en arrière-plan (force=true) pour rafraîchir
    const revalidate = async () => {
      try {
        const data = await fetchAllRankings({ force: true });
        if (!cancelled) setTabtData(data);
      } catch (error) {
        if (!cached && !cancelled) {
          // pas de cache affichable: on reste en erreur/loading
          console.error('Erreur lors du chargement des données TABT:', error);
        }
      } finally {
        if (!cached && !cancelled) setIsLoading(false);
      }
    };

    revalidate();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleEquipeClick = (nomEquipe: string) => {
    const equipeEncoded = encodeURIComponent(nomEquipe);
    navigate(`/competition/calendrier/${equipeEncoded}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8 text-[#F1C40F]" />
      </div>
    );
  }

  if (!tabtData || !tabtData.success) {
    return (
      <div className="min-h-screen bg-white">
        <div className="relative bg-[#3A3A3A] text-white py-24 overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-32 h-32 border-4 border-[#F1C40F] rounded-full" />
            <div className="absolute top-32 right-20 w-24 h-24 bg-[#F1C40F] rounded-full" />
            <div className="absolute bottom-20 left-1/4 w-16 h-16 border-4 border-[#F1C40F] rounded-full" />
            <div className="absolute bottom-10 right-10 w-20 h-20 bg-[#F1C40F] rounded-full opacity-50" />
            <div className="absolute top-1/2 left-1/2 w-6 h-6 bg-[#F1C40F] rounded-full transform -translate-x-1/2 -translate-y-1/2" />
          </div>

          <div className="container mx-auto px-4 text-center relative z-10">
            <h1 className="text-6xl font-bold mb-6 leading-tight">
              Équipes &{' '}
              <span className="text-[#F1C40F] drop-shadow-lg">Classements</span>
            </h1>
            <p className="text-xl max-w-3xl mx-auto leading-relaxed text-gray-300">
              Suivez les performances de nos équipes en championnat
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-20">
          <Alert variant="destructive" className="max-w-2xl mx-auto">
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>
              Impossible de charger les données de classement (TABT).
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const clubId = tabtData.clubId; // ex: H442

  // Filtrer les divisions selon la catégorie sélectionnée
  const divisionsFiltrees: TabtDivisionRanking[] =
    filtreCategorie === 'tous'
      ? tabtData.data
      : tabtData.data.filter(
          (division) => getCategorieFromDivisionNom(division.divisionName) === filtreCategorie
        );

  return (
    <div className="min-h-screen bg-white">
      <div className="relative bg-[#3A3A3A] text-white py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 border-4 border-[#F1C40F] rounded-full" />
          <div className="absolute top-32 right-20 w-24 h-24 bg-[#F1C40F] rounded-full" />
          <div className="absolute bottom-20 left-1/4 w-16 h-16 border-4 border-[#F1C40F] rounded-full" />
          <div className="absolute bottom-10 right-10 w-20 h-20 bg-[#F1C40F] rounded-full opacity-50" />
          <div className="absolute top-1/2 left-1/2 w-6 h-6 bg-[#F1C40F] rounded-full transform -translate-x-1/2 -translate-y-1/2" />
        </div>

        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-6xl font-bold mb-6 leading-tight">
            Équipes &{' '}
            <span className="text-[#F1C40F] drop-shadow-lg">Classements</span>
          </h1>
          <p className="text-xl max-w-3xl mx-auto leading-relaxed text-gray-300">
            Classements officiels TABT — Club {clubId}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block bg-[#F1C40F] text-[#3A3A3A] px-6 py-2 rounded-full font-semibold mb-6 text-sm uppercase tracking-wide">
              🏆 Divisions: {tabtData.count}
            </div>
            <h2 className="text-4xl font-bold text-[#3A3A3A] mb-6">
              Classements des équipes
            </h2>
            <p className="text-gray-600 text-xl max-w-3xl mx-auto mb-8">
              Découvrez les performances de toutes nos équipes dans leurs
              divisions respectives
            </p>

            {/* Boutons de filtrage */}
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <Button
                onClick={() => setFiltreCategorie('tous')}
                variant={filtreCategorie === 'tous' ? 'default' : 'outline'}
                className={`px-6 py-2 rounded-full font-semibold transition-all duration-300 ${
                  filtreCategorie === 'tous'
                    ? 'bg-[#F1C40F] text[#3A3A3A] hover:bg-[#F1C40F]/90'
                    : 'border-[#F1C40F] text-[#F1C40F] hover:bg-[#F1C40F] hover:text-[#3A3A3A]'
                }`}
              >
                Toutes les catégories
              </Button>
              <Button
                onClick={() => setFiltreCategorie('homme')}
                variant={filtreCategorie === 'homme' ? 'default' : 'outline'}
                className={`px-6 py-2 rounded-full font-semibold transition-all duration-300 ${
                  filtreCategorie === 'homme'
                    ? 'bg-[#F1C40F] text-[#3A3A3A] hover:bg-[#F1C40F]/90'
                    : 'border-[#F1C40F] text-[#F1C40F] hover:bg-[#F1C40F] hover:text-[#3A3A3A]'
                }`}
              >
                Hommes
              </Button>
              <Button
                onClick={() => setFiltreCategorie('veteran')}
                variant={filtreCategorie === 'veteran' ? 'default' : 'outline'}
                className={`px-6 py-2 rounded-full font-semibold transition-all duration-300 ${
                  filtreCategorie === 'veteran'
                    ? 'bg-[#F1C40F] text-[#3A3A3A] hover:bg-[#F1C40F]/90'
                    : 'border-[#F1C40F] text-[#F1C40F] hover:bg-[#F1C40F] hover:text-[#3A3A3A]'
                }`}
              >
                Vétérans
              </Button>
              <Button
                onClick={() => setFiltreCategorie('femme')}
                variant={filtreCategorie === 'femme' ? 'default' : 'outline'}
                className={`px-6 py-2 rounded-full font-semibold transition-all duration-300 ${
                  filtreCategorie === 'femme'
                    ? 'bg-[#F1C40F] text-[#3A3A3A] hover:bg-[#F1C40F]/90'
                    : 'border-[#F1C40F] text-[#F1C40F] hover:bg-[#F1C40F] hover:text-[#3A3A3A]'
                }`}
              >
                Femmes
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {divisionsFiltrees.map((division: TabtDivisionRanking) => {
              const classement = division.ranking as TabtRankingEntry[];

              return (
                <Card
                  key={division.divisionId}
                  className="shadow-2xl border-0 overflow-hidden flex flex-col hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-2"
                >
                  <CardHeader className="bg-gradient-to-r from-[#3A3A3A] to-gray-600 text-white">
                    <CardTitle className="flex items-center gap-3 text-xl font-semibold">
                      <div className="bg-[#F1C40F] p-2 rounded-full">
                        <Trophy className="h-5 w-5 text-[#3A3A3A]" />
                      </div>
                      {division.divisionName}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 flex-grow">
                    <div className="overflow-x-auto h-full">
                      <Table className="min-w-full h-full">
                        <TableHeader>
                          <TableRow className="bg-gray-50 hover:bg-gray-50">
                            <TableHead className="w-[60px] text-center font-bold text-[#3A3A3A]">
                              #
                            </TableHead>
                            <TableHead className="min-w-[150px] font-bold text-[#3A3A3A]">
                              Équipe
                            </TableHead>
                            <TableHead className="text-center font-bold text-[#3A3A3A]">
                              J
                            </TableHead>
                            <TableHead className="text-center font-bold text-[#3A3A3A]">
                              V
                            </TableHead>
                            <TableHead className="text-center font-bold text-[#3A3A3A]">
                              N
                            </TableHead>
                            <TableHead className="text-center font-bold text-[#3A3A3A]">
                              D
                            </TableHead>
                            <TableHead className="text-center font-bold text-[#3A3A3A]">
                              Pts
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {classement.map((equipe: TabtRankingEntry) => (
                            <TableRow
                              key={`${division.divisionId}-${equipe.team}`}
                              className={
                                equipe.teamClub === clubId
                                  ? 'bg-gradient-to-r from-[#F1C40F]/10 to-yellow-50 hover:from-[#F1C40F]/20 hover:to-yellow-100 border-l-4 border-[#F1C40F] cursor-pointer'
                                  : 'hover:bg-gray-50/70'
                              }
                              onClick={() => {
                                if (equipe.teamClub === clubId) {
                                  handleEquipeClick(equipe.team);
                                }
                              }}
                            >
                              <TableCell className="text-center">
                                <span
                                  className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${getRankColor(
                                    equipe.position
                                  )}`}
                                >
                                  {equipe.position}
                                </span>
                              </TableCell>
                              <TableCell
                                className={`font-medium text-sm ${
                                  equipe.teamClub === clubId
                                    ? 'font-bold text-[#3A3A3A] flex items-center gap-2'
                                    : 'text-gray-800'
                                }`}
                              >
                                {equipe.teamClub === clubId && (
                                  <Star className="h-4 w-4 text-[#F1C40F]" />
                                )}
                                {equipe.team}
                              </TableCell>
                              <TableCell className="text-center font-mono text-sm font-semibold">
                                {equipe.gamesPlayed}
                              </TableCell>
                              <TableCell className="text-center font-mono text-sm text-green-600 font-bold">
                                {equipe.gamesWon}
                              </TableCell>
                              <TableCell className="text-center font-mono text-sm text-gray-600 font-semibold">
                                {equipe.gamesDraw}
                              </TableCell>
                              <TableCell className="text-center font-mono text-sm text-red-600 font-bold">
                                {equipe.gamesLost}
                              </TableCell>
                              <TableCell className="text-center font-mono text-lg font-bold text-[#3A3A3A]">
                                {equipe.points}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Message si aucune division trouvée */}
          {divisionsFiltrees.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500 text-xl">
                Aucune division trouvée pour cette catégorie
              </div>
            </div>
          )}

          <div className="mt-20">
            <div className="text-center mb-12">
              <div className="inline-block bg-[#F1C40F] text-[#3A3A3A] px-6 py-2 rounded-full font-semibold mb-6 text-sm uppercase tracking-wide">
                📊 Statistiques
              </div>
              <h3 className="text-3xl font-bold text-[#3A3A3A] mb-4">
                Nos équipes en chiffres
              </h3>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <Card className="shadow-2xl border-0 bg-gradient-to-br from-[#F1C40F] to-yellow-400 text-[#3A3A3A]">
                <CardContent className="p-8 text-center">
                  <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8" />
                  </div>
                  <div className="text-4xl font-bold mb-2">
                    {(() => {
                      let totalEquipes = 0;
                      divisionsFiltrees.forEach((division) => {
                        const clubTeams = division.ranking.filter(
                          (e) => e.teamClub === clubId
                        );
                        totalEquipes += clubTeams.length;
                      });
                      return totalEquipes;
                    })()}
                  </div>
                  <div className="text-lg font-semibold">Équipes engagées</div>
                  <div className="text-sm opacity-80 mt-2">
                    {filtreCategorie === 'tous'
                      ? 'En championnat'
                      : `Catégorie ${filtreCategorie}`}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-2xl border-0 bg-gradient-to-br from-[#3A3A3A] to-gray-600 text-white">
                <CardContent className="p-8 text-center">
                  <div className="bg-[#F1C40F]/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trophy className="h-8 w-8 text-[#F1C40F]" />
                  </div>
                  <div className="text-4xl font-bold mb-2 text-[#F1C40F]">
                    {(() => {
                      let equipesAuPodium = 0;
                      divisionsFiltrees.forEach((division) => {
                        const clubTeams = division.ranking.filter(
                          (e) => e.teamClub === clubId && e.position <= 3
                        );
                        equipesAuPodium += clubTeams.length;
                      });
                      return equipesAuPodium;
                    })()}
                  </div>
                  <div className="text-lg font-semibold">Sur le podium</div>
                  <div className="text-sm opacity-80 mt-2">
                    Top 3 des divisions
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-2xl border-0 bg-gradient-to-br from-[#F1C40F] to-yellow-400 text-[#3A3A3A]">
                <CardContent className="p-8 text-center">
                  <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Star className="h-8 w-8" />
                  </div>
                  <div className="text-4xl font-bold mb-2">
                    {(() => {
                      let totalPoints = 0;
                      divisionsFiltrees.forEach((division) => {
                        division.ranking.forEach((e) => {
                          if (e.teamClub === clubId) totalPoints += e.points;
                        });
                      });
                      return totalPoints;
                    })()}
                  </div>
                  <div className="text-lg font-semibold">Points totaux</div>
                  <div className="text-sm opacity-80 mt-2">
                    {filtreCategorie === 'tous'
                      ? 'Toutes équipes'
                      : `Catégorie ${filtreCategorie}`}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
