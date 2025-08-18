/* eslint-disable */
import React, { useEffect, useState } from 'react';
import { Facebook, Instagram, Twitter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { fetchInformations } from '@/services/api';

export default function Footer() {
  const [infos, setInfos] = useState<any>(null);

  useEffect(() => {
    const loadInfos = async () => {
      try {
        const data = await fetchInformations();
        if (data && data.length > 0) {
          setInfos(data[0]); // On prend la première entrée
        }
      } catch (err) {}
    };
    loadInfos();
  }, []);

  if (!infos) {
    return null; // ou un loader si tu veux
  }

  return (
    <footer
      className={cn(
        'border-t shadow-sm',
        'py-8 mt-auto text-white bg-[#3A3A3A] relative overflow-hidden'
      )}
    >
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* À propos */}
          <div>
            <Link
              to="/infos/about"
              className="hover:text-[#F1C40F] transition-colors cursor-pointer"
            >
              <h4 className="font-semibold mb-4">À propos de nous</h4>
            </Link>
            <p className="text-sm whitespace-pre-line">
              {infos.footer?.aboutText || 'Description à venir...'}
            </p>
          </div>

          {/* Contact */}
          <div>
            <Link
              to="/contact"
              className="hover:text-[#F1C40F] transition-colors cursor-pointer"
            >
              <h4 className="font-semibold mb-4">Contact</h4>
            </Link>
            <div className="text-sm space-y-2">
              <p>📍 {infos.adresse || 'Adresse non renseignée'}</p>
              <p>📞 {infos.telephone || 'Téléphone non renseigné'}</p>
              <p>✉️ {infos.email || 'Email non renseigné'}</p>
            </div>
          </div>

          {/* Réseaux sociaux */}
          <div>
            <h4 className="font-semibold mb-4">Suivez-nous</h4>
            <div className="flex space-x-4">
              {infos.facebook && (
                <a
                  href={infos.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-[#F1C40F] transition-colors"
                >
                  <Facebook className="inline mr-1" />
                </a>
              )}
              {infos.instagram && (
                <a
                  href={infos.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-[#F1C40F] transition-colors"
                >
                  <Instagram className="inline mr-1" />
                </a>
              )}
              {infos.twitter && (
                <a
                  href={infos.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-[#F1C40F] transition-colors"
                >
                  <Twitter className="inline mr-1" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Bas du footer */}
        <div className="border-t border-gray-600 mt-8 pt-4 text-center text-sm">
          <p>
            &copy; {infos.footer?.year || ''} CTT Frameries - Tous droits réservés - Made by CTT
            Frameries
          </p>
        </div>
      </div>
    </footer>
  );
}
