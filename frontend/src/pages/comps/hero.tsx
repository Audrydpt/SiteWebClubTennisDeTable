/* eslint-disable */
import { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

export default function HeroSection() {
  const [showScrollArrow, setShowScrollArrow] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setShowScrollArrow(window.scrollY < 100);
    window.addEventListener('scroll', handleScroll);

    // Déclenche l'animation du contenu principal sur le premier frame
    const raf = requestAnimationFrame(() => {
      containerRef.current?.classList.add('animate-fade-in');
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section className="relative flex items-center justify-center overflow-hidden min-h-[70vh] bg-[#2A2A2A]">
      {/* Fond avec particules */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#3A3A3A] via-[#F1C40F22] to-[#1A1A1A] pointer-events-none">
        {[...Array(15)].map((_, i) => {
          const delay = Math.random() * 2;
          const floatDelay = delay + 1.2;
          return (
            <div
              key={i}
              className="absolute w-4 h-4 bg-[#F1C40F] rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                opacity: 0,
                animation: `
                  fade-in 1.2s ease-out forwards ${delay}s,
                  float ${2.5 + Math.random() * 2}s ease-in-out infinite ${floatDelay}s
                `,
              }}
            />
          );
        })}
      </div>

      {/* Contenu principal centré */}
      <div
        ref={containerRef}
        className="relative z-10 container mx-auto px-4 flex flex-col lg:flex-row items-center justify-center gap-12 opacity-0 translate-y-4"
      >
        {/* Logo */}
        <div className="flex-shrink-0 relative group">
          <div className="absolute inset-0 bg-[#F1C40F] rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-300" />
          <img
            src="./logo-removebg.jpg"
            alt="Logo CTT Frameries"
            className="relative h-48 md:h-72 w-auto drop-shadow-2xl transform group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Texte avec fond jaune translucide */}
        <div className="relative">
          {/* Effet de surbrillance jaune autour du cadre */}
          <div className="absolute inset-0 rounded-2xl bg-[#F1C40F] blur-xl opacity-30 pointer-events-none" />
          <div className="bg-[#3A3A3A] rounded-2xl p-6 md:p-8 max-w-xl shadow-lg text-white relative z-10">
            <h1 className="text-5xl md:text-6xl font-bold mb-4 leading-tight">
              <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                CTT
              </span>
              <span className="text-[#F1C40F] ml-4">Frameries</span>
            </h1>
            <div className="w-24 h-1 bg-[#F1C40F] mb-4" />
            <p className="text-xl md:text-2xl font-light">
              Club de Tennis de Table de Frameries
            </p>
            <p className="text-lg text-gray-200 mt-1">Passion • Sport • Convivialité</p>
          </div>
        </div>
      </div>

      {/* Flèche scroll */}
      {showScrollArrow && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-8 h-8 text-[#F1C40F]" />
        </div>
      )}

      <style>
        {`
          @keyframes fade-in {
            0% { opacity: 0; transform: translateY(4px); }
            100% { opacity: 1; transform: translateY(0); }
          }

          .animate-fade-in {
            animation: fade-in 1.8s ease-out forwards;
          }

          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-15px); }
          }
        `}
      </style>
    </section>
  );
}
