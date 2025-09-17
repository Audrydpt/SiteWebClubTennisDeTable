/* eslint-disable */

import { useState, useEffect } from 'react';
import { Loader2, Trophy, Users, Star, CheckCircle, Circle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchAllRankings, getCachedAllRankings, type TabtDivisionRanking, type TabtRankingEntry, type TabtRankingResponse, type TabtProgressPhase } from '@/services/tabt';
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

// Remplacement d’affichage pour certains termes NL
const formatDivisionName = (name: string): string => {
  if (!name) return ''
  return name
    .replace(/\bAfdeling\b/gi, 'Division')
    .replace(/\bVeteranen\b/gi, 'Vétérans')
    .replace(/\bHeren\b/gi, 'Hommes')
}

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
  if (nomLower.includes('heren') || nomLower.includes('homme')) {
    return 'homme';
  }
  return 'homme';
};

const ProgressStep = ({
  label,
  isActive,
  isCompleted,
  isLast
}: {
  phase: TabtProgressPhase;
  label: string;
  isActive: boolean;
  isCompleted: boolean;
  isLast: boolean;
}) => {
  const getIcon = () => {
    if (isCompleted) return <CheckCircle className="w-6 h-6" />;
    if (isActive) return <Clock className="w-6 h-6" />;
    return <Circle className="w-6 h-6" />;
  };

  return (
    <div className="flex items-center">
      <div className="flex flex-col items-center">
        <div className={`
          relative p-3 rounded-full transition-all duration-500 ease-in-out
          ${isCompleted 
            ? 'bg-[#F1C40F] text-[#3A3A3A] shadow-lg' 
            : isActive 
              ? 'bg-[#F1C40F]/20 text-[#F1C40F] ring-2 ring-[#F1C40F] shadow-md' 
              : 'bg-gray-200 text-gray-400'
          }
        `}>
          {getIcon()}
          {isActive && (
            <div className="absolute inset-0 rounded-full bg-[#F1C40F]/20 animate-pulse" />
          )}
        </div>
        <span className={`
          mt-2 text-sm font-medium text-center transition-all duration-300
          ${isCompleted || isActive ? 'text-[#3A3A3A]' : 'text-gray-500'}
        `}>
          {label}
        </span>
      </div>
      {!isLast && (
        <div className={`
          flex-1 h-1 mx-4 rounded-full transition-all duration-500 ease-in-out
          ${isCompleted ? 'bg-[#F1C40F]' : 'bg-gray-200'}
        `}>
          {isActive && !isCompleted && (
            <div className="h-full bg-gradient-to-r from-[#F1C40F] to-transparent rounded-full animate-pulse" />
          )}
        </div>
      )}
    </div>
  );
};

const InfoBox = () => (
  <div className="max-w-4xl mx-auto mb-8 px-4">
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
      <div className="bg-blue-100 rounded-full p-2 flex-shrink-0 mt-0.5 sm:mt-0">
        <Star className="h-4 w-4 text-blue-600" />
      </div>
      <div className="min-w-0">
        <h4 className="text-blue-900 font-semibold text-sm mb-1">
          💡 Astuce
        </h4>
        <p className="text-blue-800 text-sm leading-relaxed break-words">
          Cliquez sur une équipe de notre club (marquée avec ⭐) pour consulter tous ses matchs de la saison
        </p>
      </div>
    </div>
  </div>
);

