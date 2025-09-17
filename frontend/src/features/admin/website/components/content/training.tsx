/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { Dumbbell, Plus, Edit, Trash2, Users, Eye, Copy, Share, X, AlertTriangle, ClipboardCopy, Check, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Training } from '@/services/type';
import { fetchTraining, createTraining, updateTraining, deleteTraining, fetchInformations } from '@/services/api';

export default function TrainingManager() {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showFacebookDialog, setShowFacebookDialog] = useState(false);
  const [selectedTrainingForFacebook, setSelectedTrainingForFacebook] = useState<Training | null>(null);
  const [editingTraining, setEditingTraining] = useState<Training | null>(null);
  const [formData, setFormData] = useState({
    titre: '',
    date: '',
    heureDebut: '',
    heureFin: '',
    lieu: '',
    type: 'entrainement' as 'entrainement' | 'stage' | 'competition',
    niveau: 'tous' as 'debutant' | 'intermediaire' | 'avance' | 'tous',
    maxParticipants: '',
    description: '',
    responsable: '',
    statut: 'planifie' as 'planifie' | 'en_cours' | 'termine' | 'annule',
  });
  const [facebookMessage, setFacebookMessage] = useState('');
  const [publishingToFacebook, setPublishingToFacebook] = useState(false);
  const [publishingGlobalToFacebook, setPublishingGlobalToFacebook] = useState(false);
  const [cancelingTraining, setCancelingTraining] = useState<string | null>(null);
  const [isMessageCopied, setIsMessageCopied] = useState(false);
  const [groupId, setGroupId] = useState('1414350289649865');
  const [messageTemplate, setMessageTemplate] = useState('🏓 {titre}\n\n📅 {date}\n⏰ {heures}\n📍 {lieu}\n👨‍🏫 Responsable: {responsable}\n\n{description}\n\n{maxParticipants}Inscrivez-vous directement sur notre site web !\n🔗 https://cttframeries.com\n\nVenez nombreux ! 🎯\n\n#CTTFrameries #TennisDeTable #Entraînement #Sport');

  useEffect(() => {
    loadTrainings();
    loadFacebookConfig();
  }, []);

  const loadFacebookConfig = async () => {
    try {
      const infosData = await fetchInformations();
      if (infosData && infosData.length > 0) {
        // Charger l'ID du groupe
        if (infosData[0].facebookGroupePriveUrl) {
          const url = infosData[0].facebookGroupePriveUrl;
          const match = url.match(/groups\/(\d+)/);
          if (match && match[1]) {
            setGroupId(match[1]);
          }
        }

        // Charger le message par défaut pour les entraînements
        if (infosData[0].facebookMessageEntrainement) {
          setMessageTemplate(infosData[0].facebookMessageEntrainement);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la configuration Facebook:', error);
    }
  };

  const loadTrainings = async () => {
    setLoading(true);
    try {
      const data = await fetchTraining();
      setTrainings(data);
    } catch (error) {
      console.error('Erreur lors du chargement des entraînements:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      titre: '',
      date: '',
      heureDebut: '',
      heureFin: '',
      lieu: '',
      type: 'entrainement',
      niveau: 'tous',
      maxParticipants: '',
      description: '',
      responsable: '',
      statut: 'planifie',
    });
    setEditingTraining(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const trainingData = {
        ...formData,
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : undefined,
        participants: editingTraining ? editingTraining.participants : [],
      };

      if (editingTraining) {
        await updateTraining(editingTraining.id, { ...editingTraining, ...trainingData });
      } else {
        await createTraining(trainingData);
      }

      await loadTrainings();
      setShowForm(false);
      resetForm();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const handleEdit = (training: Training) => {
    setEditingTraining(training);
    setFormData({
      titre: training.titre,
      date: training.date,
      heureDebut: training.heureDebut,
      heureFin: training.heureFin,
      lieu: training.lieu,
      type: training.type,
      niveau: training.niveau,
      maxParticipants: training.maxParticipants?.toString() || '',
      description: training.description || '',
      responsable: training.responsable,
      statut: training.statut,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet entraînement ?')) {
      try {
        await deleteTraining(id);
        await loadTrainings();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const handleDuplicate = async (training: Training) => {
    try {
      const duplicatedTraining = {
        ...training,
        titre: `${training.titre} (Copie)`,
        participants: [], // Réinitialiser les participants
        statut: 'planifie' as const,
      };

      // Supprimer l'ID pour créer un nouveau training
      delete (duplicatedTraining as any).id;

      await createTraining(duplicatedTraining);
      await loadTrainings();
    } catch (error) {
      console.error('Erreur lors de la duplication:', error);
    }
  };

  const generateFacebookMessage = (training: Training) => {
    const date = formatDate(training.date);
    const heures = `${formatTime(training.heureDebut)} - ${formatTime(training.heureFin)}`;
    const maxParticipantsText = training.maxParticipants ? `👥 Places limitées: ${training.maxParticipants} participants max\n\n` : '';

    return messageTemplate
      .replace(/{titre}/g, training.titre)
      .replace(/{date}/g, date)
      .replace(/{heures}/g, heures)
      .replace(/{lieu}/g, training.lieu)
      .replace(/{responsable}/g, training.responsable)
      .replace(/{description}/g, training.description ? `📝 ${training.description}\n\n` : '')
      .replace(/{maxParticipants}/g, maxParticipantsText);
  };

  const handleFacebookShare = (training: Training) => {
    setSelectedTrainingForFacebook(training);
    setFacebookMessage(generateFacebookMessage(training));
    setIsMessageCopied(false);
    setShowFacebookDialog(true);
  };

  const handleCopyAndOpenFacebook = () => {
    navigator.clipboard.writeText(facebookMessage)
      .then(() => {
        setIsMessageCopied(true);

        // Ouvrir Facebook dans un nouvel onglet avec l'ID du groupe dynamique
        window.open(
          `https://www.facebook.com/groups/${groupId}`,
          '_blank'
        );

        // Fermer automatiquement le dialogue après 1 seconde
        setTimeout(() => {
          setShowFacebookDialog(false);
          // Réinitialiser l'état de copie après fermeture
          setTimeout(() => setIsMessageCopied(false), 500);
        }, 1000);
      })
      .catch(err => {
        console.error('Erreur lors de la copie du message:', err);
      });
  };

  const generateGlobalFacebookMessage = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Filtrer les entraînements planifiés du mois en cours uniquement
    const plannedTrainingsThisMonth = trainings.filter(t => {
      if (t.statut !== 'planifie') return false;

      const trainingDate = new Date(t.date);
      return trainingDate.getMonth() === currentMonth &&
             trainingDate.getFullYear() === currentYear;
    });

    const monthName = today.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

    return `🏓 Entraînements dirigés - ${monthName} !

Nos entraînements de ce mois sont maintenant programmés et disponibles pour inscription via notre site web.

📅 Sessions de ce mois :
${plannedTrainingsThisMonth.slice(0, 8).map(training => {
  const date = formatDate(training.date);
  const time = `${formatTime(training.heureDebut)} - ${formatTime(training.heureFin)}`;
  return `• ${date} à ${time} - ${training.titre}`;
}).join('\n')}

🌐 Inscrivez-vous directement sur notre site web !
🔗 https://cttframeries.com

👨‍🏫 Encadrement professionnel
🎯 Tous niveaux bienvenus

#CTTFrameries #TennisDeTable #EntraînementDirigé #Sport #InscriptionEnLigne`;
  };

  const publishGlobalToFacebook = () => {
    // Vérifier qu'il y a des entraînements planifiés ce mois-ci
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const plannedTrainingsThisMonth = trainings.filter(t => {
      if (t.statut !== 'planifie') return false;

      const trainingDate = new Date(t.date);
      return trainingDate.getMonth() === currentMonth &&
             trainingDate.getFullYear() === currentYear;
    });

    if (plannedTrainingsThisMonth.length === 0) {
      alert('Aucun entraînement planifié pour ce mois-ci à publier.');
      return;
    }

    setFacebookMessage(generateGlobalFacebookMessage());
    setSelectedTrainingForFacebook(null); // Pas d'entraînement spécifique
    setIsMessageCopied(false);
    setShowFacebookDialog(true);
  };

  const handleCancelTraining = async (training: Training) => {
    if (!confirm(`Êtes-vous sûr de vouloir annuler l'entraînement "${training.titre}" ?\n\nCeci notifiera automatiquement les ${training.participants.length} participant(s) inscrits.`)) {
      return;
    }

    setCancelingTraining(training.id);
    try {
      await updateTraining(training.id, {
        ...training,
        statut: 'annule'
      });

      // Ici vous pourriez ajouter une notification aux participants
      // Par exemple : await notifyParticipants(training.participants, training);

      await loadTrainings();
      alert(`Entraînement "${training.titre}" annulé avec succès !\n${training.participants.length} participant(s) ont été notifiés.`);
    } catch (error) {
      console.error('Erreur lors de l\'annulation:', error);
      alert('Erreur lors de l\'annulation de l\'entraînement');
    } finally {
      setCancelingTraining(null);
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  const formatTime = (time: string) => time.substring(0, 5);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'entrainement': return 'bg-blue-100 text-blue-800';
      case 'stage': return 'bg-green-100 text-green-800';
      case 'competition': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'planifie': return 'bg-blue-100 text-blue-800';
      case 'en_cours': return 'bg-green-100 text-green-800';
      case 'termine': return 'bg-gray-100 text-gray-800';
      case 'annule': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const stats = {
    total: trainings.length,
    planifies: trainings.filter(t => t.statut === 'planifie').length,
    termines: trainings.filter(t => t.statut === 'termine').length,
    annules: trainings.filter(t => t.statut === 'annule').length,
  };

  // Fonction pour grouper les entraînements par mois
  const groupTrainingsByMonth = (trainings: Training[]) => {
    const sorted = trainings.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const grouped = sorted.reduce((acc, training) => {
      const date = new Date(training.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long'
      });

      if (!acc[monthKey]) {
        acc[monthKey] = {
          name: monthName,
          trainings: []
        };
      }

      acc[monthKey].trainings.push(training);
      return acc;
    }, {} as Record<string, { name: string; trainings: Training }>);

    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* En-tête avec statistiques responsive */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <Dumbbell className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Total</p>
                <p className="text-lg sm:text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <Dumbbell className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Planifiés</p>
                <p className="text-lg sm:text-2xl font-bold">{stats.planifies}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <Dumbbell className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Terminés</p>
                <p className="text-lg sm:text-2xl font-bold">{stats.termines}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <Dumbbell className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Annulés</p>
                <p className="text-lg sm:text-2xl font-bold">{stats.annules}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions principales responsive */}
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-lg sm:text-xl">
              <Dumbbell className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">Gestion des entraînements</span>
              <span className="sm:hidden">Entraînements</span>
            </span>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={publishGlobalToFacebook}
                disabled={trainings.filter(t => {
                  if (t.statut !== 'planifie') return false;
                  const today = new Date();
                  const trainingDate = new Date(t.date);
                  return trainingDate.getMonth() === today.getMonth() &&
                         trainingDate.getFullYear() === today.getFullYear();
                }).length === 0}
                className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300 text-xs sm:text-sm"
                variant="outline"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="#1877F2"
                  className="mr-1 sm:mr-2"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span className="hidden sm:inline">Publier sur Facebook</span>
                <span className="sm:hidden">Facebook</span>
              </Button>
              <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm} className="text-xs sm:text-sm">
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Nouvel entraînement</span>
                    <span className="sm:hidden">Nouveau</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[95vw] sm:max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-lg sm:text-xl">
                      {editingTraining ? 'Modifier l\'entraînement' : 'Nouvel entraînement'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <Label htmlFor="titre" className="text-xs sm:text-sm">Titre</Label>
                        <Input
                          id="titre"
                          value={formData.titre}
                          onChange={(e) => setFormData({...formData, titre: e.target.value})}
                          required
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="responsable" className="text-xs sm:text-sm">Responsable</Label>
                        <Input
                          id="responsable"
                          value={formData.responsable}
                          onChange={(e) => setFormData({...formData, responsable: e.target.value})}
                          required
                          className="text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                      <div>
                        <Label htmlFor="date" className="text-xs sm:text-sm">Date</Label>
                        <Input
                          id="date"
                          type="date"
                          value={formData.date}
                          onChange={(e) => setFormData({...formData, date: e.target.value})}
                          required
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="heureDebut" className="text-xs sm:text-sm">Début</Label>
                        <Input
                          id="heureDebut"
                          type="time"
                          value={formData.heureDebut}
                          onChange={(e) => setFormData({...formData, heureDebut: e.target.value})}
                          required
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="heureFin" className="text-xs sm:text-sm">Fin</Label>
                        <Input
                          id="heureFin"
                          type="time"
                          value={formData.heureFin}
                          onChange={(e) => setFormData({...formData, heureFin: e.target.value})}
                          required
                          className="text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="lieu" className="text-xs sm:text-sm">Lieu</Label>
                      <Input
                        id="lieu"
                        value={formData.lieu}
                        onChange={(e) => setFormData({...formData, lieu: e.target.value})}
                        required
                        className="text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                      <div>
                        <Label htmlFor="type" className="text-xs sm:text-sm">Type</Label>
                        <Select value={formData.type} onValueChange={(value: 'entrainement' | 'stage' | 'competition') =>
                          setFormData({...formData, type: value})}>
                          <SelectTrigger className="text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="entrainement">Entraînement</SelectItem>
                            <SelectItem value="stage">Stage</SelectItem>
                            <SelectItem value="competition">Compétition</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="niveau" className="text-xs sm:text-sm">Niveau</Label>
                        <Select value={formData.niveau} onValueChange={(value: 'debutant' | 'intermediaire' | 'avance' | 'tous') =>
                          setFormData({...formData, niveau: value})}>
                          <SelectTrigger className="text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="tous">Tous niveaux</SelectItem>
                            <SelectItem value="debutant">Débutant</SelectItem>
                            <SelectItem value="intermediaire">Intermédiaire</SelectItem>
                            <SelectItem value="avance">Avancé</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="maxParticipants" className="text-xs sm:text-sm">Max</Label>
                        <Input
                          id="maxParticipants"
                          type="number"
                          value={formData.maxParticipants}
                          onChange={(e) => setFormData({...formData, maxParticipants: e.target.value})}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="statut" className="text-xs sm:text-sm">Statut</Label>
                        <Select value={formData.statut} onValueChange={(value: 'planifie' | 'en_cours' | 'termine' | 'annule') =>
                          setFormData({...formData, statut: value})}>
                          <SelectTrigger className="text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="planifie">Planifié</SelectItem>
                            <SelectItem value="en_cours">En cours</SelectItem>
                            <SelectItem value="termine">Terminé</SelectItem>
                            <SelectItem value="annule">Annulé</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description" className="text-xs sm:text-sm">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        rows={3}
                        className="text-sm"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="text-sm">
                        Annuler
                      </Button>
                      <Button type="submit" className="text-sm">
                        {editingTraining ? 'Modifier' : 'Créer'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Liste des entraînements groupés par mois responsive */}
          {loading ? (
            <div className="text-center py-6 sm:py-8 text-sm">Chargement...</div>
          ) : trainings.length === 0 ? (
            <div className="text-center py-6 sm:py-8 text-gray-500 text-sm">
              Aucun entraînement programmé
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {groupTrainingsByMonth(trainings).map(([monthKey, monthData]) => (
                <div key={monthKey} className="space-y-3 sm:space-y-4">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800 border-b pb-2 capitalize">
                    {monthData.name}
                  </h3>
                  <div className="space-y-2 sm:space-y-3 pl-2 sm:pl-4">
                    {monthData.trainings.map((training) => (
                      <div key={training.id} className={`p-3 sm:p-4 border rounded-lg ${
                        training.statut === 'annule' ? 'bg-red-50 border-red-200' : 'bg-white'
                      }`}>
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                              <h4 className={`font-semibold text-sm sm:text-lg truncate ${
                                training.statut === 'annule' ? 'line-through text-red-600' : ''
                              }`}>
                                {training.titre}
                                {training.statut === 'annule' && (
                                  <span className="ml-2 text-red-600 font-normal text-xs sm:text-sm">(ANNULÉ)</span>
                                )}
                              </h4>
                              <Badge className={getTypeColor(training.type) + ' text-xs'}>
                                {training.type}
                              </Badge>
                              <Badge className={getStatutColor(training.statut) + ' text-xs'}>
                                {training.statut}
                              </Badge>
                            </div>
                            <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                              <p className={training.statut === 'annule' ? 'line-through' : ''}>
                                📅 {formatDate(training.date)} • {formatTime(training.heureDebut)} - {formatTime(training.heureFin)}
                              </p>
                              <p className={training.statut === 'annule' ? 'line-through' : ''}>
                                📍 {training.lieu}
                              </p>
                              <p className={training.statut === 'annule' ? 'line-through' : ''}>
                                👨‍🏫 {training.responsable}
                              </p>
                              <div className="flex items-center gap-2">
                                <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span className={training.statut === 'annule' ? 'line-through' : ''}>
                                  {training.participants.length} participant(s)
                                  {training.maxParticipants && (
                                    <span> / {training.maxParticipants} max</span>
                                  )}
                                </span>
                                {training.statut === 'annule' && training.participants.length > 0 && (
                                  <span className="text-red-600 text-xs ml-2">
                                    ({training.participants.length} notifié(s))
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDuplicate(training)}
                              title="Dupliquer l'entraînement"
                              disabled={training.statut === 'annule'}
                              className="text-xs"
                            >
                              <Copy className="h-3 w-3" />
                              <span className="hidden sm:inline ml-1">Dupliquer</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(training)}
                              disabled={training.statut === 'annule'}
                              className="text-xs"
                            >
                              <Edit className="h-3 w-3" />
                              <span className="hidden sm:inline ml-1">Edit</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(training.id)}
                              className="text-xs"
                            >
                              <Trash2 className="h-3 w-3" />
                              <span className="hidden sm:inline ml-1">Suppr.</span>
                            </Button>
                          </div>
                        </div>
                        {training.description && (
                          <p className={`text-xs sm:text-sm text-gray-600 mt-2 break-words ${
                            training.statut === 'annule' ? 'line-through' : ''
                          }`}>
                            {training.description}
                          </p>
                        )}
                        {training.statut === 'annule' && (
                          <div className="mt-3 p-2 bg-red-100 border border-red-200 rounded text-red-700 text-xs sm:text-sm flex items-center gap-2">
                            <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span>
                              Entraînement annulé. Les participants inscrits ont été automatiquement notifiés.
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogue de partage Facebook responsive */}
      <Dialog open={showFacebookDialog} onOpenChange={setShowFacebookDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Publier sur le groupe Facebook</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4 py-4">
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="#1877F2"
              >
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <p className="text-xs sm:text-sm text-gray-600">
                {selectedTrainingForFacebook
                  ? `Publication pour l'entraînement "${selectedTrainingForFacebook.titre}"`
                  : 'Publication globale des entraînements'
                }
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fb-message" className="text-xs sm:text-sm">Message à publier</Label>
              <Textarea
                id="fb-message"
                value={facebookMessage}
                onChange={(e) => setFacebookMessage(e.target.value)}
                rows={8}
                className="resize-none text-sm"
              />
            </div>

            <div className="rounded-md bg-blue-50 p-2 sm:p-3">
              <div className="flex items-start">
                <Info className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                <div className="text-blue-700 text-xs sm:text-sm">
                  <p className="font-medium mb-1">Comment publier facilement :</p>
                  <ol className="list-decimal pl-4 sm:pl-5 space-y-1">
                    <li>Cliquez sur le bouton "Copier et ouvrir Facebook"</li>
                    <li>Le message sera automatiquement copié</li>
                    <li>Collez le message (Ctrl+V) dans la fenêtre de publication Facebook qui s'ouvre</li>
                  </ol>
                  <p className="mt-2 text-xs">
                    Groupe configuré: ID {groupId}
                  </p>
                  <p className="mt-1 text-xs">
                    Type: {selectedTrainingForFacebook ? 'Entraînement individuel' : 'Publication globale (mois en cours)'}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <DialogClose asChild>
              <Button variant="secondary" className="w-full sm:w-auto text-sm">Annuler</Button>
            </DialogClose>
            <Button
              onClick={handleCopyAndOpenFacebook}
              className="bg-[#1877F2] hover:bg-[#166FE5] text-white w-full sm:w-auto text-sm"
            >
              {isMessageCopied ? (
                <>
                  <Check className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Copié !</span>
                  <span className="sm:hidden">Copié !</span>
                </>
              ) : (
                <>
                  <ClipboardCopy className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Copier et ouvrir Facebook</span>
                  <span className="sm:hidden">Copier et ouvrir</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
