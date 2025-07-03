/* eslint-disable jsx-a11y/anchor-is-valid */
import React from 'react';
import { Facebook, Instagram, Twitter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function Footer() {
  return (
    <footer
      className={cn(
        'border-t shadow-sm',
        'py-8 mt-auto text-white bg-[#3A3A3A] relative overflow-hidden'
      )}
    >
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <Link
              to="/about"
              className="hover:text-[#F1C40F] transition-colors cursor-pointer"
            >
              <h4 className="font-semibold mb-4">À propos de nous</h4>
            </Link>
            <p className="text-sm">
              CTT Frameries est un club de tennis passionné, dédié à la
              promotion du tennis pour tous les âges et niveaux.
            </p>
          </div>

          <div>
            <Link
              to="/contact"
              className="hover:text-[#F1C40F] transition-colors cursor-pointer"
            >
              <h4 className="font-semibold mb-4">Contact</h4>
            </Link>
            <div className="text-sm space-y-2">
              <p>📍 7080 La Bouverie (Frameries), Rue de la Libération 65</p>
              <p>📞 01 23 45 67 89</p>
              <p>✉️ h442cttframeries@outlook.be</p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Suivez-nous</h4>
            <div className="flex space-x-4">
              <a
                href="#"
                className="text-white hover:text-[#F1C40F] transition-colors"
              >
                <Facebook className="inline mr-1" />
              </a>
              <a
                href="#"
                className="text-white hover:text-[#F1C40F] transition-colors"
              >
                <Instagram className="inline mr-1" />
              </a>
              <a
                href="#"
                className="text-white hover:text-[#F1C40F] transition-colors"
              >
                <Twitter className="inline mr-1" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-600 mt-8 pt-4 text-center text-sm">
          <p>&copy; 2025 CTT Frameries - Tous droits réservés - Made by </p>
        </div>
      </div>
    </footer>
  );
}
