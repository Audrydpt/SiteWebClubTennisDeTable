/* eslint-disable */

import { useState, useEffect } from 'react';
import { Calendar, AlertCircle, Zap, User } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ProductForm } from '@/features/public/comps/commande/ProductForm.tsx';
import { OrderSummary } from '@/features/public/comps/commande/OrderSummary.tsx';
import { GlobalOrderBar } from '@/features/public/comps/commande/GlobalOrder.tsx';
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
} from '@/services/api.ts';

export default function OrderPage() {
  const { user, getMemberId } = useAuth();
  const [mousses, setMousses] = useState<Mousse[]>([]);
  const [bois, setBois] = useState<Bois[]>([]);
  const [autres, setAutres] = useState<Autre[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [currentCommande, setCurrentCommande] = useState<Commande | null>(null);
  const [userItems, setUserItems] = useState<CommandeItem[]>([]);

  const orderDeadline = new Date('2025-02-15');
  const isOrderOpen = new Date() <= orderDeadline;

  // Charger les commandes existantes
  useEffect(() => {
    const loadCommandes = async () => {
      try {
        const data = await fetchCommandes();
        setCommandes(data);

        // Trouver la commande en cours (statut "open")
        const openCommande = data.find((c) => c.statut === 'open');
        setCurrentCommande(openCommande || null);

        // Charger les items de l'utilisateur actuel
        const memberId = getMemberId();
        if (openCommande && memberId) {
          const memberItems = openCommande.items.filter(
            item => item.memberId === memberId
          );
          setUserItems(memberItems);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des commandes:', error);
      }
    };

    loadCommandes();
  }, [getMemberId]);

  const formatDateFR = (date: Date) =>
    date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const currentUserTotal = [...mousses, ...bois, ...autres].reduce(
    (total, item) => total + (item.prix || 0),
    0
  );

  // Total des items déjà commandés par l'utilisateur
  const userCommandedTotal = userItems.reduce(
    (total, item) => total + parseFloat(item.price),
    0
  );

  const handleAddMousse = (mousse: Mousse) => {
    setMousses((prev) => [...prev, mousse]);
  };

  const handleAddBois = (b: Bois) => {
    setBois((prev) => [...prev, b]);
  };

  const handleAddAutre = (autre: Autre) => {
    setAutres((prev) => [...prev, autre]);
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
      alert('Erreur: utilisateur non connecté');
      return;
    }

    if (currentUserTotal === 0) {
      alert('Veuillez ajouter au moins un article à votre commande');
      return;
    }

    setIsLoading(true);

    try {
      // Obtenir ou créer une commande ouverte
      const commande = await getOrCreateOpenCommande();
      setCurrentCommande(commande);

      // Créer les items pour tous les produits ajoutés
      const items: Omit<CommandeItem, 'id'>[] = [
        ...mousses.map((m) => ({
          name: `${m.marque} ${m.nom}`,
          price: (m.prix || 0).toString(),
          epaisseur: m.epaisseur,
          quantity: '1',
          category: 'mousse' as const,
          memberId,
        })),
        ...bois.map((b) => ({
          name: `${b.marque} ${b.nom}`,
          price: (b.prix || 0).toString(),
          quantity: '1',
          category: 'bois' as const,
          memberId,
        })),
        ...autres.map((a) => ({
          name: a.nom,
          price: (a.prix || 0).toString(),
          quantity: '1',
          category: 'autre' as const,
          memberId,
        })),
      ];

      // Ajouter chaque item à la commande
      let updatedCommande = commande;
      for (const item of items) {
        updatedCommande = await addItemToCommande(updatedCommande.id, item);
      }

      // Recharger les commandes
      const updatedCommandes = await fetchCommandes();
      setCommandes(updatedCommandes);

      // Mettre à jour la commande courante
      const newCurrentCommande = updatedCommandes.find(c => c.id === updatedCommande.id);
      setCurrentCommande(newCurrentCommande || null);

      // Mettre à jour les items de l'utilisateur
      if (newCurrentCommande) {
        const newUserItems = newCurrentCommande.items.filter(
          item => item.memberId === memberId
        );
        setUserItems(newUserItems);
      }

      // Réinitialiser le panier
      setMousses([]);
      setBois([]);
      setAutres([]);

      alert('Commande enregistrée avec succès !');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde de la commande');
    } finally {
      setIsLoading(false);
    }
  };

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
      <div className="bg-[#F1C40F] text-[#3A3A3A]">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-balance">
                Commande d'équipement
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <div className="bg-white p-2 rounded-full">
                  <User className="w-4 h-4 text-[#3A3A3A]" />
                </div>
                <p className="font-semibold">
                  Connecté en tant que {memberName}
                </p>
              </div>
              {userCommandedTotal > 0 && (
                <p className="text-sm opacity-80 mt-1">
                  Déjà commandé: {userCommandedTotal.toFixed(2)}€
                </p>
              )}
            </div>
            <div className="flex items-center gap-3 bg-white/20 rounded-lg px-4 py-3">
              <div className="bg-white p-2 rounded-full">
                <Calendar className="w-5 h-5 text-[#3A3A3A]" />
              </div>
              <div className="text-right">
                <p className="text-sm opacity-80">Date limite</p>
                <p className="font-bold">{formatDateFR(orderDeadline)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <GlobalOrderBar
          currentUserTotal={currentUserTotal}
          mousses={mousses}
          bois={bois}
          autres={autres}
          commandes={commandes}
        />

        {/* Status Alert */}
        {isOrderOpen ? (
          <Alert className="mb-8 border-green-200 bg-green-50 text-green-800">
            <div className="bg-green-100 p-2 rounded-full inline-flex">
              <AlertCircle className="h-4 w-4 text-green-600" />
            </div>
            <AlertDescription>
              <strong>Commandes ouvertes !</strong> Vous pouvez encore passer
              votre commande jusqu'au {formatDateFR(orderDeadline)}.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="mb-8 border-destructive/20 bg-destructive/5 text-destructive">
            <div className="bg-destructive/10 p-2 rounded-full inline-flex">
              <AlertCircle className="h-4 w-4 text-destructive" />
            </div>
            <AlertDescription>
              <strong>Commandes fermées.</strong> La période de commande s'est
              terminée le {formatDateFR(orderDeadline)}.
            </AlertDescription>
          </Alert>
        )}

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
            />
          </div>
        </div>
      </div>
    </div>
  );
}
