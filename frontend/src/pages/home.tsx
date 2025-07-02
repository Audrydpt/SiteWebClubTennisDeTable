/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Slider from 'react-slick';

import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

import { Calendar, Trophy } from 'lucide-react';

import { fetchTestData } from '../services/api';
import '../lib/styles/home.css';

interface ActualiteData {
  id: string;
  title: string;
  content: string;
  imageName: string;
  category?: string;
  image?: string;
}

interface ResultatData {
  id: string;
  equipe: string;
  adversaire: string;
  score: string;
  division: string;
  domicile: boolean;
}

interface SponsorData {
  id: string;
  name: string;
  logo: string;
}

// Interface pour les props des flèches
interface ArrowProps {
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

// Composants de flèches déplacés hors du composant principal
// Composants de flèches transformés en déclarations de fonctions
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

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchTestData();

        // Si data est directement un tableau, c'est notre tableau d'actualités
        if (Array.isArray(data)) {
          setActualites(data);
        } else if (data && data.actualites && Array.isArray(data.actualites)) {
          // Si data est un objet avec une propriété actualites
          setActualites(data.actualites);
        } else {
          // Format non reconnu
          setActualites([]);
        }

        // Dans une application réelle, vous récupéreriez ces données depuis l'API
        setResultats([
          {
            id: '1',
            equipe: 'CTT Frameries A',
            adversaire: 'CTT Mons',
            score: '9-7',
            division: 'Division 2 - Semaine 12',
            domicile: true,
          },
          {
            id: '2',
            equipe: 'CTT Frameries B',
            adversaire: 'CTT Baudour',
            score: '5-11',
            division: 'Division 3 - Semaine 12',
            domicile: false,
          },
          {
            id: '3',
            equipe: 'CTT Frameries C',
            adversaire: 'CTT Quaregnon',
            score: '10-6',
            division: 'Division 4 - Semaine 12',
            domicile: true,
          },
        ]);

        setSponsors([
          { id: '1', name: 'Sponsor 1', logo: '/images/sponsor1.png' },
          { id: '2', name: 'Sponsor 2', logo: '/images/sponsor2.png' },
          { id: '3', name: 'Sponsor 3', logo: '/images/sponsor3.png' },
          { id: '4', name: 'Sponsor 4', logo: '/images/sponsor4.png' },
        ]);
      } catch (error) {
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

  // Configuration du carrousel de sponsors
  const sponsorCarouselSettings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 5,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 2000,
    arrows: false,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 3,
        },
      },
      {
        breakpoint: 640,
        settings: {
          slidesToShow: 2,
        },
      },
    ],
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

  const renderCarouselContent = () => {
    if (loading) {
      return (
        <div className="text-center py-8">
          <p>Chargement des actualités...</p>
        </div>
      );
    }

    if (!actualites || actualites.length === 0) {
      return (
        <div className="text-center py-8">
          <p>Aucune actualité disponible.</p>
        </div>
      );
    }

    const getImageUrl = (imageName: string): string => {
      if (!imageName) return '/placeholder.svg';
      return `/images/${imageName}`;
    };

    return (
      <div className="carousel-container px-4 py-2">
        <Slider {...mainCarouselSettings}>
          {actualites.map((actualite) => (
            <div key={actualite.id} className="px-2">
              <div className="relative rounded-lg overflow-hidden h-[400px] bg-black">
                {/* Image floutée en fond */}
                <div className="absolute inset-0">
                  <img
                    src={
                      actualite.image ||
                      getImageUrl(actualite.imageName) ||
                      '/placeholder.svg'
                    }
                    alt={actualite.title}
                    className="w-full h-full object-cover blur-md opacity-50"
                  />
                </div>

                {/* Image principale centrée sans rognage */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <img
                    src={
                      actualite.image ||
                      getImageUrl(actualite.imageName) ||
                      '/placeholder.svg'
                    }
                    alt={actualite.title}
                    className="max-h-full max-w-full object-contain z-10"
                  />
                </div>

                {/* Gradient + Texte */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-20" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white z-30">
                  <h3 className="text-2xl md:text-3xl font-bold leading-tight mb-2 drop-shadow-lg">
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
                  <p>Chargement...</p>
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
            <p className="text-center">Chargement des partenaires...</p>
          ) : (
            <Slider {...sponsorCarouselSettings}>
              {sponsors.map((sponsor) => (
                <div key={sponsor.id} className="px-4">
                  <div className="flex justify-center items-center h-20">
                    <img
                      src={sponsor.logo || '/placeholder.svg'}
                      alt={sponsor.name}
                      className="max-h-12 max-w-full object-contain grayscale transition-all duration-300 hover:grayscale-0"
                    />
                  </div>
                </div>
              ))}
            </Slider>
          )}
        </div>
      </section>
    </div>
  );
}
