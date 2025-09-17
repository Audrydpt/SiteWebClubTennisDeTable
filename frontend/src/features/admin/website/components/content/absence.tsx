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
    <div className="space-y-4 sm:space-y-6">
      {/* En-tête avec statistiques responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <CalendarX className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Total</p>
                <p className="text-xl sm:text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <CalendarX className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
              <div>
                <p className="text-xs sm:text-sm text-gray-600">À venir</p>
                <p className="text-xl sm:text-2xl font-bold">{stats.upcoming}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <CalendarX className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Passées</p>
                <p className="text-xl sm:text-2xl font-bold">{stats.past}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et actions responsive */}
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-lg sm:text-xl">
              <CalendarX className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">Gestion des absences</span>
              <span className="sm:hidden">Absences</span>
            </span>
            <Button onClick={exportToExcel} variant="outline" size="sm" className="text-xs sm:text-sm">
              <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Exporter Excel</span>
              <span className="sm:hidden">Export</span>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            <div className="flex-1">
              <Label htmlFor="search" className="text-xs sm:text-sm">Rechercher par membre</Label>
              <Input
                id="search"
                placeholder="Nom du membre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-sm"
              />
            </div>
            <div className="w-full sm:w-52">
              <Label htmlFor="status" className="text-xs sm:text-sm">Filtrer</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="text-sm">
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

          {/* Liste des absences responsive */}
          {loading ? (
            <div className="text-center py-6 sm:py-8 text-sm">Chargement...</div>
          ) : filteredAndSortedAbsences.length === 0 ? (
            <div className="text-center py-6 sm:py-8 text-gray-500 text-sm">
              Aucune absence trouvée
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {filteredAndSortedAbsences.map((absence) => {
                const isPast = isDatePast(absence.date);
                const dLeft = daysUntil(absence.date);

                return (
                  <div
                    key={absence.id}
                    className={`p-3 sm:p-4 border rounded-lg ${
                      isPast ? 'bg-gray-50 opacity-75' : 'bg-white'
                    }`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="font-semibold text-sm sm:text-base truncate">{absence.memberName}</h3>
                          <Badge
                            variant={isPast ? 'secondary' : 'destructive'}
                            className="text-xs"
                          >
                            {formatDate(absence.date)}
                          </Badge>
                          {!isPast && (
                            <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50 text-xs">
                              {dLeft === 0 ? "Aujourd'hui" : dLeft === 1 ? 'Dans 1 jour' : `Dans ${dLeft} jours`}
                            </Badge>
                          )}
                          {isPast && (
                            <Badge variant="outline" className="text-gray-500 text-xs">
                              Passée
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600 mb-2 break-words">
                          {absence.details.length > 120
                            ? `${absence.details.substring(0, 120)}...`
                            : absence.details}
                        </p>
                        <p className="text-xs text-gray-500">
                          Créée le {new Date(absence.dateCreation).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div className="flex gap-1 sm:gap-2 shrink-0">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedAbsence(absence)}
                              className="text-xs"
                            >
                              <Eye className="h-3 w-3" />
                              <span className="hidden sm:inline ml-1">Voir</span>
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-[95vw] sm:max-w-lg">
                            <DialogHeader>
                              <DialogTitle className="text-lg">Détails de l'absence</DialogTitle>
                            </DialogHeader>
                            {selectedAbsence && (
                              <div className="space-y-3 sm:space-y-4">
                                <div>
                                  <Label className="text-sm">Membre</Label>
                                  <p className="font-semibold text-sm sm:text-base">{selectedAbsence.memberName}</p>
                                </div>
                                <div>
                                  <Label className="text-sm">Date d'absence</Label>
                                  <p className="text-sm sm:text-base">{formatDate(selectedAbsence.date)}</p>
                                </div>
                                <div>
                                  <Label className="text-sm">Détails</Label>
                                  <p className="whitespace-pre-wrap text-sm sm:text-base break-words">{selectedAbsence.details}</p>
                                </div>
                                <div>
                                  <Label className="text-sm">Date de création</Label>
                                  <p className="text-sm sm:text-base">{new Date(selectedAbsence.dateCreation).toLocaleString('fr-FR')}</p>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(absence.id)}
                          className="text-xs"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span className="hidden sm:inline ml-1">Suppr.</span>
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
