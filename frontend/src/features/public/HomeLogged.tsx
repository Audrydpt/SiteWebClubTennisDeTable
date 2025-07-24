'use client';

import { Calendar, Users, Trophy, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

// Données mockées
const mockMember = {
  id: 1,
  nom: 'Dupont',
  prenom: 'Jean',
  classement: '15/2',
  scoreConcours: 1247, // Points de concours
};

// Prochains matchs
const mockProchainMatchs = [
  {
    id: 1,
    date: '2024-12-03',
    heure: '20:00',
    adversaire: 'TT Mons Elite',
    lieu: 'Salle Omnisports Frameries',
    equipe: 'Équipe 1 - Division Honneur',
    domicile: true,
  },
  {
    id: 2,
    date: '2024-12-10',
    heure: '19:30',
    adversaire: 'Royal Quaregnon',
    lieu: 'Complexe Sportif Quaregnon',
    equipe: 'Équipe 1 - Division Honneur',
    domicile: false,
  },
  {
    id: 3,
    date: '2024-12-15',
    heure: '14:00',
    adversaire: 'Vétérans Mons',
    lieu: 'Salle Omnisports Frameries',
    equipe: 'Équipe Vétérans',
    domicile: true,
  },
];

// Équipiers
const mockEquipiers = [
  { id: 2, nom: 'Martin', prenom: 'Sophie', classement: '15/1', poste: 2 },
  { id: 3, nom: 'Bernard', prenom: 'Pierre', classement: '15/3', poste: 3 },
  { id: 4, nom: 'Leroy', prenom: 'Marie', classement: '15/2', poste: 4 },
];

// Stats personnelles
const mockStatsPerso = {
  victoires: 8,
  defaites: 3,
  pourcentage: 72.7,
};

export default function HomeLogged() {
  const getInitials = (nom: string, prenom: string) =>
    `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      {/* En-tête joueur */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {mockMember.prenom} {mockMember.nom}
            </h1>
            <p className="opacity-90">Classement: {mockMember.classement}</p>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-90">Score concours</p>
            <p className="text-2xl font-bold">{mockMember.scoreConcours}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Prochains matchs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Mes prochains matchs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockProchainMatchs.map((match) => (
                <div
                  key={match.id}
                  className="p-4 border rounded-lg bg-gray-50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={match.domicile ? 'default' : 'secondary'}>
                        {match.domicile ? 'Domicile' : 'Extérieur'}
                      </Badge>
                      <span className="font-semibold">
                        vs {match.adversaire}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {new Date(match.date).toLocaleDateString('fr-FR')} -{' '}
                      {match.heure}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{match.lieu}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {match.equipe}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Mes équipiers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Mes équipiers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Moi */}
              <div className="flex items-center space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Avatar>
                  <AvatarFallback className="bg-blue-500 text-white">
                    {getInitials(mockMember.nom, mockMember.prenom)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold">
                    {mockMember.prenom} {mockMember.nom} (Vous)
                  </p>
                  <p className="text-sm text-gray-600">
                    {mockMember.classement} - Poste 1
                  </p>
                </div>
              </div>

              {/* Équipiers */}
              {mockEquipiers.map((equipier) => (
                <div
                  key={equipier.id}
                  className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                >
                  <Avatar>
                    <AvatarFallback>
                      {getInitials(equipier.nom, equipier.prenom)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold">
                      {equipier.prenom} {equipier.nom}
                    </p>
                    <p className="text-sm text-gray-600">
                      {equipier.classement} - Poste {equipier.poste}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats personnelles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Trophy className="mr-2 h-5 w-5" />
            Mes statistiques
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6 text-center">
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                {mockStatsPerso.victoires}
              </p>
              <p className="text-sm text-gray-600">Victoires</p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">
                {mockStatsPerso.defaites}
              </p>
              <p className="text-sm text-gray-600">Défaites</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">
                {mockStatsPerso.pourcentage}%
              </p>
              <p className="text-sm text-gray-600">Taux de victoire</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
