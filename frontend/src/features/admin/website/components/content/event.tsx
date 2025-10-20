/* eslint-disable */
import React, { useEffect, useRef, useState } from 'react';
import { fetchEvents, updateEvent } from "@/services/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Save, Plus, Trash, ChevronDown, ChevronRight, Search, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function EventManager() {
  const [eventData, setEventData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    id: "",
    date: "",
    title: "",
    type: "",
    description: "",
    time: "",
    location: "",
    isHome: true, // Pour les championnats
  });

  useEffect(() => {
    loadData();
  }, []);

  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current && eventData?.eventTypes) {
      setCollapsedCategories(new Set(Object.keys(eventData.eventTypes)));
      initialized.current = true; // ✅ évite de ré-exécuter au prochain changement
    }
  }, [eventData]);

  // Initialiser le nouvel événement lorsque les types d'événements sont chargés
  useEffect(() => {
    if (eventData?.eventTypes && Object.keys(eventData.eventTypes).length > 0) {
      setNewEvent(prev => ({
        ...prev,
        type: Object.keys(eventData.eventTypes)[0]
      }));
    }
  }, [eventData?.eventTypes]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchEvents();
      console.log('Données reçues de l\'API:', data);
      setEventData(data);
    } catch (error) {
      console.error("Erreur chargement events:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeCalendar = (id: string, field: string, value: string) => {
    setEventData((prev: any) => ({
      ...prev,
      calendar: prev.calendar.map((ev: any) =>
        ev.id === id ? { ...ev, [field]: value } : ev
      ),
    }));
  };

  const handleOpenAddEventDialog = () => {
    // Réinitialiser le formulaire avec des valeurs par défaut
    setNewEvent({
      id: Date.now().toString(),
      date: "",
      title: "Nouvel événement",
      type: Object.keys(eventData.eventTypes)[0] || "tournoi",
      description: "",
      time: "",
      location: "",
      isHome: true,
    });
    setIsDialogOpen(true);
  };

  const handleAddEvent = () => {
    // Ajouter l'événement aux données
    setEventData((prev: any) => ({
      ...prev,
      calendar: [...prev.calendar, newEvent],
    }));

    // Ouvrir la catégorie correspondante
    setCollapsedCategories(prev => {
      const newSet = new Set(prev);
      newSet.delete(newEvent.type);
      return newSet;
    });

    // Fermer le dialogue
    setIsDialogOpen(false);
  };

  const handleNewEventChange = (field: string, value: string) => {
    setNewEvent(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDeleteEvent = (id: string) => {
    if (!confirm("Supprimer cet événement ?")) return;
    setEventData((prev: any) => ({
      ...prev,
      calendar: prev.calendar.filter((ev: any) => ev.id !== id),
    }));
  };

  const handleChangeEventType = (key: string, field: string, value: string) => {
    setEventData((prev: any) => ({
      ...prev,
      eventTypes: {
        ...prev.eventTypes,
        [key]: {
          ...prev.eventTypes[key],
          [field]: value,
        },
      },
    }));
  };

  const handleAddEventType = () => {
    const newKey = `type_${Date.now()}`;
    setEventData((prev: any) => ({
      ...prev,
      eventTypes: {
        ...prev.eventTypes,
        [newKey]: {
          label: "Nouveau type",
          icon: "star",
        },
      },
    }));
  };

  const handleDeleteEventType = (key: string) => {
    if (!confirm("Supprimer ce type d'événement ?")) return;

    const isUsed = eventData.calendar.some((ev: any) => ev.type === key);
    if (isUsed) {
      alert("Ce type est utilisé dans le calendrier. Impossible de le supprimer.");
      return;
    }

    setEventData((prev: any) => {
      const newEventTypes = { ...prev.eventTypes };
      delete newEventTypes[key];
      return {
        ...prev,
        eventTypes: newEventTypes,
      };
    });
  };

  const handleSave = async () => {
    if (!eventData) return;
    try {
      setSaving(true);
      await updateEvent(eventData);
      alert("Événements sauvegardés ✅");
    } catch (error) {
      console.error("Erreur sauvegarde:", error);
      alert("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const groupEventsByType = () => {
    if (!eventData?.calendar) return {};

    const grouped: { [key: string]: any[] } = {};

    eventData.calendar
      .filter((event: any) => {
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        return (
          event.title?.toLowerCase().includes(searchLower) ||
          event.description?.toLowerCase().includes(searchLower) ||
          event.location?.toLowerCase().includes(searchLower) ||
          eventData.eventTypes?.[event.type]?.label?.toLowerCase().includes(searchLower)
        );
      })
      .forEach((event: any) => {
        const type = event.type || 'non-catégorisé';
        if (!grouped[type]) {
          grouped[type] = [];
        }
        grouped[type].push(event);
      });

    return grouped;
  };

  const getCategoryColor = (typeKey: string) => {
    const colors = [
      'bg-blue-50 border-blue-200',
      'bg-green-50 border-green-200',
      'bg-purple-50 border-purple-200',
      'bg-orange-50 border-orange-200',
      'bg-pink-50 border-pink-200',
      'bg-yellow-50 border-yellow-200',
      'bg-indigo-50 border-indigo-200',
      'bg-red-50 border-red-200'
    ];
    const index = Object.keys(eventData?.eventTypes || {}).indexOf(typeKey);
    return colors[index % colors.length] || 'bg-gray-50 border-gray-200';
  };

  const toggleCategory = (typeKey: string) => {
    setCollapsedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(typeKey)) {
        newSet.delete(typeKey);
      } else {
        newSet.add(typeKey);
      }
      return newSet;
    });
  };

  useEffect(() => {
    if (searchTerm && eventData) {
      const groupedEvents = groupEventsByType();
      const categoriesWithResults = Object.keys(groupedEvents).filter(
        typeKey => groupedEvents[typeKey].length > 0
      );

      setCollapsedCategories(prev => {
        const newSet = new Set(prev);
        categoriesWithResults.forEach(category => newSet.delete(category));
        return newSet;
      });
    }
  }, [searchTerm, eventData]);

  const handleCopyEvent = (event: any) => {
    // Copier l'événement avec un nouvel ID
    const copiedEvent = {
      ...event,
      id: Date.now().toString(),
      title: `${event.title} (copie)`,
    };

    setEventData((prev: any) => ({
      ...prev,
      calendar: [...prev.calendar, copiedEvent],
    }));

    // Ouvrir la catégorie correspondante
    setCollapsedCategories(prev => {
      const newSet = new Set(prev);
      newSet.delete(copiedEvent.type);
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 sm:py-12">
        <Loader2 className="animate-spin w-6 h-6 mr-2" />
        <span className="text-sm">Chargement des événements...</span>
      </div>
    );
  }

  if (!eventData) {
    return <div className="text-center py-6 sm:py-8 text-sm">Aucune donnée trouvée.</div>;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <CardTitle className="text-lg sm:text-xl">Gestion des Événements</CardTitle>
            <CardDescription className="text-sm">
              <span className="hidden sm:inline">Modifier le calendrier et les types d'événements du site</span>
              <span className="sm:hidden">Calendrier et événements</span>
            </CardDescription>
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto text-sm">
            {saving && <Loader2 className="animate-spin w-4 h-4 mr-2" />}
            <Save className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Sauvegarder</span>
            <span className="sm:hidden">Save</span>
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="calendar" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="calendar" className="text-xs sm:text-sm">
                <span className="hidden sm:inline">Calendrier</span>
                <span className="sm:hidden">Calendrier</span>
              </TabsTrigger>
              <TabsTrigger value="types" className="text-xs sm:text-sm">
                <span className="hidden sm:inline">Types d'événements</span>
                <span className="sm:hidden">Types</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="calendar" className="space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="text-base sm:text-lg font-semibold">
                  <span className="hidden sm:inline">Événements du calendrier</span>
                  <span className="sm:hidden">Événements</span>
                </h3>
                <Button onClick={handleOpenAddEventDialog} variant="outline" className="text-xs sm:text-sm">
                  <Plus className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Ajouter un événement</span>
                  <span className="sm:hidden">Ajouter</span>
                </Button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Rechercher un événement (titre, description, lieu, type...)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 text-sm"
                />
              </div>

              {searchTerm && (
                <div className="text-xs sm:text-sm text-gray-600">
                  {Object.values(groupEventsByType()).flat().length} événement(s) trouvé(s) pour "{searchTerm}"
                </div>
              )}

              <div className="space-y-4 sm:space-y-6">
                {Object.entries(groupEventsByType()).map(([typeKey, events]: [string, any[]]) => {
                  const isCollapsed = collapsedCategories.has(typeKey);
                  const typeLabel = eventData.eventTypes?.[typeKey]?.label || typeKey;
                  const categoryColor = getCategoryColor(typeKey);

                  return (
                    <div key={typeKey} className={`border rounded-lg ${categoryColor}`}>
                      <div className="border-b bg-white/50 rounded-t-lg">
                        <button
                          type="button"
                          className="w-full p-3 sm:p-4 flex items-center justify-between hover:bg-black/5 rounded-t-lg transition-colors"
                          onClick={() => toggleCategory(typeKey)}
                        >
                          <div className="flex items-center space-x-2 sm:space-x-3">
                            {isCollapsed ? (
                              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                            ) : (
                              <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                            )}
                            <h4 className="text-sm sm:text-lg font-semibold text-left">
                              {typeLabel} ({events.length} événement{events.length > 1 ? 's' : ''})
                            </h4>
                            {searchTerm && events.length > 0 && (
                              <span className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded text-xs">
                                Résultats trouvés
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">
                            {eventData.eventTypes?.[typeKey]?.icon && (
                              <span className="text-lg">
                                {eventData.eventTypes[typeKey].icon === 'trophy' && '🏆'}
                                {eventData.eventTypes[typeKey].icon === 'star' && '⭐'}
                                {eventData.eventTypes[typeKey].icon === 'music' && '🎵'}
                                {eventData.eventTypes[typeKey].icon === 'users' && '👥'}
                                {eventData.eventTypes[typeKey].icon === 'calendar' && '📅'}
                                {eventData.eventTypes[typeKey].icon === 'play' && '▶️'}
                                {eventData.eventTypes[typeKey].icon === 'heart' && '❤️'}
                                {eventData.eventTypes[typeKey].icon === 'flag' && '🚩'}
                              </span>
                            )}
                          </div>
                        </button>
                      </div>

                      {!isCollapsed && (
                        <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                          {events.map((ev: any) => (
                            <div
                              key={ev.id}
                              className="p-3 sm:p-4 bg-white border rounded-lg space-y-3 sm:space-y-4 relative shadow-sm"
                            >
                              <div className="absolute top-2 right-2 flex gap-2 z-10">
                                <button
                                  type="button"
                                  onClick={() => handleCopyEvent(ev)}
                                  className="text-blue-500 hover:text-blue-700"
                                  title="Copier l'événement"
                                >
                                  <Copy className="w-4 h-4 sm:w-5 sm:h-5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteEvent(ev.id)}
                                  className="text-red-500 hover:text-red-700"
                                  title="Supprimer l'événement"
                                >
                                  <Trash className="w-4 h-4 sm:w-5 sm:h-5" />
                                </button>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pr-16 sm:pr-20">
                                <div>
                                  <label className="block text-xs sm:text-sm font-medium mb-1">Titre</label>
                                  <Input
                                    value={ev.title}
                                    onChange={(e) =>
                                      handleChangeCalendar(ev.id, "title", e.target.value)
                                    }
                                    placeholder="Titre"
                                    className="text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs sm:text-sm font-medium mb-1">Date</label>
                                  <Input
                                    type="date"
                                    value={ev.date}
                                    onChange={(e) =>
                                      handleChangeCalendar(ev.id, "date", e.target.value)
                                    }
                                    className="text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs sm:text-sm font-medium mb-1">Type</label>
                                  <Select
                                    value={ev.type}
                                    onValueChange={(val) =>
                                      handleChangeCalendar(ev.id, "type", val)
                                    }
                                  >
                                    <SelectTrigger className="text-sm">
                                      <SelectValue placeholder="Sélectionner un type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {Object.entries(eventData.eventTypes).map(
                                        ([key, type]: any) => (
                                          <SelectItem key={key} value={key}>
                                            {type.label}
                                          </SelectItem>
                                        )
                                      )}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <label className="block text-xs sm:text-sm font-medium mb-1">Heure</label>
                                  <Input
                                    value={ev.time}
                                    onChange={(e) =>
                                      handleChangeCalendar(ev.id, "time", e.target.value)
                                    }
                                    placeholder="Heure"
                                    className="text-sm"
                                  />
                                </div>

                                {/* Choix Domicile/Extérieur pour les championnats */}
                                {ev.type === 'championnat' ? (
                                  <>
                                    <div>
                                      <label className="block text-xs sm:text-sm font-medium mb-1">Match</label>
                                      <Select
                                        value={ev.isHome !== undefined ? (ev.isHome ? 'home' : 'away') : 'home'}
                                        onValueChange={(val) =>
                                          handleChangeCalendar(ev.id, "isHome", val === 'home' ? 'true' : 'false')
                                        }
                                      >
                                        <SelectTrigger className="text-sm">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="home">🏠 Domicile</SelectItem>
                                          <SelectItem value="away">✈️ Extérieur</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    <div>
                                      <label className="block text-xs sm:text-sm font-medium mb-1">Lieu</label>
                                      <Select
                                        value={ev.location === 'Frameries' || ev.location === 'Domicile' ? 'domicile' : ev.location === 'Extérieur' ? 'exterieur' : 'autre'}
                                        onValueChange={(val) => {
                                          if (val === 'domicile') {
                                            handleChangeCalendar(ev.id, "location", "Frameries");
                                          } else if (val === 'exterieur') {
                                            handleChangeCalendar(ev.id, "location", "Extérieur");
                                          } else {
                                            handleChangeCalendar(ev.id, "location", "");
                                          }
                                        }}
                                      >
                                        <SelectTrigger className="text-sm">
                                          <SelectValue placeholder="Sélectionner un lieu" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="domicile">🏠 Domicile (Frameries)</SelectItem>
                                          <SelectItem value="exterieur">✈️ Extérieur</SelectItem>
                                          <SelectItem value="autre">📍 Autre (saisir manuellement)</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    {/* Champ de saisie manuelle si "Autre" est sélectionné */}
                                    {ev.location !== 'Frameries' && ev.location !== 'Domicile' && ev.location !== 'Extérieur' && (
                                      <div className="col-span-1 sm:col-span-2">
                                        <label className="block text-xs sm:text-sm font-medium mb-1">Lieu personnalisé</label>
                                        <Input
                                          value={ev.location || ''}
                                          onChange={(e) =>
                                            handleChangeCalendar(ev.id, "location", e.target.value)
                                          }
                                          placeholder="Entrez le lieu"
                                          className="text-sm"
                                        />
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <div className="col-span-1 sm:col-span-2">
                                    <label className="block text-xs sm:text-sm font-medium mb-1">Lieu</label>
                                    <Input
                                      value={ev.location}
                                      onChange={(e) =>
                                        handleChangeCalendar(ev.id, "location", e.target.value)
                                      }
                                      placeholder="Lieu"
                                      className="text-sm"
                                    />
                                  </div>
                                )}
                              </div>
                              <div>
                                <label className="block text-xs sm:text-sm font-medium mb-1">Description</label>
                                <Textarea
                                  value={ev.description}
                                  onChange={(e) =>
                                    handleChangeCalendar(ev.id, "description", e.target.value)
                                  }
                                  placeholder="Description"
                                  rows={3}
                                  className="text-sm"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {searchTerm && Object.keys(groupEventsByType()).length === 0 && (
                  <div className="text-center py-6 sm:py-8 text-gray-500 text-sm">
                    Aucun événement trouvé pour "{searchTerm}"
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="types" className="space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="text-base sm:text-lg font-semibold">
                  <span className="hidden sm:inline">Types d'événements</span>
                  <span className="sm:hidden">Types</span>
                </h3>
                <Button onClick={handleAddEventType} variant="outline" className="text-xs sm:text-sm">
                  <Plus className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Ajouter un type</span>
                  <span className="sm:hidden">+ Type</span>
                </Button>
              </div>

              <div className="space-y-3 sm:space-y-4">
                {Object.entries(eventData.eventTypes).map(([key, type]: any) => (
                  <div
                    key={key}
                    className="p-3 sm:p-4 border rounded-lg space-y-3 sm:space-y-4 bg-gray-50 relative"
                  >
                    <button
                      type="button"
                      onClick={() => handleDeleteEventType(key)}
                      className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                    >
                      <Trash className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pr-8 sm:pr-10">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium mb-1">Clé</label>
                        <Input
                          value={key}
                          disabled
                          className="bg-gray-100 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium mb-1">Label</label>
                        <Input
                          value={type.label}
                          onChange={(e) =>
                            handleChangeEventType(key, "label", e.target.value)
                          }
                          placeholder="Label du type"
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium mb-1">Icône</label>
                        <Select
                          value={type.icon}
                          onValueChange={(val) =>
                            handleChangeEventType(key, "icon", val)
                          }
                        >
                          <SelectTrigger className="text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="trophy">🏆 Trophy</SelectItem>
                            <SelectItem value="star">⭐ Star</SelectItem>
                            <SelectItem value="music">🎵 Music</SelectItem>
                            <SelectItem value="users">👥 Users</SelectItem>
                            <SelectItem value="calendar">📅 Calendar</SelectItem>
                            <SelectItem value="play">▶️ Play</SelectItem>
                            <SelectItem value="heart">❤️ Heart</SelectItem>
                            <SelectItem value="flag">🚩 Flag</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialogue d'ajout d'événement */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              <span className="hidden sm:inline">Ajouter un nouvel événement</span>
              <span className="sm:hidden">Nouvel événement</span>
            </DialogTitle>
            <DialogDescription className="text-sm">
              <span className="hidden sm:inline">Remplissez les informations pour créer un nouvel événement dans le calendrier.</span>
              <span className="sm:hidden">Créer un événement</span>
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-xs sm:text-sm">Titre</Label>
              <Input
                id="title"
                value={newEvent.title}
                onChange={(e) => handleNewEventChange("title", e.target.value)}
                placeholder="Titre de l'événement"
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type" className="text-xs sm:text-sm">Type d'événement</Label>
              <Select
                value={newEvent.type}
                onValueChange={(val) => handleNewEventChange("type", val)}
              >
                <SelectTrigger id="type" className="text-sm">
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  {eventData?.eventTypes && Object.entries(eventData.eventTypes).map(
                    ([key, type]: any) => (
                      <SelectItem key={key} value={key}>
                        {type.label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date" className="text-xs sm:text-sm">Date</Label>
              <Input
                id="date"
                type="date"
                value={newEvent.date}
                onChange={(e) => handleNewEventChange("date", e.target.value)}
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time" className="text-xs sm:text-sm">Heure</Label>
              <Input
                id="time"
                value={newEvent.time}
                onChange={(e) => handleNewEventChange("time", e.target.value)}
                placeholder="ex: 14h30"
                className="text-sm"
              />
            </div>

            <div className="col-span-1 sm:col-span-2 space-y-2">
              <Label htmlFor="location" className="text-xs sm:text-sm">Lieu</Label>
              <Input
                id="location"
                value={newEvent.location}
                onChange={(e) => handleNewEventChange("location", e.target.value)}
                placeholder="Lieu de l'événement"
                className="text-sm"
              />
            </div>

            <div className="col-span-1 sm:col-span-2 space-y-2">
              <Label htmlFor="description" className="text-xs sm:text-sm">Description</Label>
              <Textarea
                id="description"
                value={newEvent.description}
                onChange={(e) => handleNewEventChange("description", e.target.value)}
                placeholder="Description détaillée de l'événement"
                rows={3}
                className="text-sm"
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <DialogClose asChild>
              <Button variant="outline" className="w-full sm:w-auto text-sm">Annuler</Button>
            </DialogClose>
            <Button onClick={handleAddEvent} className="w-full sm:w-auto text-sm">
              <span className="hidden sm:inline">Ajouter l'événement</span>
              <span className="sm:hidden">Ajouter</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
