/* eslint-disable */

import { useState, useEffect } from 'react';
import { Calendar, AlertCircle, Zap, User, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ProductForm } from '@/features/public/comps/commande/ProductForm.tsx';
import { OrderSummary } from '@/features/public/comps/commande/OrderSummary.tsx';
import { GlobalOrderBar } from '@/features/public/comps/commande/GlobalOrder.tsx';
import { EditItemModal } from '@/features/public/comps/commande/EditItemModal.tsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Mousse,
  Bois,
  Autre,
  Commande,
  CommandeItem,
} from '@/services/type.ts';
import { useAuth } from '@/lib/authContext.tsx';
import {
  fetchCommandes,
  addItemToCommande,
  getOrCreateOpenCommande,
  updateCommandeItem,
  deleteCommandeItem,
} from '@/services/api.ts';

export default function OrderPage() {
  const { user, getMemberId } = useAuth();
  const [mousses, setMousses] = useState<Mousse[]>([]);
  const [bois, setBois] = useState<Bois[]>([]);
  const [autres, setAutres] = useState<Autre[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentCommande, setCurrentCommande] = useState<Commande | null>(null);
  const [userItems, setUserItems] = useState<CommandeItem[]>([]);
  const [editingItem, setEditingItem] = useState<CommandeItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditLoading, setIsEditLoading] = useState(false);

  // États pour les confirmations
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [dialogMessage, setDialogMessage] = useState('');
  const [itemToDelete, setItemToDelete] = useState<CommandeItem | null>(null);

  // Calculer la date limite et le statut de la commande dynamiquement
  const getOrderDeadline = () => {
    if (currentCommande?.dateFin) {
      return new Date(currentCommande.dateFin);
    }
    return null;
  };

  const getIsOrderOpen = () => {
    const deadline = getOrderDeadline();
    if (!deadline) return currentCommande?.statut === 'open';
    return new Date() <= deadline && currentCommande?.statut === 'open';
  };

  const getRemainingDays = () => {
    const deadline = getOrderDeadline();
    if (!deadline) return null;

    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  };

  const orderDeadline = getOrderDeadline();
  const isOrderOpen = getIsOrderOpen();
  const remainingDays = getRemainingDays();

  // Charger uniquement la commande ouverte
  useEffect(() => {
    const loadOpenCommande = async () => {
      try {
        const data = await fetchCommandes();

        // Trouver la commande en cours (statut "open")
        const openCommande = data.find((c) => c.statut === 'open');
        setCurrentCommande(openCommande || null);

        // Charger les items de l'utilisateur actuel
        const memberId = getMemberId();
        if (openCommande && memberId) {
          const memberGroup = openCommande.members.find(m => m.memberId === memberId);
          setUserItems(memberGroup?.items || []);
        }
      } catch (error) {
        console.error('Erreur lors du chargement de la commande ouverte:', error);
      }
    };

    loadOpenCommande();
  }, [getMemberId]);

  const formatDateFR = (date: Date) =>
    date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const currentUserTotal = [
    ...mousses.map((m) => (m.prix || 0) * (m.quantity || 1)),
    ...bois.map((b) => (b.prix || 0) * (b.quantity || 1)),
    ...autres.map((a) => (a.prix || 0) * (a.quantity || 1)),
  ].reduce((sum, price) => sum + price, 0);

  // Total des items déjà commandés par l'utilisateur (avec quantité)
  const userCommandedTotal = userItems.reduce(
    (total, item) => total + (parseFloat(item.price) * parseInt(item.quantity)),
    0
  );

  const handleAddMousse = (product: Mousse | Bois | Autre) => {
    if ('epaisseur' in product && 'couleur' in product) {
      setMousses((prev) => [...prev, product as Mousse]);
    }
  };

  const handleAddBois = (product: Mousse | Bois | Autre) => {
    if ('type' in product && !('epaisseur' in product)) {
      setBois((prev) => [...prev, product as Bois]);
    }
  };

  const handleAddAutre = (product: Mousse | Bois | Autre) => {
    if ('description' in product || (!('epaisseur' in product) && !('type' in product))) {
      setAutres((prev) => [...prev, product as Autre]);
    }
  };

  const handleRemoveMousse = (index: number) => {
    setMousses((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveBois = (index: number) => {
    setBois((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveAutre = (index: number) => {
    setAutres((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveOrder = async () => {
    const memberId = getMemberId();
    if (!memberId) {
      setDialogMessage('Erreur: utilisateur non connecté');
      setShowErrorDialog(true);
      return;
    }

    if (currentUserTotal === 0) {
      setDialogMessage('Veuillez ajouter au moins un article à votre commande');
      setShowErrorDialog(true);
      return;
    }

    setIsLoading(true);

    try {
      // Obtenir ou créer une commande ouverte
      const commande = await getOrCreateOpenCommande();
      setCurrentCommande(commande);

      // Créer les items pour tous les produits ajoutés
      const items: (Omit<CommandeItem, 'id'> & { memberId: string })[] = [
        ...mousses.map((m) => ({
          name: m.nom,
          price: (m.prix || 0).toString(),
          epaisseur: m.epaisseur,
          couleur: m.couleur,
          quantity: (m.quantity || 1).toString(),
          category: 'mousse' as const,
          fournisseur: m.marque,
          memberId,
        })),
        ...bois.map((b) => ({
          name: b.nom,
          price: (b.prix || 0).toString(),
          quantity: (b.quantity || 1).toString(),
          category: 'bois' as const,
          fournisseur: b.marque,
          memberId,
        })),
        ...autres.map((a) => ({
          name: a.nom,
          price: (a.prix || 0).toString(),
          quantity: (a.quantity || 1).toString(),
          category: 'autre' as const,
          fournisseur: a.marque,
          memberId,
        })),
      ];

      // Ajouter chaque item à la commande
      let updatedCommande = commande;
      for (const item of items) {
        updatedCommande = await addItemToCommande(updatedCommande.id, item);
      }

      // Recharger la commande ouverte
      const allCommandes = await fetchCommandes();
      const newCurrentCommande = allCommandes.find(c => c.statut === 'open');
      setCurrentCommande(newCurrentCommande || null);

      // Mettre à jour les items de l'utilisateur
      if (newCurrentCommande) {
        const memberGroup = newCurrentCommande.members.find(m => m.memberId === memberId);
        setUserItems(memberGroup?.items || []);
      }

      // Réinitialiser le panier
      setMousses([]);
      setBois([]);
      setAutres([]);

      setDialogMessage('Commande enregistrée avec succès !');
      setShowSuccessDialog(true);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      setDialogMessage('Erreur lors de la sauvegarde de la commande');
      setShowErrorDialog(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditItem = (item: CommandeItem) => {
    setEditingItem(item);
    setIsEditModalOpen(true);
  };

  const handleSaveEditedItem = async (updatedItem: CommandeItem) => {
    if (!currentCommande) return;

    setIsEditLoading(true);
    try {
      await updateCommandeItem(updatedItem.id, {
        name: updatedItem.name,
        price: updatedItem.price,
        quantity: updatedItem.quantity,
        epaisseur: updatedItem.epaisseur,
        couleur: updatedItem.couleur,
        fournisseur: updatedItem.fournisseur,
        type: updatedItem.type,
        description: updatedItem.description,
      });

      // Recharger uniquement la commande ouverte
      const allCommandes = await fetchCommandes();
      const newCurrentCommande = allCommandes.find(c => c.statut === 'open');
      setCurrentCommande(newCurrentCommande || null);

      // Mettre à jour les items de l'utilisateur
      const memberId = getMemberId();
      if (newCurrentCommande && memberId) {
        const memberGroup = newCurrentCommande.members.find(m => m.memberId === memberId);
        setUserItems(memberGroup?.items || []);
      }

      setIsEditModalOpen(false);
      setEditingItem(null);
      setDialogMessage('Article modifié avec succès !');
      setShowSuccessDialog(true);
    } catch (error) {
      console.error('Erreur lors de la modification:', error);
      setDialogMessage('Erreur lors de la modification de l\'article');
      setShowErrorDialog(true);
    } finally {
      setIsEditLoading(false);
    }
  };

  const handleDeleteItem = async () => {
    if (!currentCommande || !itemToDelete) return;

    try {
      await deleteCommandeItem(itemToDelete.id);

      // Recharger uniquement la commande ouverte
      const allCommandes = await fetchCommandes();
      const newCurrentCommande = allCommandes.find(c => c.statut === 'open');
      setCurrentCommande(newCurrentCommande || null);

      // Mettre à jour les items de l'utilisateur
      const memberId = getMemberId();
      if (newCurrentCommande && memberId) {
        const memberGroup = newCurrentCommande.members.find(m => m.memberId === memberId);
        setUserItems(memberGroup?.items || []);
      }

      setDialogMessage('Article supprimé avec succès !');
      setShowSuccessDialog(true);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      setDialogMessage('Erreur lors de la suppression de l\'article');
      setShowErrorDialog(true);
    } finally {
      setItemToDelete(null);
    }
  };

  // Fonction pour créer le bouton de suppression avec confirmation
  const createDeleteButton = (item: CommandeItem) => (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full"
      onClick={() => setItemToDelete(item)}
    >
      <Trash2 className="w-3 h-3" />
    </Button>
  );

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-yellow-600" />
              <h3 className="mt-2 text-lg font-medium">Connexion requise</h3>
              <p className="mt-1 text-sm text-gray-500">
                Vous devez être connecté pour passer une commande.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const memberName = 'nom' in user ? `${user.prenom} ${user.nom}` : user.username;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#F1C40F] to-[#D4AC0D] text-white p-6 rounded-lg">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-balance">
                {currentCommande?.name || 'Commande d\'équipement'}
              </h1>
              {userCommandedTotal > 0 && (
                <p className="text-sm opacity-80 mt-1">
                  Sous total : {userCommandedTotal.toFixed(2)}€
                </p>
              )}
            </div>

            {/* Affichage dynamique de la date limite et du décompte */}
            {orderDeadline ? (
              <div className="flex items-center gap-3 bg-white/20 rounded-lg px-4 py-3">
                <div className="bg-white p-2 rounded-full">
                  <Calendar className="w-5 h-5 text-[#3A3A3A]" />
                </div>
                <div className="text-right">
                  <p className="text-sm opacity-80">Date limite</p>
                  <p className="font-bold">{formatDateFR(orderDeadline)}</p>
                  {remainingDays !== null && (
                    <p className={`text-xs ${remainingDays <= 3 ? 'text-red-800 font-bold' : remainingDays <= 7 ? 'text-orange-800' : 'opacity-70'}`}>
                      {remainingDays > 0
                        ? `${remainingDays} jour${remainingDays > 1 ? 's' : ''} restant${remainingDays > 1 ? 's' : ''}`
                        : remainingDays === 0
                          ? 'Dernier jour !'
                          : 'Commande fermée'
                      }
                    </p>
                  )}
                </div>
              </div>
            ) : currentCommande?.statut === 'open' ? (
              <div className="flex items-center gap-3 bg-white/20 rounded-lg px-4 py-3">
                <div className="bg-white p-2 rounded-full">
                  <Calendar className="w-5 h-5 text-[#3A3A3A]" />
                </div>
                <div className="text-right">
                  <p className="text-sm opacity-80">Statut</p>
                  <p className="font-bold">Commande ouverte</p>
                  <p className="text-xs opacity-70">Pas de limite définie</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-red-500/20 rounded-lg px-4 py-3">
                <div className="bg-white p-2 rounded-full">
                  <Calendar className="w-5 h-5 text-[#3A3A3A]" />
                </div>
                <div className="text-right">
                  <p className="text-sm opacity-80">Statut</p>
                  <p className="font-bold">Commande fermée</p>
                </div>
              </div>
            )}
          </div>

          {/* Alerte si la commande est fermée ou bientôt fermée */}
          {!isOrderOpen && (
            <Alert className="mt-4 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                Cette commande est fermée. Vous ne pouvez plus ajouter d'articles.
              </AlertDescription>
            </Alert>
          )}

          {remainingDays !== null && remainingDays <= 3 && remainingDays > 0 && (
            <Alert className="mt-4 border-orange-200 bg-orange-50">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                ⏰ Plus que {remainingDays} jour{remainingDays > 1 ? 's' : ''} pour passer votre commande !
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <GlobalOrderBar
          currentUserTotal={currentUserTotal}
          commandes={currentCommande ? [currentCommande] : []}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Product Selection */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className="bg-[#F1C40F] p-3 rounded-full">
                    <Zap className="h-6 w-6 text-[#3A3A3A]" />
                  </div>
                  Ajouter des équipements
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isOrderOpen ? (
                  <Tabs defaultValue="mousses" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-6 bg-gray-100">
                      <TabsTrigger
                        value="mousses"
                        className="data-[state=active]:bg-[#F1C40F] data-[state=active]:text-[#3A3A3A] rounded-lg"
                      >
                        Mousses
                      </TabsTrigger>
                      <TabsTrigger
                        value="bois"
                        className="data-[state=active]:bg-[#F1C40F] data-[state=active]:text-[#3A3A3A] rounded-lg"
                      >
                        Bois
                      </TabsTrigger>
                      <TabsTrigger
                        value="autres"
                        className="data-[state=active]:bg-[#F1C40F] data-[state=active]:text-[#3A3A3A] rounded-lg"
                      >
                        Accessoires
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="mousses" className="space-y-4">
                      <ProductForm category="mousse" onAdd={handleAddMousse} />
                    </TabsContent>

                    <TabsContent value="bois" className="space-y-4">
                      <ProductForm category="bois" onAdd={handleAddBois} />
                    </TabsContent>

                    <TabsContent value="autres" className="space-y-4">
                      <ProductForm category="autre" onAdd={handleAddAutre} />
                    </TabsContent>
                  </Tabs>
                ) : (
                  <div className="text-center py-12">
                    <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Commande fermée
                    </h3>
                    <p className="text-gray-500">
                      Cette commande n'accepte plus de nouveaux articles.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <OrderSummary
              mousses={mousses}
              bois={bois}
              autres={autres}
              onRemoveMousse={handleRemoveMousse}
              onRemoveBois={handleRemoveBois}
              onRemoveAutre={handleRemoveAutre}
              onSave={handleSaveOrder}
              isLoading={isLoading}
              memberName={memberName}
              userItems={userItems}
              userCommandedTotal={userCommandedTotal}
              onEditItem={handleEditItem}
              onDeleteItem={createDeleteButton}
              isOrderOpen={isOrderOpen}
            />
          </div>
        </div>

        {/* Edit Item Modal */}
        <EditItemModal
          item={editingItem}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingItem(null);
          }}
          onSave={handleSaveEditedItem}
          isLoading={isEditLoading}
        />

        {/* Success Dialog */}
        <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <DialogContent className="sm:max-w-[425px] mx-4">
            <DialogHeader>
              <DialogTitle className="text-green-600">Succès</DialogTitle>
              <DialogDescription>
                {dialogMessage}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                onClick={() => setShowSuccessDialog(false)}
                className="w-full"
              >
                OK
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Error Dialog */}
        <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
          <DialogContent className="sm:max-w-[425px] mx-4">
            <DialogHeader>
              <DialogTitle className="text-red-600">Erreur</DialogTitle>
              <DialogDescription>
                {dialogMessage}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                onClick={() => setShowErrorDialog(false)}
                className="w-full"
                variant="outline"
              >
                OK
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
          <DialogContent className="sm:max-w-[425px] mx-4">
            <DialogHeader>
              <DialogTitle>Supprimer l'article</DialogTitle>
              <DialogDescription>
                {itemToDelete && `Voulez-vous vraiment supprimer "${itemToDelete.name}" de votre commande ?`}
              </DialogDescription>
            </DialogHeader>
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">
                ⚠️ Cette action est irréversible.
              </p>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setItemToDelete(null)}
                className="w-full sm:w-auto"
              >
                Annuler
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteItem}
                className="w-full sm:w-auto"
              >
                Supprimer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
