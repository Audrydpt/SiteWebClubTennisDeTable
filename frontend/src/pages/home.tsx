/* eslint-disable @typescript-eslint/no-unused-vars,no-console,jsx-a11y/no-noninteractive-element-interactions,jsx-a11y/click-events-have-key-events,no-nested-ternary */
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Slider from 'react-slick';

import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

import { Calendar, Loader2, Trophy } from 'lucide-react';

import { fetchActualites, fetchSponsors } from '../services/api';
import { ActualiteData, ResultatData, SponsorData } from '../services/type';
import '../lib/styles/home.css';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert.tsx';

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
  const [saison, setSaison] = useState(null);

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

        // Dans une application réelle, vous récupéreriez ces données depuis l'API
        setResultats([]);

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
    autoplaySpeed: 5000,
    arrows: true,
    prevArrow: <PrevArrow />,
    nextArrow: <NextArrow />,
  };

  // Fonction pour déterminer la classe de couleur du score
  const getScoreColorClass = (score: string): string => {
    const parts = score.split('-');
    const home = parseInt(parts[0], 10);
    const away = parseInt(parts[1], 10);

    if (home > away) return 'text-green-600';
    if (home < away) return 'text-red-600';
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
              Impossible de charger les actualités. Veuillez réessayer plus
              tard.
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
              <div className="relative rounded-lg overflow-hidden h-[400px] bg-black">
                {/* Image floutée en fond */}
                <div className="absolute inset-0">
                  <img
                    src={actualite.imageUrl || '/placeholder.svg'}
                    alt={actualite.title}
                    className="w-full h-full object-cover blur-md opacity-50"
                    onError={(e) => {
                      console.log(
                        'Erreur chargement image:',
                        actualite.imageUrl
                      );
                      (e.target as HTMLImageElement).src = '/placeholder.svg';
                    }}
                  />
                </div>

                {/* Image principale centrée sans rognage */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <img
                    src={actualite.imageUrl || '/placeholder.svg'}
                    alt={actualite.title}
                    className="max-h-full max-w-full object-contain z-10"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder.svg';
                    }}
                  />
                </div>

                {/* Gradient + Texte */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-20" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white z-30">
                  <h3
                    className={`text-2xl md:text-3xl font-bold leading-tight mb-2 drop-shadow-lg ${
                      actualite.redirectUrl
                        ? 'cursor-pointer hover:underline'
                        : ''
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleActualiteClick(actualite.redirectUrl);
                    }}
                  >
                    {actualite.title}
                  </h3>
                  <p className="text-sm md:text-base text-white/90 leading-relaxed drop-shadow-md">
                    {actualite.content}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </Slider>
      </div>
    );
  };

  return (
    <div>
      {/* Section Hero */}
      <section
        className="relative min-h-[300px] flex items-center justify-center text-center bg-cover bg-center"
        style={{
          background:
            'linear-gradient(to bottom, #3A3A3A 5%, #F1C40F 5% 95%, #3A3A3A 5%)',
        }}
      >
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-4 md:gap-6 px-4 py-6">
          <div className="flex-shrink-0">
            <img
              src="./logo-removebg.jpg"
              alt="Logo CTT Frameries"
              className="h-40 md:h-80 w-auto drop-shadow-lg"
            />
          </div>
          <div className="text-white">
            <h1 className="text-4xl md:text-6xl font-bold mb-2 md:mb-4 drop-shadow-lg">
              CTT Frameries
            </h1>
            <p className="text-base md:text-xl font-medium drop-shadow-md max-w-4xl">
              Club de Tennis de Table de Frameries - Passion, Sport et
              Convivialité
            </p>
          </div>
        </div>
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
                <Trophy style={{ color: '#F1C40F' }} />
                Derniers Résultats
              </h2>
              <div className="space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  </div>
                ) : !saison ? (
                  <div className="container mx-auto">
                    <Alert variant="destructive">
                      <AlertTitle>Information</AlertTitle>
                      <AlertDescription>
                        Pas de saison en cours actuellement
                      </AlertDescription>
                    </Alert>
                  </div>
                ) : (
                  <>
                    {resultats.map((res) => (
                      <div
                        key={res.id}
                        className="p-4 border rounded-lg transition-all hover:shadow-md hover:bg-[#F1F1F1]"
                        style={{
                          backgroundColor: '#F9F9F9',
                          borderColor: '#E0E0E0',
                        }}
                      >
                        <p className="text-xs text-gray-500 mb-1">
                          {res.division}
                        </p>
                        <div className="flex justify-between items-center">
                          <div className="font-semibold text-gray-800">
                            <p>{res.equipe}</p>
                            <p className="text-sm text-gray-600">
                              vs {res.adversaire}
                            </p>
                          </div>
                          <div className="text-right">
                            <p
                              className={`text-2xl font-bold ${getScoreColorClass(res.score)}`}
                            >
                              {res.score}
                            </p>
                            <p className="text-xs text-gray-500">
                              {res.domicile ? '🏠 Domicile' : '✈️ Extérieur'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
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
