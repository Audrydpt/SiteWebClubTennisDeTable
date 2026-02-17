/* eslint-disable */

import { useState, useMemo } from 'react';
import {
  Minus,
  Plus,
  PlusCircle,
  Pencil,
  Trash2,
  Tag,
  ChevronLeft,
  Save,
  GripVertical,
  LayoutGrid,
  List,
  ArrowUpDown,
  Package,
} from 'lucide-react';
import type {
  Plat,
  CategorieCaisse,
  SousProduitRecette,
} from '@/services/type';

// Nom exact de la catégorie qui utilise la logique "recette" (ingrédients liés)
const PLATS_CATEGORY_NAME = 'Plats';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  updatePlatStock,
  createPlat,
  updatePlat,
  deletePlat,
  createCategorieCaisse,
  deleteCategorieCaisse,
  updateCategorieCaisse,
  reorderCategoriesCaisse,
} from '@/services/api';
import { ReactSortable } from 'react-sortablejs';
import ImagePickerCaisse from './ImagePickerCaisse';
import AjoutStockMasse from './AjoutStockMasse';

type StockView = 'articles' | 'categories' | 'addArticle' | 'editArticle';

/** Sélecteur d'ingrédients pour les plats composés */
function RecetteEditor({
  recette,
  onChange,
  ingredients, // plats disponibles comme ingrédients (hors catégorie Plats)
}: {
  recette: SousProduitRecette[];
  onChange: (r: SousProduitRecette[]) => void;
  ingredients: Plat[];
}) {
  // Normaliser tous les IDs en string pour éviter les mismatches number/string (json-server)
  const normalize = (id: string | number) => String(id);

  const availableToAdd = ingredients.filter(
    (p) => !recette.some((r) => normalize(r.platId) === normalize(p.id))
  );

  const addIngredient = (platId: string) => {
    onChange([...recette, { platId: normalize(platId), quantite: 1 }]);
  };

  const updateQty = (platId: string, quantite: number) => {
    onChange(
      recette.map((r) =>
        normalize(r.platId) === normalize(platId) ? { ...r, quantite } : r
      )
    );
  };

  const removeIngredient = (platId: string) => {
    onChange(recette.filter((r) => normalize(r.platId) !== normalize(platId)));
  };

  return (
    <div className="bg-[#2C2C2C] rounded-xl p-3 space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <Package className="w-4 h-4 text-[#F1C40F]" />
        <p className="text-[#F1C40F] text-sm font-bold">
          Recette (ingrédients prélevés à la vente)
        </p>
      </div>

      {recette.length === 0 && (
        <p className="text-gray-500 text-xs italic">
          Aucun ingrédient — ajoutez-en ci-dessous.
        </p>
      )}

      {recette.map((ligne) => {
        const plat = ingredients.find(
          (p) => normalize(p.id) === normalize(ligne.platId)
        );
        return (
          <div
            key={ligne.platId}
            className="flex items-center gap-2 bg-[#3A3A3A] rounded-lg px-3 py-1.5"
          >
            <span className="text-white text-sm flex-1 truncate">
              {plat?.nom ?? (
                <span className="text-red-400 italic">
                  Produit introuvable ({ligne.platId})
                </span>
              )}
              {plat?.stock !== undefined && (
                <span className="text-gray-500 text-xs ml-2">
                  (stock: {plat.stock})
                </span>
              )}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  updateQty(ligne.platId, Math.max(1, ligne.quantite - 1))
                }
                className="h-6 w-6 bg-[#4A4A4A] hover:bg-[#555] text-white rounded flex items-center justify-center"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="w-8 text-center text-white text-sm font-bold tabular-nums">
                {ligne.quantite}
              </span>
              <button
                type="button"
                onClick={() => updateQty(ligne.platId, ligne.quantite + 1)}
                className="h-6 w-6 bg-[#4A4A4A] hover:bg-[#555] text-white rounded flex items-center justify-center"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => removeIngredient(ligne.platId)}
              className="text-gray-500 hover:text-red-400 ml-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}

      {availableToAdd.length > 0 && (
        <select
          value=""
          onChange={(e) => {
            if (e.target.value) addIngredient(e.target.value);
          }}
          className="h-9 w-full px-3 bg-[#3A3A3A] text-gray-400 rounded-lg border-none text-sm"
        >
          <option value="">+ Ajouter un ingrédient…</option>
          {availableToAdd.map((p) => (
            <option key={p.id} value={String(p.id)}>
              {p.nom} {p.stock !== undefined ? `(stock: ${p.stock})` : ''}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

interface StockPanelProps {
  plats: Plat[];
  categories: CategorieCaisse[];
  onDataUpdated: () => void;
}

export default function StockPanel({
  plats,
  categories,
  onDataUpdated,
}: StockPanelProps) {
  const [view, setView] = useState<StockView>('articles');
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [editStockValue, setEditStockValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [showAjoutMasse, setShowAjoutMasse] = useState(false);

  // New article form
  const [newArticle, setNewArticle] = useState({
    nom: '',
    prix: '',
    categorie: '',
    stock: '',
    imageUrl: '',
    description: '',
  });

  // Edit article
  const [editArticle, setEditArticle] = useState<Plat | null>(null);

  // Recette (sous-produits liés) pour la catégorie Plats
  const [newRecette, setNewRecette] = useState<SousProduitRecette[]>([]);
  const [editRecette, setEditRecette] = useState<SousProduitRecette[]>([]);

  // Category form
  const [newCatName, setNewCatName] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState('');

  // Table view
  const [stockViewMode, setStockViewMode] = useState<'grid' | 'table'>('grid');
  type SortKey = 'nom' | 'categorie' | 'prix' | 'stock' | 'statut';
  const [sortKey, setSortKey] = useState<SortKey>('nom');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const sortedCategories = [...categories].sort((a, b) => a.ordre - b.ordre);

  const sortedPlats = useMemo(() => {
    return [...plats].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'nom':
          cmp = a.nom.localeCompare(b.nom, 'fr');
          break;
        case 'categorie':
          cmp = a.categorie.localeCompare(b.categorie, 'fr');
          break;
        case 'prix':
          cmp = a.prix - b.prix;
          break;
        case 'stock':
          cmp = (a.stock ?? 9999) - (b.stock ?? 9999);
          break;
        case 'statut':
          cmp = (a.disponible ? 1 : 0) - (b.disponible ? 1 : 0);
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [plats, sortKey, sortDir]);

  // Liste filtrée pour le mode grille (exclure les articles indisponibles)
  const sortedPlatsDisponibles = useMemo(() => {
    return sortedPlats.filter((p) => p.disponible !== false);
  }, [sortedPlats]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  // --- Stock quick actions ---
  const handleStockChange = async (platId: string, newStock: number) => {
    setSaving(true);
    try {
      await updatePlatStock(platId, Math.max(0, newStock));
      onDataUpdated();
    } catch (err) {
      console.error('Erreur maj stock:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDirectEdit = async (platId: string) => {
    const val = parseInt(editStockValue);
    if (!isNaN(val) && val >= 0) {
      await handleStockChange(platId, val);
    }
    setEditingStockId(null);
  };

  // --- Add article ---
  const handleAddArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArticle.nom.trim() || !newArticle.prix || !newArticle.categorie)
      return;
    setSaving(true);
    try {
      await createPlat({
        nom: newArticle.nom.trim(),
        prix: parseFloat(newArticle.prix),
        categorie: newArticle.categorie,
        disponible: true,
        stock: newArticle.stock ? parseInt(newArticle.stock) : undefined,
        imageUrl: newArticle.imageUrl || undefined,
        description: newArticle.description || undefined,
        dateCreation: new Date().toISOString(),
        sousProduitsIds:
          newArticle.categorie === PLATS_CATEGORY_NAME && newRecette.length > 0
            ? newRecette
            : undefined,
      });
      setNewArticle({
        nom: '',
        prix: '',
        categorie: '',
        stock: '',
        imageUrl: '',
        description: '',
      });
      setNewRecette([]);
      setView('articles');
      onDataUpdated();
    } catch (err) {
      console.error('Erreur ajout article:', err);
    } finally {
      setSaving(false);
    }
  };

  // --- Edit article ---
  const handleEditArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editArticle) return;
    setSaving(true);
    try {
      const updatedPlat: Plat = {
        ...editArticle,
        sousProduitsIds:
          editArticle.categorie === PLATS_CATEGORY_NAME &&
          editRecette.length > 0
            ? editRecette
            : editArticle.categorie === PLATS_CATEGORY_NAME
              ? []
              : undefined,
      };
      await updatePlat(editArticle.id, updatedPlat);
      setEditArticle(null);
      setEditRecette([]);
      setView('articles');
      onDataUpdated();
    } catch (err) {
      console.error('Erreur modif article:', err);
    } finally {
      setSaving(false);
    }
  };

  // --- Delete article ---
  const handleDeleteArticle = async (id: string) => {
    if (!confirm('Supprimer cet article ?')) return;
    setSaving(true);
    try {
      await deletePlat(id);
      onDataUpdated();
    } catch (err) {
      console.error('Erreur suppression article:', err);
    } finally {
      setSaving(false);
    }
  };

  // --- Ajout de stock en masse ---
  const handleAjoutStockMasse = async (
    ajouts: { platId: string; quantite: number }[]
  ) => {
    setSaving(true);
    try {
      console.log('[handleAjoutStockMasse] Début traitement:', ajouts);
      for (const ajout of ajouts) {
        console.log('[handleAjoutStockMasse] Traitement ajout:', ajout);
        const plat = plats.find((p) => String(p.id) === String(ajout.platId));
        console.log('[handleAjoutStockMasse] Plat trouvé:', plat);
        if (plat) {
          const newStock = (plat.stock || 0) + ajout.quantite;
          console.log(
            '[handleAjoutStockMasse] Ancien stock:',
            plat.stock,
            'Nouveau stock:',
            newStock
          );
          await updatePlatStock(ajout.platId, newStock);
        } else {
          console.log(
            '[handleAjoutStockMasse] ❌ Plat non trouvé pour ID:',
            ajout.platId
          );
        }
      }
      setShowAjoutMasse(false);
      onDataUpdated();
      console.log('[handleAjoutStockMasse] ✅ Mise à jour terminée');
    } catch (err) {
      console.error('Erreur ajout stock en masse:', err);
    } finally {
      setSaving(false);
    }
  };

  // --- Categories ---
  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    setSaving(true);
    try {
      await createCategorieCaisse({
        nom: newCatName.trim(),
        ordre: categories.length,
      });
      setNewCatName('');
      onDataUpdated();
    } catch (err) {
      console.error('Erreur ajout categorie:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Supprimer cette categorie ?')) return;
    setSaving(true);
    try {
      await deleteCategorieCaisse(id);
      onDataUpdated();
    } catch (err) {
      console.error('Erreur suppression categorie:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleReorderCategory = async (id: string, direction: -1 | 1) => {
    const idx = sortedCategories.findIndex((c) => c.id === id);
    const swapIdx = idx + direction;
    if (swapIdx < 0 || swapIdx >= sortedCategories.length) return;
    setSaving(true);
    try {
      await updateCategorieCaisse(sortedCategories[idx].id, {
        ordre: sortedCategories[swapIdx].ordre,
      });
      await updateCategorieCaisse(sortedCategories[swapIdx].id, {
        ordre: sortedCategories[idx].ordre,
      });
      onDataUpdated();
    } catch (err) {
      console.error('Erreur reorder:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleRenameCategory = async (id: string) => {
    if (!editCatName.trim()) return;
    setSaving(true);
    try {
      const oldCat = categories.find((c) => c.id === id);
      if (oldCat && oldCat.nom !== editCatName.trim()) {
        await updateCategorieCaisse(id, { nom: editCatName.trim() });
        const platsToUpdate = plats.filter((p) => p.categorie === oldCat.nom);
        for (const p of platsToUpdate) {
          await updatePlat(p.id, { ...p, categorie: editCatName.trim() });
        }
      }
      setEditingCatId(null);
      onDataUpdated();
    } catch (err) {
      console.error('Erreur rename categorie:', err);
    } finally {
      setSaving(false);
    }
  };

  const getCategoryName = (catId: string) =>
    categories.find((c) => c.nom === catId)?.nom || catId;

  // =========== RENDER ===========

  // --- Add Article View ---
  if (view === 'addArticle') {
    return (
      <div className="h-full flex flex-col min-h-0">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setView('articles')}
            className="h-9 w-9 text-gray-400 hover:text-white rounded-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-white text-lg font-bold">Nouvel article</h2>
        </div>
        <form onSubmit={handleAddArticle} className="space-y-3 flex-1">
          <Input
            placeholder="Nom du produit"
            value={newArticle.nom}
            onChange={(e) =>
              setNewArticle({ ...newArticle, nom: e.target.value })
            }
            className="h-12 bg-[#4A4A4A] border-none text-white placeholder:text-gray-500 rounded-xl text-base"
          />
          <Input
            placeholder="Description (optionnel)"
            value={newArticle.description}
            onChange={(e) =>
              setNewArticle({ ...newArticle, description: e.target.value })
            }
            className="h-12 bg-[#4A4A4A] border-none text-white placeholder:text-gray-500 rounded-xl"
          />
          <div className="flex gap-2">
            <Input
              type="number"
              step="0.01"
              placeholder="Prix"
              value={newArticle.prix}
              onChange={(e) =>
                setNewArticle({ ...newArticle, prix: e.target.value })
              }
              className="h-12 bg-[#4A4A4A] border-none text-white placeholder:text-gray-500 rounded-xl flex-1"
            />
            <Input
              type="number"
              placeholder="Stock initial"
              value={newArticle.stock}
              onChange={(e) =>
                setNewArticle({ ...newArticle, stock: e.target.value })
              }
              className="h-12 bg-[#4A4A4A] border-none text-white placeholder:text-gray-500 rounded-xl flex-1"
            />
          </div>
          <select
            value={newArticle.categorie}
            onChange={(e) =>
              setNewArticle({ ...newArticle, categorie: e.target.value })
            }
            className="h-12 w-full px-3 bg-[#4A4A4A] text-white rounded-xl border-none text-sm"
          >
            <option value="">-- Categorie --</option>
            {sortedCategories.map((cat) => (
              <option key={cat.id} value={cat.nom}>
                {cat.nom}
              </option>
            ))}
          </select>
          <div>
            <p className="text-gray-400 text-sm mb-1">Image du produit</p>
            <ImagePickerCaisse
              value={newArticle.imageUrl}
              onChange={(url) =>
                setNewArticle({ ...newArticle, imageUrl: url })
              }
            />
          </div>

          {/* Recette — uniquement pour la catégorie Plats */}
          {newArticle.categorie === PLATS_CATEGORY_NAME && (
            <RecetteEditor
              recette={newRecette}
              onChange={setNewRecette}
              ingredients={plats.filter(
                (p) => p.categorie !== PLATS_CATEGORY_NAME
              )}
            />
          )}

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setView('articles')}
              className="flex-1 h-12 bg-[#4A4A4A] text-gray-400 hover:bg-[#555] rounded-xl"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={
                saving ||
                !newArticle.nom.trim() ||
                !newArticle.prix ||
                !newArticle.categorie
              }
              className="flex-1 h-12 bg-green-600 text-white hover:bg-green-700 rounded-xl disabled:opacity-30"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Ajout...' : 'Ajouter'}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  // --- Edit Article View ---
  if (view === 'editArticle' && editArticle) {
    return (
      <div className="h-full flex flex-col min-h-0">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setView('articles');
              setEditArticle(null);
            }}
            className="h-9 w-9 text-gray-400 hover:text-white rounded-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-white text-lg font-bold">Modifier l'article</h2>
        </div>
        <form onSubmit={handleEditArticle} className="space-y-3 flex-1">
          <Input
            placeholder="Nom"
            value={editArticle.nom}
            onChange={(e) =>
              setEditArticle({ ...editArticle, nom: e.target.value })
            }
            className="h-12 bg-[#4A4A4A] border-none text-white placeholder:text-gray-500 rounded-xl text-base"
          />
          <Input
            placeholder="Description"
            value={editArticle.description || ''}
            onChange={(e) =>
              setEditArticle({ ...editArticle, description: e.target.value })
            }
            className="h-12 bg-[#4A4A4A] border-none text-white placeholder:text-gray-500 rounded-xl"
          />
          <div className="flex gap-2">
            <Input
              type="number"
              step="0.01"
              placeholder="Prix"
              value={editArticle.prix}
              onChange={(e) =>
                setEditArticle({
                  ...editArticle,
                  prix: parseFloat(e.target.value) || 0,
                })
              }
              className="h-12 bg-[#4A4A4A] border-none text-white placeholder:text-gray-500 rounded-xl flex-1"
            />
            <Input
              type="number"
              placeholder="Stock"
              value={editArticle.stock ?? ''}
              onChange={(e) =>
                setEditArticle({
                  ...editArticle,
                  stock: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
              className="h-12 bg-[#4A4A4A] border-none text-white placeholder:text-gray-500 rounded-xl flex-1"
            />
          </div>
          <select
            value={editArticle.categorie}
            onChange={(e) =>
              setEditArticle({ ...editArticle, categorie: e.target.value })
            }
            className="h-12 w-full px-3 bg-[#4A4A4A] text-white rounded-xl border-none text-sm"
          >
            <option value="">-- Categorie --</option>
            {sortedCategories.map((cat) => (
              <option key={cat.id} value={cat.nom}>
                {cat.nom}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-3">
            <label className="text-gray-400 text-sm">Disponible</label>
            <button
              type="button"
              onClick={() =>
                setEditArticle({
                  ...editArticle,
                  disponible: !editArticle.disponible,
                })
              }
              className={`h-8 w-14 rounded-full transition-colors ${editArticle.disponible ? 'bg-green-600' : 'bg-gray-600'}`}
            >
              <div
                className={`w-6 h-6 bg-white rounded-full transition-transform ${editArticle.disponible ? 'translate-x-7' : 'translate-x-1'}`}
              />
            </button>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-1">Image du produit</p>
            <ImagePickerCaisse
              value={editArticle.imageUrl || ''}
              onChange={(url) =>
                setEditArticle({ ...editArticle, imageUrl: url || undefined })
              }
            />
          </div>

          {/* Recette — uniquement pour la catégorie Plats */}
          {editArticle.categorie === PLATS_CATEGORY_NAME && (
            <RecetteEditor
              recette={editRecette}
              onChange={setEditRecette}
              ingredients={plats.filter(
                (p) =>
                  p.categorie !== PLATS_CATEGORY_NAME && p.id !== editArticle.id
              )}
            />
          )}

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setView('articles');
                setEditArticle(null);
                setEditRecette([]);
              }}
              className="flex-1 h-12 bg-[#4A4A4A] text-gray-400 hover:bg-[#555] rounded-xl"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={saving || !editArticle.nom.trim()}
              className="flex-1 h-12 bg-[#F1C40F] text-[#2C2C2C] hover:bg-[#F1C40F]/90 font-bold rounded-xl disabled:opacity-30"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  // --- Categories View ---
  if (view === 'categories') {
    return (
      <div className="h-full flex flex-col min-h-0">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setView('articles')}
            className="h-9 w-9 text-gray-400 hover:text-white rounded-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-white text-lg font-bold">Categories</h2>
        </div>

        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Nouvelle categorie"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            className="h-11 bg-[#4A4A4A] border-none text-white placeholder:text-gray-500 rounded-xl flex-1"
          />
          <Button
            onClick={handleAddCategory}
            disabled={saving || !newCatName.trim()}
            className="h-11 px-4 bg-green-600 text-white hover:bg-green-700 rounded-xl disabled:opacity-30"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Ajouter
          </Button>
        </div>

        <ReactSortable
          list={sortedCategories}
          setList={async (newList) => {
            setSaving(true);
            try {
              const orderedIds = newList.map((cat, index) => ({
                id: cat.id,
                ordre: index,
              }));
              await reorderCategoriesCaisse(orderedIds);
              onDataUpdated();
            } catch (err) {
              console.error('Erreur reorder:', err);
            } finally {
              setSaving(false);
            }
          }}
          handle=".drag-handle"
          animation={200}
          ghostClass="opacity-40"
          forceFallback={true}
          className="flex-1 min-h-0 overflow-hidden"
        >
          <ScrollArea className="h-full">
            <div className="space-y-1 pr-4">
              {sortedCategories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center gap-2 p-3 bg-[#3A3A3A] rounded-xl"
                >
                  <GripVertical className="w-4 h-4 text-gray-500 cursor-grab drag-handle shrink-0" />
                  <Tag className="w-4 h-4 text-[#F1C40F] shrink-0" />
                  {editingCatId === cat.id ? (
                    <div className="flex-1 flex items-center gap-2">
                      <Input
                        value={editCatName}
                        onChange={(e) => setEditCatName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRenameCategory(cat.id);
                          if (e.key === 'Escape') setEditingCatId(null);
                        }}
                        className="h-8 bg-[#4A4A4A] border-none text-white rounded-lg text-sm flex-1"
                        autoFocus
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRenameCategory(cat.id)}
                        disabled={saving}
                        className="h-7 w-7 text-green-400 hover:text-green-300"
                      >
                        <Save className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingCatId(null)}
                        className="h-7 w-7 text-gray-500 hover:text-white"
                      >
                        <span className="text-xs">&times;</span>
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span className="text-white text-sm font-medium flex-1">
                        {cat.nom}
                      </span>
                      <span className="text-gray-500 text-xs">
                        {plats.filter((p) => p.categorie === cat.nom).length}{' '}
                        articles
                      </span>
                    </>
                  )}
                  {editingCatId !== cat.id && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingCatId(cat.id);
                          setEditCatName(cat.nom);
                        }}
                        disabled={saving}
                        className="h-7 w-7 text-gray-500 hover:text-[#F1C40F] disabled:opacity-20"
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteCategory(cat.id)}
                        disabled={saving}
                        className="h-7 w-7 text-gray-500 hover:text-red-400 disabled:opacity-20"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </ReactSortable>
        {sortedCategories.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-8">
            Aucune categorie. Ajoutez-en une !
          </p>
        )}
      </div>
    );
  }

  // --- Articles List View (default) ---
  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white text-lg font-bold">Gestion du stock</h2>
        <div className="flex gap-2">
          <div className="flex gap-1 bg-[#3A3A3A] rounded-lg p-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setStockViewMode('grid')}
              className={`h-7 w-7 rounded ${
                stockViewMode === 'grid'
                  ? 'bg-[#F1C40F] text-[#2C2C2C]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setStockViewMode('table')}
              className={`h-7 w-7 rounded ${
                stockViewMode === 'table'
                  ? 'bg-[#F1C40F] text-[#2C2C2C]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </Button>
          </div>
          <Button
            variant="ghost"
            onClick={() => setView('categories')}
            className="h-9 px-3 bg-[#4A4A4A] text-gray-300 hover:bg-[#555] hover:text-white rounded-lg text-sm"
          >
            <Tag className="w-4 h-4 mr-1" />
            Categories
          </Button>
          <Button
            variant="ghost"
            onClick={() => setShowAjoutMasse(true)}
            className="h-9 px-3 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm"
          >
            <Package className="w-4 h-4 mr-1" />
            Stock en Masse
          </Button>
          <Button
            variant="ghost"
            onClick={() => setView('addArticle')}
            className="h-9 px-3 bg-green-600 text-white hover:bg-green-700 rounded-lg text-sm"
          >
            <PlusCircle className="w-4 h-4 mr-1" />
            Article
          </Button>
        </div>
      </div>

      {stockViewMode === 'table' ? (
        <div className="flex-1 min-h-0 overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[#2C2C2C]">
              <tr className="border-b border-[#4A4A4A]">
                {(
                  [
                    ['nom', 'Nom'],
                    ['categorie', 'Categorie'],
                    ['prix', 'Prix'],
                    ['stock', 'Stock'],
                    ['statut', 'Statut'],
                  ] as [SortKey, string][]
                ).map(([key, label]) => (
                  <th
                    key={key}
                    onClick={() => toggleSort(key)}
                    className="text-left px-3 py-2 text-gray-400 font-medium cursor-pointer hover:text-white select-none"
                  >
                    <span className="inline-flex items-center gap-1">
                      {label}
                      <ArrowUpDown
                        className={`w-3 h-3 ${sortKey === key ? 'text-[#F1C40F]' : 'text-gray-600'}`}
                      />
                    </span>
                  </th>
                ))}
                <th className="px-3 py-2 text-gray-400 font-medium text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedPlats.map((plat) => (
                <tr
                  key={plat.id}
                  className="border-b border-[#4A4A4A]/50 hover:bg-[#3A3A3A]/50"
                >
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      {plat.imageUrl ? (
                        <div className="w-8 h-8 rounded-md overflow-hidden bg-[#4A4A4A] shrink-0">
                          <img
                            src={plat.imageUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-md bg-[#4A4A4A] shrink-0" />
                      )}
                      <span className="text-white truncate">{plat.nom}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-gray-400">{plat.categorie}</td>
                  <td className="px-3 py-2 text-white tabular-nums">
                    {plat.prix.toFixed(2)}&euro;
                  </td>
                  <td className="px-3 py-2">
                    {plat.stock !== undefined ? (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={saving || plat.stock <= 0}
                          onClick={() =>
                            handleStockChange(plat.id, plat.stock! - 1)
                          }
                          className="h-6 w-6 bg-[#4A4A4A] text-white hover:bg-[#555] rounded disabled:opacity-30"
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </Button>
                        <span
                          className={`h-6 w-10 flex items-center justify-center rounded font-bold text-xs tabular-nums ${
                            plat.stock === 0
                              ? 'bg-red-600 text-white'
                              : plat.stock <= 3
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-[#4A4A4A] text-white'
                          }`}
                        >
                          {plat.stock}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={saving}
                          onClick={() =>
                            handleStockChange(plat.id, plat.stock! + 1)
                          }
                          className="h-6 w-6 bg-[#4A4A4A] text-white hover:bg-[#555] rounded disabled:opacity-30"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </Button>
                      </div>
                    ) : (
                      <span className="text-gray-500 text-xs">illimite</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        plat.disponible
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {plat.disponible ? 'Actif' : 'Off'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex gap-1 justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditArticle(plat);
                          setEditRecette(plat.sousProduitsIds || []);
                          setView('editArticle');
                        }}
                        className="h-7 w-7 text-gray-500 hover:text-[#F1C40F] rounded"
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteArticle(plat.id)}
                        disabled={saving}
                        className="h-7 w-7 text-gray-500 hover:text-red-400 rounded disabled:opacity-20"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {plats.length === 0 && (
            <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
              Aucun article. Ajoutez-en un !
            </div>
          )}
        </div>
      ) : (
        <ScrollArea className="flex-1 min-h-0">
          <div className="space-y-1 pr-4">
            {sortedPlatsDisponibles.map((plat) => (
              <div
                key={plat.id}
                className="flex items-center gap-3 p-3 bg-[#3A3A3A] rounded-xl"
              >
                {plat.imageUrl ? (
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#4A4A4A] shrink-0">
                    <img
                      src={plat.imageUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-[#4A4A4A] flex items-center justify-center shrink-0">
                    <span className="text-gray-600 text-xs">?</span>
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">
                    {plat.nom}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {getCategoryName(plat.categorie)} &middot;{' '}
                    {plat.prix.toFixed(2)}&euro;
                    {!plat.disponible && (
                      <span className="text-red-400 ml-1">(off)</span>
                    )}
                    {plat.sousProduitsIds &&
                      plat.sousProduitsIds.length > 0 && (
                        <span
                          className="text-[#F1C40F] ml-1"
                          title={`Recette: ${plat.sousProduitsIds
                            .map((s) => {
                              const p = plats.find((x) => x.id === s.platId);
                              return `${s.quantite}x ${p?.nom ?? s.platId}`;
                            })
                            .join(', ')}`}
                        >
                          🍽 recette ({plat.sousProduitsIds.length})
                        </span>
                      )}
                  </p>
                </div>

                {plat.stock !== undefined ? (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={saving || plat.stock <= 0}
                      onClick={() =>
                        handleStockChange(plat.id, plat.stock! - 1)
                      }
                      className="h-8 w-8 bg-[#4A4A4A] text-white hover:bg-[#555] rounded-lg disabled:opacity-30"
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    {editingStockId === plat.id ? (
                      <Input
                        type="number"
                        min="0"
                        value={editStockValue}
                        onChange={(e) => setEditStockValue(e.target.value)}
                        onBlur={() => handleDirectEdit(plat.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleDirectEdit(plat.id);
                        }}
                        className="h-8 w-16 text-center bg-[#4A4A4A] border-none text-white rounded-lg text-sm"
                        autoFocus
                      />
                    ) : (
                      <button
                        onClick={() => {
                          setEditingStockId(plat.id);
                          setEditStockValue(String(plat.stock));
                        }}
                        className={`h-8 w-12 flex items-center justify-center rounded-lg font-bold text-sm tabular-nums ${plat.stock === 0 ? 'bg-red-600 text-white' : plat.stock <= 3 ? 'bg-red-500/20 text-red-400' : 'bg-[#4A4A4A] text-white'}`}
                      >
                        {plat.stock}
                      </button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={saving}
                      onClick={() =>
                        handleStockChange(plat.id, plat.stock! + 1)
                      }
                      className="h-8 w-8 bg-[#4A4A4A] text-white hover:bg-[#555] rounded-lg disabled:opacity-30"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <span className="text-gray-500 text-xs px-2">illimite</span>
                )}

                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditArticle(plat);
                      setEditRecette(plat.sousProduitsIds || []);
                      setView('editArticle');
                    }}
                    className="h-8 w-8 text-gray-500 hover:text-[#F1C40F] rounded-lg"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteArticle(plat.id)}
                    disabled={saving}
                    className="h-8 w-8 text-gray-500 hover:text-red-400 rounded-lg disabled:opacity-20"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}

            {sortedPlatsDisponibles.length === 0 && (
              <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
                Aucun article disponible. Ajoutez-en un !
              </div>
            )}
          </div>
        </ScrollArea>
      )}

      {/* Modal Ajout Stock en Masse */}
      {showAjoutMasse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="w-full max-w-4xl mx-4">
            <AjoutStockMasse
              plats={plats}
              onClose={() => setShowAjoutMasse(false)}
              onConfirm={handleAjoutStockMasse}
              loading={saving}
            />
          </div>
        </div>
      )}
    </div>
  );
}