export default function EquipesPage() {
  const [tabtData, setTabtData] = useState<TabtRankingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filtreCategorie, setFiltreCategorie] = useState<CategorieFiltre>('tous');
  const [showProgress, setShowProgress] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [currentPhase, setCurrentPhase] = useState<TabtProgressPhase>('contact');
  const [completedPhases, setCompletedPhases] = useState<TabtProgressPhase[]>([]);
  const navigate = useNavigate();

  const progressSteps: { phase: TabtProgressPhase; label: string }[] = [
    { phase: 'contact', label: 'Connexion AFTT' },
    { phase: 'reception', label: 'Réception données' },
    { phase: 'tri', label: 'Traitement' },
    { phase: 'cache', label: 'Mise en cache' },
    { phase: 'done', label: 'Finalisation' },
  ];

  useEffect(() => {
    let cancelled = false;

    // 1) Afficher immédiatement le cache s'il existe
    const cached = getCachedAllRankings();
    if (cached && !cancelled) {
      setTabtData(cached);
      setIsLoading(false);
      setShowProgress(false);
    } else {
      setShowProgress(true);
      setProgressValue(5);
      setCurrentPhase('contact');
      setCompletedPhases([]);
    }

    // 2) Revalidation en arrière-plan (force=true) pour rafraîchir
    const revalidate = async () => {
      try {
        const data = await fetchAllRankings({
          force: true,
          onProgress: (phase, percent) => {
            if (cancelled) return;
            setCurrentPhase(phase);
            if (typeof percent === 'number') {
              setProgressValue(percent);
            }

            // Marquer les phases précédentes comme complétées
            const currentIndex = progressSteps.findIndex(step => step.phase === phase);
            const completed = progressSteps.slice(0, currentIndex).map(step => step.phase);
            setCompletedPhases(completed);
          },
        });
        if (!cancelled) {
          setTabtData(data);
          // Marquer toutes les phases comme complétées
          setCompletedPhases(progressSteps.map(step => step.phase));
        }
      } catch (error) {
        if (!cached && !cancelled) {
          console.error('Erreur lors du chargement des données TABT:', error);
        }
      } finally {
        if (!cached && !cancelled) {
          setIsLoading(false);
          setTimeout(() => {
            if (!cancelled) setShowProgress(false);
          }, 800);
        }
      }
    };

    revalidate();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleEquipeClick = (nomEquipe: string, divisionId: number) => {
    const equipeEncoded = encodeURIComponent(nomEquipe);
    navigate(`/competition/calendrier/${equipeEncoded}?divisionId=${divisionId}`);
  };

  if (isLoading) {
    // Premier chargement sans cache: afficher la barre de progression
    if (showProgress) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
          {/* Header élégant */}
          <div className="relative bg-gradient-to-r from-[#3A3A3A] via-gray-700 to-[#3A3A3A] text-white py-20 overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-10 left-10 w-32 h-32 border-4 border-[#F1C40F] rounded-full animate-pulse" />
              <div className="absolute top-32 right-20 w-24 h-24 bg-[#F1C40F] rounded-full opacity-50 animate-bounce" />
              <div className="absolute bottom-20 left-1/4 w-16 h-16 border-4 border-[#F1C40F] rounded-full animate-spin" />
              <div className="absolute bottom-10 right-10 w-20 h-20 bg-[#F1C40F] rounded-full opacity-30" />
              <div className="absolute top-1/2 left-1/2 w-6 h-6 bg-[#F1C40F] rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-ping" />
            </div>

            <div className="container mx-auto px-4 text-center relative z-10">
              <div className="mb-6">
                <div className="inline-flex items-center px-4 py-2 bg-[#F1C40F]/20 rounded-full backdrop-blur-sm border border-[#F1C40F]/30">
                  <Loader2 className="animate-spin w-5 h-5 text-[#F1C40F] mr-2" />
                  <span className="text-[#F1C40F] font-medium">Chargement en cours</span>
                </div>
              </div>
              <h1 className="text-5xl font-bold mb-4 leading-tight bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                Récupération des classements
              </h1>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                Connexion aux services AFTT pour obtenir les données les plus récentes
              </p>
            </div>
          </div>

          {/* Section de progression principale */}
          <div className="container mx-auto px-4 py-16">
            <div className="max-w-4xl mx-auto">
              {/* Étapes de progression */}
              <div className="mb-12">
                <div className="flex items-center justify-between mb-8">
                  {progressSteps.map((step, index) => (
                    <ProgressStep
                      key={step.phase}
                      phase={step.phase}
                      label={step.label}
                      isActive={currentPhase === step.phase}
                      isCompleted={completedPhases.includes(step.phase)}
                      isLast={index === progressSteps.length - 1}
                    />
                  ))}
                </div>
              </div>

              {/* Barre de progression principale */}
              <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-[#3A3A3A]">
                      {progressSteps.find(s => s.phase === currentPhase)?.label || 'Chargement...'}
                    </span>
                    <span className="text-sm font-bold text-[#F1C40F]">
                      {Math.min(100, Math.max(0, Math.round(progressValue)))}%
                    </span>
                  </div>

                  {/* Barre de progression stylée */}
                  <div className="relative w-full h-4 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                    <div
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#F1C40F] to-yellow-300 rounded-full transition-all duration-500 ease-out shadow-lg"
                      style={{ width: `${Math.min(100, Math.max(0, progressValue))}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                    </div>
                  </div>
                </div>

                {/* Informations détaillées */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                  <div className="bg-gradient-to-br from-[#F1C40F]/10 to-yellow-50 rounded-xl p-4 border border-[#F1C40F]/20">
                    <div className="text-xs text-[#3A3A3A]/70 uppercase tracking-wide font-semibold mb-1">
                      Source
                    </div>
                    <div className="text-sm font-bold text-[#3A3A3A]">
                      AFTT Belgique
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                    <div className="text-xs text-[#3A3A3A]/70 uppercase tracking-wide font-semibold mb-1">
                      Étape actuelle
                    </div>
                    <div className="text-sm font-bold text-[#3A3A3A]">
                      {progressSteps.find(s => s.phase === currentPhase)?.label}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                    <div className="text-xs text-[#3A3A3A]/70 uppercase tracking-wide font-semibold mb-1">
                      Progression
                    </div>
                    <div className="text-sm font-bold text-[#3A3A3A]">
                      {completedPhases.length} / {progressSteps.length} étapes
                    </div>
                  </div>
                </div>

                {/* Message d'encouragement */}
                <div className="mt-8 text-center">
                  <div className="inline-flex items-center px-4 py-2 bg-gray-50 rounded-full border">
                    <Clock className="w-4 h-4 text-gray-500 mr-2" />
                    <span className="text-sm text-gray-600">
                      Cette opération peut prendre quelques secondes...
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Fallback spinner (ne devrait s'afficher que très brièvement)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
        <div className="text-center">
          <Loader2 className="animate-spin w-12 h-12 text-[#F1C40F] mx-auto mb-4" />
          <p className="text-gray-600">Préparation...</p>
        </div>
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
              Impossible de charger les données de classement (AFTT).
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
            Classements officiels AFTT — Club {clubId}
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

          <InfoBox />

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
                      {formatDivisionName(division.divisionName)}
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
                                  handleEquipeClick(equipe.team, division.divisionId);
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
