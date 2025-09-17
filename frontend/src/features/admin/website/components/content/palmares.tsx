/* eslint-disable */
import { useEffect, useState } from 'react';
import { Loader2, Save, Plus, Trash, Trophy, Edit, X } from 'lucide-react';
import { fetchInformations, updateInformations } from '@/services/api';
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
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const NIVEAU_OPTIONS = [
  {
    value: 'International',
    label: 'International',
    color: 'bg-gradient-to-r from-yellow-400 to-yellow-600',
  },
  {
    value: 'National',
    label: 'National',
    color: 'bg-gradient-to-r from-blue-500 to-blue-700',
  },
  {
    value: 'Régional',
    label: 'Régional',
    color: 'bg-gradient-to-r from-green-500 to-green-700',
  },
  {
    value: 'Provincial',
    label: 'Provincial',
    color: 'bg-gradient-to-r from-purple-500 to-purple-700',
  },
];

const CATEGORIE_OPTIONS = [
  { value: 'Équipe Senior', label: 'Équipe Senior' },
  { value: 'Équipe Réserve', label: 'Équipe Réserve' },
  { value: 'Senior', label: 'Senior' },
  { value: 'Dame', label: 'Dame' },
  { value: 'Jeune', label: 'Jeune' },
  { value: 'Vétéran', label: 'Vétéran' },
  { value: 'Club', label: 'Club' },
];

