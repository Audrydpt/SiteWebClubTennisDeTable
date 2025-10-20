/* eslint-disable */
import { useState, useEffect } from 'react';
import {
  Calendar,
  Trophy,
  Users,
  Music,
  Star,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { fetchEvents } from '@/services/api';

interface Event {
  id: string;
  date: string;
  title: string;
  type: string;
  description: string;
  time?: string;
  location?: string;
  isHome?: boolean;
}

export default function EventsCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [eventTypeConfig, setEventTypeConfig] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEventsData();
  }, []);

  const loadEventsData = async () => {
    try {
      setLoading(true);
      const eventData = await fetchEvents();

      // Charger les événements depuis l'API
      setEvents(eventData.calendar || []);

      // Construire la configuration des types d'événements dynamiquement
      const dynamicEventTypeConfig: any = {};

      Object.entries(eventData.eventTypes || {}).forEach(([key, type]: any) => {
        const iconMap: any = {
          trophy: Trophy,
          star: Star,
          music: Music,
          users: Users,
          calendar: Calendar,
        };

        const colorMap: any = {
          tournoi: 'bg-[#F1C40F]',
          championnat: 'bg-red-500',
          soiree: 'bg-purple-500',
          entrainement: 'bg-blue-500',
          formation: 'bg-green-500',
          evenement: 'bg-orange-500',
        };

        dynamicEventTypeConfig[key] = {
          color: colorMap[key] || 'bg-gray-500',
          icon: iconMap[type.icon] || Star,
          label: type.label,
        };
      });

      setEventTypeConfig(dynamicEventTypeConfig);
    } catch (error) {
      console.error('Erreur lors du chargement des événements:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

  const getFirstDayOfMonth = (date: Date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return firstDay === 0 ? 6 : firstDay - 1; // Adjust for Monday start
  };

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getEventsForDate = (day: number) => {
    const dateStr = formatDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    );
    return events.filter((event) => event.date === dateStr);
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
      days.push(<div key={`empty-${i}`} className="h-16 sm:h-24" />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayEvents = getEventsForDate(day);
      const hasEvents = dayEvents.length > 0;

      days.push(
        <div
          key={day}
          className={`h-16 sm:h-24 border border-gray-200 p-0.5 sm:p-1 cursor-pointer hover:bg-gray-50 transition-colors ${
            hasEvents ? 'bg-yellow-50' : ''
          }`}
          onClick={() => hasEvents && setSelectedEvent(dayEvents[0])}
        >
          <div className="font-semibold text-[#3A3A3A] text-xs sm:text-base mb-0.5 sm:mb-1">{day}</div>
          <div className="space-y-0.5 sm:space-y-1">
            {dayEvents.slice(0, 2).map((event) => {
              const config = eventTypeConfig[event.type] || {
                color: 'bg-gray-500',
                label: 'Autre',
              };
              return (
                <div
                  key={event.id}
                  className={`text-[10px] sm:text-xs px-0.5 sm:px-1 py-0.5 rounded text-white ${config.color} truncate flex items-center gap-1`}
                >
                  {event.type === 'championnat' && event.isHome !== undefined && (
                    <span className="text-[8px] sm:text-xs">
                      {event.isHome ? '🏠' : '✈️'}
                    </span>
                  )}
                  <span className="truncate">{event.title}</span>
                </div>
              );
            })}
            {dayEvents.length > 2 && (
              <div className="text-[10px] sm:text-xs text-gray-500">
                +{dayEvents.length - 2}
              </div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin w-8 h-8 mx-auto mb-4 text-[#F1C40F]" />
          <p className="text-gray-600">Chargement du calendrier...</p>
        </div>
      </div>
    );
  }

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
            Calendrier{' '}
            <span className="text-[#F1C40F] drop-shadow-lg">Général</span>
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
              <div className="flex flex-wrap justify-center gap-4">
                {Object.entries(eventTypeConfig).map(([type, config]: any) => {
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
                    className={`w-4 h-4 rounded ${eventTypeConfig[selectedEvent.type]?.color || 'bg-gray-500'}`}
                  />
                  <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                    {eventTypeConfig[selectedEvent.type]?.label || 'Autre'}
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
