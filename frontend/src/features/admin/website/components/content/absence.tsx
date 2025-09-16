/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { CalendarX, Eye, Trash2, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Absence } from '@/services/type';
import { fetchAbsence, deleteAbsence } from '@/services/api';
import { exportAbsencesToExcel } from '@/utils/excelExport';

export default function AbsenceManager() {
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  // Par défaut: afficher uniquement les absences à venir
  const [statusFilter, setStatusFilter] = useState<string>('upcoming');
  const [selectedAbsence, setSelectedAbsence] = useState<Absence | null>(null);

  useEffect(() => {
    loadAbsences();
  }, []);

  const loadAbsences = async () => {
    setLoading(true);
    try {
      const data = await fetchAbsence();
      setAbsences(data);
    } catch (error) {
      console.error('Erreur lors du chargement des absences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette absence ?')) {
      try {
        await deleteAbsence(id);
        await loadAbsences();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  const isDatePast = (dateString: string) => {
    const absenceDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return absenceDate < today;
  };

  const daysUntil = (dateString: string) => {
    const d = new Date(dateString);
    const today = new Date();
    // Normaliser à minuit pour l'écart en jours
    d.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diff = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  // Export Excel propre
  const exportToExcel = () => {
    exportAbsencesToExcel(filteredAndSortedAbsences);
  };

  // Filtrer par nom et statut, puis trier par date la plus proche
  const filteredAndSortedAbsences = absences
    .filter((absence) => {
      const matchesSearch = absence.memberName
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      // Nouveau filtre: upcoming = date future ou aujourd'hui
      const isUpcoming = !isDatePast(absence.date);
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'upcoming' && isUpcoming) ||
        (statusFilter === 'past' && !isUpcoming);

      return matchesSearch && matchesStatus;
    })
    // Trier croissant (les plus proches en premier)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const stats = {
    total: absences.length,
    upcoming: absences.filter((a) => !isDatePast(a.date)).length,
    past: absences.filter((a) => isDatePast(a.date)).length,
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CalendarX className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CalendarX className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">À venir</p>
                <p className="text-2xl font-bold">{stats.upcoming}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CalendarX className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">Passées</p>
                <p className="text-2xl font-bold">{stats.past}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CalendarX className="h-5 w-5" />
              Gestion des absences
            </span>
            <Button onClick={exportToExcel} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exporter Excel
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Rechercher par membre</Label>
              <Input
                id="search"
                placeholder="Nom du membre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full md:w-52">
              <Label htmlFor="status">Filtrer</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">À venir</SelectItem>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="past">Passées</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Liste des absences */}
          {loading ? (
            <div className="text-center py-8">Chargement...</div>
          ) : filteredAndSortedAbsences.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Aucune absence trouvée
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAndSortedAbsences.map((absence) => {
                const isPast = isDatePast(absence.date);
                const dLeft = daysUntil(absence.date);

                return (
                  <div
                    key={absence.id}
                    className={`p-4 border rounded-lg ${
                      isPast ? 'bg-gray-50 opacity-75' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="font-semibold">{absence.memberName}</h3>
                          <Badge
                            variant={isPast ? 'secondary' : 'destructive'}
                            className="flex items-center gap-1"
                          >
                            {formatDate(absence.date)}
                          </Badge>
                          {!isPast && (
                            <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">
                              {dLeft === 0 ? "Aujourd'hui" : dLeft === 1 ? 'Dans 1 jour' : `Dans ${dLeft} jours`}
                            </Badge>
                          )}
                          {isPast && (
                            <Badge variant="outline" className="text-gray-500">
                              Passée
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {absence.details.length > 160
                            ? `${absence.details.substring(0, 160)}...`
                            : absence.details}
                        </p>
                        <p className="text-xs text-gray-500">
                          Créée le {new Date(absence.dateCreation).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedAbsence(absence)}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Détails de l'absence</DialogTitle>
                            </DialogHeader>
                            {selectedAbsence && (
                              <div className="space-y-4">
                                <div>
                                  <Label>Membre</Label>
                                  <p className="font-semibold">{selectedAbsence.memberName}</p>
                                </div>
                                <div>
                                  <Label>Date d'absence</Label>
                                  <p>{formatDate(selectedAbsence.date)}</p>
                                </div>
                                <div>
                                  <Label>Détails</Label>
                                  <p className="whitespace-pre-wrap">{selectedAbsence.details}</p>
                                </div>
                                <div>
                                  <Label>Date de création</Label>
                                  <p>{new Date(selectedAbsence.dateCreation).toLocaleString('fr-FR')}</p>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(absence.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