export default function PalmaresManager() {
  const [palmaresData, setPalmaresData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string>('');
  const [editingData, setEditingData] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<
    'stats' | 'clubAchievements' | 'individualAchievements' | 'objectifs'
  >('stats');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const infos = await fetchInformations();
      const current = infos[0];
      setPalmaresData(
        current.palmares || {
          stats: [],
          clubAchievements: [],
          individualAchievements: [],
          objectifs: [],
          objectifGlobal: '',
        }
      );
    } catch (error) {
      console.error('Erreur chargement palmarès:', error);
    }
    setLoading(false);
  };

  const handleEdit = (category: string) => {
    setEditingCategory(category);
    setEditingData(JSON.parse(JSON.stringify(palmaresData[category] || [])));
    setModalType(category as any);
    setIsModalOpen(true);
  };

  const handleSaveModal = () => {
    setPalmaresData((prev: any) => ({
      ...prev,
      [editingCategory]: editingData,
    }));
    setIsModalOpen(false);
    setEditingCategory('');
    setEditingData(null);
  };

  const addItem = (type: string) => {
    const newItem = getNewItemTemplate(type);
    setEditingData((prev: any) => [...prev, newItem]);
  };

  const getNewItemTemplate = (type: string) => {
    switch (type) {
      case 'stats':
        return { value: '', label: '', sublabel: '' };
      case 'clubAchievements':
        return {
          annee: '',
          titre: '',
          categorie: 'Équipe Senior',
          niveau: 'Régional',
          description: '',
        };
      case 'individualAchievements':
        return { nom: '', titres: [''], categorie: 'Senior' };
      case 'objectifs':
        return { titre: '', description: '' };
      default:
        return {};
    }
  };

  const removeItem = (index: number) => {
    setEditingData((prev: any) =>
      prev.filter((_: any, i: number) => i !== index)
    );
  };

  const updateItem = (index: number, field: string, value: any) => {
    setEditingData((prev: any) =>
      prev.map((item: any, i: number) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  };

  const addTitre = (achievementIndex: number) => {
    setEditingData((prev: any) =>
      prev.map((item: any, i: number) =>
        i === achievementIndex
          ? { ...item, titres: [...item.titres, ''] }
          : item
      )
    );
  };

  const removeTitre = (achievementIndex: number, titreIndex: number) => {
    setEditingData((prev: any) =>
      prev.map((item: any, i: number) =>
        i === achievementIndex
          ? {
            ...item,
            titres: item.titres.filter(
              (_: any, j: number) => j !== titreIndex
            ),
          }
          : item
      )
    );
  };

  const updateTitre = (
    achievementIndex: number,
    titreIndex: number,
    value: string
  ) => {
    setEditingData((prev: any) =>
      prev.map((item: any, i: number) =>
        i === achievementIndex
          ? {
              ...item,
              titres: item.titres.map((titre: string, j: number) =>
                j === titreIndex ? value : titre
              ),
            }
          : item
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const allInfos = await fetchInformations();
      const current = allInfos[0];
      const updatedData = {
        ...current,
        palmares: palmaresData,
      };
      await updateInformations(current.id, updatedData);
      alert('🏆 Le palmarès a été sauvegardé avec succès !');
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      alert('❌ Erreur lors de la sauvegarde du palmarès. Veuillez réessayer.');
    }
    setSaving(false);
  };

  const renderCategoryCard = (
    key: string,
    title: string,
    description: string,
    data: any[]
  ) => (
    <Card key={key}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
          <div>
            <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
            <CardDescription className="text-sm">{description}</CardDescription>
            <div className="text-xs sm:text-sm text-gray-500 mt-2">
              {Array.isArray(data)
                ? `${data.length} élément(s)`
                : 'Non configuré'}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => handleEdit(key)} className="text-xs sm:text-sm">
            <Edit size={16} className="mr-1" />
            <span className="hidden sm:inline">Éditer</span>
            <span className="sm:hidden">Edit</span>
          </Button>
        </div>
      </CardHeader>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6 sm:p-8">
        <Loader2 className="animate-spin w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold flex items-center gap-2">
            <Trophy className="w-6 h-6 sm:w-8 sm:h-8" />
            <span className="hidden sm:inline">Gestion du Palmarès</span>
            <span className="sm:hidden">Palmarès</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            <span className="hidden sm:inline">Gérez les récompenses et distinctions du club</span>
            <span className="sm:hidden">Récompenses du club</span>
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="min-w-[100px] sm:min-w-[120px] text-sm"
        >
          <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
          {saving ? (
            <span className="hidden sm:inline">Enregistrement...</span>
          ) : (
            <span className="hidden sm:inline">Sauvegarder</span>
          )}
          <span className="sm:hidden">{saving ? 'Save...' : 'Save'}</span>
        </Button>
      </div>

      {/* Objectif Global */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Objectif Global</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={palmaresData?.objectifGlobal || ''}
            onChange={(e) =>
              setPalmaresData((prev: any) => ({
                ...prev,
                objectifGlobal: e.target.value,
              }))
            }
            placeholder="Objectif principal du club..."
            rows={3}
            className="text-sm"
          />
        </CardContent>
      </Card>

      {/* Sections du palmarès */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {renderCategoryCard(
          'stats',
          'Statistiques',
          'Les chiffres clés du club',
          palmaresData?.stats || []
        )}

        {renderCategoryCard(
          'clubAchievements',
          'Réalisations du Club',
          'Les succès collectifs de nos équipes',
          palmaresData?.clubAchievements || []
        )}

        {renderCategoryCard(
          'individualAchievements',
          'Performances Individuelles',
          'Les champions et leurs titres',
          palmaresData?.individualAchievements || []
        )}

        {renderCategoryCard(
          'objectifs',
          'Objectifs Futurs',
          "Nos ambitions pour l'avenir",
          palmaresData?.objectifs || []
        )}
      </div>

      {/* Modal d'édition */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              Éditer{' '}
              {editingCategory === 'stats'
                ? 'Statistiques'
                : editingCategory === 'clubAchievements'
                  ? 'Réalisations du Club'
                  : editingCategory === 'individualAchievements'
                    ? 'Performances Individuelles'
                    : 'Objectifs Futurs'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-base sm:text-lg font-semibold">
                {Array.isArray(editingData)
                  ? `${editingData.length} élément(s)`
                  : '0 élément'}
              </h3>
              <Button
                onClick={() => addItem(editingCategory)}
                variant="outline"
                className="text-xs sm:text-sm"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Ajouter</span>
                <span className="sm:hidden">+</span>
              </Button>
            </div>

            {editingData?.map((item: any, index: number) => (
              <Card key={index}>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-4">
                    <h4 className="font-medium text-sm sm:text-base">Élément {index + 1}</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(index)}
                      className="text-destructive text-xs sm:text-sm"
                    >
                      <Trash size={14} className="mr-1" />
                      <span className="hidden sm:inline">Suppr.</span>
                    </Button>
                  </div>

                  {modalType === 'stats' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs sm:text-sm">Valeur</Label>
                        <Input
                          value={item.value || ''}
                          onChange={(e) =>
                            updateItem(index, 'value', e.target.value)
                          }
                          placeholder="50+"
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs sm:text-sm">Label</Label>
                        <Input
                          value={item.label || ''}
                          onChange={(e) =>
                            updateItem(index, 'label', e.target.value)
                          }
                          placeholder="Membres actifs"
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs sm:text-sm">Sous-label</Label>
                        <Input
                          value={item.sublabel || ''}
                          onChange={(e) =>
                            updateItem(index, 'sublabel', e.target.value)
                          }
                          placeholder="De tous âges"
                          className="text-sm"
                        />
                      </div>
                    </div>
                  )}

                  {modalType === 'clubAchievements' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs sm:text-sm">Année</Label>
                          <Input
                            value={item.annee || ''}
                            onChange={(e) =>
                              updateItem(index, 'annee', e.target.value)
                            }
                            placeholder="2023"
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs sm:text-sm">Titre</Label>
                          <Input
                            value={item.titre || ''}
                            onChange={(e) =>
                              updateItem(index, 'titre', e.target.value)
                            }
                            placeholder="Champion provincial"
                            className="text-sm"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs sm:text-sm">Catégorie</Label>
                          <Select
                            value={item.categorie || 'Équipe Senior'}
                            onValueChange={(value) =>
                              updateItem(index, 'categorie', value)
                            }
                          >
                            <SelectTrigger className="text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CATEGORIE_OPTIONS.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs sm:text-sm">Niveau</Label>
                          <Select
                            value={item.niveau || 'Régional'}
                            onValueChange={(value) =>
                              updateItem(index, 'niveau', value)
                            }
                          >
                            <SelectTrigger className="text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {NIVEAU_OPTIONS.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs sm:text-sm">Description</Label>
                        <Textarea
                          value={item.description || ''}
                          onChange={(e) =>
                            updateItem(index, 'description', e.target.value)
                          }
                          placeholder="Description de la réalisation..."
                          rows={2}
                          className="text-sm"
                        />
                      </div>
                    </div>
                  )}

                  {modalType === 'individualAchievements' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs sm:text-sm">Nom du joueur</Label>
                          <Input
                            value={item.nom || ''}
                            onChange={(e) =>
                              updateItem(index, 'nom', e.target.value)
                            }
                            placeholder="Jean Dupont"
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs sm:text-sm">Catégorie</Label>
                          <Select
                            value={item.categorie || 'Senior'}
                            onValueChange={(value) =>
                              updateItem(index, 'categorie', value)
                            }
                          >
                            <SelectTrigger className="text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CATEGORIE_OPTIONS.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                          <Label className="text-xs sm:text-sm">Titres</Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addTitre(index)}
                            className="text-xs"
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            <span className="hidden sm:inline">Titre</span>
                            <span className="sm:hidden">+</span>
                          </Button>
                        </div>
                        {item.titres?.map(
                          (titre: string, titreIndex: number) => (
                            <div key={titreIndex} className="flex gap-2 mb-2">
                              <Input
                                value={titre}
                                onChange={(e) =>
                                  updateTitre(index, titreIndex, e.target.value)
                                }
                                placeholder="Champion provincial 2023"
                                className="flex-1 text-sm"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeTitre(index, titreIndex)}
                                className="text-destructive"
                              >
                                <X className="w-3 h-3 sm:w-4 sm:h-4" />
                              </Button>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {modalType === 'objectifs' && (
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs sm:text-sm">Titre</Label>
                        <Input
                          value={item.titre || ''}
                          onChange={(e) =>
                            updateItem(index, 'titre', e.target.value)
                          }
                          placeholder="Montée en division supérieure"
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs sm:text-sm">Description</Label>
                        <Textarea
                          value={item.description || ''}
                          onChange={(e) =>
                            updateItem(index, 'description', e.target.value)
                          }
                          placeholder="Description de l'objectif..."
                          rows={3}
                          className="text-sm"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto text-sm">
              Annuler
            </Button>
            <Button onClick={handleSaveModal} className="w-full sm:w-auto text-sm">
              Sauvegarder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
