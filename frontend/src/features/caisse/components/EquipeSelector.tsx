/* eslint-disable */
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Users, Plus, Edit, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { CompteEquipe } from '@/services/type';
import {
  fetchComptesEquipe,
  createCompteEquipe,
  updateCompteEquipe,
  deleteCompteEquipe,
} from '@/services/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface EquipeSelectorProps {
  onSelect: (equipe: CompteEquipe) => void;
  onClose: () => void;
}

export default function EquipeSelector({
  onSelect,
  onClose,
}: EquipeSelectorProps) {
  const [equipes, setEquipes] = useState<CompteEquipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingEquipe, setEditingEquipe] = useState<CompteEquipe | null>(null);
  const [formData, setFormData] = useState({
    nom: '',
    type: 'equipe' as 'equipe' | 'club_general',
    equipeLabel: '',
    description: '',
  });

  useEffect(() => {
    loadEquipes();
  }, []);

  const loadEquipes = async () => {
    try {
      setLoading(true);
      const data = await fetchComptesEquipe();
      setEquipes(data);
    } catch (err) {
      console.error('Erreur chargement équipes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingEquipe(null);
    setFormData({
      nom: '',
      type: 'equipe',
      equipeLabel: '',
      description: '',
    });
    setShowCreateDialog(true);
  };

  const handleEdit = (equipe: CompteEquipe) => {
    setEditingEquipe(equipe);
    setFormData({
      nom: equipe.nom,
      type: equipe.type,
      equipeLabel: equipe.equipeLabel || '',
      description: equipe.description || '',
    });
    setShowCreateDialog(true);
  };

  const handleSave = async () => {
    try {
      if (editingEquipe) {
        await updateCompteEquipe(editingEquipe.id, {
          ...editingEquipe,
          ...formData,
        });
      } else {
        await createCompteEquipe(formData);
      }
      await loadEquipes();
      setShowCreateDialog(false);
    } catch (err) {
      console.error('Erreur sauvegarde équipe:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Supprimer cette équipe ?')) {
      try {
        await deleteCompteEquipe(id);
        await loadEquipes();
      } catch (err) {
        console.error('Erreur suppression équipe:', err);
      }
    }
  };

  const handleSelect = (equipe: CompteEquipe) => {
    onSelect(equipe);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <div className="bg-[#3A3A3A] rounded-2xl w-full max-w-lg mx-4 p-6 shadow-2xl max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white text-lg font-bold">Sélectionner une équipe</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-32 text-gray-400">
              Chargement...
            </div>
          ) : (
            <>
              <ScrollArea className="max-h-96">
                <div className="space-y-2 pr-3">
                  {equipes.map((equipe) => (
                    <div
                      key={equipe.id}
                      className="flex items-center gap-3 bg-[#4A4A4A] rounded-lg p-3 hover:bg-[#555] transition-colors"
                    >
                      <button
                        onClick={() => handleSelect(equipe)}
                        className="flex-1 flex items-center gap-3 text-left"
                      >
                        <Users className="w-5 h-5 text-orange-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">
                            {equipe.nom}
                          </p>
                          {equipe.description && (
                            <p className="text-gray-400 text-xs truncate">
                              {equipe.description}
                            </p>
                          )}
                        </div>
                        {equipe.equipeLabel && (
                          <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded-md text-xs font-bold">
                            {equipe.equipeLabel}
                          </span>
                        )}
                      </button>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(equipe)}
                          className="h-8 w-8 text-gray-400 hover:text-blue-400"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(equipe.id)}
                          className="h-8 w-8 text-gray-400 hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {equipes.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                      <Users className="w-8 h-8 mb-2 opacity-30" />
                      <span className="text-sm">Aucune équipe créée</span>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="mt-4 pt-4 border-t border-[#4A4A4A]">
                <Button
                  onClick={handleCreate}
                  className="w-full h-11 bg-orange-500 hover:bg-orange-600 text-white rounded-xl"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Créer une nouvelle équipe
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Dialog de création/édition */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-[#3A3A3A] text-white border-[#4A4A4A]">
          <DialogHeader>
            <DialogTitle>
              {editingEquipe ? 'Modifier l\'équipe' : 'Créer une équipe'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="nom">Nom de l'équipe</Label>
              <Input
                id="nom"
                value={formData.nom}
                onChange={(e) =>
                  setFormData({ ...formData, nom: e.target.value })
                }
                placeholder="Ex: Équipe A"
                className="bg-[#4A4A4A] border-none text-white"
              />
            </div>
            <div>
              <Label htmlFor="equipeLabel">Label (lettre)</Label>
              <Input
                id="equipeLabel"
                value={formData.equipeLabel}
                onChange={(e) =>
                  setFormData({ ...formData, equipeLabel: e.target.value })
                }
                placeholder="Ex: A"
                maxLength={3}
                className="bg-[#4A4A4A] border-none text-white"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Ex: Tournées après matchs équipe A"
                className="bg-[#4A4A4A] border-none text-white"
              />
            </div>
            <div>
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    type: e.target.value as 'equipe' | 'club_general',
                  })
                }
                className="w-full h-10 px-3 bg-[#4A4A4A] border-none text-white rounded-md"
              >
                <option value="equipe">Équipe de compétition</option>
                <option value="club_general">Compte club général</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowCreateDialog(false)}
              className="bg-[#4A4A4A] text-gray-300 hover:bg-[#555]"
            >
              Annuler
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formData.nom}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {editingEquipe ? 'Mettre à jour' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

