/* eslint-disable */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/authContext';
import useFullscreen from '@/hooks/use-fullscreen';
import IOSInstallPrompt from '@/components/ios-install-prompt';
import DebugPanel from '@/components/debug-panel';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Check, ClipboardCopy, Info } from 'lucide-react';
import type {
  Plat,
  Member,
  ClientCaisse,
  LigneCaisse,
  TransactionCaisse,
  CompteCaisse,
  CategorieCaisse,
  SoldeCaisse,
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
  fetchSoldeCaisseEnCours,
  createSoldeCaisse,
  cloturerSoldeCaisse,
  ajouterTransactionSolde,
  updateSoldeCaisse,
} from '@/services/api';

import CaisseLoginForm from './CaisseLoginForm';
import CaisseTopBar, { type CaisseView } from './components/CaisseTopBar';
import CaisseLayout from './components/CaisseLayout';
import ArticleGrid from './components/ArticleGrid';
import PanierPanel from './components/PanierPanel';
import ComptesActifsPanel from './components/ComptesActifsPanel';
import ClientSelector from './components/ClientSelector';
import PaiementModal from './components/PaiementModal';
import ArdoisePanel from './components/ArdoisePanel';
import HistoriquePanel from './components/HistoriquePanel';
import StockPanel from './components/StockPanel';
import SoldePanel from './components/SoldePanel';
import SoldeCreate from './components/SoldeCreate';

interface SelectedClient {
  type: 'membre' | 'externe' | 'anonyme';
  id?: string;
  nom: string;
}

