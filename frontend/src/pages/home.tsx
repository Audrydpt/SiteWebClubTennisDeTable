/* eslint-disable no-console */
// frontend/src/pages/home.tsx
import React, { useEffect, useState } from 'react';
import { fetchTestData } from '../services/api';

// Définition de l'interface pour les données de test
interface TestData {
  id: number;
  name: string;
  description: string;
  image?: string;
  created_at: string;
  updated_at: string;
}

export default function HomePage() {
  // Spécifier le type du tableau
  const [testData, setTestData] = useState<TestData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchTestData();
        setTestData(data);
      } catch (error) {
        console.error('Erreur lors du chargement des données :', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <div>
      {/* Section Hero - code existant conservé */}
      <section
        className="relative h-90 flex items-center justify-center text-center bg-cover bg-center"
        style={{
          background:
            'linear-gradient(to bottom, #3A3A3A 5%, #F1C40F 5% 95%, #3A3A3A 5%)',
        }}
      >
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 flex items-center gap-6 px-4">
          <div className="flex-shrink-0">
            <img
              src="./logo-removebg.jpg"
              alt="Logo CTT Frameries"
              className="h-80 w-auto drop-shadow-lg"
            />
          </div>

          <div className="text-white">
            <h1 className="text-6xl md:text-6xl font-bold mb-4 drop-shadow-lg">
              CTT Frameries
            </h1>
            <p className="text-lg md:text-xl font-medium drop-shadow-md max-w-4xl">
              Club de Tennis de Table de Frameries - Passion, Sport et
              Convivialité
            </p>
          </div>
        </div>
      </section>

      {/* Contenu principal avec les données JSON */}
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">
          Bienvenue sur le site du CTT Frameries
        </h2>

        {loading ? (
          <p>Chargement des données...</p>
        ) : (
          <div className="space-y-6">
            {testData.map((item) => (
              <div key={item.id} className="bg-gray-50 p-4 rounded-lg shadow">
                <h3 className="text-xl font-semibold">{item.name}</h3>
                <p className="mt-2">{item.description}</p>
                <p className="text-sm text-gray-500 mt-2">
                  Dernière mise à jour:{' '}
                  {new Date(item.updated_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
