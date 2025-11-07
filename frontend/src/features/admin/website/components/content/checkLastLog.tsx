/* eslint-disable */
import React, { useEffect, useState } from 'react';
import { Clock, AlertCircle, ArrowUpDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { fetchUsers } from '@/services/api';
import { Member } from '@/services/type';

type SortField = 'lastLog' | 'nom' | 'prenom' | 'classement';
type SortDirection = 'asc' | 'desc';

export default function CheckLastLog() {
  const [membres, setMembres] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortField, setSortField] = useState<SortField>('lastLog');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  useEffect(() => {
    loadMembres();
  }, []);

  const loadMembres = async () => {
    try {
      setLoading(true);
      const data = await fetchUsers();
      setMembres(data);
    } catch (err) {
      setError('Erreur lors du chargement des membres');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Si on clique sur la même colonne, inverser la direction
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Nouvelle colonne, direction par défaut selon le champ
      setSortField(field);
      setSortDirection(field === 'lastLog' ? 'desc' : 'asc');
    }
  };

  const sortedMembres = React.useMemo(() => {
    const sorted = [...membres].sort((a: Member, b: Member) => {
      let compareResult = 0;

      switch (sortField) {
        case 'lastLog':
          if (!a.lastLog && !b.lastLog) compareResult = 0;
          else if (!a.lastLog) compareResult = 1;
          else if (!b.lastLog) compareResult = -1;
          else compareResult = new Date(b.lastLog).getTime() - new Date(a.lastLog).getTime();
          break;

        case 'nom':
          compareResult = a.nom.localeCompare(b.nom, 'fr');
          break;

        case 'prenom':
          compareResult = a.prenom.localeCompare(b.prenom, 'fr');
          break;

        case 'classement':
          // Tri par classement (C4 < D0 < E0, etc.)
          compareResult = a.classement.localeCompare(b.classement);
          break;

        default:
          compareResult = 0;
      }

      return sortDirection === 'asc' ? compareResult : -compareResult;
    });

    return sorted;
  }, [membres, sortField, sortDirection]);

  const getTimeStatus = (lastLog?: string) => {
    if (!lastLog) {
      return { color: 'red', label: 'Jamais connecté' };
    }

    const now = new Date();
    const lastLogDate = new Date(lastLog);
    const diffInMs = now.getTime() - lastLogDate.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

    if (diffInHours <= 10) {
      return { color: 'green', label: 'Récent' };
    } else if (diffInDays <= 7) {
      return { color: 'orange', label: 'Moyen' };
    } else {
      return { color: 'red', label: 'Ancien' };
    }
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'Jamais';

    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    return `${day}/${month}/${year} à ${hours}:${minutes}`;
  };

  const getRelativeTime = (dateString?: string) => {
    if (!dateString) return '';

    const now = new Date();
    const date = new Date(dateString);
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 60) {
      return `Il y a ${diffInMinutes} min`;
    } else if (diffInHours < 24) {
      return `Il y a ${diffInHours}h`;
    } else if (diffInDays === 1) {
      return 'Hier';
    } else if (diffInDays < 7) {
      return `Il y a ${diffInDays} jours`;
    } else {
      const weeks = Math.floor(diffInDays / 7);
      return `Il y a ${weeks} semaine${weeks > 1 ? 's' : ''}`;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Dernières Connexions des Membres
        </CardTitle>
        <CardDescription>
          Suivi de l'activité des membres sur la plateforme
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Badge className="bg-green-500">Vert</Badge>
            <span className="text-gray-600">Moins de 10h</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-orange-500">Orange</Badge>
            <span className="text-gray-600">Moins de 7 jours</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-red-500">Rouge</Badge>
            <span className="text-gray-600">Plus de 7 jours</span>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                    onClick={() => handleSort('nom')}
                  >
                    Nom
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                    onClick={() => handleSort('prenom')}
                  >
                    Prénom
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                    onClick={() => handleSort('classement')}
                  >
                    Classement
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                    onClick={() => handleSort('lastLog')}
                  >
                    Dernière Connexion
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedMembres.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    Aucun membre trouvé
                  </TableCell>
                </TableRow>
              ) : (
                sortedMembres.map((membre) => {
                  const status = getTimeStatus(membre.lastLog);
                  return (
                    <TableRow key={membre.id}>
                      <TableCell className="font-medium">{membre.nom}</TableCell>
                      <TableCell>{membre.prenom}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{membre.classement}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{formatDateTime(membre.lastLog)}</span>
                          {membre.lastLog && (
                            <span className="text-xs text-gray-500">
                              {getRelativeTime(membre.lastLog)}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            status.color === 'green'
                              ? 'bg-green-500 hover:bg-green-600'
                              : status.color === 'orange'
                              ? 'bg-orange-500 hover:bg-orange-600'
                              : 'bg-red-500 hover:bg-red-600'
                          }
                        >
                          {status.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 text-sm text-gray-500">
          Total: {sortedMembres.length} membre{sortedMembres.length > 1 ? 's' : ''}
        </div>
      </CardContent>
    </Card>
  );
}