export default function CaissePage() {
  const { isAuthenticated, isAdmin, user } = useAuth();

  // Activer le mode plein écran permanent
  useFullscreen();

  // Data
  const [plats, setPlats] = useState<Plat[]>([]);
  const [categories, setCategories] = useState<CategorieCaisse[]>([]);
  const [membres, setMembres] = useState<Member[]>([]);
  const [clientsExternes, setClientsExternes] = useState<ClientCaisse[]>([]);
  const [transactions, setTransactions] = useState<TransactionCaisse[]>([]);
  const [comptes, setComptes] = useState<CompteCaisse[]>([]);
  const [soldeActuel, setSoldeActuel] = useState<SoldeCaisse | null>(null);
  const [payconiqUrl, setPayconiqUrl] = useState<string>('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [soldeLoading, setSoldeLoading] = useState(false);

  // Facebook
  const [showFacebookDialog, setShowFacebookDialog] = useState(false);
  const [facebookMessage, setFacebookMessage] = useState('');
  const [groupId, setGroupId] = useState('1414350289649865');
  const [messageTemplate, setMessageTemplate] = useState('Bonjour @tout le monde\n\n💰 Pensez à régler vos ardoises au club ! 🏓\n\nConsultez votre solde directement sur notre site ou au comptoir.\n\n🔗 https://cttframeries.com\n\nMerci pour votre collaboration ! 🙏\n\n#CTTFrameries #Caisse #ClubLife');
  const [isMessageCopied, setIsMessageCopied] = useState(false);

  // UI
  const [activeView, setActiveView] = useState<CaisseView>('vente');
  const [showClientSelector, setShowClientSelector] = useState(false);
  const [showPaiementModal, setShowPaiementModal] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [successType, setSuccessType] = useState<'paiement' | 'ardoise'>('paiement');

  // Cart
  const [panier, setPanier] = useState<LigneCaisse[]>([]);
  const [selectedClient, setSelectedClient] = useState<SelectedClient | null>(
    null
  );

  // Load data
  const loadData = useCallback(async () => {
    try {
      const results = await Promise.allSettled([
        fetchPlats(),
        fetchCategoriesCaisse(),
        fetchUsers(),
        fetchClientsCaisse(),
        fetchTransactionsCaisse(),
        fetchComptesCaisse(),
        fetchInformations(),
        fetchSoldeCaisseEnCours(),
      ]);

      // Helper pour extraire les valeurs des résultats
      const getValue = <T,>(result: PromiseSettledResult<T>, defaultValue: T): T => {
        return result.status === 'fulfilled' ? result.value : defaultValue;
      };

      const [p, cats, m, ce, tx, cpt, infos, solde] = results;

      setPlats(getValue(p as PromiseSettledResult<Plat[]>, []));
      setCategories(getValue(cats as PromiseSettledResult<CategorieCaisse[]>, []));
      setMembres(getValue(m as PromiseSettledResult<Member[]>, []));
      setClientsExternes(getValue(ce as PromiseSettledResult<ClientCaisse[]>, []));
      setTransactions(getValue(tx as PromiseSettledResult<TransactionCaisse[]>, []));
      setComptes(getValue(cpt as PromiseSettledResult<CompteCaisse[]>, []));
      setSoldeActuel(getValue(solde as PromiseSettledResult<SoldeCaisse | null>, null));

      const infosData = getValue(infos as PromiseSettledResult<any[]>, []);
      if (infosData && infosData.length > 0) {
        setPayconiqUrl(infosData[0].payconiqUrl || '');
        // Charger la config Facebook
        if (infosData[0].facebookGroupePriveUrl) {
          const url = infosData[0].facebookGroupePriveUrl;
          const match = url.match(/groups\/(\d+)/);
          if (match && match[1]) {
            setGroupId(match[1]);
          }
        }
        if (infosData[0].facebookMessageCaisse) {
          setMessageTemplate(infosData[0].facebookMessageCaisse);
        }
      }

      // Loguer les erreurs éventuelles
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const names = ['plats', 'categories', 'membres', 'clients', 'transactions', 'comptes', 'infos', 'solde'];
          console.warn(`Erreur chargement ${names[index]}:`, result.reason);
        }
      });
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
    setPanier(
      (prev) =>
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

  const operateurName = user && 'username' in user ? user.username : 'admin';

  const handlePayImmediat = async () => {
    setPaymentLoading(true);
    try {
      const tx = await createTransactionCaisse({
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

      // Ajouter au solde de caisse si un solde est ouvert
      if (soldeActuel) {
        await ajouterTransactionSolde(soldeActuel.id, {
          type: 'vente_cash',
          montant: total,
          date: new Date().toISOString(),
          transactionId: tx.id,
        });
      }

      setSuccessType('paiement');
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

      setSuccessType('ardoise');
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
      const tx = await createTransactionCaisse({
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

      // Ajouter au solde de caisse si un solde est ouvert
      if (soldeActuel) {
        await ajouterTransactionSolde(soldeActuel.id, {
          type: 'vente_payconiq',
          montant: total,
          date: new Date().toISOString(),
          transactionId: tx.id,
        });
      }

      setSuccessType('paiement');
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

      // Si la transaction a impacté le solde de caisse (cash ou payconiq),
      // on retire la TransactionSolde correspondante
      if (
        soldeActuel &&
        (tx.modePaiement === 'immediat' || tx.modePaiement === 'payconiq')
      ) {
        const transactionsSansCelle = soldeActuel.transactions.filter(
          (ts) => ts.transactionId !== tx.id
        );
        // On ne fait le patch que si une entrée a effectivement été retirée
        if (transactionsSansCelle.length < soldeActuel.transactions.length) {
          const updatedSolde = await updateSoldeCaisse(soldeActuel.id, {
            transactions: transactionsSansCelle,
          });
          setSoldeActuel(updatedSolde);
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
  const handleArdoisePayment = async (compteId: string, montant: number) => {
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
            modePaiement: 'immediat',
          },
        ],
      };
      await updateCompteCaisse(compteId, updatedCompte);

      // Ajouter au solde de caisse si un solde est ouvert
      if (soldeActuel) {
        await ajouterTransactionSolde(soldeActuel.id, {
          type: 'compte_cash',
          montant,
          date: now,
          compteId: compte.id,
          compteName: compte.clientNom,
        });
      }

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
            modePaiement: 'payconiq',
          },
        ],
      };
      await updateCompteCaisse(compteId, updatedCompte);

      // Ajouter au solde de caisse si un solde est ouvert
      if (soldeActuel) {
        await ajouterTransactionSolde(soldeActuel.id, {
          type: 'compte_payconiq',
          montant,
          date: now,
          compteId: compte.id,
          compteName: compte.clientNom,
        });
      }

      loadData();
    } catch (err) {
      console.error('Erreur paiement ardoise payconiq:', err);
    }
  };

  // Facebook message
  const handleFacebookClick = () => {
    setFacebookMessage(messageTemplate);
    setShowFacebookDialog(true);
  };

  const handleCopyAndOpenFacebook = () => {
    navigator.clipboard
      .writeText(facebookMessage)
      .then(() => {
        setIsMessageCopied(true);
        setTimeout(() => setIsMessageCopied(false), 2000);
        const fbUrl = `https://www.facebook.com/groups/${groupId}`;
        window.open(fbUrl, '_blank');
      })
      .catch((err) => console.error('Erreur lors de la copie du message:', err));
  };

  // Gestion du solde de caisse
  const handleCreateSolde = async (montantInitial: number) => {
    setSoldeLoading(true);
    try {
      const newSolde = await createSoldeCaisse({
        montantInitial,
        dateOuverture: new Date().toISOString(),
        statut: 'en_cours',
        transactions: [],
      });
      setSoldeActuel(newSolde);
    } catch (err) {
      console.error('Erreur creation solde:', err);
    } finally {
      setSoldeLoading(false);
    }
  };

  const handleCloturerSolde = async () => {
    if (!soldeActuel) return;
    setSoldeLoading(true);
    try {
      await cloturerSoldeCaisse(soldeActuel.id);
      setSoldeActuel(null);
    } catch (err) {
      console.error('Erreur cloture solde:', err);
    } finally {
      setSoldeLoading(false);
    }
  };

  // Auth gate
  if (!isAuthenticated || !isAdmin()) {
    return <CaisseLoginForm />;
  }

  // Render active view content
  const renderLeftPanel = () => {
    console.log(
      '[CaissePage] renderLeftPanel - activeView:',
      activeView,
      'isEditMode:',
      isEditMode
    );

    switch (activeView) {
      case 'vente':
        return (
          <ArticleGrid
            plats={plats}
            categories={categories}
            onAddToCart={addToCart}
            onReordered={reloadPlatsAndCategories}
            isEditMode={isEditMode}
          />
        );
      case 'ardoises':
        return (
          <ArdoisePanel
            comptes={comptes}
            transactions={transactions}
            membres={membres} // ← ajouter
            clientsExternes={clientsExternes} // ← ajouter
            onPayment={handleArdoisePayment}
            onPaymentPayconiq={handleArdoisePaymentPayconiq}
            onClientUpdated={(c) =>
              setClientsExternes((prev) =>
                prev.map((x) => (x.id === c.id ? c : x))
              )
            }
            onClientDeleted={(id) =>
              setClientsExternes((prev) => prev.filter((x) => x.id !== id))
            }
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
      case 'solde':
        if (!soldeActuel) {
          return (
            <SoldeCreate
              onCreateSolde={handleCreateSolde}
              loading={soldeLoading}
            />
          );
        }
        return (
          <SoldePanel
            solde={soldeActuel}
            onCloturer={handleCloturerSolde}
            loading={soldeLoading}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-dvh flex flex-col bg-[#2C2C2C] overflow-hidden">
      <CaisseTopBar
        activeView={activeView}
        onViewChange={setActiveView}
        isEditMode={isEditMode}
        onEditModeToggle={() => {
          console.log('[CaissePage] Toggle Edit Mode:', !isEditMode);
          setIsEditMode(!isEditMode);
        }}
        onFacebookClick={handleFacebookClick}
      />

      {activeView === 'vente' ? (
        <CaisseLayout
          leftPanel={renderLeftPanel()}
          centerPanel={
            <PanierPanel
              lignes={panier}
              selectedClient={selectedClient}
              hasSoldeOuvert={!!soldeActuel}
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
          rightPanel={
            <ComptesActifsPanel
              comptes={comptes}
              onSelectClient={(client) => setSelectedClient(client)}
            />
          }
        />
      ) : (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-[#3A3A3A] p-4">
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
          successType={successType}
          payconiqUrl={payconiqUrl}
        />
      )}

      {/* Dialogue de partage Facebook */}
      <Dialog open={showFacebookDialog} onOpenChange={setShowFacebookDialog}>
        <DialogContent className="w-full max-w-full sm:max-w-md mx-4 bg-[#2C2C2C] text-white border-[#3A3A3A]">
          <DialogHeader>
            <DialogTitle className="text-[#F1C40F]">Message Facebook - Caisse</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fb-message" className="text-gray-300">Message à publier</Label>
              <Textarea
                id="fb-message"
                value={facebookMessage}
                onChange={(e) => setFacebookMessage(e.target.value)}
                rows={8}
                className="resize-none bg-[#3A3A3A] border-[#4A4A4A] text-white"
              />
            </div>
            <div className="rounded-md bg-blue-900/30 border border-blue-700/30 p-3">
              <div className="flex items-start">
                <Info className="h-5 w-5 text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
                <div className="text-blue-300 text-sm">
                  <p className="font-medium mb-1">Comment publier facilement :</p>
                  <ol className="list-decimal pl-5 space-y-1">
                    <li>Cliquez sur le bouton "Copier et ouvrir Facebook"</li>
                    <li>Le message sera automatiquement copié</li>
                    <li>Collez le message (Ctrl+V) dans la fenêtre de publication Facebook qui s'ouvre</li>
                  </ol>
                  <p className="mt-2 text-xs">Groupe configuré: ID {groupId}</p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2">
            <DialogClose asChild>
              <Button variant="secondary" className="bg-[#3A3A3A] hover:bg-[#4A4A4A] text-white">Annuler</Button>
            </DialogClose>
            <Button onClick={handleCopyAndOpenFacebook} className="bg-[#1877F2] hover:bg-[#166FE5] text-white">
              {isMessageCopied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copié !
                </>
              ) : (
                <>
                  <ClipboardCopy className="h-4 w-4 mr-2" />
                  Copier et ouvrir Facebook
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Prompt d'installation pour iOS/iPad */}
      <IOSInstallPrompt />

      {/* Panneau de debug pour tester sur PC */}
      <DebugPanel />
    </div>
  );
}
