import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/authContext';
import type {
  Plat,
  Member,
  ClientCaisse,
  LigneCaisse,
  TransactionCaisse,
  CompteCaisse,
} from '@/services/type';
import {
  fetchPlats,
  fetchUsers,
  fetchClientsCaisse,
  fetchTransactionsCaisse,
  fetchComptesCaisse,
  createTransactionCaisse,
  fetchCompteCaisseByClient,
  createCompteCaisse,
  updateCompteCaisse,
  decrementStock,
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
  const [membres, setMembres] = useState<Member[]>([]);
  const [clientsExternes, setClientsExternes] = useState<ClientCaisse[]>([]);
  const [transactions, setTransactions] = useState<TransactionCaisse[]>([]);
  const [comptes, setComptes] = useState<CompteCaisse[]>([]);

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
      const [p, m, ce, tx, cpt] = await Promise.all([
        fetchPlats(),
        fetchUsers(),
        fetchClientsCaisse(),
        fetchTransactionsCaisse(),
        fetchComptesCaisse(),
      ]);
      setPlats(p);
      setMembres(m);
      setClientsExternes(ce);
      setTransactions(tx);
      setComptes(cpt);
    } catch (err) {
      console.error('Erreur chargement donnees:', err);
    }
  }, []);

  const reloadPlats = useCallback(async () => {
    try {
      const p = await fetchPlats();
      setPlats(p);
    } catch (err) {
      console.error('Erreur rechargement plats:', err);
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

  // Auth gate
  if (!isAuthenticated || !isAdmin()) {
    return <CaisseLoginForm />;
  }

  // Render active view content
  const renderLeftPanel = () => {
    switch (activeView) {
      case 'vente':
        return <ArticleGrid plats={plats} onAddToCart={addToCart} />;
      case 'ardoises':
        return (
          <ArdoisePanel
            comptes={comptes}
            onPayment={handleArdoisePayment}
          />
        );
      case 'historique':
        return <HistoriquePanel transactions={transactions} />;
      case 'stock':
        return <StockPanel plats={plats} onPlatsUpdated={reloadPlats} />;
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
          onClose={() => setShowPaiementModal(false)}
          loading={paymentLoading}
          success={paymentSuccess}
        />
      )}
    </div>
  );
}
