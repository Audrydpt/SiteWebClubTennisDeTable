/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { Dumbbell, Users, MapPin, Clock, UserCheck, UserX, Globe, AlertTriangle, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Training, Member } from '@/services/type';
import { fetchTraining, updateTraining } from '@/services/api';

interface TrainingCalendarProps {
  member: Member;
}

export default function TrainingCalendar({ member }: TrainingCalendarProps) {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTrainings();
  }, []);

  const loadTrainings = async () => {
    setLoading(true);
    try {
      const data = await fetchTraining();
      // Inclure les entraînements futurs (planifiés ET annulés) pour que l'utilisateur voie les annulations
      const upcomingTrainings = data.filter((training: Training) => {
        const trainingDate = new Date(training.date);
        const today = new Date();
        return trainingDate >= today && (training.statut === 'planifie' || training.statut === 'annule');
      });
      setTrainings(upcomingTrainings);
    } catch (error) {
      console.error('Erreur lors du chargement des entraînements:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleParticipation = async (training: Training) => {
    // Empêcher l'inscription/désinscription pour les entraînements annulés
    if (training.statut === 'annule') {
      return;
    }

    try {
      const isParticipating = training.participants.includes(member.id);
      const updatedParticipants = isParticipating
        ? training.participants.filter((id) => id !== member.id)
        : [...training.participants, member.id];

      await updateTraining(training.id, {
        ...training,
        participants: updatedParticipants,
      });

      await loadTrainings();

      // Indication que l'inscription vient du site
      if (!isParticipating) {
        console.log(`Inscription via le site web pour: ${training.titre}`);
      }
    } catch (error) {
      console.error(
        'Erreur lors de la mise à jour de la participation:',
        error
      );
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });

  const formatTime = (time: string) => time.substring(0, 5);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'entrainement':
        return 'bg-blue-100 text-blue-800';
      case 'stage':
        return 'bg-green-100 text-green-800';
      case 'competition':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getNiveauColor = (niveau: string) => {
    switch (niveau) {
      case 'debutant':
        return 'bg-yellow-100 text-yellow-800';
      case 'intermediaire':
        return 'bg-orange-100 text-orange-800';
      case 'avance':
        return 'bg-purple-100 text-purple-800';
      case 'tous':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isTrainingFull = (training: Training) =>
    Boolean(
      training.maxParticipants &&
        training.participants.length >= training.maxParticipants
    );

  const canJoin = (training: Training) =>
    !training.participants.includes(member.id) &&
    (!training.maxParticipants ||
      training.participants.length < training.maxParticipants);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Dumbbell className="mr-2 h-5 w-5 text-blue-500" />
          Entraînements à venir
          <div className="ml-auto flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
            <Globe className="h-3 w-3" />
            Inscription via le site
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4">Chargement...</div>
        ) : trainings.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            Aucun entraînement programmé
          </div>
        ) : (
          <div className="space-y-4">
            {trainings.map((training) => {
              const isParticipating = training.participants.includes(member.id);
              const isFull = Boolean(training.maxParticipants && training.participants.length >= training.maxParticipants);
              const isCanceled = training.statut === 'annule';

              return (
                <div
                  key={training.id}
                  className={`p-4 border rounded-lg ${
                    isCanceled 
                      ? 'bg-red-50 border-red-200' 
                      : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  {/* Alerte d'annulation en haut */}
                  {isCanceled && (
                    <div className="mb-3 p-2 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm flex items-center gap-2">
                      <X className="h-4 w-4" />
                      <strong>ENTRAÎNEMENT ANNULÉ</strong>
                      {isParticipating && (
                        <span className="ml-2">- Vous étiez inscrit(e) à cet entraînement</span>
                      )}
                    </div>
                  )}

                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className={`font-semibold text-lg ${
                        isCanceled ? 'line-through text-red-600' : ''
                      }`}>
                        {training.titre}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span className={isCanceled ? 'line-through' : ''}>
                          {formatDate(training.date)} •{' '}
                          {formatTime(training.heureDebut)} -{' '}
                          {formatTime(training.heureFin)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span className={isCanceled ? 'line-through' : ''}>
                          {training.lieu}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Badge className={getTypeColor(training.type)}>
                        {training.type}
                      </Badge>
                      <Badge className={getNiveauColor(training.niveau)}>
                        {training.niveau}
                      </Badge>
                      {isCanceled && (
                        <Badge variant="destructive" className="text-xs">
                          ANNULÉ
                        </Badge>
                      )}
                    </div>
                  </div>

                  {training.description && (
                    <p className={`text-sm text-gray-600 mb-3 ${
                      isCanceled ? 'line-through' : ''
                    }`}>
                      {training.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-sm">
                        <Users className="h-4 w-4" />
                        <span className={isCanceled ? 'line-through' : ''}>
                          {training.participants.length}
                          {training.maxParticipants && (
                            <span>/ {training.maxParticipants}</span>
                          )}
                        </span>
                        <span className="text-gray-500">participants</span>
                      </div>

                      {training.participants.length > 0 && (
                        <div className="flex -space-x-2">
                          {training.participants
                            .slice(0, 3)
                            .map((participantId, index) => (
                              <Avatar
                                key={participantId}
                                className={`h-6 w-6 border-2 border-white ${
                                  isCanceled ? 'opacity-50' : ''
                                }`}
                              >
                                <AvatarFallback className="text-xs">
                                  {index + 1}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                          {training.participants.length > 3 && (
                            <div className={`h-6 w-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center ${
                              isCanceled ? 'opacity-50' : ''
                            }`}>
                              <span className="text-xs text-gray-600">
                                +{training.participants.length - 3}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <Button
                      size="sm"
                      variant={isParticipating && !isCanceled ? 'destructive' : 'default'}
                      onClick={() => toggleParticipation(training)}
                      disabled={isCanceled || (!isParticipating && Boolean(isFull))}
                      className={`${
                        !isParticipating && !isFull && !isCanceled ? 'bg-blue-600 hover:bg-blue-700' : ''
                      } ${isCanceled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isCanceled ? (
                        <>
                          <X className="h-4 w-4 mr-1" />
                          Annulé
                        </>
                      ) : isParticipating ? (
                        <>
                          <UserX className="h-4 w-4 mr-1" />
                          Se désinscrire
                        </>
                      ) : isFull ? (
                        'Complet'
                      ) : (
                        <>
                          <UserCheck className="h-4 w-4 mr-1" />
                          S'inscrire
                        </>
                      )}
                    </Button>
                  </div>

                  {isFull && !isParticipating && !isCanceled && (
                    <div className="mt-2 text-xs text-orange-600 bg-orange-50 p-2 rounded">
                      ⚠️ Entraînement complet
                    </div>
                  )}

                  {isCanceled && isParticipating && (
                    <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded flex items-center gap-2">
                      <AlertTriangle className="h-3 w-3" />
                      Vous étiez inscrit(e) à cet entraînement annulé
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
