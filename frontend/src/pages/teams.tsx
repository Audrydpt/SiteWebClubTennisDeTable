/* eslint-disable @typescript-eslint/no-explicit-any,no-console */

import { useState, useEffect } from 'react';
import { Loader2, Trophy, Users, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchSaisonEnCours } from '@/services/api';
import calculerClassement from '@/services/classements';
import type { Saison, Serie, ClassementEntry } from '@/services/type.ts';
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

export default function EquipesPage() {
  const [saison, setSaison] = useState<Saison | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchSaisonEnCours();
        setSaison(data);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleEquipeClick = (nomEquipe: string) => {
    // Encoder le nom de l'équipe pour l'URL
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

  if (!saison) {
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
              Impossible de charger les données de la saison en cours.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const nomClub = 'CTT Frameries';

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
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block bg-[#F1C40F] text-[#3A3A3A] px-6 py-2 rounded-full font-semibold mb-6 text-sm uppercase tracking-wide">
              🏆 {saison.label}
            </div>
            <h2 className="text-4xl font-bold text-[#3A3A3A] mb-6">
              Classements des équipes
            </h2>
            <p className="text-gray-600 text-xl max-w-3xl mx-auto">
              Découvrez les performances de toutes nos équipes dans leurs
              divisions respectives
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {saison.series.map((serie: Serie) => {
              const classement = calculerClassement(
                serie,
                saison.calendrier
              ) as ClassementEntry[];

              return (
                <Card
                  key={serie.id}
                  className="shadow-2xl border-0 overflow-hidden flex flex-col hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-2"
                >
                  <CardHeader className="bg-gradient-to-r from-[#3A3A3A] to-gray-600 text-white">
                    <CardTitle className="flex items-center gap-3 text-xl font-semibold">
                      <div className="bg-[#F1C40F] p-2 rounded-full">
                        <Trophy className="h-5 w-5 text-[#3A3A3A]" />
                      </div>
                      {serie.nom}
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
                          {classement.map((equipe: ClassementEntry) => (
                            <TableRow
                              key={equipe.nom}
                              className={
                                equipe.nom.includes(nomClub)
                                  ? 'bg-gradient-to-r from-[#F1C40F]/10 to-yellow-50 hover:from-[#F1C40F]/20 hover:to-yellow-100 border-l-4 border-[#F1C40F] cursor-pointer'
                                  : 'hover:bg-gray-50/70'
                              }
                              onClick={() => {
                                if (equipe.nom.includes(nomClub)) {
                                  handleEquipeClick(equipe.nom);
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
                                  equipe.nom.includes(nomClub)
                                    ? 'font-bold text-[#3A3A3A] flex items-center gap-2'
                                    : 'text-gray-800'
                                }`}
                              >
                                {equipe.nom.includes(nomClub) && (
                                  <Star className="h-4 w-4 text-[#F1C40F]" />
                                )}
                                {equipe.nom}
                              </TableCell>
                              <TableCell className="text-center font-mono text-sm font-semibold">
                                {equipe.joues}
                              </TableCell>
                              <TableCell className="text-center font-mono text-sm text-green-600 font-bold">
                                {equipe.victoires}
                              </TableCell>
                              <TableCell className="text-center font-mono text-sm text-gray-600 font-semibold">
                                {equipe.nuls}
                              </TableCell>
                              <TableCell className="text-center font-mono text-sm text-red-600 font-bold">
                                {equipe.defaites}
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
                    {saison.series.length}
                  </div>
                  <div className="text-lg font-semibold">Équipes engagées</div>
                  <div className="text-sm opacity-80 mt-2">En championnat</div>
                </CardContent>
              </Card>

              <Card className="shadow-2xl border-0 bg-gradient-to-br from-[#3A3A3A] to-gray-600 text-white">
                <CardContent className="p-8 text-center">
                  <div className="bg-[#F1C40F]/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trophy className="h-8 w-8 text-[#F1C40F]" />
                  </div>
                  <div className="text-4xl font-bold mb-2 text-[#F1C40F]">
                    {
                      saison.series.filter((serie) => {
                        const classement = calculerClassement(
                          serie,
                          saison.calendrier
                        ) as ClassementEntry[];
                        const clubTeam = classement.find((equipe) =>
                          equipe.nom.includes(nomClub)
                        );
                        return clubTeam && clubTeam.position <= 3;
                      }).length
                    }
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
                      saison.series.forEach((serie) => {
                        const classement = calculerClassement(
                          serie,
                          saison.calendrier
                        ) as ClassementEntry[];
                        const clubTeam = classement.find((equipe) =>
                          equipe.nom.includes(nomClub)
                        );
                        if (clubTeam) totalPoints += clubTeam.points;
                      });
                      return totalPoints;
                    })()}
                  </div>
                  <div className="text-lg font-semibold">Points totaux</div>
                  <div className="text-sm opacity-80 mt-2">Toutes équipes</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
