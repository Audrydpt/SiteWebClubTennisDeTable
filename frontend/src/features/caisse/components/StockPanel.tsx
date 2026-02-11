import { useState } from 'react';
import type { Plat } from '@/services/type';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Minus, Plus, PlusCircle } from 'lucide-react';
import { updatePlatStock, createPlat } from '@/services/api';

interface StockPanelProps {
  plats: Plat[];
  onPlatsUpdated: () => void;
}

export default function StockPanel({ plats, onPlatsUpdated }: StockPanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newArticle, setNewArticle] = useState({
    nom: '',
    prix: '',
    categorie: 'boisson' as Plat['categorie'],
    stock: '',
  });
  const [saving, setSaving] = useState(false);

  const handleStockChange = async (platId: string, newStock: number) => {
    setSaving(true);
    try {
      await updatePlatStock(platId, Math.max(0, newStock));
      onPlatsUpdated();
    } catch (err) {
      console.error('Erreur maj stock:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDirectEdit = async (platId: string) => {
    const val = parseInt(editValue);
    if (!isNaN(val) && val >= 0) {
      await handleStockChange(platId, val);
    }
    setEditingId(null);
  };

  const handleAddArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArticle.nom.trim() || !newArticle.prix) return;
    setSaving(true);
    try {
      await createPlat({
        nom: newArticle.nom.trim(),
        prix: parseFloat(newArticle.prix),
        categorie: newArticle.categorie,
        disponible: true,
        stock: newArticle.stock ? parseInt(newArticle.stock) : undefined,
        dateCreation: new Date().toISOString(),
      });
      setNewArticle({ nom: '', prix: '', categorie: 'boisson', stock: '' });
      setShowAddForm(false);
      onPlatsUpdated();
    } catch (err) {
      console.error('Erreur ajout article:', err);
    } finally {
      setSaving(false);
    }
  };

  const categoryLabels: Record<string, string> = {
    boisson: 'Boisson',
    entree: 'Entree',
    plat: 'Plat',
    dessert: 'Dessert',
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white text-lg font-bold">Gestion du stock</h2>
        <Button
          variant="ghost"
          onClick={() => setShowAddForm(!showAddForm)}
          className="h-9 px-4 bg-green-600 text-white hover:bg-green-700 rounded-lg text-sm"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Ajouter
        </Button>
      </div>

      {showAddForm && (
        <form
          onSubmit={handleAddArticle}
          className="bg-[#3A3A3A] rounded-xl p-4 mb-4 space-y-3"
        >
          <p className="text-gray-400 text-sm font-medium">Nouvel article</p>
          <div className="flex gap-2">
            <Input
              placeholder="Nom"
              value={newArticle.nom}
              onChange={(e) =>
                setNewArticle({ ...newArticle, nom: e.target.value })
              }
              className="h-10 bg-[#4A4A4A] border-none text-white placeholder:text-gray-500 rounded-lg"
            />
            <Input
              type="number"
              step="0.01"
              placeholder="Prix"
              value={newArticle.prix}
              onChange={(e) =>
                setNewArticle({ ...newArticle, prix: e.target.value })
              }
              className="h-10 w-24 bg-[#4A4A4A] border-none text-white placeholder:text-gray-500 rounded-lg"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={newArticle.categorie}
              onChange={(e) =>
                setNewArticle({
                  ...newArticle,
                  categorie: e.target.value as Plat['categorie'],
                })
              }
              className="h-10 px-3 bg-[#4A4A4A] text-white rounded-lg border-none text-sm flex-1"
            >
              <option value="boisson">Boisson</option>
              <option value="entree">Entree</option>
              <option value="plat">Plat</option>
              <option value="dessert">Dessert</option>
            </select>
            <Input
              type="number"
              placeholder="Stock initial"
              value={newArticle.stock}
              onChange={(e) =>
                setNewArticle({ ...newArticle, stock: e.target.value })
              }
              className="h-10 w-32 bg-[#4A4A4A] border-none text-white placeholder:text-gray-500 rounded-lg"
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowAddForm(false)}
              className="flex-1 h-10 bg-[#4A4A4A] text-gray-400 hover:bg-[#555] rounded-lg"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={saving || !newArticle.nom.trim() || !newArticle.prix}
              className="flex-1 h-10 bg-green-600 text-white hover:bg-green-700 rounded-lg disabled:opacity-30"
            >
              {saving ? 'Ajout...' : 'Ajouter'}
            </Button>
          </div>
        </form>
      )}

      <div className="flex-1 overflow-y-auto space-y-1">
        {plats.map((plat) => (
          <div
            key={plat.id}
            className="flex items-center gap-3 p-3 bg-[#3A3A3A] rounded-xl"
          >
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {plat.nom}
              </p>
              <p className="text-gray-500 text-xs">
                {categoryLabels[plat.categorie] || plat.categorie} &middot;{' '}
                {plat.prix.toFixed(2)}&euro;
                {!plat.disponible && (
                  <span className="text-red-400 ml-1">(indisponible)</span>
                )}
              </p>
            </div>

            {plat.stock !== undefined ? (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={saving || plat.stock <= 0}
                  onClick={() => handleStockChange(plat.id, plat.stock! - 1)}
                  className="h-8 w-8 bg-[#4A4A4A] text-white hover:bg-[#555] rounded-lg disabled:opacity-30"
                >
                  <Minus className="w-3 h-3" />
                </Button>

                {editingId === plat.id ? (
                  <Input
                    type="number"
                    min="0"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
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
                      setEditingId(plat.id);
                      setEditValue(String(plat.stock));
                    }}
                    className={`h-8 w-12 flex items-center justify-center rounded-lg font-bold text-sm tabular-nums ${
                      plat.stock === 0
                        ? 'bg-red-600 text-white'
                        : plat.stock <= 3
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-[#4A4A4A] text-white'
                    }`}
                  >
                    {plat.stock}
                  </button>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  disabled={saving}
                  onClick={() => handleStockChange(plat.id, plat.stock! + 1)}
                  className="h-8 w-8 bg-[#4A4A4A] text-white hover:bg-[#555] rounded-lg disabled:opacity-30"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <span className="text-gray-500 text-xs">Illimite</span>
            )}
          </div>
        ))}

        {plats.length === 0 && (
          <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
            Aucun article
          </div>
        )}
      </div>
    </div>
  );
}
