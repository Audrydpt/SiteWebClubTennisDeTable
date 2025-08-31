/* eslint-disable */
import React, { useEffect, useState } from 'react';
import { Search, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { fetchUsers } from '@/services/api';
import { Member } from '@/services/type';

const getClassementColor = (classement: string) => {
  if (classement.startsWith('A')) return 'bg-green-100 text-green-800';
  if (classement.startsWith('B')) return 'bg-blue-100 text-blue-800';
  if (classement.startsWith('C')) return 'bg-orange-100 text-orange-800';
  return 'bg-gray-100 text-gray-800';
};

const getInitials = (nom: string, prenom: string) =>
  `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();

const sortByClassement = (membres: Member[]) => {
  return [...membres].sort((a, b) => {
    // Si l'un des deux n'a pas de classement, le mettre à la fin
    if (!a.classement && !b.classement) return 0;
    if (!a.classement) return 1;
    if (!b.classement) return -1;

    // Extraire la lettre et le nombre du classement
    const getClassementParts = (classement: string) => {
      const match = classement.match(/^([A-Z])(\d+)$/);
      return match ? { letter: match[1], number: parseInt(match[2]) } : { letter: 'Z', number: 999 };
    };

    const partsA = getClassementParts(a.classement);
    const partsB = getClassementParts(b.classement);

    // Comparer d'abord par lettre
    if (partsA.letter !== partsB.letter) {
      return partsA.letter.localeCompare(partsB.letter);
    }

    // Puis par nombre
    return partsA.number - partsB.number;
  });
};

export default function MembresListing() {
  const [membres, setMembres] = useState<Member[]>([]);
  const [filteredMembres, setFilteredMembres] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMembres = async () => {
      try {
        const data = await fetchUsers();
        const sortedData = sortByClassement(data);
        setMembres(sortedData);
        setFilteredMembres(sortedData);
      } catch (error) {
        console.error('Erreur lors du chargement des membres:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMembres();
  }, []);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredMembres(sortByClassement(membres));
      return;
    }

    const filtered = membres.filter((membre) => {
      const search = searchTerm.toLowerCase();
      return (
        membre.nom.toLowerCase().includes(search) ||
        membre.prenom.toLowerCase().includes(search) ||
        membre.classement.toLowerCase().includes(search)
      );
    });

    setFilteredMembres(sortByClassement(filtered));
  }, [searchTerm, membres]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-6 w-6" />
            Liste des membres ({filteredMembres.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Barre de recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Rechercher par nom, prénom ou classement..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Liste des membres */}
          <div className="space-y-3">
            {filteredMembres.map((membre) => (
              <div
                key={membre.id}
                className="flex items-center space-x-3 p-3 rounded-lg bg-white border hover:shadow-md transition-shadow"
              >
                <Avatar>
                  <AvatarFallback>
                    {getInitials(membre.nom, membre.prenom)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold">
                      {membre.prenom} {membre.nom}
                    </p>
                    <div className="flex gap-2">
                      {membre.classement && (
                        <Badge
                          className={`${getClassementColor(membre.classement)} text-xs`}
                        >
                          {membre.classement}
                        </Badge>
                      )}
                      {membre.classement && (
                        <Badge
                          variant="outline"
                          className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                        >
                          Index:{' '}
                          {membre.indexListeForce > 0
                            ? membre.indexListeForce
                            : 'N/A'}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {membre.telephone && (
                    <p className="text-sm text-gray-600 mt-1">
                      {membre.telephone}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {filteredMembres.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun membre trouvé</p>
                {searchTerm && (
                  <p className="text-sm">
                    Essayez de modifier votre terme de recherche
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
