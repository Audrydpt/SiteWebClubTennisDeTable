/* eslint-disable */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/authContext';
import type {
  Plat,
  Member,
  ClientCaisse,
  LigneCaisse,
  TransactionCaisse,
  CompteCaisse,
  CategorieCaisse,
} from '@/services/type';
import {
  fetchPlats,
  fetchUsers,
  fetchClientsCaisse,
  fetchTransactionsCaisse,
  fetchComptesCaisse,
  fetchCategoriesCaisse,
  fetchInformations,
  createTransactionCaisse,
  updateTransactionCaisse,
  fetchCompteCaisseByClient,
  createCompteCaisse,
  updateCompteCaisse,
  decrementStock,
  incrementStock,
} from '@/services/api';

import CaisseLoginForm from './CaisseLoginForm';
import CaisseTopBar, { type CaisseView } from './components/CaisseTopBar';
import CaisseLayout from './components/CaisseLayout';
import ArticleGrid from './components/ArticleGrid';
import PanierPanel from './components/PanierPanel';
import ClientSelector from './components/ClientSelector';
import PaiementModal from './components/PaiementModal';
import ArdoisePanel from './components/ArdoisePanel';
import HistoriquePanel from './components/HistoriquePanel';
import StockPanel from './components/StockPanel';

interface SelectedClient {
  type: 'membre' | 'externe' | 'anonyme';
  id?: string;
  nom: string;
}

