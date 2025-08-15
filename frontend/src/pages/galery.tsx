'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface GalleryImage {
  id: string;
  src: string;
  title: string;
  date: string;
  description: string;
}

const mockGalleryImages: GalleryImage[] = [
  {
    id: '1',
    src: 'https://res.cloudinary.com/dsrrxx5yx/image/upload/v1755298749/table-tennis-championship-action_qajhjd.png',
    title: 'Championnat Régional 2024',
    date: '15 Décembre 2024',
    description: 'Moments forts du championnat régional avec nos équipes',
  },
  {
    id: '2',
    src: 'https://res.cloudinary.com/dsrrxx5yx/image/upload/v1755298743/soiree-club-tennis-de-table_qintyx.png',
    title: 'Tournoi Interne Automne',
    date: '20 Octobre 2024',
    description: "Remise des prix du tournoi interne d'automne",
  },
  {
    id: '3',
    src: 'https://res.cloudinary.com/dsrrxx5yx/image/upload/v1755298742/table-tennis-team-victory_uoqvvo.png',
    title: 'Victoire en Division 2',
    date: '5 Novembre 2024',
    description: 'Célébration de la victoire de notre équipe première',
  },
  {
    id: '4',
    src: 'https://res.cloudinary.com/dsrrxx5yx/image/upload/v1755298743/intense-table-tennis-match_1_bkw6ge.png',
    title: 'Formation des Jeunes',
    date: '12 Septembre 2024',
    description: 'Nos jeunes talents en action lors des entraînements',
  },
  {
    id: '5',
    src: 'https://res.cloudinary.com/dsrrxx5yx/image/upload/v1755298742/tennis-table-prize-ceremony_azdxzn.png',
    title: 'Soirée du Club',
    date: '30 Août 2024',
    description: 'Ambiance conviviale lors de notre soirée annuelle',
  },
  {
    id: '6',
    src: 'https://res.cloudinary.com/dsrrxx5yx/image/upload/v1755298740/young-table-tennis-players_yusz6x.png',
    title: 'Compétition Interclubs',
    date: '18 Juillet 2024',
    description: 'Moments intenses de la compétition interclubs',
  },
];

export default function EventsGallery() {
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

  return (
    <div className="min-h-screen bg-white">
      {/* HEADER */}
      <div className="relative bg-[#3A3A3A] text-white py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 border-4 border-[#F1C40F] rounded-full" />
          <div className="absolute top-32 right-20 w-24 h-24 bg-[#F1C40F] rounded-full" />
          <div className="absolute bottom-20 left-1/4 w-16 h-16 border-4 border-[#F1C40F] rounded-full" />
          <div className="absolute bottom-10 right-10 w-20 h-20 bg-[#F1C40F] rounded-full opacity-50" />
        </div>

        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-6xl font-bold mb-6 leading-tight">
            Galerie des{' '}
            <span className="text-[#F1C40F] drop-shadow-lg">Championnats</span>
          </h1>
          <p className="text-xl max-w-3xl mx-auto leading-relaxed text-gray-300">
            Revivez les moments forts de nos compétitions et événements
          </p>
        </div>
      </div>

      {/* GALLERY SECTION */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-block bg-[#F1C40F] text-[#3A3A3A] px-6 py-2 rounded-full font-semibold mb-6 text-sm uppercase tracking-wide">
              📸 Nos Moments
            </div>
            <h2 className="text-4xl font-bold text-[#3A3A3A] mb-6">
              Galerie des Championnats
            </h2>
            <p className="text-gray-600 text-xl max-w-3xl mx-auto">
              Revivez les moments forts de nos compétitions et événements
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {mockGalleryImages.map((image) => (
              <Card
                key={image.id}
                className="shadow-xl border-0 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer"
                onClick={() => setSelectedImage(image)}
              >
                <CardContent className="p-0">
                  <div className="relative overflow-hidden rounded-t-lg">
                    <img
                      src={image.src || '/placeholder.svg'}
                      alt={image.title}
                      className="w-full h-64 object-cover transition-transform duration-300 hover:scale-105"
                    />
                    <div className="absolute top-4 right-4 bg-[#F1C40F] text-[#3A3A3A] px-3 py-1 rounded-full text-sm font-semibold">
                      {image.date}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-bold text-[#3A3A3A] mb-2 text-xl">
                      {image.title}
                    </h3>
                    <p className="text-gray-600 text-sm">{image.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* IMAGE MODAL */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="max-w-4xl w-full">
            <div className="flex justify-end mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedImage(null)}
                className="text-white hover:text-gray-300"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
            <Card className="shadow-2xl border-0">
              <CardContent className="p-0">
                <img
                  src={selectedImage.src || '/placeholder.svg'}
                  alt={selectedImage.title}
                  className="w-full h-auto max-h-[70vh] object-contain rounded-t-lg"
                />
                <div className="p-6 bg-white">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-2xl font-bold text-[#3A3A3A]">
                      {selectedImage.title}
                    </h3>
                    <span className="bg-[#F1C40F] text-[#3A3A3A] px-3 py-1 rounded-full text-sm font-semibold">
                      {selectedImage.date}
                    </span>
                  </div>
                  <p className="text-gray-600">{selectedImage.description}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
