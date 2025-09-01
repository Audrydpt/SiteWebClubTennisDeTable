/* eslint-disable */
import { useEffect, useState } from 'react';
import {
  Loader2,
  Save,
  Plus,
  Trash,
  Users,
  Table,
  Trophy,
  Calendar,
  Edit,
  X,
  MapPin,
  Clock,
  Star,
  Target,
  Sparkles,
  Heart,
} from 'lucide-react';
import {
  fetchAbout,
  fetchInformations,
  updateInformations,
} from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

const ICON_OPTIONS = [
  { value: 'Users', label: 'Utilisateurs', icon: Users },
  { value: 'MapPin', label: 'Localisation', icon: MapPin },
  { value: 'Clock', label: 'Horloge', icon: Clock },
  { value: 'Star', label: 'Étoile', icon: Star },
  { value: 'Trophy', label: 'Trophée', icon: Trophy },
  { value: 'Target', label: 'Cible', icon: Target },
  { value: 'Sparkles', label: 'Étincelles', icon: Sparkles },
  { value: 'Heart', label: 'Cœur', icon: Heart },
];

export default function AboutManager() {
  const [aboutData, setAboutData] = useState<any[]>([]);
  const [statsData, setStatsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingSection, setEditingSection] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const informations = await fetchInformations();
      const current = informations[0];
      setAboutData(current.about || []);

      setStatsData({
        membresActif: current.membresActif || '',
        tablesDispo: current.tablesDispo || '',
        nbrEquipes: current.nbrEquipes || '',
        anciennete: current.anciennete || '',
      });
    } catch (error) {
      console.error('Erreur chargement about:', error);
    }
    setLoading(false);
  };

  const handleStatsChange = (field: string, value: string) => {
    setStatsData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNestedChange = (
    sectionId: string,
    path: (string | number)[],
    newValue: any
  ) => {
    setAboutData((prev) =>
      prev.map((section) => {
        if (section.id !== sectionId) return section;
        const updated = { ...section };
        let ref: any = updated;
        for (let i = 0; i < path.length - 1; i++) {
          ref = ref[path[i]];
        }
        ref[path[path.length - 1]] = newValue;
        return updated;
      })
    );
  };

  const handleSectionEdit = (section: any) => {
    setEditingSection({ ...section });
    setIsModalOpen(true);
  };

  const handleSectionSave = () => {
    if (!editingSection) return;

    setAboutData((prev) =>
      prev.map((section) =>
        section.id === editingSection.id ? editingSection : section
      )
    );
    setIsModalOpen(false);
    setEditingSection(null);
  };

  const addNewSection = () => {
    const newSection = {
      id: `section_${Date.now()}`,
      title: 'Nouvelle section',
      subtitle: 'Description de la section',
    };
    setEditingSection(newSection);
    setIsModalOpen(true);
  };

  const removeSection = (sectionId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette section ?')) {
      setAboutData((prev) =>
        prev.filter((section) => section.id !== sectionId)
      );
    }
  };

  const addArrayItem = (field: string, type: 'string' | 'object') => {
    if (!editingSection) return;

    const newItem =
      type === 'string' ? '' : { title: '', text: '', icon: 'Heart' };
    setEditingSection((prev: any) => ({
      ...prev,
      [field]: [...(prev[field] || []), newItem],
    }));
  };

  const removeArrayItem = (field: string, index: number) => {
    if (!editingSection) return;

    setEditingSection((prev: any) => ({
      ...prev,
      [field]: prev[field].filter((_: any, i: number) => i !== index),
    }));
  };

  const updateArrayItem = (field: string, index: number, value: any) => {
    if (!editingSection) return;

    setEditingSection((prev: any) => ({
      ...prev,
      [field]: prev[field].map((item: any, i: number) =>
        i === index ? value : item
      ),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const allInfos = await fetchInformations();
      const current = allInfos[0];

      const updatedData = {
        ...current,
        about: aboutData,
        membresActif: statsData?.membresActif || current.membresActif,
        tablesDispo: statsData?.tablesDispo || current.tablesDispo,
        nbrEquipes: statsData?.nbrEquipes || current.nbrEquipes,
        anciennete: statsData?.anciennete || current.anciennete,
      };

      await updateInformations(current.id, updatedData);
      alert('✅ Les modifications ont été sauvegardées avec succès !');
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      alert('❌ Erreur lors de la sauvegarde. Veuillez réessayer.');
    }
    setSaving(false);
  };

  const renderSectionPreview = (section: any) => {
    const getSectionType = (id: string) => {
      const typeMap: { [key: string]: string } = {
        aboutHeader: 'En-tête',
        evolution2025: 'Évolution 2025',
        histoire: 'Histoire',
        ambiance: 'Ambiance',
        valeurs: 'Valeurs',
        equipe: 'Équipe',
        installations: 'Installations',
      };
      return typeMap[id] || 'Section personnalisée';
    };

    return (
      <div className="space-y-2 text-sm text-gray-600">
        <div>
          <strong>Type:</strong> {getSectionType(section.id)}
        </div>
        {section.title && (
          <div>
            <strong>Titre:</strong> {section.title}
          </div>
        )}
        {section.subtitle && (
          <div>
            <strong>Sous-titre:</strong> {section.subtitle}
          </div>
        )}
        {section.content && (
          <div>
            <strong>Contenu:</strong> {section.content.substring(0, 100)}...
          </div>
        )}
        {section.ancienNom && (
          <div>
            <strong>Ancien nom:</strong> {section.ancienNom}
          </div>
        )}
        {section.nouveauNom && (
          <div>
            <strong>Nouveau nom:</strong> {section.nouveauNom}
          </div>
        )}
        {section.raisons && (
          <div>
            <strong>Raisons:</strong> {section.raisons.length} raison(s)
          </div>
        )}
        {section.events && (
          <div>
            <strong>Événements:</strong> {section.events.length} événement(s)
          </div>
        )}
        {section.valeurs && (
          <div>
            <strong>Valeurs:</strong> {section.valeurs.length} valeur(s)
          </div>
        )}
        {section.membres && (
          <div>
            <strong>Membres:</strong> {section.membres.length} membre(s)
          </div>
        )}
        {section.list && (
          <div>
            <strong>Liste:</strong> {section.list.length} élément(s)
          </div>
        )}
        {section.salle && (
          <div>
            <strong>Salle:</strong> Informations installations
          </div>
        )}
        {section.citation && (
          <div>
            <strong>Citation:</strong> {section.citation.text?.substring(0, 50)}
            ...
          </div>
        )}
      </div>
    );
  };

  const renderFieldsForSection = (sectionId: string) => {
    const commonFields = (
      <>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>ID de la section</Label>
            <Input
              value={editingSection.id || ''}
              onChange={(e) =>
                setEditingSection((prev: any) => ({
                  ...prev,
                  id: e.target.value,
                }))
              }
              disabled={aboutData.some((s) => s.id === editingSection.id)}
            />
          </div>
          <div>
            <Label>Titre</Label>
            <Input
              value={editingSection.title || ''}
              onChange={(e) =>
                setEditingSection((prev: any) => ({
                  ...prev,
                  title: e.target.value,
                }))
              }
            />
          </div>
        </div>

        <div>
          <Label>Sous-titre</Label>
          <Input
            value={editingSection.subtitle || ''}
            onChange={(e) =>
              setEditingSection((prev: any) => ({
                ...prev,
                subtitle: e.target.value,
              }))
            }
          />
        </div>

        <div>
          <Label>Contenu</Label>
          <Textarea
            value={editingSection.content || ''}
            onChange={(e) =>
              setEditingSection((prev: any) => ({
                ...prev,
                content: e.target.value,
              }))
            }
            rows={3}
          />
        </div>
      </>
    );

    switch (sectionId) {
      case 'evolution2025':
        return (
          <>
            {commonFields}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Ancien nom</Label>
                <Input
                  value={editingSection.ancienNom || ''}
                  onChange={(e) =>
                    setEditingSection((prev: any) => ({
                      ...prev,
                      ancienNom: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label>Nouveau nom</Label>
                <Input
                  value={editingSection.nouveauNom || ''}
                  onChange={(e) =>
                    setEditingSection((prev: any) => ({
                      ...prev,
                      nouveauNom: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            {/* Section Raisons */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-lg font-semibold">
                  Raisons du changement
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addArrayItem('raisons', 'object')}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Ajouter une raison
                </Button>
              </div>
              {editingSection.raisons?.map((raison: any, index: number) => (
                <Card key={index} className="mb-3">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-medium">Raison {index + 1}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeArrayItem('raisons', index)}
                        className="text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label>Titre</Label>
                        <Input
                          value={raison.title || ''}
                          onChange={(e) =>
                            updateArrayItem('raisons', index, {
                              ...raison,
                              title: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={raison.text || ''}
                          onChange={(e) =>
                            updateArrayItem('raisons', index, {
                              ...raison,
                              text: e.target.value,
                            })
                          }
                          rows={2}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        );

      case 'histoire':
        return (
          <>
            {commonFields}
            {/* Section Événements */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-lg font-semibold">
                  Événements historiques
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addArrayItem('events', 'object')}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Ajouter un événement
                </Button>
              </div>
              {editingSection.events?.map((event: any, index: number) => (
                <Card key={index} className="mb-3">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-medium">Événement {index + 1}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeArrayItem('events', index)}
                        className="text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Titre</Label>
                        <Input
                          value={event.title || ''}
                          onChange={(e) =>
                            updateArrayItem('events', index, {
                              ...event,
                              title: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label>Icône</Label>
                        <Select
                          value={event.icon || 'Calendar'}
                          onValueChange={(value) =>
                            updateArrayItem('events', index, {
                              ...event,
                              icon: value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ICON_OPTIONS.map((option) => {
                              const IconComponent = option.icon;
                              return (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  <div className="flex items-center gap-2">
                                    <IconComponent className="w-4 h-4" />
                                    {option.label}
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="mt-3">
                      <Label>Description</Label>
                      <Textarea
                        value={event.text || ''}
                        onChange={(e) =>
                          updateArrayItem('events', index, {
                            ...event,
                            text: e.target.value,
                          })
                        }
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        );

      case 'ambiance':
        return (
          <>
            {commonFields}
            {/* Section Valeurs pour ambiance */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-lg font-semibold">
                  Valeurs de l'ambiance
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addArrayItem('valeurs', 'object')}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Ajouter une valeur
                </Button>
              </div>
              {editingSection.valeurs?.map((valeur: any, index: number) => (
                <Card key={index} className="mb-3">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-medium">Valeur {index + 1}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeArrayItem('valeurs', index)}
                        className="text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Titre</Label>
                        <Input
                          value={valeur.title || ''}
                          onChange={(e) =>
                            updateArrayItem('valeurs', index, {
                              ...valeur,
                              title: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label>Icône</Label>
                        <Select
                          value={valeur.icon || 'Heart'}
                          onValueChange={(value) =>
                            updateArrayItem('valeurs', index, {
                              ...valeur,
                              icon: value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ICON_OPTIONS.map((option) => {
                              const IconComponent = option.icon;
                              return (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  <div className="flex items-center gap-2">
                                    <IconComponent className="w-4 h-4" />
                                    {option.label}
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="mt-3">
                      <Label>Description</Label>
                      <Textarea
                        value={valeur.text || ''}
                        onChange={(e) =>
                          updateArrayItem('valeurs', index, {
                            ...valeur,
                            text: e.target.value,
                          })
                        }
                        rows={2}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Citation */}
            <div>
              <Label className="text-lg font-semibold">Citation</Label>
              <div className="space-y-3 mt-3">
                <div>
                  <Label>Texte de la citation</Label>
                  <Textarea
                    value={editingSection.citation?.text || ''}
                    onChange={(e) =>
                      setEditingSection((prev: any) => ({
                        ...prev,
                        citation: { ...prev.citation, text: e.target.value },
                      }))
                    }
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Auteur</Label>
                  <Input
                    value={editingSection.citation?.author || ''}
                    onChange={(e) =>
                      setEditingSection((prev: any) => ({
                        ...prev,
                        citation: { ...prev.citation, author: e.target.value },
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            {/* Moments forts */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-lg font-semibold">Moments forts</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addArrayItem('momentsForts', 'string')}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Ajouter un moment
                </Button>
              </div>
              {editingSection.momentsForts?.map(
                (moment: string, index: number) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <Input
                      value={moment}
                      onChange={(e) =>
                        updateArrayItem('momentsForts', index, e.target.value)
                      }
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeArrayItem('momentsForts', index)}
                      className="text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )
              )}
            </div>

            {/* Ce qui nous rend uniques */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-lg font-semibold">
                  Ce qui nous rend uniques
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addArrayItem('uniques', 'string')}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Ajouter un élément
                </Button>
              </div>
              {editingSection.uniques?.map((unique: string, index: number) => (
                <div key={index} className="flex gap-2 mb-2">
                  <Input
                    value={unique}
                    onChange={(e) =>
                      updateArrayItem('uniques', index, e.target.value)
                    }
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeArrayItem('uniques', index)}
                    className="text-destructive"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </>
        );

      case 'valeurs':
        return (
          <>
            {commonFields}
            {/* Section Liste des valeurs */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-lg font-semibold">
                  Liste des valeurs
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addArrayItem('list', 'object')}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Ajouter une valeur
                </Button>
              </div>
              {editingSection.list?.map((valeur: any, index: number) => (
                <Card key={index} className="mb-3">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-medium">Valeur {index + 1}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeArrayItem('list', index)}
                        className="text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Titre</Label>
                        <Input
                          value={valeur.title || ''}
                          onChange={(e) =>
                            updateArrayItem('list', index, {
                              ...valeur,
                              title: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label>Icône</Label>
                        <Select
                          value={valeur.icon || 'Heart'}
                          onValueChange={(value) =>
                            updateArrayItem('list', index, {
                              ...valeur,
                              icon: value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ICON_OPTIONS.map((option) => {
                              const IconComponent = option.icon;
                              return (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  <div className="flex items-center gap-2">
                                    <IconComponent className="w-4 h-4" />
                                    {option.label}
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="mt-3">
                      <Label>Description</Label>
                      <Textarea
                        value={valeur.text || ''}
                        onChange={(e) =>
                          updateArrayItem('list', index, {
                            ...valeur,
                            text: e.target.value,
                          })
                        }
                        rows={2}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        );

      case 'equipe':
        return (
          <>
            {commonFields}
            {/* Section Membres de l'équipe */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-lg font-semibold">
                  Membres de l'équipe
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addArrayItem('membres', 'object')}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Ajouter un membre
                </Button>
              </div>
              {editingSection.membres?.map((membre: any, index: number) => (
                <Card key={index} className="mb-3">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-medium">Membre {index + 1}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeArrayItem('membres', index)}
                        className="text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Titre/Rôle</Label>
                        <Input
                          value={membre.title || ''}
                          onChange={(e) =>
                            updateArrayItem('membres', index, {
                              ...membre,
                              title: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label>Icône</Label>
                        <Select
                          value={membre.icon || 'Users'}
                          onValueChange={(value) =>
                            updateArrayItem('membres', index, {
                              ...membre,
                              icon: value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ICON_OPTIONS.map((option) => {
                              const IconComponent = option.icon;
                              return (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  <div className="flex items-center gap-2">
                                    <IconComponent className="w-4 h-4" />
                                    {option.label}
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-3 mt-3">
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={membre.text || ''}
                          onChange={(e) =>
                            updateArrayItem('membres', index, {
                              ...membre,
                              text: e.target.value,
                            })
                          }
                          rows={2}
                        />
                      </div>
                      <div>
                        <Label>Note (nom de la personne)</Label>
                        <Input
                          value={membre.note || ''}
                          onChange={(e) =>
                            updateArrayItem('membres', index, {
                              ...membre,
                              note: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        );

      case 'installations':
        return (
          <>
            {commonFields}
            {/* Section Salle */}
            <div>
              <Label className="text-lg font-semibold">
                Informations sur la salle
              </Label>
              <div className="space-y-3 mt-3">
                <div>
                  <Label>Titre de la salle</Label>
                  <Input
                    value={editingSection.salle?.title || ''}
                    onChange={(e) =>
                      setEditingSection((prev: any) => ({
                        ...prev,
                        salle: { ...prev.salle, title: e.target.value },
                      }))
                    }
                  />
                </div>
                <div>
                  <Label>Citation</Label>
                  <Textarea
                    value={editingSection.salle?.citation || ''}
                    onChange={(e) =>
                      setEditingSection((prev: any) => ({
                        ...prev,
                        salle: { ...prev.salle, citation: e.target.value },
                      }))
                    }
                    rows={2}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label>Éléments de la salle</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const currentItems = editingSection.salle?.items || [];
                        setEditingSection((prev: any) => ({
                          ...prev,
                          salle: {
                            ...prev.salle,
                            items: [...currentItems, ''],
                          },
                        }));
                      }}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Ajouter un élément
                    </Button>
                  </div>
                  {editingSection.salle?.items?.map(
                    (item: string, index: number) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <Input
                          value={item}
                          onChange={(e) => {
                            const updatedItems = [
                              ...(editingSection.salle?.items || []),
                            ];
                            updatedItems[index] = e.target.value;
                            setEditingSection((prev: any) => ({
                              ...prev,
                              salle: { ...prev.salle, items: updatedItems },
                            }));
                          }}
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const updatedItems =
                              editingSection.salle?.items?.filter(
                                (_: any, i: number) => i !== index
                              ) || [];
                            setEditingSection((prev: any) => ({
                              ...prev,
                              salle: { ...prev.salle, items: updatedItems },
                            }));
                          }}
                          className="text-destructive"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </>
        );

      default:
        return commonFields;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="animate-spin w-8 h-8 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Gestion de la section "À propos"
          </h1>
          <p className="text-muted-foreground">
            Modifiez les informations et statistiques du club
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="min-w-[120px]"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Enregistrement...' : 'Sauvegarder'}
        </Button>
      </div>

      {/* Section Statistiques */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Statistiques du Club
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Membres Actifs
              </Label>
              <Input
                value={statsData?.membresActif || ''}
                onChange={(e) =>
                  setStatsData((prev: any) => ({
                    ...prev,
                    membresActif: e.target.value,
                  }))
                }
                placeholder="50+"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Table className="w-4 h-4" />
                Tables Disponibles
              </Label>
              <Input
                value={statsData?.tablesDispo || ''}
                onChange={(e) =>
                  setStatsData((prev: any) => ({
                    ...prev,
                    tablesDispo: e.target.value,
                  }))
                }
                placeholder="8"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                Nombre d'Équipes
              </Label>
              <Input
                value={statsData?.nbrEquipes || ''}
                onChange={(e) =>
                  setStatsData((prev: any) => ({
                    ...prev,
                    nbrEquipes: e.target.value,
                  }))
                }
                placeholder="13"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Ancienneté (années)
              </Label>
              <Input
                value={statsData?.anciennete || ''}
                onChange={(e) =>
                  setStatsData((prev: any) => ({
                    ...prev,
                    anciennete: e.target.value,
                  }))
                }
                placeholder="10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Sections About */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Sections de contenu</h2>
          <Button onClick={addNewSection} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Ajouter une section
          </Button>
        </div>

        {aboutData.map((section) => (
          <Card key={section.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg">{section.id}</CardTitle>
                  {renderSectionPreview(section)}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSectionEdit(section)}
                  >
                    <Edit size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSection(section.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash size={16} />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Modal d'édition */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSection?.id
                ? `Éditer ${editingSection.id}`
                : 'Nouvelle section'}
            </DialogTitle>
          </DialogHeader>

          {editingSection && (
            <div className="space-y-6">
              {renderFieldsForSection(editingSection.id)}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSectionSave}>Sauvegarder la section</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
