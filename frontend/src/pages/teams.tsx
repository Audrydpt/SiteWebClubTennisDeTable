/* eslint-disable @typescript-eslint/no-explicit-any,no-console */

import { useState, useEffect } from 'react';
import { Loader2, Trophy } from 'lucide-react';
import { fetchSaisonEnCours } from '@/services/api';
import calculerClassement from '@/services/classements';
import { Saison, Serie, ClassementEntry } from '@/services/type.ts';
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-10 min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!saison) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>
            Impossible de charger les données de la saison en cours.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const nomClub = 'CTT Frameries';

  return (
    <div className="bg-gray-50/50 py-10">
      <Card className="container mx-auto px-4 py-8 sm:px-6 lg:px-8 shadow-xl rounded-2xl bg-white">
        <main>
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
              Équipes & Classements
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              Classements pour la saison {saison.label}
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
                  className="shadow-lg border-t-4 border-primary/20 overflow-hidden flex flex-col"
                >
                  <CardHeader className="bg-slate-100/80">
                    <CardTitle className="flex items-center gap-3 text-xl font-semibold text-slate-800">
                      <Trophy className="h-6 w-6 text-yellow-500" />
                      {serie.nom}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 flex-grow">
                    <div className="overflow-x-auto h-full">
                      <Table className="min-w-full h-full">
                        <TableHeader>
                          <TableRow className="bg-gray-50 hover:bg-gray-50">
                            <TableHead className="w-[60px] text-center">
                              #
                            </TableHead>
                            <TableHead className="min-w-[150px]">
                              Équipe
                            </TableHead>
                            <TableHead className="text-center">J</TableHead>
                            <TableHead className="text-center">V</TableHead>
                            <TableHead className="text-center">N</TableHead>
                            <TableHead className="text-center">D</TableHead>
                            <TableHead className="text-center font-bold">
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
                                  ? 'bg-blue-50 hover:bg-blue-100/70'
                                  : 'hover:bg-gray-50/70'
                              }
                            >
                              <TableCell className="text-center">
                                <span
                                  className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold ${getRankColor(
                                    equipe.position
                                  )}`}
                                >
                                  {equipe.position}
                                </span>
                              </TableCell>
                              <TableCell
                                className={`font-medium text-sm ${
                                  equipe.nom.includes(nomClub)
                                    ? 'font-bold text-blue-900'
                                    : 'text-gray-800'
                                }`}
                              >
                                {equipe.nom}
                              </TableCell>
                              <TableCell className="text-center font-mono text-sm">
                                {equipe.joues}
                              </TableCell>
                              <TableCell className="text-center font-mono text-sm text-green-600 font-semibold">
                                {equipe.victoires}
                              </TableCell>
                              <TableCell className="text-center font-mono text-sm text-gray-600">
                                {equipe.nuls}
                              </TableCell>
                              <TableCell className="text-center font-mono text-sm text-red-600 font-semibold">
                                {equipe.defaites}
                              </TableCell>
                              <TableCell className="text-center font-mono text-base font-bold text-gray-900">
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
        </main>
      </Card>
    </div>
  );
}
