// frontend/src/pages/home.tsx
import React, { useEffect, useState } from 'react';
import Slider from 'react-slick';
import { fetchTestData } from '../services/api';
import '../lib/styles/home.css';

// Imports CSS pour slick-carousel
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

interface ActualiteData {
  id: string;
  title: string;
  content: string;
  imageName: string;
}

export default function HomePage() {
  const [actualites, setActualites] = useState<ActualiteData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchTestData();
        console.log('Données récupérées:', data);
        setActualites(data || []);
      } catch (error) {
        console.error('Erreur lors du chargement des données :', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const carouselSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    arrows: true,
  };

  const renderCarouselContent = () => {
    if (loading) {
      return (
        <div className="text-center py-8">
          <p>Chargement des actualités...</p>
        </div>
      );
    }

    if (actualites.length === 0) {
      return (
        <div className="text-center py-8">
          <p>Aucune actualité disponible.</p>
        </div>
      );
    }

    const getImageUrl = (imageName: string): string => {
      const url = `/images/${imageName}`;
      return url;
    };
    return (
      <div className="carousel-container">
        <Slider {...carouselSettings}>
          {actualites.map((actualite) => (
            <div key={actualite.id} className="carousel-slide">
              <div className="bg-white border rounded-lg shadow-md p-4 h-96">
                <img
                  src={getImageUrl(actualite.imageName)}
                  alt={actualite.title}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
                <h3 className="text-xl font-semibold mb-3 text-gray-800">
                  {actualite.title}
                </h3>
                <p className="text-gray-600 text-sm line-clamp-3">
                  {actualite.content}
                </p>
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

      {/* Carousel */}
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Actualités du CTT Frameries</h2>
        {renderCarouselContent()}
      </div>
    </div>
  );
}
