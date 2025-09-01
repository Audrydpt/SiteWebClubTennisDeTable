/* eslint-disable react/no-array-index-key,react/no-unescaped-entities,@typescript-eslint/no-unused-vars,no-empty */
import {
  Trophy,
  Medal,
  Star,
  Award,
  Target,
  Users,
  Crown,
  TrendingUp,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { fetchInformations } from '@/services/api';

interface ClubAchievement {
  annee: string;
  titre: string;
  categorie: string;
  niveau: string;
  description?: string;
}

interface IndividualAchievement {
  nom: string;
  titres: string[];
  categorie: string;
}

interface Stat {
  value: string;
  label: string;
  sublabel: string;
}

interface Objectif {
  titre: string;
  description: string;
}

export default function Palmares() {
  const [stats, setStats] = useState<Stat[]>([]);
  const [clubAchievements, setClubAchievements] = useState<ClubAchievement[]>(
    []
  );
  const [individualAchievements, setIndividualAchievements] = useState<
    IndividualAchievement[]
  >([]);
  const [objectifs, setObjectifs] = useState<Objectif[]>([]);
  const [objectifGlobal, setObjectifGlobal] = useState<string>('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const infos = await fetchInformations();
        if (infos && infos.length > 0 && infos[0].palmares) {
          const p = infos[0].palmares;
          setStats(p.stats || []);
          setClubAchievements(p.clubAchievements || []);
          setIndividualAchievements(p.individualAchievements || []);
          setObjectifs(p.objectifs || []);
          setObjectifGlobal(p.objectifGlobal || '');
        }
      } catch (error) {}
    };

    loadData();
  }, []);

  const getIconForCategory = (category: string) => {
    switch (category) {
      case 'Équipe Senior':
        return Users;
      case 'Équipe Réserve':
        return Target;
      case 'Club':
        return Award;
      case 'Senior':
        return Trophy;
      case 'Dame':
        return Star;
      case 'Jeune':
        return TrendingUp;
      case 'Vétéran':
        return Crown;
      default:
        return Medal;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'International':
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
      case 'National':
        return 'bg-gradient-to-r from-blue-500 to-blue-700';
      case 'Régional':
        return 'bg-gradient-to-r from-green-500 to-green-700';
      case 'Provincial':
        return 'bg-gradient-to-r from-purple-500 to-purple-700';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* HEADER */}
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
            Palmarès du{' '}
            <span className="text-[#F1C40F] drop-shadow-lg">CTT Frameries</span>
          </h1>
          <p className="text-xl max-w-3xl mx-auto leading-relaxed text-gray-300">
            Découvrez les succès et réalisations de notre club de tennis de
            table
          </p>
        </div>
      </div>

      {/* STATISTIQUES */}
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto mb-20">
          <div className="text-center mb-16">
            <div className="inline-block bg-[#F1C40F] text-[#3A3A3A] px-6 py-2 rounded-full font-semibold mb-6 text-sm uppercase tracking-wide">
              🏆 Nos Succès en Chiffres
            </div>
            <h2 className="text-4xl font-bold text-[#3A3A3A] mb-6">
              Une trajectoire victorieuse
            </h2>
          </div>

          {/* Exactement 4 cartes par ligne pour les statistiques */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 justify-items-center max-w-6xl mx-auto">
            {stats.map((stat, index) => (
              <Card
                key={index}
                className={`shadow-2xl border-0 w-full max-w-xs ${index % 2 === 0 ? 'bg-gradient-to-br from-[#F1C40F] to-yellow-400 text-[#3A3A3A]' : 'bg-gradient-to-br from-[#3A3A3A] to-gray-600 text-white'}`}
              >
                <CardContent className="p-8 text-center">
                  <div
                    className={`text-4xl font-bold mb-2 ${index % 2 === 1 ? 'text-[#F1C40F]' : ''}`}
                  >
                    {stat.value}
                  </div>
                  <div className="text-lg font-semibold">{stat.label}</div>
                  <div className="text-sm opacity-80 mt-2">{stat.sublabel}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* RÉALISATIONS DU CLUB */}
      <div className="bg-gray-50 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-block bg-[#F1C40F] text-[#3A3A3A] px-6 py-2 rounded-full font-semibold mb-6 text-sm uppercase tracking-wide">
                🏅 Réalisations Collectives
              </div>
              <h2 className="text-4xl font-bold text-[#3A3A3A] mb-6">
                Les succès de nos équipes
              </h2>
              <p className="text-gray-600 text-xl max-w-3xl mx-auto">
                Retour sur les moments forts et les victoires qui ont marqué
                l'histoire du club
              </p>
            </div>

            {/* Maximum 3 cartes par ligne CENTRÉ */}
            <div className="flex flex-wrap justify-center gap-8 max-w-5xl mx-auto">
              {clubAchievements.map((achievement, index) => {
                const IconComponent = getIconForCategory(achievement.categorie);
                return (
                  <Card
                    key={index}
                    className="shadow-xl border-0 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 w-full max-w-lg"
                  >
                    <CardContent className="p-8">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="bg-[#F1C40F] p-3 rounded-full">
                          <IconComponent className="h-6 w-6 text-[#3A3A3A]" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="bg-[#3A3A3A] text-white px-3 py-1 rounded-full text-sm font-semibold">
                              {achievement.annee}
                            </span>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${getLevelColor(achievement.niveau)}`}
                            >
                              {achievement.niveau}
                            </span>
                          </div>
                          <h3 className="font-bold text-[#3A3A3A] mb-2 text-xl">
                            {achievement.titre}
                          </h3>
                          <p className="text-[#F1C40F] font-semibold mb-2">
                            {achievement.categorie}
                          </p>
                          {achievement.description && (
                            <p className="text-gray-600 leading-relaxed">
                              {achievement.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* PERFORMANCES INDIVIDUELLES */}
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block bg-[#F1C40F] text-[#3A3A3A] px-6 py-2 rounded-full font-semibold mb-6 text-sm uppercase tracking-wide">
              ⭐ Performances Individuelles
            </div>
            <h2 className="text-4xl font-bold text-[#3A3A3A] mb-6">
              Nos champions
            </h2>
            <p className="text-gray-600 text-xl max-w-3xl mx-auto">
              Les joueurs qui font la fierté du CTT Frameries par leurs
              performances exceptionnelles
            </p>
          </div>

          {/* Maximum 3 cartes par ligne CENTRÉ */}
          <div className="flex flex-wrap justify-center gap-8 max-w-5xl mx-auto">
            {individualAchievements.map((player, index) => {
              const IconComponent = getIconForCategory(player.categorie);
              return (
                <Card
                  key={index}
                  className="shadow-xl border-0 hover:shadow-2xl transition-all duration-300 w-full max-w-md"
                >
                  <CardContent className="p-8">
                    <div className="flex items-start gap-4 mb-6">
                      <div className="bg-[#F1C40F] p-3 rounded-full">
                        <IconComponent className="h-6 w-6 text-[#3A3A3A]" />
                      </div>
                      <div>
                        <h3 className="font-bold text-[#3A3A3A] mb-2 text-xl">
                          {player.nom}
                        </h3>
                        <span className="bg-[#3A3A3A] text-white px-3 py-1 rounded-full text-sm font-semibold">
                          {player.categorie}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {player.titres.map(
                        (achievement: string, achievementIndex: number) => (
                          <div
                            key={achievementIndex}
                            className="flex items-start gap-3"
                          >
                            <Medal className="h-4 w-4 text-[#F1C40F] mt-1 flex-shrink-0" />
                            <span className="text-gray-700">{achievement}</span>
                          </div>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* OBJECTIFS FUTURS */}
      <div className="bg-gray-50 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-block bg-[#F1C40F] text-[#3A3A3A] px-6 py-2 rounded-full font-semibold mb-6 text-sm uppercase tracking-wide">
                🎯 Nos Ambitions
              </div>
              <h2 className="text-4xl font-bold text-[#3A3A3A] mb-6">
                Vers de nouveaux sommets
              </h2>
            </div>

            <Card className="shadow-2xl border-0 bg-gradient-to-r from-[#3A3A3A] to-gray-600 text-white mb-12">
              <CardContent className="p-12">
                <div className="text-center">
                  <div className="text-6xl mb-6">🏓</div>
                  <blockquote className="text-2xl font-light italic mb-6 leading-relaxed">
                    &#34;{objectifGlobal}"
                  </blockquote>
                  <div className="text-[#F1C40F] font-semibold">
                    L'équipe dirigeante du CTT Frameries
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Maximum 3 cartes par ligne CENTRÉ */}
            <div className="flex flex-wrap justify-center gap-8 max-w-5xl mx-auto">
              {objectifs.map((objectif, index) => (
                <Card
                  key={index}
                  className="shadow-xl border-0 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 w-full max-w-sm"
                >
                  <CardContent className="p-8 text-center">
                    <div className="bg-[#F1C40F] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                      {index === 0 && (
                        <TrendingUp className="h-8 w-8 text-[#3A3A3A]" />
                      )}
                      {index === 1 && (
                        <Users className="h-8 w-8 text-[#3A3A3A]" />
                      )}
                      {index === 2 && (
                        <Trophy className="h-8 w-8 text-[#3A3A3A]" />
                      )}
                    </div>
                    <h3 className="font-bold text-[#3A3A3A] mb-4 text-xl">
                      {objectif.titre}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {objectif.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
