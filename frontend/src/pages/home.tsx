/* eslint-disable @typescript-eslint/no-unused-vars,no-console,jsx-a11y/no-noninteractive-element-interactions,jsx-a11y/click-events-have-key-events,no-nested-ternary,@typescript-eslint/no-explicit-any,prettier/prettier,jsx-a11y/no-static-element-interactions,react/button-has-type */
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Slider from 'react-slick';

import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

import { Calendar, Loader2, Award } from 'lucide-react';

import {
  fetchActualites,
  fetchSponsors,
  fetchSaisonEnCours,
} from '../services/api';
import { ActualiteData, SponsorData, ResultatData } from '../services/type';
import '../lib/styles/home.css';
import HeroSection from '@/pages/comps/hero.tsx';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert.tsx';

// Ajout d'un type minimal pour la saison
type Serie = { id: string; nom: string };
type EquipeClub = { nom: string };
type CalendrierMatch = {
  id: string;
  division?: string;
  serie?: string;
  serieId?: string;
  domicile: string;
  exterieur: string;
  score?: string;
  date: string;
};
type SaisonData = {
  series?: Serie[];
  equipesClub?: EquipeClub[];
  calendrier?: CalendrierMatch[];

};

// Interface pour les props des flèches
interface ArrowProps {
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

function PrevArrow({ onClick }: ArrowProps) {
  return (
    <button
      type="button"
      className="custom-arrow custom-prev"
      onClick={onClick}
      aria-label="Précédent"
    >
      ❮
    </button>
  );
}

function NextArrow({ onClick }: ArrowProps) {
  return (
    <button
      type="button"
      className="custom-arrow custom-next"
      onClick={onClick}
      aria-label="Suivant"
    >
      ❯
    </button>
  );
}

export default function HomePage() {
  const [actualites, setActualites] = useState<ActualiteData[]>([]);
  const [resultats, setResultats] = useState<ResultatData[]>([]);
  const [sponsors, setSponsors] = useState<SponsorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saison, setSaison] = useState<SaisonData | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<ActualiteData | null>(null);


  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchActualites();
        console.log('Actualités récupérées:', data);

        let actualitesData = [];

        // Si data est directement un tableau, c'est notre tableau d'actualités
        if (Array.isArray(data)) {
          actualitesData = data;
        } else if (data && data.actualites && Array.isArray(data.actualites)) {
          // Si data est un objet avec une propriété actualites
          actualitesData = data.actualites;
        }

        // Trier les actualités par ordre
        const sortedActualites = actualitesData.sort(
          (a: ActualiteData, b: ActualiteData) =>
            (a.order || Infinity) - (b.order || Infinity)
        );

        setActualites(sortedActualites);

        // Récupération des résultats réels depuis l'API (saison en cours)
        const saisonEnCours = await fetchSaisonEnCours();
        setSaison(saisonEnCours);

        // On extrait les résultats des matchs du calendrier de la saison en cours
        let resultatsData: ResultatData[] = [];
        if (saisonEnCours && Array.isArray(saisonEnCours.calendrier)) {
          resultatsData = saisonEnCours.calendrier
            .filter((match: any) => match.score) // On ne garde que les matchs avec un score
            .map((match: any) => ({
              id: match.id,
              division: match.division || match.serie || '',
              equipe: match.domicile,
              adversaire: match.exterieur,
              score: match.score,
              date: match.date,
              domicile: true, // Par défaut, on considère que l'équipe passée ici est à domicile
              serieId: match.serieId || '',
            }));
        }
        setResultats(resultatsData);

