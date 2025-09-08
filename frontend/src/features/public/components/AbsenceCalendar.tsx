/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Edit, Trash2, CalendarX, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Absence, Member } from '@/services/type';
import {
  fetchAbsence,
  createAbsence,
  updateAbsence,
  deleteAbsence,
} from '@/services/api';

interface AbsenceCalendarProps {
  member: Member;
}

export default function AbsenceCalendar({ member }: AbsenceCalendarProps) {
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingAbsence, setEditingAbsence] = useState<Absence | null>(null);
  const [formData, setFormData] = useState({
    date: '',
    details: '',
  });

  useEffect(() => {
    loadAbsences();
  }, [member.id]);

  const loadAbsences = async () => {
    setLoading(true);
    try {
      const data = await fetchAbsence();
      setAbsences(data.filter((abs: Absence) => abs.memberId === member.id));
    } catch (error) {
      console.error('Erreur lors du chargement des absences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const absenceData = {
        ...formData,
        memberId: member.id,
        memberName: `${member.prenom} ${member.nom}`,
        statut: 'active' as const,
        dateCreation: new Date().toISOString(),
      };

      if (editingAbsence) {
        await updateAbsence(editingAbsence.id, {
          ...editingAbsence,
          ...absenceData,
        });
      } else {
        await createAbsence(absenceData);
      }

      await loadAbsences();
      setShowForm(false);
      setEditingAbsence(null);
      setFormData({ date: '', details: '' });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const handleEdit = (absence: Absence) => {
    setEditingAbsence(absence);
    setFormData({
      date: absence.date,
      details: absence.details,
    });
    setShowForm(true);
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
      year: 'numeric'
    });

  const isDatePast = (dateString: string) => {
    const absenceDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return absenceDate < today;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <CalendarX className="mr-2 h-5 w-5 text-red-500" />
            Mes absences
          </CardTitle>
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                onClick={() => {
                  setEditingAbsence(null);
                  setFormData({
                    date: '',
                    details: '',
                  });
                }}
              >
                <Plus className="h-4 w-4 mr-1" />
                Nouvelle absence
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingAbsence ? "Modifier l'absence" : 'Nouvelle absence'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="date">Date d'absence</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="details">Détails</Label>
                  <Textarea
                    id="details"
                    value={formData.details}
                    onChange={(e) =>
                      setFormData({ ...formData, details: e.target.value })
                    }
                    placeholder="Exemple : Peux quand même jouer au matin si besoin, ..."
                    required
                    rows={4}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                  >
                    Annuler
                  </Button>
                  <Button type="submit">
                    {editingAbsence ? 'Modifier' : 'Créer'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4">Chargement...</div>
        ) : absences.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            Aucune absence enregistrée
          </div>
        ) : (
          <div className="space-y-3">
            {absences
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((absence) => {
                const isPast = isDatePast(absence.date);

                return (
                  <div
                    key={absence.id}
                    className={`p-3 border rounded-lg ${
                      isPast ? 'bg-gray-100 opacity-75' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            variant={isPast ? "secondary" : "destructive"}
                            className="flex items-center gap-1"
                          >
                            <Clock className="h-3 w-3" />
                            {formatDate(absence.date)}
                          </Badge>
                          {isPast && (
                            <Badge variant="outline" className="text-gray-500">
                              Passée
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm leading-relaxed">{absence.details}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(absence)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
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
  );
}
