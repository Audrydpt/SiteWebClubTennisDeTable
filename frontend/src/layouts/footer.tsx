/* eslint-disable jsx-a11y/anchor-is-valid */
import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-muted text-muted-foreground py-8 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4">Club Sportif</h3>
            <p className="text-sm">
              Votre club de sport de référence pour tous les âges et niveaux.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <div className="text-sm space-y-2">
              <p>📍 123 Rue du Sport, 75000 Paris</p>
              <p>📞 01 23 45 67 89</p>
              <p>✉️ contact@clubsportif.fr</p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Suivez-nous</h4>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-primary transition-colors">
                Facebook
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                Instagram
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                Twitter
              </a>
            </div>
          </div>
        </div>

        <div className="border-t mt-8 pt-4 text-center text-sm">
          <p>&copy; 2024 Club Sportif. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}