        const sponsorsData = await fetchSponsors();
        // Tri par ordre
        const sortedSponsors = sponsorsData.sort(
          (a: SponsorData, b: SponsorData) => a.order - b.order
        );
        setSponsors(sortedSponsors);
      } catch (error) {
        console.error('Erreur lors du chargement des actualités:', error);
        setActualites([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Configuration du carrousel principal (mise à jour)
  const mainCarouselSettings = {
    dots: true,
    infinite: true,
    speed: 600,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 8000,
    arrows: true,
    prevArrow: <PrevArrow />,
    nextArrow: <NextArrow />,
  };

  // Fonction pour déterminer la classe de couleur du score
  // Prend en compte si l'équipe du club était à domicile ou à l'extérieur
  const getScoreColorClass = (score: string, isDomicile: boolean): string => {
    if (!score || score === '-') return 'text-gray-400';
    const parts = score.split('-');
    if (parts.length !== 2) return 'text-gray-700';
    const home = parseInt(parts[0], 10);
    const away = parseInt(parts[1], 10);

    // Si l'équipe du club est à domicile, home = club
    // Si l'équipe du club est à l'extérieur, away = club
    const clubScore = isDomicile ? home : away;
    const advScore = isDomicile ? away : home;

    if (clubScore > advScore) return 'text-green-600';
    if (clubScore < advScore) return 'text-red-600';
    return 'text-gray-700';
  };

  const handleActualiteClick = (redirectUrl: string | undefined | null) => {
    // Vérifie si l'URL existe et n'est pas une chaîne vide
    if (redirectUrl && redirectUrl.trim() !== '') {
      console.log('Redirection vers:', redirectUrl);
      window.open(redirectUrl, '_blank', 'noopener,noreferrer');
    } else {
      console.log('Pas de redirection: URL manquante ou vide');
    }
  };

  const renderCarouselContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      );
    }

    if (!actualites || actualites.length === 0) {
      return (
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>
              Impossible de charger les actualités. Veuillez réessayer plus tard.
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return (
      <div className="carousel-container px-4 py-2">
        <Slider {...mainCarouselSettings}>
          {actualites.map((actualite) => (
            <div key={actualite.id} className="px-2">
              <div
                className="relative rounded-lg overflow-hidden h-[400px] bg-black cursor-pointer group"
                onClick={() => setSelectedArticle(actualite)}
              >
                {/* Image floutée en fond */}
                <div className="absolute inset-0">
                  <img
                    src={actualite.imageUrl || '/placeholder.svg'}
                    alt={actualite.title}
                    className="w-full h-full object-cover blur-md opacity-50 transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder.svg';
                    }}
                  />
                </div>

                {/* Image principale centrée sans rognage */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <img
                    src={actualite.imageUrl || '/placeholder.svg'}
                    alt={actualite.title}
                    className="max-h-full max-w-full object-contain z-10 transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder.svg';
                    }}
                  />
                </div>

                {/* Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-20" />

                {/* Bloc texte global */}
                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 text-white z-30 bg-gradient-to-t from-black/80 via-black/50 to-transparent">
                  <div className="flex flex-col gap-2">
                    {/* Titre */}
                    <h3 className="text-lg md:text-2xl font-bold leading-tight drop-shadow-lg">
                      {actualite.title}
                    </h3>

                    {/* Aperçu du contenu avec Voir + après troncature */}
                    <div className="text-sm md:text-base text-gray-200 leading-relaxed drop-shadow-lg">
                      <p className="line-clamp-2 overflow-hidden">
                        {actualite.content.length > 150
                          ? `${actualite.content.substring(0, 150)}... `
                          : `${actualite.content} `
                        }
                        <button
                          className="text-white underline hover:text-gray-300 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedArticle(actualite);
                          }}
                        >
                          Voir +
                        </button>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </Slider>

        {/* MODAL PLEIN ÉCRAN */}
        {selectedArticle && (
          <div
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-2 sm:p-4 animate-fadeIn"
            onClick={(e) =>
              e.target === e.currentTarget && setSelectedArticle(null)
            }
          >
            <div className="relative max-w-4xl w-full bg-white rounded-lg overflow-hidden shadow-lg animate-slideUp max-h-[95vh] sm:max-h-[90vh]">
              {/* Bouton fermer */}
              <button
                className="absolute top-2 right-2 sm:top-4 sm:right-4 text-white text-2xl sm:text-3xl z-50 bg-black/50 rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center hover:bg-black/70"
                onClick={() => setSelectedArticle(null)}
              >
                ✕
              </button>

              {/* Image - hauteur adaptative selon l'écran */}
              <div className="w-full h-[200px] sm:h-[300px] md:h-[400px] bg-black overflow-hidden flex items-center justify-center">
                <img
                  src={selectedArticle.imageUrl || '/placeholder.svg'}
                  alt={selectedArticle.title}
                  className="max-h-full max-w-full object-contain transition-transform duration-500"
                />
              </div>

              {/* Contenu - hauteur adaptative pour éviter le scroll */}
              <div className="p-3 sm:p-4 md:p-6 text-black h-[250px] sm:h-[300px] md:h-[400px] flex flex-col">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-2 sm:mb-3 md:mb-4 flex-shrink-0 leading-tight">
                  {selectedArticle.title}
                </h2>

                <div className="flex-1 overflow-hidden">
                  <p className="leading-relaxed whitespace-pre-line text-sm sm:text-base">
                    {selectedArticle.content}
                  </p>
                </div>

                {selectedArticle.redirectUrl && selectedArticle.redirectUrl.trim() !== '' && (
                  <div className="mt-2 sm:mt-3 md:mt-4 pt-2 sm:pt-3 md:pt-4 border-t flex-shrink-0">
                    <a
                      href={selectedArticle.redirectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline hover:text-blue-800 visited:text-purple-600 transition-colors block truncate text-sm sm:text-base"
                      title={selectedArticle.redirectUrl}
                    >
                      {selectedArticle.redirectUrl}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* Section Hero */}
      <section>
        <HeroSection />
      </section>

      {/* Contenu principal : Carousel et Résultats */}
      <main className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Section Carousel */}
          <div className="lg:col-span-3">
            <div className="bg-white p-6 rounded-xl shadow-lg h-full">
              <h2 className="text-3xl font-bold text-gray-800 mb-4 flex items-center gap-3">
                <Calendar style={{ color: '#F1C40F' }} />À la une
              </h2>
              {renderCarouselContent()}
            </div>
          </div>

          {/* Section Résultats */}
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-xl shadow-lg h-full">
              <h2 className="text-3xl font-bold text-gray-800 mb-4 flex items-center gap-3">
                <Award style={{ color: '#F1C40F' }} />
                Derniers Résultats
              </h2>
              <div className="space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    {(() => {
                      // Récupère les noms complets des équipes du club
                      const equipesClub =
                        saison?.equipesClub?.map((e: { nom: string }) =>
                          e.nom.trim()
                        ) ?? [];

                      // Fonction utilitaire pour obtenir le nom de la série à partir du serieId
                      const getSerieNom = (serieId: string) => {
                        if (!saison?.series) return '';
                        const serie = saison.series.find(
                          (s: any) => s.id === serieId
                        );
                        return serie ? serie.nom : '';
                      };

                      // Fonction utilitaire pour formater la date
                      const formatDate = (dateStr: string) => {
                        if (!dateStr) return '';
                        const date = new Date(dateStr);
                        return date.toLocaleDateString('fr-BE', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                        });
                      };

                      // Pour chaque équipe du club, on prend son dernier match joué ou la prochaine rencontre prévue
                      const resultatsEquipes: ResultatData[] = equipesClub
                        .map((nomEquipe: string) => {
                          // Tous les matchs de l'équipe (domicile ou extérieur)
                          const matchsEquipe = resultats
                            .filter(
                              (res) =>
                                res.equipe?.trim() === nomEquipe ||
                                res.adversaire?.trim() === nomEquipe
                            )
                            .sort(
                              (a, b) =>
                                new Date(b.date).getTime() -
                                new Date(a.date).getTime()
                            );

                          // Matchs déjà joués (avec score)
                          const matchsJoues = matchsEquipe.filter(
                            (res) => res.score && res.score !== '-'
                          );

                          if (matchsJoues.length > 0) {
                            // Dernier match joué
                            const dernierMatch = matchsJoues[0];
                            const domicile =
                              dernierMatch.equipe?.trim() === nomEquipe;
                            // Cherche le match dans le calendrier pour récupérer serieId et date
                            const matchCalendrier = (
                              saison?.calendrier ?? []
                            ).find((m: any) => m.id === dernierMatch.id);
                            return {
                              ...dernierMatch,
                              equipe: nomEquipe,
                              adversaire: domicile
                                ? dernierMatch.adversaire
                                : dernierMatch.equipe,
                              domicile,
                              serieId: matchCalendrier?.serieId || dernierMatch.serieId || '',
                              date: matchCalendrier?.date || dernierMatch.date,
                            };
                          }

                          // Si pas de match joué, chercher la prochaine rencontre prévue (dans le calendrier de la saison)
                          const calendrier = saison?.calendrier ?? [];
                          const prochainsMatchs = calendrier
                            .filter(
                              (match: any) =>
                                (match.domicile?.trim() === nomEquipe ||
                                  match.exterieur?.trim() === nomEquipe) &&
                                (!match.score || match.score === '-') &&
                                new Date(match.date).getTime() >=
                                  new Date().setHours(0, 0, 0, 0)
                            )
                            .sort(
                              (a: any, b: any) =>
                                new Date(a.date).getTime() -
                                new Date(b.date).getTime()
                            );

                          if (prochainsMatchs.length > 0) {
                            const prochain = prochainsMatchs[0];
                            const domicile =
                              prochain.domicile?.trim() === nomEquipe;
                            return {
                              id: prochain.id,
                              division:
                                prochain.division || prochain.serie || '',
                              equipe: nomEquipe,
                              adversaire: domicile
                                ? prochain.exterieur
                                : prochain.domicile,
                              score: '-',
                              date: prochain.date,
                              domicile,
                              serieId: prochain.serieId || '',
                            };
                          }

                          // Si aucun match joué ni prévu, ne rien retourner
                          return null;
                        })
                        .filter((r): r is ResultatData => !!r);

                      if (resultatsEquipes.length === 0) {
                        return (
                          <div className="text-center text-gray-500 py-8">
                            Aucun résultat ou match prévu pour les équipes du club.
                          </div>
                        );
                      }

                      return (
                        <>
                          {resultatsEquipes.map(
                            (res: {
                              id: React.Key | null | undefined;
                              division: any;
                              equipe: any;
                              adversaire: any;
                              score: any;
                              domicile: any;
                              serieId?: string;
                              date: string;
                            }) => (
                              <div
                                key={res.id}
                                className="p-4 border rounded-lg transition-all hover:shadow-md hover:bg-[#F1F1F1]"
                                style={{
                                  backgroundColor: '#F9F9F9',
                                  borderColor: '#E0E0E0',
                                }}
                              >
                                <div className="flex justify-between items-center mb-1">
                                  <p className="text-xs text-gray-500">
                                    {getSerieNom(res.serieId || '') ||
                                      res.division ||
                                      'Division inconnue'}
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    {formatDate(res.date)}
                                  </p>
                                </div>
                                <div className="flex justify-between items-center">
                                  <div className="font-semibold text-gray-800">
                                    <p>{res.equipe}</p>
                                    <p className="text-sm text-gray-600">
                                      vs {res.adversaire}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p
                                      className={`text-2xl font-bold ${
                                        res.score !== '-'
                                          ? getScoreColorClass(
                                            res.score,
                                            res.domicile
                                          )
                                          : 'text-gray-400'
                                      }`}
                                    >
                                      {res.score}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {res.domicile
                                        ? '🏠 Domicile'
                                        : '✈️ Extérieur'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )
                          )}
                        </>
                      );
                    })()}
                    <div className="text-center mt-6">
                      <Link
                        to="competition/equipes"
                        className="inline-block px-4 py-2 text-white rounded-md transition-colors hover:bg-[#D4AC0D]"
                        style={{
                          backgroundColor: '#F1C40F',
                        }}
                      >
                        Voir plus d&#39;équipes →
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Bande déroulante des sponsors */}
      <section className="py-8 bg-gray-100">
        <div className="container mx-auto">
          <h3 className="text-center text-xl font-bold text-gray-600 mb-6">
            Ils nous soutiennent
          </h3>
          {loading ? (
            <div className="flex items-center justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : sponsors.length > 0 ? (
            <div
              className={
                sponsors.length >= 6 ? 'marquee-container' : 'static-sponsors'
              }
            >
              <div
                className={
                  sponsors.length >= 6
                    ? 'marquee-content'
                    : 'flex justify-center'
                }
              >
                {/* Logos des sponsors */}
                {sponsors.map((sponsor) => (
                  <div
                    key={sponsor.id}
                    className={sponsors.length >= 6 ? 'mx-8' : 'mx-8 mb-8'}
                  >
                    {sponsor.redirectUrl ? (
                      <a
                        href={sponsor.redirectUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <img
                          src={sponsor.logoUrl || '/placeholder.svg'}
                          alt={sponsor.name}
                          className="hover:grayscale"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              '/placeholder.svg';
                          }}
                        />
                      </a>
                    ) : (
                      <Link to="/sponsors" className="block">
                        <img
                          src={sponsor.logoUrl || '/placeholder.svg'}
                          alt={sponsor.name}
                          className="hover:grayscale"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              '/placeholder.svg';
                          }}
                        />
                      </Link>
                    )}
                  </div>
                ))}

                {/* Première duplication (existante) */}
                {sponsors.length >= 6 &&
                  sponsors.map((sponsor) => (
                    <div key={`${sponsor.id}-duplicate-1`} className="mx-8">
                      {sponsor.redirectUrl ? (
                        <a
                          href={sponsor.redirectUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <img
                            src={sponsor.logoUrl || '/placeholder.svg'}
                            alt={sponsor.name}
                            className="hover:grayscale"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                '/placeholder.svg';
                            }}
                          />
                        </a>
                      ) : (
                        <Link to="/sponsors" className="block">
                          <img
                            src={sponsor.logoUrl || '/placeholder.svg'}
                            alt={sponsor.name}
                            className="hover:grayscale"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                '/placeholder.svg';
                            }}
                          />
                        </Link>
                      )}
                    </div>
                  ))}

                {/* Deuxième duplication (nouvelle) */}
                {sponsors.length >= 6 &&
                  sponsors.map((sponsor) => (
                    <div key={`${sponsor.id}-duplicate-2`} className="mx-8">
                      {sponsor.redirectUrl ? (
                        <a
                          href={sponsor.redirectUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <img
                            src={sponsor.logoUrl || '/placeholder.svg'}
                            alt={sponsor.name}
                            className="hover:grayscale"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                '/placeholder.svg';
                            }}
                          />
                        </a>
                      ) : (
                        <Link to="/sponsors" className="block">
                          <img
                            src={sponsor.logoUrl || '/placeholder.svg'}
                            alt={sponsor.name}
                            className="hover:grayscale"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                '/placeholder.svg';
                            }}
                          />
                        </Link>
                      )}
                    </div>
                  ))}

                {/* Troisième duplication (nouvelle) */}
                {sponsors.length >= 6 &&
                  sponsors.map((sponsor) => (
                    <div key={`${sponsor.id}-duplicate-3`} className="mx-8">
                      {sponsor.redirectUrl ? (
                        <a
                          href={sponsor.redirectUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <img
                            src={sponsor.logoUrl || '/placeholder.svg'}
                            alt={sponsor.name}
                            className="hover:grayscale"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                '/placeholder.svg';
                            }}
                          />
                        </a>
                      ) : (
                        <Link to="/sponsors" className="block">
                          <img
                            src={sponsor.logoUrl || '/placeholder.svg'}
                            alt={sponsor.name}
                            className="hover:grayscale"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                '/placeholder.svg';
                            }}
                          />
                        </Link>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            <p className="text-center">Aucun sponsor à afficher.</p>
          )}
        </div>
      </section>
    </div>
  );
}
