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
import { Loader2, Save, Plus, Trash, Edit, ChevronDown, ChevronRight, Search } from "lucide-react";
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin w-6 h-6 mr-2" />
        Chargement des événements...
      </div>
    );
  }

  if (!eventData) {
    return <div>Aucune donnée trouvée.</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex justify-between items-center">
          <div>
            <CardTitle>Gestion des Événements</CardTitle>
            <CardDescription>
              Modifier le calendrier et les types d'événements du site
            </CardDescription>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="animate-spin w-4 h-4 mr-2" />}
            <Save className="w-4 h-4 mr-2" />
            Sauvegarder
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="calendar" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="calendar">Calendrier</TabsTrigger>
              <TabsTrigger value="types">Types d'événements</TabsTrigger>
            </TabsList>

            <TabsContent value="calendar" className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Événements du calendrier</h3>
                <Button onClick={handleOpenAddEventDialog} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter un événement
                </Button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Rechercher un événement (titre, description, lieu, type...)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {searchTerm && (
                <div className="text-sm text-gray-600">
                  {Object.values(groupEventsByType()).flat().length} événement(s) trouvé(s) pour "{searchTerm}"
                </div>
              )}

              <div className="space-y-6">
                {Object.entries(groupEventsByType()).map(([typeKey, events]: [string, any[]]) => {
                  const isCollapsed = collapsedCategories.has(typeKey);
                  const typeLabel = eventData.eventTypes?.[typeKey]?.label || typeKey;
                  const categoryColor = getCategoryColor(typeKey);

                  return (
                    <div key={typeKey} className={`border rounded-lg ${categoryColor}`}>
                      <div className="border-b bg-white/50 rounded-t-lg">
                        <button
                          type="button"
                          className="w-full p-4 flex items-center justify-between hover:bg-black/5 rounded-t-lg transition-colors"
                          onClick={() => toggleCategory(typeKey)}
                        >
                          <div className="flex items-center space-x-3">
                            {isCollapsed ? (
                              <ChevronRight className="w-5 h-5 flex-shrink-0" />
                            ) : (
                              <ChevronDown className="w-5 h-5 flex-shrink-0" />
                            )}
                            <h4 className="text-lg font-semibold text-left">
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
                        <div className="p-4 space-y-4">
                          {events.map((ev: any) => (
                            <div
                              key={ev.id}
                              className="p-4 bg-white border rounded-lg space-y-4 relative shadow-sm"
                            >
                              <button
                                type="button"
                                onClick={() => handleDeleteEvent(ev.id)}
                                className="absolute top-2 right-2 text-red-500 hover:text-red-700 z-10"
                              >
                                <Trash className="w-5 h-5" />
                              </button>

                              <div className="grid grid-cols-2 gap-4 pr-10">
                                <div>
                                  <label className="block text-sm font-medium mb-1">Titre</label>
                                  <Input
                                    value={ev.title}
                                    onChange={(e) =>
                                      handleChangeCalendar(ev.id, "title", e.target.value)
                                    }
                                    placeholder="Titre"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium mb-1">Date</label>
                                  <Input
                                    type="date"
                                    value={ev.date}
                                    onChange={(e) =>
                                      handleChangeCalendar(ev.id, "date", e.target.value)
                                    }
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium mb-1">Type</label>
                                  <Select
                                    value={ev.type}
                                    onValueChange={(val) =>
                                      handleChangeCalendar(ev.id, "type", val)
                                    }
                                  >
                                    <SelectTrigger>
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
                                  <label className="block text-sm font-medium mb-1">Heure</label>
                                  <Input
                                    value={ev.time}
                                    onChange={(e) =>
                                      handleChangeCalendar(ev.id, "time", e.target.value)
                                    }
                                    placeholder="Heure"
                                  />
                                </div>
                                <div className="col-span-2">
                                  <label className="block text-sm font-medium mb-1">Lieu</label>
                                  <Input
                                    value={ev.location}
                                    onChange={(e) =>
                                      handleChangeCalendar(ev.id, "location", e.target.value)
                                    }
                                    placeholder="Lieu"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <Textarea
                                  value={ev.description}
                                  onChange={(e) =>
                                    handleChangeCalendar(ev.id, "description", e.target.value)
                                  }
                                  placeholder="Description"
                                  rows={3}
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
                  <div className="text-center py-8 text-gray-500">
                    Aucun événement trouvé pour "{searchTerm}"
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="types" className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Types d'événements</h3>
                <Button onClick={handleAddEventType} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter un type
                </Button>
              </div>

              <div className="space-y-4">
                {Object.entries(eventData.eventTypes).map(([key, type]: any) => (
                  <div
                    key={key}
                    className="p-4 border rounded-lg space-y-4 bg-gray-50 relative"
                  >
                    <button
                      type="button"
                      onClick={() => handleDeleteEventType(key)}
                      className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                    >
                      <Trash className="w-5 h-5" />
                    </button>

                    <div className="grid grid-cols-3 gap-4 pr-10">
                      <div>
                        <label className="block text-sm font-medium mb-1">Clé</label>
                        <Input
                          value={key}
                          disabled
                          className="bg-gray-100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Label</label>
                        <Input
                          value={type.label}
                          onChange={(e) =>
                            handleChangeEventType(key, "label", e.target.value)
                          }
                          placeholder="Label du type"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Icône</label>
                        <Select
                          value={type.icon}
                          onValueChange={(val) =>
                            handleChangeEventType(key, "icon", val)
                          }
                        >
                          <SelectTrigger>
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ajouter un nouvel événement</DialogTitle>
            <DialogDescription>
              Remplissez les informations pour créer un nouvel événement dans le calendrier.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre</Label>
              <Input
                id="title"
                value={newEvent.title}
                onChange={(e) => handleNewEventChange("title", e.target.value)}
                placeholder="Titre de l'événement"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type d'événement</Label>
              <Select
                value={newEvent.type}
                onValueChange={(val) => handleNewEventChange("type", val)}
              >
                <SelectTrigger id="type">
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
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={newEvent.date}
                onChange={(e) => handleNewEventChange("date", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Heure</Label>
              <Input
                id="time"
                value={newEvent.time}
                onChange={(e) => handleNewEventChange("time", e.target.value)}
                placeholder="ex: 14h30"
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="location">Lieu</Label>
              <Input
                id="location"
                value={newEvent.location}
                onChange={(e) => handleNewEventChange("location", e.target.value)}
                placeholder="Lieu de l'événement"
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newEvent.description}
                onChange={(e) => handleNewEventChange("description", e.target.value)}
                placeholder="Description détaillée de l'événement"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button onClick={handleAddEvent}>
              Ajouter l'événement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}