/* eslint-disable no-console */
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { fetchSponsors } from '@/services/api';
import { SponsorData } from '@/services/type';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert.tsx';

export default function Sponsors() {
  const [sponsors, setSponsors] = useState<SponsorData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSponsors = async () => {
      try {
        setIsLoading(true);
        const data = await fetchSponsors();
        setSponsors(
          data.sort((a: SponsorData, b: SponsorData) => a.order - b.order)
        );
      } catch (error) {
        console.error('Erreur lors du chargement des sponsors:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSponsors();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-10 min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (sponsors.length === 0 || null) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>
            Impossible de charger les données des sponsors.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-16 px-4">
      <div className="bg-white rounded-xl shadow-xl p-8">
        <h1 className="text-4xl font-bold text-center mb-12">
          Nos Sponsors/Partenaires
        </h1>
        <p className="text-lg text-center mb-16 max-w-3xl mx-auto text-gray-600">
          Nous remercions chaleureusement nos partenaires pour leur confiance.
        </p>
        <div className="w-300 h-1 bg-gray-300 mx-auto mb-12 rounded-full" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sponsors.map((sponsor) => (
            <div
              key={sponsor.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="p-6 flex flex-col items-center text-center">
                <div className="h-36 w-full flex items-center justify-center mb-6">
                  <img
                    src={sponsor.logoUrl}
                    alt={sponsor.name}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <h3 className="text-xl font-semibold mb-2">{sponsor.name}</h3>
                <p className="text-gray-600 mb-4">{sponsor.texte}</p>
                {sponsor.redirectUrl && (
                  <a
                    href={sponsor.redirectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Visiter le site
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
