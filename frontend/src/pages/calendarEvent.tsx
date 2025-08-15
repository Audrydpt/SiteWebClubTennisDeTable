/* eslint-disable jsx-a11y/click-events-have-key-events,no-plusplus,jsx-a11y/no-static-element-interactions */

import { useState } from 'react';
import {
  Calendar,
  Trophy,
  Users,
  Music,
  Star,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Event {
  id: string;
  date: string;
  title: string;
  type: 'tournoi' | 'soiree' | 'entrainement' | 'championnat';
  description: string;
  time?: string;
  location?: string;
}

const mockEvents: Event[] = [
  {
    id: '1',
    date: '2025-01-20',
    title: 'Tournoi Interne Hiver',
    type: 'tournoi',
    description: 'Tournoi interne pour tous les niveaux avec remise des prix',
    time: '14:00',
    location: 'Salle principale',
  },
  {
    id: '2',
    date: '2025-01-25',
    title: 'Championnat Division 3',
    type: 'championnat',
    description: 'Match de championnat contre Mons TTC',
    time: '19:30',
    location: 'Salle principale',
  },
  {
    id: '3',
    date: '2025-02-01',
    title: 'Soirée Conviviale',
    type: 'soiree',
    description: 'Soirée détente avec barbecue et animations',
    time: '18:00',
    location: 'Club house',
  },
  {
    id: '4',
    date: '2025-02-08',
    title: 'Entraînement Jeunes',
    type: 'entrainement',
    description: "Séance d'entraînement spéciale pour les jeunes joueurs",
    time: '16:00',
    location: 'Salle principale',
  },
  {
    id: '5',
    date: '2025-02-15',
    title: 'Tournoi Open Frameries',
    type: 'tournoi',
    description: 'Grand tournoi ouvert à tous les clubs de la région',
    time: '09:00',
    location: 'Toutes les salles',
  },
  {
    id: '6',
    date: '2025-01-18',
    title: 'Championnat Division 2',
    type: 'championnat',
    description:
      'Match crucial contre La Louvière TTC pour maintenir notre position en tête du classement',
    time: '20:00',
    location: 'Salle principale',
  },
  {
    id: '7',
    date: '2025-01-22',
    title: 'Entraînement Compétiteurs',
    type: 'entrainement',
    description:
      'Séance intensive de préparation physique et technique pour nos joueurs de compétition',
    time: '19:00',
    location: 'Salle principale',
  },
  {
    id: '8',
    date: '2025-01-29',
    title: 'Entraînement Loisirs',
    type: 'entrainement',
    description:
      'Entraînement convivial pour les joueurs loisirs avec initiation aux techniques de base',
    time: '20:30',
    location: 'Salle annexe',
  },
  {
    id: '9',
    date: '2025-02-05',
    title: 'Championnat Jeunes',
    type: 'championnat',
    description:
      'Nos équipes jeunes affrontent Charleroi TTC dans un match décisif pour les playoffs',
    time: '18:00',
    location: 'Salle principale',
  },
  {
    id: '10',
    date: '2025-02-12',
    title: 'Stage Perfectionnement',
    type: 'entrainement',
    description:
      "Stage de perfectionnement animé par un entraîneur diplômé d'État, ouvert à tous niveaux",
    time: '14:00',
    location: 'Toutes les salles',
  },
  {
    id: '11',
    date: '2025-02-19',
    title: 'Soirée Carnaval',
    type: 'soiree',
    description:
      'Grande soirée déguisée avec concours de costumes, DJ et buffet préparé par les membres',
    time: '19:00',
    location: 'Club house',
  },
  {
    id: '12',
    date: '2025-02-22',
    title: 'Tournoi Vétérans',
    type: 'tournoi',
    description:
      "Tournoi réservé aux joueurs de plus de 40 ans avec catégories par tranches d'âge",
    time: '13:30',
    location: 'Salle principale',
  },
  {
    id: '13',
    date: '2025-03-01',
    title: 'Championnat Division 1',
    type: 'championnat',
    description:
      'Match de gala contre Tournai TTC, leader du championnat, dans une ambiance exceptionnelle',
    time: '19:30',
    location: 'Salle principale',
  },
  {
    id: '14',
    date: '2025-03-05',
    title: 'Entraînement Arbitrage',
    type: 'entrainement',
    description:
      "Formation à l'arbitrage pour nos membres souhaitant officier lors des compétitions",
    time: '19:30',
    location: 'Salle de réunion',
  },
  {
    id: '15',
    date: '2025-03-08',
    title: 'Tournoi Féminin',
    type: 'tournoi',
    description:
      'Tournoi exclusivement féminin pour promouvoir la pratique du tennis de table chez les femmes',
    time: '14:00',
    location: 'Salle principale',
  },
  {
    id: '16',
    date: '2025-03-12',
    title: 'Championnat Interclubs',
    type: 'championnat',
    description:
      'Réception de Binche TTC dans un match qui pourrait décider de notre montée en division supérieure',
    time: '20:00',
    location: 'Salle principale',
  },
  {
    id: '17',
    date: '2025-03-15',
    title: 'Journée Portes Ouvertes',
    type: 'soiree',
    description:
      'Découverte gratuite du tennis de table avec initiations, démonstrations et inscriptions pour la saison prochaine',
    time: '10:00',
    location: 'Toutes les salles',
  },
  {
    id: '18',
    date: '2025-03-19',
    title: 'Entraînement Technique',
    type: 'entrainement',
    description:
      'Séance spécialisée sur les services et retours de service avec analyse vidéo',
    time: '19:00',
    location: 'Salle principale',
  },
  {
    id: '19',
    date: '2025-03-22',
    title: 'Tournoi Doubles',
    type: 'tournoi',
    description:
      'Tournoi de doubles mixtes et homogènes avec tirages au sort des paires pour plus de convivialité',
    time: '14:00',
    location: 'Salle principale',
  },
  {
    id: '20',
    date: '2025-03-26',
    title: 'Championnat Playoffs',
    type: 'championnat',
    description:
      'Premier tour des playoffs contre Fleurus TTC - match aller décisif pour notre avenir en division',
    time: '19:30',
    location: 'Salle principale',
  },
  {
    id: '21',
    date: '2025-03-29',
    title: 'Assemblée Générale',
    type: 'soiree',
    description:
      "Assemblée générale annuelle avec bilan de la saison, élections du comité et pot de l'amitié",
    time: '19:00',
    location: 'Club house',
  },
  {
    id: '22',
    date: '2025-04-02',
    title: 'Stage Jeunes Vacances',
    type: 'entrainement',
    description:
      'Stage intensif pendant les vacances scolaires pour les jeunes de 8 à 16 ans avec jeux et compétitions',
    time: '09:00',
    location: 'Toutes les salles',
  },
  {
    id: '23',
    date: '2025-04-05',
    title: 'Tournoi de Pâques',
    type: 'tournoi',
    description:
      'Tournoi traditionnel de Pâques avec chasse aux œufs pour les enfants et buffet pascal',
    time: '13:00',
    location: 'Salle principale',
  },
  {
    id: '24',
    date: '2025-04-09',
    title: 'Championnat Retour',
    type: 'championnat',
    description:
      'Match retour crucial contre Fleurus TTC - la qualification pour la finale se joue ici',
    time: '20:00',
    location: 'Salle principale',
  },
  {
    id: '25',
    date: '2025-04-12',
    title: 'Soirée Quiz',
    type: 'soiree',
    description:
      'Soirée quiz sur le tennis de table et culture générale avec lots à gagner et ambiance détendue',
    time: '19:30',
    location: 'Club house',
  },
  {
    id: '26',
    date: '2025-04-16',
    title: 'Entraînement Préparation Finale',
    type: 'entrainement',
    description:
      'Dernière séance de préparation avant la finale avec travail mental et stratégies de match',
    time: '19:00',
    location: 'Salle principale',
  },
  {
    id: '27',
    date: '2025-04-19',
    title: 'Finale Championnat',
    type: 'championnat',
    description:
      "GRANDE FINALE du championnat contre Nivelles TTC - l'aboutissement de toute une saison !",
    time: '19:30',
    location: 'Salle principale',
  },
  {
    id: '28',
    date: '2025-04-26',
    title: 'Tournoi de Clôture',
    type: 'tournoi',
    description:
      'Tournoi de fin de saison ouvert à tous avec remise des récompenses annuelles et remerciements',
    time: '14:00',
    location: 'Salle principale',
  },
  {
    id: '29',
    date: '2025-05-03',
    title: 'Barbecue de Fin de Saison',
    type: 'soiree',
    description:
      'Grand barbecue convivial pour célébrer la fin de saison avec familles, amis et partenaires du club',
    time: '17:00',
    location: 'Extérieur + Club house',
  },
  {
    id: '30',
    date: '2025-05-10',
    title: 'Nettoyage des Locaux',
    type: 'entrainement',
    description:
      'Journée collective de nettoyage et rangement des installations avant la pause estivale',
    time: '09:00',
    location: 'Toutes les salles',
  },
];

const eventTypeConfig = {
  tournoi: { color: 'bg-[#F1C40F]', icon: Trophy, label: 'Tournoi' },
  championnat: { color: 'bg-red-500', icon: Star, label: 'Championnat' },
  soiree: { color: 'bg-purple-500', icon: Music, label: 'Soirée' },
  entrainement: { color: 'bg-blue-500', icon: Users, label: 'Entraînement' },
};

export default function EventsCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const getDaysInMonth = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

  const getFirstDayOfMonth = (date: Date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return firstDay === 0 ? 6 : firstDay - 1; // Adjust for Monday start
  };

  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  const getEventsForDate = (day: number) => {
    const dateStr = formatDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    );
    return mockEvents.filter((event) => event.date === dateStr);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24" />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const events = getEventsForDate(day);
      const hasEvents = events.length > 0;

      days.push(
        <div
          key={day}
          className={`h-24 border border-gray-200 p-1 cursor-pointer hover:bg-gray-50 transition-colors ${
            hasEvents ? 'bg-yellow-50' : ''
          }`}
          onClick={() => hasEvents && setSelectedEvent(events[0])}
        >
          <div className="font-semibold text-[#3A3A3A] mb-1">{day}</div>
          <div className="space-y-1">
            {events.slice(0, 2).map((event) => {
              const config = eventTypeConfig[event.type];
              return (
                <div
                  key={event.id}
                  className={`text-xs px-1 py-0.5 rounded text-white ${config.color} truncate`}
                >
                  {event.title}
                </div>
              );
            })}
            {events.length > 2 && (
              <div className="text-xs text-gray-500">
                +{events.length - 2} autres
              </div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* HEADER */}
      <div className="relative bg-[#3A3A3A] text-white py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 border-4 border-[#F1C40F] rounded-full" />
          <div className="absolute top-32 right-20 w-24 h-24 bg-[#F1C40F] rounded-full" />
          <div className="absolute bottom-20 left-1/4 w-16 h-16 border-4 border-[#F1C40F] rounded-full" />
          <div className="absolute bottom-10 right-10 w-20 h-20 bg-[#F1C40F] rounded-full opacity-50" />
        </div>

        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-6xl font-bold mb-6 leading-tight">
            Calendrier des{' '}
            <span className="text-[#F1C40F] drop-shadow-lg">Événements</span>
          </h1>
          <p className="text-xl max-w-3xl mx-auto leading-relaxed text-gray-300">
            Découvrez nos tournois, championnats et moments conviviaux
          </p>
        </div>
      </div>

      {/* CALENDAR SECTION */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Legend */}
          <Card className="mb-8 shadow-lg border-0">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-[#3A3A3A] mb-4">
                Légende des événements
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(eventTypeConfig).map(([type, config]) => {
                  const IconComponent = config.icon;
                  return (
                    <div key={type} className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded ${config.color}`} />
                      <IconComponent className="h-4 w-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">
                        {config.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Calendar Navigation */}
          <Card className="shadow-2xl border-0">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-8">
                <Button
                  variant="outline"
                  onClick={() => navigateMonth('prev')}
                  className="border-[#F1C40F] text-[#3A3A3A] hover:bg-[#F1C40F] hover:text-[#3A3A3A]"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-3xl font-bold text-[#3A3A3A]">
                  {currentDate.toLocaleDateString('fr-FR', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </h2>
                <Button
                  variant="outline"
                  onClick={() => navigateMonth('next')}
                  className="border-[#F1C40F] text-[#3A3A3A] hover:bg-[#F1C40F] hover:text-[#3A3A3A]"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-0 border border-gray-200 rounded-lg overflow-hidden">
                {/* Day headers */}
                {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(
                  (day) => (
                    <div
                      key={day}
                      className="bg-[#3A3A3A] text-white p-4 text-center font-semibold"
                    >
                      {day}
                    </div>
                  )
                )}
                {/* Calendar days */}
                {renderCalendar()}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* EVENT DETAIL MODAL */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full shadow-2xl border-0">
            <CardContent className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded ${eventTypeConfig[selectedEvent.type].color}`}
                  />
                  <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                    {eventTypeConfig[selectedEvent.type].label}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedEvent(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <h3 className="text-2xl font-bold text-[#3A3A3A] mb-4">
                {selectedEvent.title}
              </h3>
              <p className="text-gray-600 mb-6">{selectedEvent.description}</p>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-gray-700">
                  <Calendar className="h-4 w-4 text-[#F1C40F]" />
                  <span>
                    {new Date(selectedEvent.date).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                {selectedEvent.time && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <span className="w-4 h-4 flex items-center justify-center text-[#F1C40F] font-bold">
                      ⏰
                    </span>
                    <span>{selectedEvent.time}</span>
                  </div>
                )}
                {selectedEvent.location && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <span className="w-4 h-4 flex items-center justify-center text-[#F1C40F] font-bold">
                      📍
                    </span>
                    <span>{selectedEvent.location}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
