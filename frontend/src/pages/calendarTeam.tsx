import { useState, useEffect } from 'react';
import { Loader2, Calendar, Home, Plane, Trophy, Filter } from 'lucide-react';
import { fetchSaisonEnCours } from '@/services/api';
import { Saison, Match, Equipe } from '@/services/type.ts';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@/components/ui/table.tsx';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function CalendrierPage() {
  const [saison, setSaison] = useState<Saison | null>(null);
  const [equipeSelectionnee, setEquipeSelectionnee] = useState<Equipe | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [filtre, setFiltre] = useState<'tous' | 'passes' | 'futurs'>('tous');

  useEffect(() => {
    fetchSaisonEnCours()
      .then((data) => {
        setSaison(data);
        if (data && data.equipesClub.length > 0) {
          setEquipeSelectionnee(data.equipesClub[0]);
        }
      })
      .catch((error) => {
        console.error('Erreur lors du chargement des données:', error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handleSelectEquipe = (equipeId: string) => {
    const equipe = saison?.equipesClub.find((e) => e.id === equipeId);
    if (equipe) {
      setEquipeSelectionnee(equipe);
    }
  };

  const getMatchsPourEquipe = () => {
    if (!saison || !equipeSelectionnee) return [];

    const allMatches = saison.calendrier.filter(
      (match) =>
        match.serieId === equipeSelectionnee.serieId &&
        (match.domicile === equipeSelectionnee.nom ||
          match.exterieur === equipeSelectionnee.nom)
    );

    const aujourdhui = new Date();

    switch (filtre) {
      case 'passes':
        return allMatches.filter(
          (match) => match.date && new Date(match.date) < aujourdhui
        );
      case 'futurs':
        return allMatches.filter(
          (match) => !match.date || new Date(match.date) >= aujourdhui
        );
      default:
        return allMatches;
    }
  };

  const matchs = getMatchsPourEquipe();
  const matchsParSemaine = matchs.reduce(
    (acc, match) => {
      (acc[match.semaine] = acc[match.semaine] || []).push(match);
      return acc;
    },
    {} as Record<number, Match[]>
  );

  // Calculer les statistiques
  const calculerStatistiques = () => {
    if (!equipeSelectionnee || !saison)
      return { victoires: 0, defaites: 0, nuls: 0, aJouer: 0 };

    const matchsTermines = matchs.filter((match) => match.score);

    let victoires = 0;
    let defaites = 0;
    let nuls = 0;

    matchsTermines.forEach((match) => {
      const isDomicile = match.domicile === equipeSelectionnee.nom;
      const [scoreDomicile, scoreExterieur] = match.score
        .split('-')
        .map((s) => parseInt(s, 10));

      if (isDomicile) {
        if (scoreDomicile > scoreExterieur) {
          victoires += 1;
        } else if (scoreDomicile < scoreExterieur) {
          defaites += 1;
        } else {
          nuls += 1;
        }
      } else if (scoreExterieur > scoreDomicile) {
        victoires += 1;
      } else if (scoreExterieur < scoreDomicile) {
        defaites += 1;
      } else {
        nuls += 1;
      }
    });

    return {
      victoires,
      defaites,
      nuls,
      aJouer: matchs.length - matchsTermines.length,
    };
  };

  const stats = calculerStatistiques();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-10 min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!saison) {
    return (
      <div className="text-center p-10">
        Impossible de charger les données de la saison.
      </div>
    );
  }

  const getBadgeStyle = (res: string): string => {
    if (res === 'victoire') return 'bg-green-100 text-green-800 ml-2';
    if (res === 'defaite') return 'bg-red-100 text-red-800 ml-2';
    return 'bg-blue-100 text-blue-800 ml-2';
  };

  const getScoreStyle = (res: string | null, isOpponent: boolean): string => {
    if (!res) return '';
    if (res === 'victoire' && !isOpponent) return 'text-green-600';
    if (res === 'defaite' && isOpponent) return 'text-green-600';
    if (res === 'defaite' && !isOpponent) return 'text-red-600';
    if (res === 'victoire' && isOpponent) return 'text-red-600';
    return '';
  };

  return (
    <div className="bg-gray-100 min-h-screen py-6">
      <Card className="container mx-auto shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
              Calendrier des Compétitions
            </h1>
            {saison.equipesClub.length > 0 && (
              <div className="w-full sm:w-auto">
                <Select
                  onValueChange={handleSelectEquipe}
                  defaultValue={equipeSelectionnee?.id}
                >
                  <SelectTrigger className="w-full sm:w-[280px] text-base py-6">
                    <SelectValue placeholder="Sélectionner une équipe" />
                  </SelectTrigger>
                  <SelectContent>
                    {saison.equipesClub.map((equipe) => (
                      <SelectItem key={equipe.id} value={equipe.id}>
                        {equipe.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {equipeSelectionnee && (
            <Card className="mb-6 overflow-hidden shadow-sm">
              <CardContent className="p-4">
                <h2 className="font-bold text-xl mb-3">
                  Statistiques: {equipeSelectionnee.nom}
                </h2>
                <div className="grid grid-cols-4 gap-3 text-center">
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">
                      {stats.victoires}
                    </p>
                    <p className="text-sm text-gray-600">Victoires</p>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg">
                    <p className="text-2xl font-bold text-red-600">
                      {stats.defaites}
                    </p>
                    <p className="text-sm text-gray-600">Défaites</p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">
                      {stats.nuls}
                    </p>
                    <p className="text-sm text-gray-600">Nuls</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-2xl font-bold text-gray-600">
                      {stats.aJouer}
                    </p>
                    <p className="text-sm text-gray-600">À jouer</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {equipeSelectionnee && (
            <div className="mb-6">
              <Tabs
                defaultValue="tous"
                onValueChange={(value) =>
                  setFiltre(value as 'tous' | 'passes' | 'futurs')
                }
              >
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="tous">Tous les matchs</TabsTrigger>
                  <TabsTrigger value="passes">Matchs passés</TabsTrigger>
                  <TabsTrigger value="futurs">Matchs à venir</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          )}

          {!equipeSelectionnee ? (
            <div className="text-center py-12">
              <Trophy className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">
                Aucune équipe sélectionnée
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Veuillez choisir une équipe pour voir son calendrier.
              </p>
            </div>
          ) : Object.keys(matchsParSemaine).length > 0 ? (
            <div className="space-y-8">
              {Object.entries(matchsParSemaine).map(
                ([semaine, matchsDeLaSemaine]) => (
                  <Card
                    key={semaine}
                    className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300"
                  >
                    <CardContent className="p-0">
                      <div className="border-b border-gray-200 px-4 py-3">
                        <h3 className="text-xl font-semibold text-gray-700">
                          Semaine {semaine}
                        </h3>
                      </div>
                      <Table>
                        <TableBody>
                          {matchsDeLaSemaine.map((match) => {
                            const isDomicile =
                              match.domicile === equipeSelectionnee.nom;
                            const adversaire = isDomicile
                              ? match.exterieur
                              : match.domicile;

                            const scoreInfo = match.score
                              ? match.score
                                .split('-')
                                .map((s) => parseInt(s, 10))
                              : null;

                            let scoreEquipe = null;
                            let scoreAdversaire = null;
                            if (scoreInfo) {
                              scoreEquipe = isDomicile
                                ? scoreInfo[0]
                                : scoreInfo[1];
                              scoreAdversaire = isDomicile
                                ? scoreInfo[1]
                                : scoreInfo[0];
                            }

                            let resultat = null;
                            if (
                              scoreEquipe !== null &&
                              scoreAdversaire !== null
                            ) {
                              if (scoreEquipe > scoreAdversaire) {
                                resultat = 'victoire';
                              } else if (scoreEquipe < scoreAdversaire) {
                                resultat = 'defaite';
                              } else {
                                resultat = 'nul';
                              }
                            }

                            return (
                              <TableRow
                                key={match.id}
                                className="hover:bg-gray-50/70"
                              >
                                <TableCell className="w-12 text-center">
                                  {isDomicile ? (
                                    <span title="Match à domicile">
                                      <Home className="h-6 w-6 text-blue-500 mx-auto" />
                                    </span>
                                  ) : (
                                    <span title="Match à l'extérieur">
                                      <Plane className="h-6 w-6 text-orange-500 mx-auto" />
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="font-medium text-gray-800 text-base">
                                  {adversaire}
                                </TableCell>
                                <TableCell className="w-32 text-center">
                                  {match.score ? (
                                    <div className="flex items-center justify-center gap-2">
                                      <div className="text-xl font-bold font-mono">
                                        <span
                                          className={getScoreStyle(
                                            resultat,
                                            false
                                          )}
                                        >
                                          {scoreEquipe}
                                        </span>
                                        <span className="text-gray-400">-</span>
                                        <span
                                          className={getScoreStyle(
                                            resultat,
                                            true
                                          )}
                                        >
                                          {scoreAdversaire}
                                        </span>
                                      </div>

                                      {resultat && (
                                        <Badge
                                          className={getBadgeStyle(resultat)}
                                        >
                                          {resultat === 'victoire'
                                            ? 'V'
                                            : resultat === 'defaite'
                                              ? 'D'
                                              : 'N'}
                                        </Badge>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-sm font-normal text-gray-400 italic">
                                      À jouer
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="w-40 text-right text-gray-600">
                                  <div className="flex items-center justify-end gap-2">
                                    <Calendar className="h-5 w-5" />
                                    <span>
                                      {match.date
                                        ? new Date(
                                          match.date
                                        ).toLocaleDateString('fr-BE', {
                                          day: 'numeric',
                                          month: 'short',
                                          year: 'numeric',
                                        })
                                        : 'À définir'}
                                    </span>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )
              )}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <Filter className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">
                  Aucun match trouvé
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Aucun match ne correspond au filtre sélectionné.
                </p>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
