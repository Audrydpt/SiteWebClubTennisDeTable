/* eslint-disable react/no-unescaped-entities,@typescript-eslint/no-explicit-any,react/no-array-index-key,react/button-has-type,@typescript-eslint/no-unused-vars,prettier/prettier,no-console */
import { JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal, useEffect, useState } from 'react';
import {
  Users,
  Trophy,
  Target,
  Heart,
  Calendar,
  MapPin,
  Star,
  Award,
  Clock,
  Zap,
  ArrowDown,
  ArrowRight,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { fetchAbout, fetchInformations } from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';

interface AboutSection {
  id: string;
  title?: string;
  subtitle?: string;
  content?: string;
  items?: Array<{
    title?: string;
    description?: string;
    icon?: string;
  }>;
  stats?: Array<{
    value?: string;
    label?: string;
    sublabel?: string;
  }>;
  team?: Array<{
    role?: string;
    description?: string;
    experience?: string;
  }>;
  facilities?: Array<{
    name?: string;
    description?: string;
  }>;
  history?: Array<{
    period?: string;
    title?: string;
    description?: string;
  }>;
  values?: Array<{
    name?: string;
    description?: string;
    icon?: string;
  }>;
  evolution?: {
    oldName?: string;
    newName?: string;
    items?: Array<{
      title?: string;
      description?: string;
      icon?: string;
    }>;
  };
}

interface StatsData {
  membresActif: string;
  tablesDispo: string;
  anciennete: string;
  nbrEquipes: string;
}

export default function About() {
  const [aboutData, setAboutData] = useState<AboutSection[]>([]);
  const [statsData, setStatsData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [infos, setInfos] = useState<any>(null); // toutes les infos depuis JSON


  useEffect(() => {
    const loadAboutData = async () => {
      try {
        setLoading(true);
        // Charger les données about
        const data = await fetchAbout();
        setAboutData(Array.isArray(data) ? data : [data]);

        // Charger les statistiques depuis informations
        const informations = await fetchInformations();
        const stats = informations[0];
        setStatsData({
          membresActif: stats.membresActif || '',
          tablesDispo: stats.tablesDispo || '',
          anciennete: stats.anciennete || '',
          nbrEquipes: stats.nbrEquipes || '',
        });
      } catch (err) {
        setError('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    loadAboutData();

    const loadInfos = async () => {
      try {
        const data = await fetchInformations();
        if (data && data.length > 0) {
          setInfos(data[0]); // objet unique
        }
      } catch (err) {
        console.error('Erreur fetchInformations:', err);
      }
    };
    loadInfos();
  }, []);

  const getIconComponent = (iconName?: string) => {
    const iconMap: { [key: string]: any } = {
      Users,
      Trophy,
      Target,
      Heart,
      Calendar,
      MapPin,
      Star,
      Award,
      Clock,
      Zap,
      ArrowRight,
      Sparkles,
    };
    return iconMap[iconName || 'Heart'] || Heart;
  };

  const findSectionById = (id: string): AboutSection | undefined => {
    const found = aboutData.find((section) => section.id === id);
    return found;
  };




  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8 text-[#F1C40F]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-red-600">
          <p className="text-xl mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#F1C40F] text-[#3A3A3A] px-4 py-2 rounded"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // Si pas de données, afficher un fallback complet en dur
  if (!aboutData || aboutData.length === 0) {
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
              À propos du{' '}
              <span className="text-[#F1C40F] drop-shadow-lg">
                CTT Frameries
              </span>
            </h1>
            <p className="text-xl max-w-3xl mx-auto leading-relaxed text-gray-300">
              Découvrez l'histoire, les valeurs et l'esprit de notre club de
              tennis de table
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-20">
          <div className="text-center text-gray-500">
            <p>
              Aucune donnée disponible. Veuillez configurer le contenu via
              l'administration.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const headerSection = findSectionById('aboutHeader');
  const evolutionSection = findSectionById('evolution2025');
  const historySection = findSectionById('histoire');
  const spiritSection = findSectionById('ambiance');
  const valuesSection = findSectionById('valeurs');
  const teamSection = findSectionById('equipe');
  const facilitiesSection = findSectionById('installations');
  const contact = infos?.contact || [];
  const horaires = contact[0]?.horaires || [];

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
            {'À propos du'}{' '}
            <span className="text-[#F1C40F] drop-shadow-lg">CTT Frameries</span>
          </h1>
          <p className="text-xl max-w-3xl mx-auto leading-relaxed text-gray-300">
            {headerSection?.subtitle ||
              "Découvrez l'histoire, les valeurs et l'esprit de notre club de tennis de table"}
          </p>
        </div>
      </div>

      {/* INSTALLATIONS */}
      {facilitiesSection && (
        <div className="container mx-auto px-4 py-10">
          <div className="max-w-6xl mx-auto mt-8">
            <div className="text-center mb-16">
              <div className="inline-block bg-[#F1C40F] text-[#3A3A3A] px-6 py-2 rounded-full font-semibold mb-6 text-sm uppercase tracking-wide">
                🏢 Nos Installations
              </div>
              <h2 className="text-4xl font-bold text-[#3A3A3A] mb-6">
                {facilitiesSection.title}
              </h2>
            </div>

            <Card className="shadow-2xl border-0 overflow-hidden">
              <CardContent className="p-8">
                <div className="grid lg:grid-cols-2 gap-8 items-center">
                  <div>
                    <h3 className="text-2xl font-bold text-[#3A3A3A] mb-6">
                      {(facilitiesSection as any).salle?.title ||
                        'Salle de tennis de table moderne'}
                    </h3>
                    {(facilitiesSection as any).salle?.items && (
                      <div className="space-y-4">
                        {(facilitiesSection as any).salle.items.map(
                          (item: string, index: number) => {
                            const icons = [MapPin];
                            const IconComponent = icons[index % icons.length];
                            return (
                              <div
                                key={index}
                                className="flex items-center gap-3"
                              >
                                <div className="bg-[#F1C40F] p-2 rounded-full">
                                  <IconComponent className="h-4 w-4 text-[#3A3A3A]" />
                                </div>
                                <span className="text-gray-700">{item}</span>
                              </div>
                            );
                          }
                        )}
                      </div>
                    )}
                  </div>
                  <div className="bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src="https://res.cloudinary.com/dsrrxx5yx/image/upload/v1755271837/ydrro3shuy69uels5xua.jpg"
                      alt="Installations du club"
                      className="w-full h-64 object-cover"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto mb-20">
          <div className="text-center mb-16">
            <div className="inline-block bg-[#F1C40F] text-[#3A3A3A] px-6 py-2 rounded-full font-semibold mb-6 text-sm uppercase tracking-wide">
              📊 Le Club en Chiffres
            </div>
            <h2 className="text-4xl font-bold text-[#3A3A3A] mb-6">
              Notre communauté
            </h2>
          </div>
          {/* MODIFICATION: Grille responsive pour les statistiques */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 justify-items-center max-w-6xl mx-auto">
            <Card className="shadow-2xl border-0 bg-gradient-to-br from-[#F1C40F] to-yellow-400 text-[#3A3A3A] w-full max-w-xs">
              <CardContent className="p-8 text-center">
                <div className="text-4xl font-bold mb-2">
                  {statsData?.membresActif || '50'}+
                </div>
                <div className="text-lg font-semibold">Membres actifs</div>
                <div className="text-sm opacity-80 mt-2">De tous âges</div>
              </CardContent>
            </Card>
            <Card className="shadow-2xl border-0 bg-gradient-to-br from-[#3A3A3A] to-gray-600 text-white w-full max-w-xs">
              <CardContent className="p-8 text-center">
                <div className="text-4xl font-bold mb-2 text-[#F1C40F]">
                  {statsData?.tablesDispo || '8'}
                </div>
                <div className="text-lg font-semibold">Tables officielles</div>
                <div className="text-sm opacity-80 mt-2">
                  Équipement professionnel
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-2xl border-0 bg-gradient-to-br from-[#F1C40F] to-yellow-400 text-[#3A3A3A] w-full max-w-xs">
              <CardContent className="p-8 text-center">
                <div className="text-4xl font-bold mb-2">
                  {statsData?.nbrEquipes || '13'}
                </div>
                <div className="text-lg font-semibold">Équipes</div>
                <div className="text-sm opacity-80 mt-2">En championnat</div>
              </CardContent>
            </Card>
            <Card className="shadow-2xl border-0 bg-gradient-to-br from-[#3A3A3A] to-gray-600 text-white w-full max-w-xs">
              <CardContent className="p-8 text-center">
                <div className="text-4xl font-bold mb-2 text-[#F1C40F]">
                  {statsData?.anciennete || '10'}+
                </div>
                <div className="text-lg font-semibold">Années</div>
                <div className="text-sm opacity-80 mt-2">D'expérience</div>
              </CardContent>
            </Card>
          </div>

          {/* HORAIRES - Section séparée centrée */}
          {horaires.length > 0 && (
            <div className="flex justify-center mt-12">
              <Card className="shadow-2xl border-0 max-w-md w-full">
                <CardContent className="p-8 text-center">
                  <div className="flex items-start gap-4 justify-center">
                    <div className="bg-[#F1C40F] p-3 rounded-full shadow-lg">
                      <Clock className="h-6 w-6 text-[#3A3A3A]" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-[#3A3A3A] mb-2 text-lg">
                        Horaires entrainement
                      </h3>
                      <ul className="text-gray-700 font-medium space-y-1">
                        {horaires.map(
                          (
                            h: {
                              jour:
                                | string
                                | number
                                | bigint
                                | boolean
                                | ReactElement<
                                unknown,
                                string | JSXElementConstructor<any>
                              >
                                | Iterable<ReactNode>
                                | ReactPortal
                                | Promise<
                                | string
                                | number
                                | bigint
                                | boolean
                                | ReactPortal
                                | ReactElement<
                                unknown,
                                string | JSXElementConstructor<any>
                              >
                                | Iterable<ReactNode>
                                | null
                                | undefined
                              >
                                | Iterable<ReactNode>
                                | null
                                | undefined;
                              horaire:
                                | string
                                | number
                                | bigint
                                | boolean
                                | ReactElement<
                                unknown,
                                string | JSXElementConstructor<any>
                              >
                                | Iterable<ReactNode>
                                | ReactPortal
                                | Promise<
                                | string
                                | number
                                | bigint
                                | boolean
                                | ReactPortal
                                | ReactElement<
                                unknown,
                                string | JSXElementConstructor<any>
                              >
                                | Iterable<ReactNode>
                                | null
                                | undefined
                              >
                                | Iterable<ReactNode>
                                | null
                                | undefined;
                            },
                            idx: Key | null | undefined
                          ) => (
                            <li key={idx}>
                              <span className="font-semibold">{h.jour} :</span>{' '}
                              {h.horaire}
                            </li>
                          )
                        )}
                      </ul>
                      <p className="text-gray-400 font-medium mt-3">
                        <span className="font-semibold">
                          Championnat le samedi
                        </span>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* ÉVOLUTION & CHANGEMENT DE NOM 2025 */}
      {evolutionSection && (
        <div className="bg-gray-50 py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <div className="inline-block bg-[#F1C40F] text-[#3A3A3A] px-6 py-2 rounded-full font-semibold mb-6 text-sm uppercase tracking-wide">
                  🔄 Évolution 2025
                </div>
                <h2 className="text-4xl font-bold text-[#3A3A3A] mb-6">
                  {evolutionSection.title}
                </h2>
                <p className="text-gray-600 text-xl max-w-3xl mx-auto">
                  {evolutionSection.subtitle}
                </p>
              </div>

              {/* Afficher les raisons de l'évolution - CENTRÉ avec CSS Grid */}
              {(evolutionSection as any).raisons && (
                <div className="mb-12">
                  {/* MODIFICATION: Grille responsive pour les raisons de l'évolution */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center max-w-6xl mx-auto">
                    {(evolutionSection as any).raisons.map(
                      (raison: any, index: number) => {
                        const icons = [MapPin, Target, Sparkles];
                        const IconComponent = icons[index % icons.length];
                        return (
                          <Card
                            key={index}
                            className="shadow-xl border-0 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 bg-white w-full max-w-sm"
                          >
                            <CardContent className="p-8 text-center">
                              <div className="bg-[#F1C40F] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                                <IconComponent className="h-8 w-8 text-[#3A3A3A]" />
                              </div>
                              <h3 className="font-bold text-[#3A3A3A] mb-4 text-xl">
                                {raison.title}
                              </h3>
                              <p className="text-gray-600 leading-relaxed">
                                {raison.text}
                              </p>
                            </CardContent>
                          </Card>
                        );
                      }
                    )}
                  </div>
                </div>
              )}

              <div className="flex flex-col items-center">
                <div className="bg-white rounded-lg shadow-lg px-8 py-6 max-w-xl text-center">
                  <div className="text-2xl font-bold text-[#3A3A3A] mb-2">
                    Ancien nom :{' '}
                    <span className="font-normal">
                      {(evolutionSection as any).ancienNom ||
                        'Palette Greemlins Quaregnon/Wasmuel'}
                    </span>
                  </div>
                  <ArrowDown className="h-8 w-8 text-[#F1C40F] mx-auto my-4" />
                  <div className="text-2xl font-bold text-[#F1C40F]">
                    Nouveau nom :{' '}
                    <span className="text-[#3A3A3A] font-normal">
                      {(evolutionSection as any).nouveauNom || 'CTT Frameries'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HISTOIRE DU CLUB */}
      {historySection && (
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-block bg-[#F1C40F] text-[#3A3A3A] px-6 py-2 rounded-full font-semibold mb-6 text-sm uppercase tracking-wide">
                🏓 Notre Histoire
              </div>
              <h2 className="text-4xl font-bold text-[#3A3A3A] mb-6">
                {historySection.title}
              </h2>
              <p className="text-gray-600 text-xl max-w-3xl mx-auto">
                {historySection.subtitle}
              </p>
            </div>

            {(historySection as any).events && (
              <div className="mb-20">
                <div className="flex justify-center">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch max-w-4xl">
                    {(historySection as any).events.map(
                      (event: any, index: number) => {
                        const IconComponent = getIconComponent(event.icon);
                        return (
                          <Card key={index} className="shadow-2xl border-0 overflow-hidden h-full w-full max-w-lg">
                            <CardContent className="p-8 flex flex-col h-full">
                              <div className="flex items-start gap-4 mb-6 flex-grow">
                                <div className="bg-[#F1C40F] p-3 rounded-full flex-shrink-0">
                                  <IconComponent className="h-6 w-6 text-[#3A3A3A]" />
                                </div>
                                <div className="flex flex-col flex-grow">
                                  <h3 className="font-bold text-[#3A3A3A] mb-2 text-xl">
                                    {event.title}
                                  </h3>
                                  <p className="text-gray-600 leading-relaxed flex-grow">
                                    {event.text}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      }
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AMBIANCE & ESPRIT CLUB */}
      {spiritSection && (
        <div className="bg-gray-50 py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <div className="inline-block bg-[#F1C40F] text-[#3A3A3A] px-6 py-2 rounded-full font-semibold mb-6 text-sm uppercase tracking-wide">
                  ❤️ Notre Ambiance
                </div>
                <h2 className="text-4xl font-bold text-[#3A3A3A] mb-6">
                  {spiritSection.title}
                </h2>
                <p className="text-gray-600 text-xl max-w-3xl mx-auto">
                  {spiritSection.subtitle}
                </p>
              </div>

              {(spiritSection as any).valeurs && (
                <div className="mb-12">
                  {/* MODIFICATION: Grille responsive pour les valeurs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center max-w-6xl mx-auto">
                    {(spiritSection as any).valeurs.map(
                      (valeur: any, index: number) => {
                        const IconComponent = getIconComponent(valeur.icon);
                        return (
                          <Card
                            key={index}
                            className="shadow-xl border-0 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 w-full max-w-sm"
                          >
                            <CardContent className="p-8 text-center">
                              <div className="bg-[#F1C40F] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                                <IconComponent className="h-8 w-8 text-[#3A3A3A]" />
                              </div>
                              <h3 className="font-bold text-[#3A3A3A] mb-4 text-xl">
                                {valeur.title}
                              </h3>
                              <p className="text-gray-600 leading-relaxed">
                                {valeur.text}
                              </p>
                            </CardContent>
                          </Card>
                        );
                      }
                    )}
                  </div>
                </div>
              )}

              {(spiritSection as any).citation && (
                <Card className="shadow-2xl border-0 bg-gradient-to-r from-[#3A3A3A] to-gray-600 text-white mb-12">
                  <CardContent className="p-12">
                    <div className="text-center">
                      <div className="text-6xl mb-6">🏓</div>
                      <blockquote className="text-2xl font-light italic mb-6 leading-relaxed">
                        "{(spiritSection as any).citation.text}"
                      </blockquote>
                      <div className="text-[#F1C40F] font-semibold">
                        {(spiritSection as any).citation.author}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {((spiritSection as any).momentsForts ||
                (spiritSection as any).uniques) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 justify-items-center max-w-4xl mx-auto">
                  {(spiritSection as any).momentsForts && (
                    <Card className="shadow-xl border-0 w-full max-w-md">
                      <CardContent className="p-8">
                        <h3 className="text-2xl font-bold text-[#3A3A3A] mb-4 flex items-center gap-3 justify-center">
                          <Calendar className="h-6 w-6" />
                          Nos moments forts
                        </h3>
                        <ul className="space-y-3 text-gray-600">
                          {(spiritSection as any).momentsForts.map(
                            (moment: string, index: number) => (
                              <li
                                className="flex items-start gap-2"
                                key={index}
                              >
                                <span className="text-[#F1C40F] font-bold">
                                  •
                                </span>
                                {moment}
                              </li>
                            )
                          )}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {(spiritSection as any).uniques && (
                    <Card className="shadow-xl border-0 w-full max-w-md">
                      <CardContent className="p-8">
                        <h3 className="text-2xl font-bold text-[#3A3A3A] mb-4 flex items-center gap-3 justify-center">
                          <Star className="h-6 w-6" />
                          Ce qui nous rend uniques
                        </h3>
                        <ul className="space-y-3 text-gray-600">
                          {(spiritSection as any).uniques.map(
                            (unique: string, index: number) => (
                              <li
                                className="flex items-start gap-2"
                                key={index}
                              >
                                <span className="text-[#F1C40F] font-bold">
                                  •
                                </span>
                                {unique}
                              </li>
                            )
                          )}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ÉQUIPE DIRIGEANTE */}
      {teamSection && (
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-block bg-[#F1C40F] text-[#3A3A3A] px-6 py-2 rounded-full font-semibold mb-6 text-sm uppercase tracking-wide">
                👥 Notre Équipe
              </div>
              <h2 className="text-4xl font-bold text-[#3A3A3A] mb-6">
                {teamSection.title}
              </h2>
              <p className="text-gray-600 text-xl max-w-3xl mx-auto">
                {teamSection.subtitle}
              </p>
            </div>

            {(teamSection as any).membres && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center max-w-6xl mx-auto">
                {(teamSection as any).membres.map(
                  (member: any, index: number) => {
                    const IconComponent = getIconComponent(member.icon);
                    return (
                      <Card
                        key={index}
                        className="shadow-xl border-0 hover:shadow-2xl transition-all duration-300 w-full max-w-sm"
                      >
                        <CardContent className="p-8 text-center">
                          <div className="bg-[#F1C40F] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <IconComponent className="h-10 w-10 text-[#3A3A3A]" />
                          </div>
                          <h3 className="font-bold text-[#3A3A3A] mb-2 text-xl">
                            {member.title}
                          </h3>
                          <p className="text-gray-600 mb-4">{member.text}</p>
                          {member.note && (
                            <div className="text-sm text-gray-500">
                              {member.note}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  }
                )}
              </div>
            )}
          </div>
        </div>
      )}


      {/* FALLBACK - Si aucune section trouvée, afficher un contenu minimal */}
      {!evolutionSection &&
        !historySection &&
        !spiritSection &&
        !valuesSection &&
        !teamSection &&
        !facilitiesSection && (
          <div className="container mx-auto px-4 py-20">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-[#3A3A3A] mb-8">
                CTT Frameries
              </h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                Club de tennis de table situé à Frameries. Contenu en cours de
                configuration.
              </p>
            </div>
          </div>
      )}
    </div>
  );
}
