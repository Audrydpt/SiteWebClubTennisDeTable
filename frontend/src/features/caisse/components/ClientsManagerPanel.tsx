/* eslint-disable */
import { useState, useMemo } from 'react';
import type { Member, ClientCaisse, CompteCaisse } from '@/services/type';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ArrowLeft,
  Search,
  Pencil,
  Trash2,
  Check,
  X,
  AlertTriangle,
  Users,
  UserPlus,
  Eraser,
} from 'lucide-react';
import {
  updateClientCaisse,
  deleteClientCaisse,
  deleteTransactionCaisse,
  deleteCompteCaisse,
  fetchTransactionsByClient,
  fetchCompteCaisseByClient,
  updateCompteCaisse,
  updateTransactionCaisse,
  fetchSoldeCaisseEnCours,
  updateSoldeCaisse,
} from '@/services/api';

interface ClientsManagerPanelProps {
  membres: Member[];
  clientsExternes: ClientCaisse[];
  comptes: CompteCaisse[];
  onBack: () => void;
  onClientUpdated: (client: ClientCaisse) => void;
  onClientDeleted: (clientId: string) => void;
  onCascadeComplete?: () => void;
}

type FilterType = 'tous' | 'membres' | 'externes';

export default function ClientsManagerPanel({
  membres,
  clientsExternes,
  comptes,
  onBack,
  onClientUpdated,
  onClientDeleted,
  onCascadeComplete,
}: ClientsManagerPanelProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('tous');

  // Édition d'un client externe
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNom, setEditNom] = useState('');
  const [editPrenom, setEditPrenom] = useState('');
  const [editTelephone, setEditTelephone] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Suppression
  const [deleteTarget, setDeleteTarget] = useState<ClientCaisse | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Vider historique membre
  const [viderTarget, setViderTarget] = useState<Member | null>(null);
  const [viderLoading, setViderLoading] = useState(false);

  // Compte actif du client à supprimer
  const compteActif = useMemo(() => {
    if (!deleteTarget) return null;
    return (
      comptes.find((c) => c.clientId === deleteTarget.id && c.solde > 0) || null
    );
  }, [deleteTarget, comptes]);

  // Liste fusionnée et filtrée
  const listeAffichee = useMemo(() => {
    const term = search.toLowerCase();

    const externsList = clientsExternes
      .filter((c) => {
        const fullName = `${c.prenom} ${c.nom}`.toLowerCase();
        return fullName.includes(term);
      })
      .map((c) => ({
        type: 'externe' as const,
        id: c.id,
        nom: c.nom,
        prenom: c.prenom,
        detail: c.telephone,
        raw: c,
      }));

    const membresList = membres
      .filter((m) => {
        const fullName = `${m.prenom} ${m.nom}`.toLowerCase();
        return fullName.includes(term);
      })
      .map((m) => ({
        type: 'membre' as const,
        id: m.id,
        nom: m.nom,
        prenom: m.prenom,
        detail: m.classement,
        raw: m,
      }));

    if (filter === 'externes') return externsList;
    if (filter === 'membres') return membresList;

    // Trier : externes d'abord, puis membres
    return [...externsList, ...membresList];
  }, [search, filter, clientsExternes, membres]);

  const startEdit = (client: ClientCaisse) => {
    setEditingId(client.id);
    setEditNom(client.nom);
    setEditPrenom(client.prenom);
    setEditTelephone(client.telephone || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditNom('');
    setEditPrenom('');
    setEditTelephone('');
  };

  const saveEdit = async () => {
    if (!editingId || !editNom.trim() || !editPrenom.trim()) return;
    setEditLoading(true);
    try {
      const newNom = `${editPrenom.trim()} ${editNom.trim()}`;

      // 1. Mettre à jour le client
      const updated = await updateClientCaisse(editingId, {
        nom: editNom.trim(),
        prenom: editPrenom.trim(),
        telephone: editTelephone.trim() || undefined,
      });

      // 2. Mettre à jour le clientNom dans le compte
      const compte = await fetchCompteCaisseByClient(editingId);
      if (compte) {
        await updateCompteCaisse(compte.id, { ...compte, clientNom: newNom });
      }

      // 3. Mettre à jour le clientNom dans toutes les transactions
      const txs = await fetchTransactionsByClient(editingId);
      await Promise.all(
        txs.map((tx) => updateTransactionCaisse(tx.id, { clientNom: newNom }))
      );

      onClientUpdated(updated);
      onCascadeComplete?.();
      cancelEdit();
    } catch (err) {
      console.error('Erreur mise à jour client:', err);
    } finally {
      setEditLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      // 1. Récupérer et supprimer toutes les transactions du client
      const txs = await fetchTransactionsByClient(deleteTarget.id);
      const txIds = new Set(txs.map((t) => t.id));
      await Promise.all(txs.map((tx) => deleteTransactionCaisse(tx.id)));

      // 2. Supprimer le compte
      const compte = await fetchCompteCaisseByClient(deleteTarget.id);
      if (compte) {
        await deleteCompteCaisse(compte.id);
      }

      // 3. Nettoyer le solde de caisse en cours (retirer les TransactionSolde liées)
      if (txIds.size > 0) {
        const soldeEnCours = await fetchSoldeCaisseEnCours();
        if (soldeEnCours) {
          const txSoldeFiltered = soldeEnCours.transactions.filter(
            (ts) => !ts.transactionId || !txIds.has(ts.transactionId)
          );
          if (txSoldeFiltered.length < soldeEnCours.transactions.length) {
            await updateSoldeCaisse(soldeEnCours.id, {
              transactions: txSoldeFiltered,
            });
          }
        }
      }

      // 4. Supprimer le client
      await deleteClientCaisse(deleteTarget.id);

      onClientDeleted(deleteTarget.id);
      onCascadeComplete?.();
      setDeleteTarget(null);
    } catch (err) {
      console.error('Erreur suppression client:', err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const confirmVider = async () => {
    if (!viderTarget) return;
    setViderLoading(true);
    try {
      // 1. Supprimer toutes les transactions du membre
      const txs = await fetchTransactionsByClient(String(viderTarget.id));
      const txIds = new Set(txs.map((t) => t.id));
      await Promise.all(txs.map((tx) => deleteTransactionCaisse(tx.id)));

      // 2. Réinitialiser le compte (solde 0, historique vide) sans le supprimer
      const compte = await fetchCompteCaisseByClient(String(viderTarget.id));
      if (compte) {
        await updateCompteCaisse(compte.id, {
          ...compte,
          solde: 0,
          historique: [],
          derniereActivite: new Date().toISOString(),
        });
      }

      // 3. Nettoyer le solde de caisse en cours
      if (txIds.size > 0) {
        const soldeEnCours = await fetchSoldeCaisseEnCours();
        if (soldeEnCours) {
          const filtered = soldeEnCours.transactions.filter(
            (ts) => !ts.transactionId || !txIds.has(ts.transactionId)
          );
          if (filtered.length < soldeEnCours.transactions.length) {
            await updateSoldeCaisse(soldeEnCours.id, {
              transactions: filtered,
            });
          }
        }
      }

      onCascadeComplete?.();
      setViderTarget(null);
    } catch (err) {
      console.error('Erreur vidage historique:', err);
    } finally {
      setViderLoading(false);
    }
  };

  const getCompteForClient = (clientId: string) => {
    return comptes.find((c) => c.clientId === clientId && c.solde > 0);
  };

  return (
    <>
      {/* Modal de confirmation suppression */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-[#3A3A3A] rounded-2xl w-full max-w-sm mx-4 p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-white font-bold">Supprimer le client</h3>
                <p className="text-gray-400 text-sm">
                  {deleteTarget.prenom} {deleteTarget.nom}
                </p>
              </div>
            </div>

            {compteActif ? (
              <div className="bg-orange-500/15 border border-orange-500/40 rounded-xl p-4 mb-5">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-orange-300 text-sm font-semibold mb-1">
                      Compte en cours !
                    </p>
                    <p className="text-orange-200/80 text-xs leading-relaxed">
                      Ce client a un solde ouvert de{' '}
                      <span className="font-bold text-orange-300">
                        {compteActif.solde.toFixed(2)}€
                      </span>
                      . Si vous supprimez ce client, le compte restera dans la
                      base mais ne sera plus associé à aucun profil.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-400 text-sm mb-5">
                Cette action est irréversible. Le client sera définitivement
                supprimé de la base de données.
              </p>
            )}

            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => setDeleteTarget(null)}
                disabled={deleteLoading}
                className="flex-1 h-11 bg-[#4A4A4A] text-gray-300 hover:bg-[#555] rounded-xl"
              >
                Annuler
              </Button>
              <Button
                onClick={confirmDelete}
                disabled={deleteLoading}
                className="flex-1 h-11 bg-red-600 text-white hover:bg-red-700 rounded-xl font-semibold"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {deleteLoading
                  ? 'Suppression...'
                  : compteActif
                    ? 'Supprimer quand même'
                    : 'Supprimer'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Contenu principal */}
      {/* Modal vider historique membre */}
      {viderTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-[#3A3A3A] rounded-2xl w-full max-w-sm mx-4 p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0">
                <Eraser className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <h3 className="text-white font-bold">Vider l'historique</h3>
                <p className="text-gray-400 text-sm">
                  {viderTarget.prenom} {viderTarget.nom}
                </p>
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-3">
              Toutes les transactions liées à ce membre seront supprimées
              définitivement. Le compte sera remis à zéro.
            </p>
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-3 mb-5 text-xs text-orange-300">
              ⚠️ Cette action retire également les montants du solde de caisse
              en cours si applicable.
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViderTarget(null)}
                disabled={viderLoading}
                className="flex-1 h-11 bg-[#4A4A4A] text-gray-300 hover:bg-[#555] rounded-xl text-sm font-medium disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={confirmVider}
                disabled={viderLoading}
                className="flex-1 h-11 bg-orange-600 text-white hover:bg-orange-700 rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Eraser className="w-4 h-4" />
                {viderLoading ? 'Vidage...' : 'Vider'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="h-full flex flex-col min-h-0">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-9 w-9 text-gray-400 hover:text-white rounded-lg shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-white text-lg font-bold">
              Gestion des clients
            </h2>
            <p className="text-gray-400 text-xs">
              {clientsExternes.length} externe
              {clientsExternes.length !== 1 ? 's' : ''} · {membres.length}{' '}
              membre{membres.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Recherche */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder="Rechercher un client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 pl-10 bg-[#4A4A4A] border-none text-white placeholder:text-gray-500 rounded-xl text-sm"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filtres */}
        <div className="flex gap-2 mb-4">
          {(['tous', 'externes', 'membres'] as FilterType[]).map((f) => (
            <Button
              key={f}
              variant="ghost"
              onClick={() => setFilter(f)}
              className={`h-8 px-4 rounded-lg text-xs font-medium transition-colors ${
                filter === f
                  ? 'bg-[#F1C40F] text-[#2C2C2C]'
                  : 'bg-[#4A4A4A] text-gray-400 hover:text-white hover:bg-[#555]'
              }`}
            >
              {f === 'tous'
                ? 'Tous'
                : f === 'externes'
                  ? 'Externes'
                  : 'Membres'}
            </Button>
          ))}
        </div>

        {/* Liste */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="space-y-2 pr-4">
            {listeAffichee.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">
                Aucun client trouvé
              </p>
            ) : (
              listeAffichee.map((item) => {
                const isExterne = item.type === 'externe';
                const compteOuvert = isExterne
                  ? getCompteForClient(item.id)
                  : null;
                const isEditing = editingId === item.id;

                return (
                  <div
                    key={`${item.type}-${item.id}`}
                    className="bg-[#3A3A3A] rounded-xl p-3"
                  >
                    {isEditing ? (
                      /* Mode édition */
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Prénom"
                            value={editPrenom}
                            onChange={(e) => setEditPrenom(e.target.value)}
                            className="h-9 bg-[#4A4A4A] border-none text-white placeholder:text-gray-500 rounded-lg text-sm"
                          />
                          <Input
                            placeholder="Nom"
                            value={editNom}
                            onChange={(e) => setEditNom(e.target.value)}
                            className="h-9 bg-[#4A4A4A] border-none text-white placeholder:text-gray-500 rounded-lg text-sm"
                          />
                        </div>
                        <Input
                          placeholder="Téléphone (optionnel)"
                          value={editTelephone}
                          onChange={(e) => setEditTelephone(e.target.value)}
                          className="h-9 bg-[#4A4A4A] border-none text-white placeholder:text-gray-500 rounded-lg text-sm"
                        />
                        <div className="flex gap-2 pt-1">
                          <Button
                            variant="ghost"
                            onClick={cancelEdit}
                            disabled={editLoading}
                            className="flex-1 h-9 bg-[#4A4A4A] text-gray-400 hover:text-white rounded-lg text-sm"
                          >
                            <X className="w-3.5 h-3.5 mr-1.5" />
                            Annuler
                          </Button>
                          <Button
                            onClick={saveEdit}
                            disabled={
                              editLoading ||
                              !editNom.trim() ||
                              !editPrenom.trim()
                            }
                            className="flex-1 h-9 bg-green-600 text-white hover:bg-green-700 rounded-lg text-sm disabled:opacity-30"
                          >
                            <Check className="w-3.5 h-3.5 mr-1.5" />
                            {editLoading ? 'Sauvegarde...' : 'Enregistrer'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      /* Mode affichage */
                      <div className="flex items-center gap-3">
                        {/* Icône type */}
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                            isExterne ? 'bg-green-500/20' : 'bg-blue-500/20'
                          }`}
                        >
                          {isExterne ? (
                            <UserPlus className="w-4 h-4 text-green-400" />
                          ) : (
                            <Users className="w-4 h-4 text-blue-400" />
                          )}
                        </div>

                        {/* Infos */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-white text-sm font-medium">
                              {item.prenom} {item.nom}
                            </p>
                            {compteOuvert && (
                              <span className="text-xs bg-orange-500/20 text-orange-300 px-1.5 py-0.5 rounded-full font-semibold">
                                {compteOuvert.solde.toFixed(2)}€ dû
                              </span>
                            )}
                          </div>
                          <p className="text-gray-500 text-xs">
                            {isExterne ? 'Externe' : 'Membre'}
                            {item.detail ? ` · ${item.detail}` : ''}
                          </p>
                        </div>

                        {/* Actions — uniquement pour les clients externes */}
                        {isExterne && (
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                startEdit(item.raw as ClientCaisse)
                              }
                              className="h-8 w-8 rounded-lg text-gray-400 hover:text-[#F1C40F] hover:bg-[#4A4A4A]"
                              title="Modifier"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                setDeleteTarget(item.raw as ClientCaisse)
                              }
                              className="h-8 w-8 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                              title="Supprimer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        )}

                        {/* Membres : vider historique */}
                        {!isExterne && (
                          <button
                            onClick={() => setViderTarget(item.raw as Member)}
                            className="h-8 w-8 rounded-lg text-gray-500 hover:text-orange-400 hover:bg-orange-500/10 flex items-center justify-center transition-colors"
                            title="Vider l'historique de transactions"
                          >
                            <Eraser className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>
    </>
  );
}
