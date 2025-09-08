/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { Dumbbell, Plus, Edit, Trash2, Users, Eye, Copy, Share } from 'lucide-react';
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
} from '@/components/ui/dialog';
import { Training } from '@/services/type';
import { fetchTraining, createTraining, updateTraining, deleteTraining } from '@/services/api';

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

  useEffect(() => {
    loadTrainings();
  }, []);

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
    const time = `${formatTime(training.heureDebut)} - ${formatTime(training.heureFin)}`;

    return `🏓 ${training.titre}

📅 ${date}
⏰ ${time}
📍 ${training.lieu}
👨‍🏫 Responsable: ${training.responsable}

${training.description ? `📝 ${training.description}` : ''}

${training.maxParticipants ? `👥 Places limitées: ${training.maxParticipants} participants max` : ''}

Venez nombreux ! 🎯

#CTTFrameries #TennisDeTable #Entraînement #Sport`;
  };

  const handleFacebookShare = (training: Training) => {
    setSelectedTrainingForFacebook(training);
    setFacebookMessage(generateFacebookMessage(training));
    setShowFacebookDialog(true);
  };

  const publishToFacebook = async () => {
    if (!selectedTrainingForFacebook) return;

    setPublishingToFacebook(true);
    try {
      // Ici vous pouvez intégrer l'API Facebook
      // Pour l'instant, on simule la publication

      // Simulation d'appel API Facebook
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Vous pouvez remplacer ceci par un vrai appel API Facebook :
      /*
      const response = await fetch('/api/facebook/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: facebookMessage,
          trainingId: selectedTrainingForFacebook.id,
        }),
      });
      */

      alert('Publication Facebook réussie ! 🎉');
      setShowFacebookDialog(false);
      setSelectedTrainingForFacebook(null);
      setFacebookMessage('');
    } catch (error) {
      console.error('Erreur lors de la publication Facebook:', error);
      alert('Erreur lors de la publication Facebook');
    } finally {
      setPublishingToFacebook(false);
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

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-blue-500" />
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
              <Dumbbell className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Planifiés</p>
                <p className="text-2xl font-bold">{stats.planifies}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">Terminés</p>
                <p className="text-2xl font-bold">{stats.termines}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-gray-600">Annulés</p>
                <p className="text-2xl font-bold">{stats.annules}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions principales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5" />
              Gestion des entraînements
            </span>
            <Dialog open={showForm} onOpenChange={setShowForm}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvel entraînement
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingTraining ? 'Modifier l\'entraînement' : 'Nouvel entraînement'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="titre">Titre</Label>
                      <Input
                        id="titre"
                        value={formData.titre}
                        onChange={(e) => setFormData({...formData, titre: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="responsable">Responsable</Label>
                      <Input
                        id="responsable"
                        value={formData.responsable}
                        onChange={(e) => setFormData({...formData, responsable: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="heureDebut">Heure début</Label>
                      <Input
                        id="heureDebut"
                        type="time"
                        value={formData.heureDebut}
                        onChange={(e) => setFormData({...formData, heureDebut: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="heureFin">Heure fin</Label>
                      <Input
                        id="heureFin"
                        type="time"
                        value={formData.heureFin}
                        onChange={(e) => setFormData({...formData, heureFin: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="lieu">Lieu</Label>
                    <Input
                      id="lieu"
                      value={formData.lieu}
                      onChange={(e) => setFormData({...formData, lieu: e.target.value})}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="type">Type</Label>
                      <Select value={formData.type} onValueChange={(value: 'entrainement' | 'stage' | 'competition') =>
                        setFormData({...formData, type: value})}>
                        <SelectTrigger>
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
                      <Label htmlFor="niveau">Niveau</Label>
                      <Select value={formData.niveau} onValueChange={(value: 'debutant' | 'intermediaire' | 'avance' | 'tous') =>
                        setFormData({...formData, niveau: value})}>
                        <SelectTrigger>
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
                      <Label htmlFor="maxParticipants">Max participants</Label>
                      <Input
                        id="maxParticipants"
                        type="number"
                        value={formData.maxParticipants}
                        onChange={(e) => setFormData({...formData, maxParticipants: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="statut">Statut</Label>
                      <Select value={formData.statut} onValueChange={(value: 'planifie' | 'en_cours' | 'termine' | 'annule') =>
                        setFormData({...formData, statut: value})}>
                        <SelectTrigger>
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
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                      Annuler
                    </Button>
                    <Button type="submit">
                      {editingTraining ? 'Modifier' : 'Créer'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Liste des entraînements */}
          {loading ? (
            <div className="text-center py-8">Chargement...</div>
          ) : trainings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Aucun entraînement programmé
            </div>
          ) : (
            <div className="space-y-4">
              {trainings
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((training) => (
                  <div key={training.id} className="p-4 border rounded-lg bg-white">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{training.titre}</h3>
                          <Badge className={getTypeColor(training.type)}>
                            {training.type}
                          </Badge>
                          <Badge className={getStatutColor(training.statut)}>
                            {training.statut}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>📅 {formatDate(training.date)} • {formatTime(training.heureDebut)} - {formatTime(training.heureFin)}</p>
                          <p>📍 {training.lieu}</p>
                          <p>👨‍🏫 {training.responsable}</p>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>{training.participants.length} participant(s)</span>
                            {training.maxParticipants && (
                              <span>/ {training.maxParticipants} max</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDuplicate(training)}
                          title="Dupliquer l'entraînement"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleFacebookShare(training)}
                          title="Publier sur Facebook"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Share className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(training)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(training.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    {training.description && (
                      <p className="text-sm text-gray-600 mt-2">{training.description}</p>
                    )}
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog pour publication Facebook */}
      <Dialog open={showFacebookDialog} onOpenChange={setShowFacebookDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share className="h-5 w-5 text-blue-600" />
              Publier sur Facebook
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="facebook-message">Message de publication</Label>
              <Textarea
                id="facebook-message"
                value={facebookMessage}
                onChange={(e) => setFacebookMessage(e.target.value)}
                rows={12}
                className="mt-2"
              />
            </div>

            {selectedTrainingForFacebook && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">Aperçu de l'entraînement</h4>
                <div className="text-sm space-y-1">
                  <p><strong>Titre:</strong> {selectedTrainingForFacebook.titre}</p>
                  <p><strong>Date:</strong> {formatDate(selectedTrainingForFacebook.date)}</p>
                  <p><strong>Horaire:</strong> {formatTime(selectedTrainingForFacebook.heureDebut)} - {formatTime(selectedTrainingForFacebook.heureFin)}</p>
                  <p><strong>Lieu:</strong> {selectedTrainingForFacebook.lieu}</p>
                  <p><strong>Responsable:</strong> {selectedTrainingForFacebook.responsable}</p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowFacebookDialog(false)}
                disabled={publishingToFacebook}
              >
                Annuler
              </Button>
              <Button
                onClick={publishToFacebook}
                disabled={publishingToFacebook}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {publishingToFacebook ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Publication...
                  </>
                ) : (
                  <>
                    <Share className="h-4 w-4 mr-2" />
                    Publier sur Facebook
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
