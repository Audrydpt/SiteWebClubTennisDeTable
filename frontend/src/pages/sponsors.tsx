/* eslint-disable */
'use client';

import { useEffect, useState } from 'react';
import { Loader2, X, ExternalLink, Mail, Phone, MapPin } from 'lucide-react';
import { fetchSponsors } from '@/services/api';
import { SponsorData } from '@/services/type.ts';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Link } from 'react-router-dom';

export default function Sponsors() {
  const [sponsors, setSponsors] = useState<SponsorData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSponsor, setSelectedSponsor] = useState<SponsorData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const loadSponsors = async () => {
      try {
        setIsLoading(true);
        const data = await fetchSponsors();
        setSponsors(
          data.sort((a: { order: number }, b: { order: number }) => a.order - b.order)
        );
      } catch (error) {
        console.error('Erreur lors du chargement des sponsors:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadSponsors();
  }, []);

  const handleSponsorClick = (sponsor: SponsorData) => {
    setSelectedSponsor(sponsor);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#F1C40F] mx-auto mb-4" />
          <p className="text-[#3A3A3A] text-lg">Chargement des sponsors...</p>
        </div>
      </div>
    );
  }

  if (sponsors.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="container mx-auto py-8">
          <Alert variant="destructive">
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>
              Impossible de charger les données des sponsors.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#3A3A3A] to-[#3A3A3A] text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-6xl font-bold mb-6 leading-tight">
              Nos <span className="text-[#F1C40F] drop-shadow-lg">Partenaires</span>
            </h1>
            <div className="w-24 h-1 bg-[#F1C40F] mx-auto mb-6" />
            <p className="text-xl text-[#E0E0E0] leading-relaxed max-w-2xl mx-auto">
              Découvrez les entreprises et organisations qui nous font confiance et accompagnent notre club.
            </p>
          </div>
        </div>
      </div>

      {/* Sponsors Grid */}
      <div className="py-20">
        <div className="container mx-auto px-10">
          <div className="flex flex-wrap justify-center gap-8">
            {sponsors.map((sponsor, index) => (
              <div
                key={sponsor.id}
                className="group bg-[#FAFAFA] rounded-2xl shadow-lg hover:shadow-xl transition-all duration-500 cursor-pointer transform hover:-translate-y-2 border border-gray-200 hover:border-[#F1C40F] overflow-hidden"
                onClick={() => handleSponsorClick(sponsor)}
                style={{ animationDelay: `${index * 100}ms`, width: '350px' }} // largeur fixe pour garder taille actuelle
              >
                <div className="p-6 flex flex-col items-center text-center h-full">
                  {/* Logo */}
                  <div className="h-24 w-24 mb-4 flex items-center justify-center bg-gray-50 rounded-xl group-hover:bg-[#F1C40F] group-hover:bg-opacity-10 transition-all duration-300">
                    <img
                      src={sponsor.logoUrl || '/placeholder.svg?height=80&width=80'}
                      alt={sponsor.name}
                      className="max-h-20 max-w-20 object-contain group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  {/* Nom */}
                  <h3 className="text-lg font-bold text-[#3A3A3A] group-hover:text-[#F1C40F] mb-2">
                    {sponsor.name}
                  </h3>
                  {sponsor.texte && (
                    <p className="text-gray-600 text-sm mb-4 italic">{sponsor.texte}</p>
                  )}
                  {/* Coordonnées */}
                  <div className="text-xs text-gray-700 space-y-1">
                    {sponsor.adresse && (
                      <p className="flex items-center justify-center gap-1">
                        <MapPin size={14} /> {sponsor.adresse}
                      </p>
                    )}
                    {sponsor.telephone && (
                      <p className="flex items-center justify-center gap-1">
                        <Phone size={14} /> {sponsor.telephone}
                      </p>
                    )}
                    {sponsor.email && (
                      <p className="flex items-center justify-center gap-1">
                        <Mail size={14} /> {sponsor.email}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>


      {/* Call to Action */}
      <div className="py-8 bg-gray-100">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-[#3A3A3A] mb-4">Vous souhaitez devenir partenaire ?</h2>
          <p className="text-[#3A3A3A] text-lg mb-8 max-w-2xl mx-auto">
            Rejoignez notre communauté de partenaires et participez à notre développement.
          </p>
          <Link to="/contact">
            <button className="bg-[#3A3A3A] text-white px-8 py-4 rounded-xl font-semibold hover:bg-[#4A4A4A] hover:text-[#F1C40F] transition-colors duration-300 shadow-lg">
              Nous contacter
            </button>
          </Link>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && selectedSponsor && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="bg-[#3A3A3A] text-white p-8 rounded-t-3xl">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-6">
                  <div className="h-20 w-20 bg-white rounded-2xl p-3 flex items-center justify-center shadow-lg">
                    <img
                      src={selectedSponsor.logoUrl || '/placeholder.svg?height=60&width=60'}
                      alt={selectedSponsor.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold mb-2">{selectedSponsor.name}</h2>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-white hover:text-[#F1C40F] transition-colors duration-300 p-2 hover:bg-white hover:bg-opacity-10 rounded-full"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            {/* Contenu */}
            <div className="p-8 space-y-6">
              {/* A propos */}
              <div>
                <h3 className="text-xl font-bold text-[#3A3A3A] mb-4 flex items-center">
                  <div className="w-1 h-6 bg-[#F1C40F] mr-3 rounded" />À propos
                </h3>
                <p className="text-gray-700 leading-relaxed">{selectedSponsor.description}</p>
              </div>

              {/* Infos */}
              <div>
                <h3 className="text-xl font-bold text-[#3A3A3A] mb-4 flex items-center">
                  <div className="w-1 h-6 bg-[#F1C40F] mr-3 rounded" />Informations
                </h3>
                <div className="space-y-2 text-gray-700">
                  {selectedSponsor.adresse && (
                    <p className="flex items-center gap-2">
                      <MapPin size={16} />
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          selectedSponsor.adresse
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {selectedSponsor.adresse}
                      </a>
                    </p>
                  )}
                  {selectedSponsor.telephone && (
                    <p className="flex items-center gap-2">
                      <Phone size={16} /> {selectedSponsor.telephone}
                    </p>
                  )}
                  {selectedSponsor.email && (
                    <p className="flex items-center gap-2">
                      <Mail size={16} /> {selectedSponsor.email}
                    </p>
                  )}
                </div>
              </div>

              {/* Réseaux sociaux */}
              {(selectedSponsor.facebook ||
                selectedSponsor.instagram ||
                selectedSponsor.twitter ||
                selectedSponsor.youtube ||
                selectedSponsor.linkedin) && (
                <div>
                  <h3 className="text-xl font-bold text-[#3A3A3A] mb-4 flex items-center">
                    <div className="w-1 h-6 bg-[#F1C40F] mr-3 rounded" />Réseaux sociaux
                  </h3>
                  <div className="flex flex-wrap gap-4">
                    {selectedSponsor.facebook && (
                      <a
                        href={selectedSponsor.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#3b5998] hover:opacity-80 transition text-2xl"
                      >
                        <i className="fab fa-facebook-f"></i>
                      </a>
                    )}
                    {selectedSponsor.instagram && (
                      <a
                        href={selectedSponsor.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#E4405F] hover:opacity-80 transition text-2xl"
                      >
                        <i className="fab fa-instagram"></i>
                      </a>
                    )}
                    {selectedSponsor.twitter && (
                      <a
                        href={selectedSponsor.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#1DA1F2] hover:opacity-80 transition text-2xl"
                      >
                        <i className="fab fa-twitter"></i>
                      </a>
                    )}
                    {selectedSponsor.youtube && (
                      <a
                        href={selectedSponsor.youtube}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#FF0000] hover:opacity-80 transition text-2xl"
                      >
                        <i className="fab fa-youtube"></i>
                      </a>
                    )}
                    {selectedSponsor.linkedin && (
                      <a
                        href={selectedSponsor.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#0077B5] hover:opacity-80 transition text-2xl"
                      >
                        <i className="fab fa-linkedin-in"></i>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Site web */}
              {selectedSponsor.redirectUrl && (
                <div className="pt-4">
                  <a
                    href={selectedSponsor.redirectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-3 bg-gradient-to-r from-[#3A3A3A] to-gray-700 text-white px-8 py-4 rounded-xl hover:from-gray-700 hover:to-[#3A3A3A] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <span className="font-semibold">Visiter le site web</span>
                    <ExternalLink className="h-5 w-5" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