export default function CaissePage() {
  const { isAuthenticated, isAdmin, user } = useAuth();

  // Data
  const [plats, setPlats] = useState<Plat[]>([]);
  const [categories, setCategories] = useState<CategorieCaisse[]>([]);
  const [membres, setMembres] = useState<Member[]>([]);
  const [clientsExternes, setClientsExternes] = useState<ClientCaisse[]>([]);
  const [transactions, setTransactions] = useState<TransactionCaisse[]>([]);
  const [comptes, setComptes] = useState<CompteCaisse[]>([]);
  const [payconiqUrl, setPayconiqUrl] = useState<string>('');

  // UI
  const [activeView, setActiveView] = useState<CaisseView>('vente');
  const [showClientSelector, setShowClientSelector] = useState(false);
  const [showPaiementModal, setShowPaiementModal] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Cart
  const [panier, setPanier] = useState<LigneCaisse[]>([]);
  const [selectedClient, setSelectedClient] = useState<SelectedClient | null>(
    null
  );

  // Load data
  const loadData = useCallback(async () => {
    try {
      const [p, cats, m, ce, tx, cpt, infos] = await Promise.all([
        fetchPlats(),
        fetchCategoriesCaisse(),
        fetchUsers(),
        fetchClientsCaisse(),
        fetchTransactionsCaisse(),
        fetchComptesCaisse(),
        fetchInformations(),
      ]);
      setPlats(p);
      setCategories(cats);
      setMembres(m);
      setClientsExternes(ce);
      setTransactions(tx);
      setComptes(cpt);
      if (infos && infos.length > 0) {
        setPayconiqUrl(infos[0].payconiqUrl || '');
      }
    } catch (err) {
      console.error('Erreur chargement donnees:', err);
    }
  }, []);

  const reloadPlatsAndCategories = useCallback(async () => {
    try {
      const [p, cats] = await Promise.all([
        fetchPlats(),
        fetchCategoriesCaisse(),
      ]);
      setPlats(p);
      setCategories(cats);
    } catch (err) {
      console.error('Erreur rechargement:', err);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && isAdmin()) {
      loadData();
    }
  }, [isAuthenticated, isAdmin, loadData]);

  // Cart actions
  const addToCart = useCallback((plat: Plat) => {
    setPanier((prev) => {
      const existing = prev.find((l) => l.platId === plat.id);
      if (existing) {
        return prev.map((l) =>
          l.platId === plat.id
            ? {
                ...l,
                quantite: l.quantite + 1,
                sousTotal: (l.quantite + 1) * l.prixUnitaire,
              }
            : l
        );
      }
      return [
        ...prev,
        {
          platId: plat.id,
          platNom: plat.nom,
          prixUnitaire: plat.prix,
          quantite: 1,
          sousTotal: plat.prix,
        },
      ];
    });
  }, []);

  const updateQuantity = useCallback((platId: string, delta: number) => {
    setPanier((prev) =>
      prev
        .map((l) => {
          if (l.platId !== platId) return l;
          const newQty = l.quantite + delta;
          if (newQty <= 0) return null;
          return {
            ...l,
            quantite: newQty,
            sousTotal: newQty * l.prixUnitaire,
          };
        })
        .filter(Boolean) as LigneCaisse[]
    );
  }, []);

  const removeLine = useCallback((platId: string) => {
    setPanier((prev) => prev.filter((l) => l.platId !== platId));
  }, []);

  const clearCart = useCallback(() => {
    setPanier([]);
    setSelectedClient(null);
  }, []);

  // Payment
  const total = panier.reduce((sum, l) => sum + l.sousTotal, 0);

  const operateurName =
    user && 'username' in user ? user.username : 'admin';

  const handlePayImmediat = async () => {
    setPaymentLoading(true);
    try {
      await createTransactionCaisse({
        lignes: panier,
        total,
        modePaiement: 'immediat',
        statut: 'payee',
        clientType: selectedClient?.type || 'anonyme',
        clientId: selectedClient?.id,
        clientNom: selectedClient?.nom,
        dateTransaction: new Date().toISOString(),
        operateur: operateurName,
      });

      // Decrement stock for each line
      for (const ligne of panier) {
        await decrementStock(ligne.platId, ligne.quantite);
      }

      setPaymentSuccess(true);
      setTimeout(() => {
        setPaymentSuccess(false);
        setShowPaiementModal(false);
        clearCart();
        loadData();
      }, 1500);
    } catch (err) {
      console.error('Erreur paiement immediat:', err);
      setPaymentLoading(false);
    }
  };

  const handlePayArdoise = async () => {
    if (!selectedClient || selectedClient.type === 'anonyme') return;
    setPaymentLoading(true);
    try {
      const tx = await createTransactionCaisse({
        lignes: panier,
        total,
        modePaiement: 'ardoise',
        statut: 'ardoise',
        clientType: selectedClient.type,
        clientId: selectedClient.id,
        clientNom: selectedClient.nom,
        dateTransaction: new Date().toISOString(),
        operateur: operateurName,
      });

      // Update or create compte
      let compte = await fetchCompteCaisseByClient(selectedClient.id!);
      const now = new Date().toISOString();

      if (compte) {
        compte.solde += total;
        compte.derniereActivite = now;
        compte.historique.push({
          transactionId: tx.id,
          montant: total,
          type: 'consommation',
          date: now,
        });
        await updateCompteCaisse(compte.id, compte);
      } else {
        await createCompteCaisse({
          clientType: selectedClient.type as 'membre' | 'externe',
          clientId: selectedClient.id!,
          clientNom: selectedClient.nom,
          solde: total,
          derniereActivite: now,
          historique: [
            {
              transactionId: tx.id,
              montant: total,
              type: 'consommation',
              date: now,
            },
          ],
        });
      }

      // Decrement stock
      for (const ligne of panier) {
        await decrementStock(ligne.platId, ligne.quantite);
      }

      setPaymentSuccess(true);
      setTimeout(() => {
        setPaymentSuccess(false);
        setShowPaiementModal(false);
        clearCart();
        loadData();
      }, 1500);
    } catch (err) {
      console.error('Erreur paiement ardoise:', err);
      setPaymentLoading(false);
    }
  };

  // Payconiq payment (same flow as immediat, but with payconiq mode)
  const handlePayPayconiq = async () => {
    setPaymentLoading(true);
    try {
      await createTransactionCaisse({
        lignes: panier,
        total,
        modePaiement: 'payconiq',
        statut: 'payee',
        clientType: selectedClient?.type || 'anonyme',
        clientId: selectedClient?.id,
        clientNom: selectedClient?.nom,
        dateTransaction: new Date().toISOString(),
        operateur: operateurName,
      });

      for (const ligne of panier) {
        await decrementStock(ligne.platId, ligne.quantite);
      }

      setPaymentSuccess(true);
      setTimeout(() => {
        setPaymentSuccess(false);
        setShowPaiementModal(false);
        clearCart();
        loadData();
      }, 1500);
    } catch (err) {
      console.error('Erreur paiement payconiq:', err);
      setPaymentLoading(false);
    }
  };

  // Annuler transaction
  const handleAnnulerTransaction = async (tx: TransactionCaisse) => {
    try {
      await updateTransactionCaisse(tx.id, { statut: 'annulee' });

      // Restore stock
      for (const ligne of tx.lignes) {
        await incrementStock(ligne.platId, ligne.quantite);
      }

      // If ardoise, adjust account balance
      if (tx.modePaiement === 'ardoise' && tx.clientId) {
        const compte = await fetchCompteCaisseByClient(tx.clientId);
        if (compte) {
          const now = new Date().toISOString();
          await updateCompteCaisse(compte.id, {
            ...compte,
            solde: Math.max(0, compte.solde - tx.total),
            derniereActivite: now,
            historique: [
              ...compte.historique,
              {
                transactionId: tx.id,
                montant: tx.total,
                type: 'paiement' as const,
                date: now,
              },
            ],
          });
        }
      }

      loadData();
    } catch (err) {
      console.error('Erreur annulation transaction:', err);
    }
  };

  // Modifier transaction
  const handleModifierTransaction = async (
    tx: TransactionCaisse,
    newLignes: LigneCaisse[],
    newTotal: number
  ) => {
    try {
      // Calculate stock differences
      for (const oldLigne of tx.lignes) {
        const newLigne = newLignes.find((l) => l.platId === oldLigne.platId);
        const oldQty = oldLigne.quantite;
        const newQty = newLigne ? newLigne.quantite : 0;
        const diff = oldQty - newQty;
        if (diff > 0) {
          await incrementStock(oldLigne.platId, diff);
        } else if (diff < 0) {
          await decrementStock(oldLigne.platId, Math.abs(diff));
        }
      }
      // Handle new items that weren't in original (shouldn't happen in current UI, but safety)
      for (const newLigne of newLignes) {
        if (!tx.lignes.find((l) => l.platId === newLigne.platId)) {
          await decrementStock(newLigne.platId, newLigne.quantite);
        }
      }

      await updateTransactionCaisse(tx.id, {
        lignes: newLignes,
        total: newTotal,
      });

      // If ardoise, adjust account balance
      if (tx.modePaiement === 'ardoise' && tx.clientId) {
        const compte = await fetchCompteCaisseByClient(tx.clientId);
        if (compte) {
          const diff = newTotal - tx.total;
          await updateCompteCaisse(compte.id, {
            ...compte,
            solde: Math.max(0, compte.solde + diff),
            derniereActivite: new Date().toISOString(),
          });
        }
      }

      loadData();
    } catch (err) {
      console.error('Erreur modification transaction:', err);
    }
  };

  // Ardoise payment
  const handleArdoisePayment = async (
    compteId: string,
    montant: number
  ) => {
    try {
      const compte = comptes.find((c) => c.id === compteId);
      if (!compte) return;

      const now = new Date().toISOString();
      const updatedCompte: CompteCaisse = {
        ...compte,
        solde: Math.max(0, compte.solde - montant),
        derniereActivite: now,
        historique: [
          ...compte.historique,
          {
            transactionId: `paiement_${Date.now()}`,
            montant,
            type: 'paiement' as const,
            date: now,
          },
        ],
      };
      await updateCompteCaisse(compteId, updatedCompte);
      loadData();
    } catch (err) {
      console.error('Erreur paiement ardoise:', err);
    }
  };

  // Ardoise payment via Payconiq
  const handleArdoisePaymentPayconiq = async (
    compteId: string,
    montant: number
  ) => {
    try {
      const compte = comptes.find((c) => c.id === compteId);
      if (!compte) return;

      const now = new Date().toISOString();
      const updatedCompte: CompteCaisse = {
        ...compte,
        solde: Math.max(0, compte.solde - montant),
        derniereActivite: now,
        historique: [
          ...compte.historique,
          {
            transactionId: `paiement_payconiq_${Date.now()}`,
            montant,
            type: 'paiement' as const,
            date: now,
          },
        ],
      };
      await updateCompteCaisse(compteId, updatedCompte);
      loadData();
    } catch (err) {
      console.error('Erreur paiement ardoise payconiq:', err);
    }
  };

  // Auth gate
  if (!isAuthenticated || !isAdmin()) {
    return <CaisseLoginForm />;
  }

  // Render active view content
  const renderLeftPanel = () => {
    switch (activeView) {
      case 'vente':
        return (
          <ArticleGrid
            plats={plats}
            categories={categories}
            onAddToCart={addToCart}
            onReordered={reloadPlatsAndCategories}
          />
        );
      case 'ardoises':
        return (
          <ArdoisePanel
            comptes={comptes}
            onPayment={handleArdoisePayment}
            onPaymentPayconiq={handleArdoisePaymentPayconiq}
            payconiqUrl={payconiqUrl}
          />
        );
      case 'historique':
        return (
          <HistoriquePanel
            transactions={transactions}
            onAnnuler={handleAnnulerTransaction}
            onModifier={handleModifierTransaction}
          />
        );
      case 'stock':
        return (
          <StockPanel
            plats={plats}
            categories={categories}
            onDataUpdated={reloadPlatsAndCategories}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#2C2C2C] overflow-hidden">
      <CaisseTopBar activeView={activeView} onViewChange={setActiveView} />

      {activeView === 'vente' ? (
        <CaisseLayout
          leftPanel={renderLeftPanel()}
          rightPanel={
            <PanierPanel
              lignes={panier}
              selectedClient={selectedClient}
              onUpdateQuantity={updateQuantity}
              onRemoveLine={removeLine}
              onClearCart={clearCart}
              onOpenClientSelector={() => setShowClientSelector(true)}
              onRemoveClient={() => setSelectedClient(null)}
              onPay={() => {
                setPaymentLoading(false);
                setPaymentSuccess(false);
                setShowPaiementModal(true);
              }}
            />
          }
        />
      ) : (
        <div className="flex-1 overflow-y-auto bg-[#3A3A3A] p-4">
          {renderLeftPanel()}
        </div>
      )}

      {/* Modals */}
      {showClientSelector && (
        <ClientSelector
          membres={membres}
          clientsExternes={clientsExternes}
          onSelect={(client) => {
            setSelectedClient(client);
            setShowClientSelector(false);
          }}
          onClose={() => setShowClientSelector(false)}
          onClientCreated={(newClient) => {
            setClientsExternes((prev) => [...prev, newClient]);
          }}
        />
      )}

      {showPaiementModal && (
        <PaiementModal
          total={total}
          clientNom={selectedClient?.nom || null}
          onPayImmediat={handlePayImmediat}
          onPayArdoise={handlePayArdoise}
          onPayPayconiq={handlePayPayconiq}
          onClose={() => setShowPaiementModal(false)}
          loading={paymentLoading}
          success={paymentSuccess}
          payconiqUrl={payconiqUrl}
        />
      )}
    </div>
  );
}
