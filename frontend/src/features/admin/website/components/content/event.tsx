/* eslint-disable */
import React, { useEffect, useState } from "react";
import { fetchEvents, updateEvent } from "@/services/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Save, Plus, Trash, Edit } from "lucide-react";
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

export default function EventManager() {
  const [eventData, setEventData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

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

  // Gestion des événements du calendrier
  const handleChangeCalendar = (id: string, field: string, value: string) => {
    setEventData((prev: any) => ({
      ...prev,
      calendar: prev.calendar.map((ev: any) =>
        ev.id === id ? { ...ev, [field]: value } : ev
      ),
    }));
  };

  const handleAddEvent = () => {
    const newId = Date.now().toString();
    const newEvent = {
      id: newId,
      date: "",
      title: "Nouvel événement",
      type: Object.keys(eventData.eventTypes)[0] || "tournoi",
      description: "",
      time: "",
      location: "",
    };
    setEventData((prev: any) => ({
      ...prev,
      calendar: [...prev.calendar, newEvent],
    }));
  };

  const handleDeleteEvent = (id: string) => {
    if (!confirm("Supprimer cet événement ?")) return;
    setEventData((prev: any) => ({
      ...prev,
      calendar: prev.calendar.filter((ev: any) => ev.id !== id),
    }));
  };

  // Gestion des types d'événements
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

    // Vérifier si ce type est utilisé dans le calendrier
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
                <Button onClick={handleAddEvent} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter un événement
                </Button>
              </div>

              <div className="space-y-6">
                {eventData.calendar.map((ev: any) => (
                  <div
                    key={ev.id}
                    className="p-4 border rounded-lg space-y-4 bg-gray-50 relative"
                  >
                    <button
                      onClick={() => handleDeleteEvent(ev.id)}
                      className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                    >
                      <Trash className="w-5 h-5" />
                    </button>

                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        value={ev.title}
                        onChange={(e) =>
                          handleChangeCalendar(ev.id, "title", e.target.value)
                        }
                        placeholder="Titre"
                      />
                      <Input
                        type="date"
                        value={ev.date}
                        onChange={(e) =>
                          handleChangeCalendar(ev.id, "date", e.target.value)
                        }
                      />
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
                      <Input
                        value={ev.time}
                        onChange={(e) =>
                          handleChangeCalendar(ev.id, "time", e.target.value)
                        }
                        placeholder="Heure"
                      />
                      <Input
                        value={ev.location}
                        onChange={(e) =>
                          handleChangeCalendar(ev.id, "location", e.target.value)
                        }
                        placeholder="Lieu"
                      />
                    </div>
                    <Textarea
                      value={ev.description}
                      onChange={(e) =>
                        handleChangeCalendar(ev.id, "description", e.target.value)
                      }
                      placeholder="Description"
                    />
                  </div>
                ))}
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
                      onClick={() => handleDeleteEventType(key)}
                      className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                    >
                      <Trash className="w-5 h-5" />
                    </button>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium">Clé</label>
                        <Input
                          value={key}
                          disabled
                          className="bg-gray-100"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Label</label>
                        <Input
                          value={type.label}
                          onChange={(e) =>
                            handleChangeEventType(key, "label", e.target.value)
                          }
                          placeholder="Label du type"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Icône</label>
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
    </div>
  );
}