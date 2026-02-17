/* eslint-disable */
import { useState, useMemo } from 'react';
import type { Member, ClientCaisse, CompteCaisse } from '@/services/type';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ArrowLeft,
  Search,
  Users,
  UserPlus,
  ClipboardList,
  Plus,
  Trash2,
  Check,
  AlertTriangle,
} from 'lucide-react';
import {
  fetchCompteCaisseByClient,
  createCompteCaisse,
  updateCompteCaisse,
  createTransactionCaisse,
} from '@/services/api';

interface LigneImport {
  id: string;
  nom: string;
  quantite: number;
  prixUnitaire: number;
}

interface ClientResult {
  type: 'membre' | 'externe';
  id: string;
  nom: string;
  prenom: string;
  detail?: string;
}

interface ImportCompteAncienProps {
  membres: Member[];
  clientsExternes: ClientCaisse[];
  comptes: CompteCaisse[];
  onBack: () => void;
  onImported: () => void;
}

export default function ImportCompteAncien({
  membres,
  clientsExternes,
  comptes,
  onBack,
  onImported,
}: ImportCompteAncienProps) {
  const today = new Date().toISOString().split('T')[0];

  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<ClientResult | null>(
    null
  );
  const [date, setDate] = useState(today);
  const [lignes, setLignes] = useState<LigneImport[]>([
    { id: '1', nom: '', quantite: 1, prixUnitaire: 0 },
  ]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const compteExistant = useMemo(() => {
    if (!selectedClient) return null;
    return (
      comptes.find((c) => c.clientId === selectedClient.id && c.solde > 0) ||
      null
    );
  }, [selectedClient, comptes]);

  const results = useMemo(() => {
    if (search.length < 2) return [];
    const term = search.toLowerCase();
    const list: ClientResult[] = [];
    membres.forEach((m) => {
      if (`${m.prenom} ${m.nom}`.toLowerCase().includes(term))
        list.push({
          type: 'membre',
          id: m.id,
          nom: m.nom,
          prenom: m.prenom,
          detail: m.classement,
        });
    });
    clientsExternes.forEach((c) => {
      if (`${c.prenom} ${c.nom}`.toLowerCase().includes(term))
        list.push({
          type: 'externe',
          id: c.id,
          nom: c.nom,
          prenom: c.prenom,
          detail: c.telephone,
        });
    });
    return list.slice(0, 8);
  }, [search, membres, clientsExternes]);

  const lignesValides = lignes.filter(
    (l) => l.nom.trim() && l.prixUnitaire > 0 && l.quantite > 0
  );
  const total = lignesValides.reduce(
    (sum, l) => sum + l.quantite * l.prixUnitaire,
    0
  );

  const addLigne = () =>
    setLignes((prev) => [
      ...prev,
      { id: Date.now().toString(), nom: '', quantite: 1, prixUnitaire: 0 },
    ]);

  const removeLigne = (id: string) =>
    setLignes((prev) => prev.filter((l) => l.id !== id));

  const updateLigne = (
    id: string,
    field: keyof LigneImport,
    value: string | number
  ) =>
    setLignes((prev) =>
      prev.map((l) => (l.id === id ? { ...l, [field]: value } : l))
    );

  const handleSubmit = async () => {
    if (!selectedClient) {
      setError('Veuillez sélectionner un client.');
      return;
    }
    if (lignesValides.length === 0) {
      setError('Ajoutez au moins une consommation valide.');
      return;
    }
    if (!date) {
      setError('Veuillez choisir une date.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const dateISO = new Date(date + 'T12:00:00').toISOString();
      const clientNom = `${selectedClient.prenom} ${selectedClient.nom}`;

      const txLignes = lignesValides.map((l) => ({
        platId: `import_${l.id}`,
        platNom: l.nom.trim(),
        prixUnitaire: l.prixUnitaire,
        quantite: l.quantite,
        sousTotal: Math.round(l.quantite * l.prixUnitaire * 100) / 100,
      }));

      // Créer la transaction sans décrementer le stock
      const tx = await createTransactionCaisse({
        lignes: txLignes,
        total: Math.round(total * 100) / 100,
        modePaiement: 'ardoise',
        statut: 'ardoise',
        clientType: selectedClient.type,
        clientId: selectedClient.id,
        clientNom: clientNom,
        dateTransaction: dateISO,
        operateur: 'import_papier',
      });

      // Mettre à jour ou créer le compte
      const existing = await fetchCompteCaisseByClient(selectedClient.id);
      if (existing) {
        await updateCompteCaisse(existing.id, {
          ...existing,
          solde: Math.round((existing.solde + total) * 100) / 100,
          derniereActivite: dateISO,
          historique: [
            ...existing.historique,
            {
              transactionId: tx.id,
              montant: Math.round(total * 100) / 100,
              type: 'consommation' as const,
              date: dateISO,
            },
          ],
        });
      } else {
        await createCompteCaisse({
          clientType: selectedClient.type,
          clientId: selectedClient.id,
          clientNom: clientNom,
          solde: Math.round(total * 100) / 100,
          derniereActivite: dateISO,
          historique: [
            {
              transactionId: tx.id,
              montant: Math.round(total * 100) / 100,
              type: 'consommation' as const,
              date: dateISO,
            },
          ],
        });
      }

      setSuccess(true);
      setTimeout(() => {
        onImported();
        onBack();
      }, 1400);
    } catch (err) {
      console.error('Erreur import compte:', err);
      setError("Une erreur est survenue lors de l'enregistrement.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3">
        <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center">
          <Check className="w-7 h-7 text-green-400" />
        </div>
        <p className="text-white font-bold text-lg">Compte encodé !</p>
        <p className="text-gray-400 text-sm">
          {total.toFixed(2)}€ ajouté au compte de {selectedClient?.prenom}{' '}
          {selectedClient?.nom}
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="h-9 w-9 text-gray-400 hover:text-white rounded-lg shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-white text-lg font-bold flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-[#F1C40F]" />
            Encoder un compte papier
          </h2>
          <p className="text-gray-400 text-xs">
            Reprise d'un solde existant · sans impact sur le stock
          </p>
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="space-y-3 pr-2 pb-4">
          {/* 1 — Client */}
          <div className="bg-[#3A3A3A] rounded-xl p-4">
            <p className="text-[#F1C40F] text-xs font-bold uppercase tracking-wide mb-3">
              1 · Client
            </p>

            {selectedClient ? (
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    selectedClient.type === 'membre'
                      ? 'bg-blue-500/20'
                      : 'bg-green-500/20'
                  }`}
                >
                  {selectedClient.type === 'membre' ? (
                    <Users className="w-4 h-4 text-blue-400" />
                  ) : (
                    <UserPlus className="w-4 h-4 text-green-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">
                    {selectedClient.prenom} {selectedClient.nom}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {selectedClient.type === 'membre' ? 'Membre' : 'Externe'}
                    {selectedClient.detail ? ` · ${selectedClient.detail}` : ''}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedClient(null);
                    setError(null);
                  }}
                  className="text-gray-500 hover:text-red-400 text-xs underline shrink-0"
                >
                  Changer
                </button>
              </div>
            ) : (
              <>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    placeholder="Rechercher un client..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-10 pl-10 bg-[#4A4A4A] border-none text-white placeholder:text-gray-500 rounded-xl text-sm"
                    autoFocus
                  />
                </div>
                {results.length > 0 && (
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {results.map((r) => (
                      <button
                        key={`${r.type}-${r.id}`}
                        onClick={() => {
                          setSelectedClient(r);
                          setSearch('');
                        }}
                        className="w-full flex items-center gap-3 p-2.5 rounded-lg bg-[#4A4A4A] hover:bg-[#555] transition-colors text-left"
                      >
                        {r.type === 'membre' ? (
                          <Users className="w-4 h-4 text-blue-400 shrink-0" />
                        ) : (
                          <UserPlus className="w-4 h-4 text-green-400 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm truncate">
                            {r.prenom} {r.nom}
                          </p>
                          {r.detail && (
                            <p className="text-gray-400 text-xs">{r.detail}</p>
                          )}
                        </div>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                            r.type === 'membre'
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-green-500/20 text-green-400'
                          }`}
                        >
                          {r.type === 'membre' ? 'Membre' : 'Externe'}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                {search.length >= 2 && results.length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-2">
                    Aucun client trouvé
                  </p>
                )}
              </>
            )}

            {compteExistant && (
              <div className="mt-3 flex items-start gap-2 bg-orange-500/15 border border-orange-500/40 rounded-lg p-3">
                <AlertTriangle className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
                <p className="text-orange-200 text-xs">
                  Ce client a déjà un solde ouvert de{' '}
                  <span className="font-bold text-orange-300">
                    {compteExistant.solde.toFixed(2)}€
                  </span>
                  . Le montant importé s'y ajoutera.
                </p>
              </div>
            )}
          </div>

          {/* 2 — Date */}
          <div className="bg-[#3A3A3A] rounded-xl p-4">
            <p className="text-[#F1C40F] text-xs font-bold uppercase tracking-wide mb-3">
              2 · Date des consommations
            </p>
            <input
              type="date"
              value={date}
              max={today}
              onChange={(e) => setDate(e.target.value)}
              className="w-full h-10 bg-[#4A4A4A] text-white rounded-xl px-3 text-sm border-none outline-none [color-scheme:dark]"
            />
          </div>

          {/* 3 — Lignes */}
          <div className="bg-[#3A3A3A] rounded-xl p-4">
            <p className="text-[#F1C40F] text-xs font-bold uppercase tracking-wide mb-3">
              3 · Consommations
            </p>

            <div className="space-y-2 mb-3">
              <div className="grid grid-cols-[1fr_52px_72px_32px] gap-2 px-1">
                <p className="text-gray-500 text-xs">Article</p>
                <p className="text-gray-500 text-xs text-center">Qté</p>
                <p className="text-gray-500 text-xs text-center">Prix u.</p>
                <div />
              </div>

              {lignes.map((ligne) => (
                <div
                  key={ligne.id}
                  className="grid grid-cols-[1fr_52px_72px_32px] gap-2 items-center"
                >
                  <Input
                    placeholder="Nom article"
                    value={ligne.nom}
                    onChange={(e) =>
                      updateLigne(ligne.id, 'nom', e.target.value)
                    }
                    className="h-9 bg-[#4A4A4A] border-none text-white placeholder:text-gray-600 rounded-lg text-sm"
                  />
                  <Input
                    type="number"
                    min="1"
                    value={ligne.quantite}
                    onChange={(e) =>
                      updateLigne(
                        ligne.id,
                        'quantite',
                        parseInt(e.target.value) || 1
                      )
                    }
                    className="h-9 bg-[#4A4A4A] border-none text-white rounded-lg text-sm text-center"
                  />
                  <Input
                    type="number"
                    min="0"
                    step="0.10"
                    placeholder="0.00"
                    value={ligne.prixUnitaire || ''}
                    onChange={(e) =>
                      updateLigne(
                        ligne.id,
                        'prixUnitaire',
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className="h-9 bg-[#4A4A4A] border-none text-white rounded-lg text-sm text-center"
                  />
                  <button
                    onClick={() => removeLigne(ligne.id)}
                    disabled={lignes.length === 1}
                    className="h-9 w-8 flex items-center justify-center text-gray-500 hover:text-red-400 disabled:opacity-20 rounded-lg"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <Button
              variant="ghost"
              onClick={addLigne}
              className="w-full h-9 bg-[#4A4A4A] text-gray-400 hover:text-white hover:bg-[#555] rounded-lg text-sm"
            >
              <Plus className="w-3.5 h-3.5 mr-2" />
              Ajouter une ligne
            </Button>
          </div>

          {/* Total */}
          {total > 0 && (
            <div className="flex items-center justify-between bg-[#3A3A3A] rounded-xl px-4 py-3">
              <span className="text-gray-400 text-sm font-medium">
                Total à encoder
              </span>
              <span className="text-[#F1C40F] font-bold text-xl tabular-nums">
                {total.toFixed(2)}€
              </span>
            </div>
          )}

          {/* Erreur */}
          {error && (
            <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/40 rounded-xl p-3">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={loading || !selectedClient || lignesValides.length === 0}
            className="w-full h-12 bg-[#F1C40F] text-[#2C2C2C] hover:bg-[#F1C40F]/90 font-bold rounded-xl disabled:opacity-30"
          >
            <ClipboardList className="w-4 h-4 mr-2" />
            {loading ? 'Enregistrement...' : 'Encoder ce compte'}
          </Button>
        </div>
      </ScrollArea>
    </div>
  );
}
