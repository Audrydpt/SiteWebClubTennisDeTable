import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface Joueur {
  id: string;
  nom: string;
  prenom: string;
  classement: string;
  indexListeForce: number;
}

interface ListingProps {
  joueurs: Joueur[];
}

const getClassementColor = (classement: string) => {
  if (classement.startsWith('A')) return 'bg-green-100 text-green-800';
  if (classement.startsWith('B')) return 'bg-blue-100 text-blue-800';
  if (classement.startsWith('C')) return 'bg-orange-100 text-orange-800';
  return 'bg-gray-100 text-gray-800';
};

const getInitials = (nom: string, prenom: string) =>
  `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();

export default function Listing({ joueurs }: ListingProps) {
  return (
    <div className="space-y-3">
      {joueurs.map((joueur) => (
        <div
          key={joueur.id}
          className="flex items-center space-x-3 p-3 rounded-lg bg-white border"
        >
          <Avatar>
            <AvatarFallback>
              {getInitials(joueur.nom, joueur.prenom)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold">
                {joueur.prenom} {joueur.nom}
              </p>
              <div className="flex gap-2">
                {joueur.classement && (
                  <Badge
                    className={`${getClassementColor(joueur.classement)} text-xs`}
                  >
                    {joueur.classement}
                  </Badge>
                )}
                {joueur.classement && (
                  <Badge
                    variant="outline"
                    className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                  >
                    Index:{' '}
                    {joueur.indexListeForce > 0
                      ? joueur.indexListeForce
                      : 'N/A'}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
