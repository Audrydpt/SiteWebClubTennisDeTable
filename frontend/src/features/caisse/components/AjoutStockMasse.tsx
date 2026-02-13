/* eslint-disable */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Plus, Check, Trash2, Package } from 'lucide-react';
import type { Plat } from '@/services/type';

interface AjoutEnAttente {
  id: string;
  platId: string;
  platNom: string;
  format: number;
  quantitePacks: number;
  totalUnites: number;
}

interface AjoutStockMasseProps {
  plats: Plat[];
  onClose: () => void;
  onConfirm: (ajouts: { platId: string; quantite: number }[]) => void;
  loading?: boolean;
}

export default function AjoutStockMasse({
  plats,
  onClose,
  onConfirm,
  loading,
}: AjoutStockMasseProps) {
  const [selectedPlatId, setSelectedPlatId] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<number | 'custom'>(6);
  const [customFormat, setCustomFormat] = useState('');
  const [quantitePacks, setQuantitePacks] = useState('1');
  const [ajoutsEnAttente, setAjoutsEnAttente] = useState<AjoutEnAttente[]>([]);

  // Filtrer les produits (exclure les plats cuisinés et les items indisponibles)
  const produitsDisponibles = plats.filter((p) => {
    // Exclure les plats cuisinés
    // Exclure les items explicitement marqués comme indisponibles
    if (p.disponible === false) return false;
    return true;
  });

  console.log('[AjoutStockMasse] Total plats:', plats.length);
  console.log(
    '[AjoutStockMasse] Produits disponibles après filtre:',
    produitsDisponibles.length
  );
  console.log(
    '[AjoutStockMasse] Premiers produits:',
    produitsDisponibles.slice(0, 3).map((p) => ({
      id: p.id,
      nom: p.nom,
      isPlat: p.isPlat,
      disponible: p.disponible,
    }))
  );

  const selectedPlat = plats.find(
    (p) => String(p.id) === String(selectedPlatId)
  );

  const formatsDisponibles = selectedPlat?.formats || [6, 12, 24];

  const calculerTotal = () => {
    const format =
      selectedFormat === 'custom'
        ? parseInt(customFormat) || 0
        : typeof selectedFormat === 'number'
          ? selectedFormat
          : 0;
    const qty = parseInt(quantitePacks) || 0;
    const result = format * qty;
    console.log(
      '[calculerTotal] format:',
      format,
      'qty:',
      qty,
      'result:',
      result
    );
    return result;
  };

  const ajouterAListe = () => {
    console.log('[AjoutStockMasse] === ajouterAListe appelé ===');
    console.log('[AjoutStockMasse] selectedPlatId:', selectedPlatId);
    console.log('[AjoutStockMasse] selectedFormat:', selectedFormat);
    console.log('[AjoutStockMasse] customFormat:', customFormat);
    console.log('[AjoutStockMasse] quantitePacks:', quantitePacks);

    if (!selectedPlatId || !quantitePacks) {
      console.log(
        '[AjoutStockMasse] ❌ Annulation: selectedPlatId ou quantitePacks manquant'
      );
      return;
    }

    const format =
      selectedFormat === 'custom'
        ? parseInt(customFormat) || 0
        : typeof selectedFormat === 'number'
          ? selectedFormat
          : 0;
    const qty = parseInt(quantitePacks) || 0;
    const total = format * qty;

    console.log(
      '[AjoutStockMasse] Calculs - format:',
      format,
      'qty:',
      qty,
      'total:',
      total
    );

    if (total <= 0 || format <= 0 || qty <= 0) {
      console.log(
        '[AjoutStockMasse] ❌ Annulation: valeurs invalides (total, format ou qty <= 0)'
      );
      return;
    }

    const plat = plats.find((p) => String(p.id) === String(selectedPlatId));
    if (!plat) {
      console.log('[AjoutStockMasse] ❌ Annulation: plat non trouvé');
      console.log(
        '[AjoutStockMasse] DEBUG - selectedPlatId:',
        selectedPlatId,
        'type:',
        typeof selectedPlatId
      );
      console.log(
        '[AjoutStockMasse] DEBUG - IDs disponibles:',
        plats.map((p) => ({ id: p.id, type: typeof p.id }))
      );
      return;
    }

    const nouvelAjout: AjoutEnAttente = {
      id: `ajout_${Date.now()}_${Math.random()}`,
      platId: selectedPlatId,
      platNom: plat.nom,
      format,
      quantitePacks: qty,
      totalUnites: total,
    };

    console.log('[AjoutStockMasse] ✅ Ajout créé:', nouvelAjout);
    console.log(
      "[AjoutStockMasse] Nombre d'ajouts avant:",
      ajoutsEnAttente.length
    );

    setAjoutsEnAttente((prev) => {
      const newList = [...prev, nouvelAjout];
      console.log("[AjoutStockMasse] Nombre d'ajouts après:", newList.length);
      return newList;
    });

    // Reset form
    setSelectedPlatId('');
    setSelectedFormat(6);
    setCustomFormat('');
    setQuantitePacks('1');
  };

  const supprimerAjout = (id: string) => {
    setAjoutsEnAttente(ajoutsEnAttente.filter((a) => a.id !== id));
  };

  const confirmerTout = () => {
    const ajouts = ajoutsEnAttente.map((a) => ({
      platId: a.platId,
      quantite: a.totalUnites,
    }));
    onConfirm(ajouts);
  };

  const totalUnites = ajoutsEnAttente.reduce(
    (sum, a) => sum + a.totalUnites,
    0
  );

  // Vérifier si le bouton doit être désactivé
  const isAddButtonDisabled =
    !selectedPlatId ||
    calculerTotal() <= 0 ||
    (selectedFormat === 'custom' &&
      (!customFormat || parseInt(customFormat) <= 0));

  console.log('[AjoutStockMasse] isAddButtonDisabled:', isAddButtonDisabled);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-[#2C2C2C] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#4A4A4A]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[#F1C40F]/20 flex items-center justify-center">
              <Package className="w-5 h-5 text-[#F1C40F]" />
            </div>
            <div>
              <h2 className="text-white text-xl font-bold">
                Ajout de stock en masse
              </h2>
              <p className="text-gray-400 text-sm">
                Ajoutez vos achats produit par produit
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Form */}
        <div className="p-6 border-b border-[#4A4A4A]">
          <div className="space-y-4">
            {/* Sélection produit */}
            <div>
              <label className="text-gray-400 text-sm mb-2 block">
                Produit
              </label>
              <select
                value={selectedPlatId}
                onChange={(e) => {
                  console.log('[select] Produit sélectionné:', e.target.value);
                  setSelectedPlatId(e.target.value);
                }}
                className="w-full h-12 px-4 bg-[#3A3A3A] border-none text-white rounded-xl focus:ring-2 focus:ring-[#F1C40F]"
              >
                <option value="">Sélectionner un produit...</option>
                {produitsDisponibles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nom} (Stock actuel: {p.stock || 0})
                  </option>
                ))}
              </select>
            </div>

            {selectedPlatId && (
              <>
                {/* Format */}
                <div>
                  <label className="text-gray-400 text-sm mb-2 block">
                    Format
                  </label>
                  <div className="flex gap-2">
                    {formatsDisponibles.map((fmt) => (
                      <Button
                        key={fmt}
                        type="button"
                        onClick={() => {
                          console.log('[format] Format sélectionné:', fmt);
                          setSelectedFormat(fmt);
                        }}
                        className={`flex-1 h-12 rounded-xl font-bold ${
                          selectedFormat === fmt
                            ? 'bg-[#F1C40F] text-[#2C2C2C] hover:bg-[#F1C40F]/90'
                            : 'bg-[#3A3A3A] text-white hover:bg-[#4A4A4A]'
                        }`}
                      >
                        Pack de {fmt}
                      </Button>
                    ))}
                    <Button
                      type="button"
                      onClick={() => {
                        console.log('[format] Format personnalisé sélectionné');
                        setSelectedFormat('custom');
                      }}
                      className={`flex-1 h-12 rounded-xl font-bold ${
                        selectedFormat === 'custom'
                          ? 'bg-[#F1C40F] text-[#2C2C2C] hover:bg-[#F1C40F]/90'
                          : 'bg-[#3A3A3A] text-white hover:bg-[#4A4A4A]'
                      }`}
                    >
                      Personnalisé
                    </Button>
                  </div>
                </div>

                {/* Custom format input */}
                {selectedFormat === 'custom' && (
                  <div>
                    <label className="text-gray-400 text-sm mb-2 block">
                      Nombre d'unités par pack
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={customFormat}
                      onChange={(e) => {
                        console.log('[customFormat] Valeur:', e.target.value);
                        setCustomFormat(e.target.value);
                      }}
                      placeholder="Ex: 48"
                      className="h-12 bg-[#3A3A3A] border-none text-white rounded-xl"
                    />
                  </div>
                )}

                {/* Quantité de packs */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-400 text-sm mb-2 block">
                      Nombre de packs/cartons
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={quantitePacks}
                      onChange={(e) => {
                        console.log('[quantitePacks] Valeur:', e.target.value);
                        setQuantitePacks(e.target.value);
                      }}
                      className="h-12 bg-[#3A3A3A] border-none text-white rounded-xl text-center text-xl font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm mb-2 block">
                      Total à ajouter
                    </label>
                    <div className="h-12 bg-[#3A3A3A] rounded-xl flex items-center justify-center">
                      <span className="text-[#F1C40F] text-xl font-bold">
                        +{calculerTotal()} unités
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bouton ajouter */}
                <Button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('[Button] Click sur Ajouter à la liste');
                    ajouterAListe();
                  }}
                  disabled={isAddButtonDisabled}
                  className="w-full h-12 bg-[#F1C40F] text-[#2C2C2C] hover:bg-[#F1C40F]/90 font-bold rounded-xl disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Ajouter à la liste
                </Button>

                {/* Debug info */}
                {isAddButtonDisabled && (
                  <div className="text-xs text-red-400 mt-2">
                    Bouton désactivé - Raisons:
                    {!selectedPlatId && <div>- Aucun produit sélectionné</div>}
                    {calculerTotal() <= 0 && <div>- Total calculé = 0</div>}
                    {selectedFormat === 'custom' &&
                      (!customFormat || parseInt(customFormat) <= 0) && (
                        <div>- Format personnalisé invalide</div>
                      )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Liste des ajouts */}
        <div className="flex-1 min-h-0 p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-bold">
              Ajouts en attente ({ajoutsEnAttente.length})
            </h3>
            {ajoutsEnAttente.length > 0 && (
              <span className="text-[#F1C40F] font-bold">
                Total: +{totalUnites} unités
              </span>
            )}
          </div>

          {ajoutsEnAttente.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-gray-500 text-sm">
              Aucun ajout en attente
            </div>
          ) : (
            <ScrollArea className="h-full max-h-64">
              <div className="space-y-2 pr-4">
                {ajoutsEnAttente.map((ajout) => (
                  <div
                    key={ajout.id}
                    className="flex items-center justify-between p-3 bg-[#3A3A3A] rounded-xl"
                  >
                    <div className="flex-1">
                      <p className="text-white font-medium">{ajout.platNom}</p>
                      <p className="text-gray-400 text-sm">
                        {ajout.quantitePacks} × Pack de {ajout.format} ={' '}
                        <span className="text-[#F1C40F] font-bold">
                          +{ajout.totalUnites} unités
                        </span>
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => supprimerAjout(ajout.id)}
                      className="h-8 w-8 text-red-400 hover:text-red-500 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#4A4A4A] flex gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="flex-1 h-12 text-gray-400 hover:text-white hover:bg-[#3A3A3A] rounded-xl"
          >
            Annuler
          </Button>
          <Button
            type="button"
            onClick={confirmerTout}
            disabled={loading || ajoutsEnAttente.length === 0}
            className="flex-1 h-12 bg-green-600 text-white hover:bg-green-700 rounded-xl disabled:opacity-30"
          >
            <Check className="w-5 h-5 mr-2" />
            {loading ? 'Confirmation...' : `Confirmer (${totalUnites} unités)`}
          </Button>
        </div>
      </div>
    </div>
  );
}
