/* eslint-disable */
import React, { useState, useEffect } from 'react';
import {
  UtensilsCrossed,
  Plus,
  Minus,
  Clock,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ZoneCommande, Plat, Member } from '@/services/type';
import { fetchZonesCommande, updateZoneCommande, fetchPlats } from '@/services/api';

interface FoodMenuSaturdayProps {
  member: Member;
}

export default function FoodMenuSaturday({ member }: FoodMenuSaturdayProps) {
  const [zone, setZone] = useState<ZoneCommande | null>(null);
  const [plats, setPlats] = useState<Plat[]>([]);
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState<{ [platId: string]: number }>({});
  const [existingOrder, setExistingOrder] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadMenu();
  }, [member.id]);

  const loadMenu = async () => {
    setLoading(true);
    setError('');
    try {
      const [zonesData, platsData] = await Promise.all([
        fetchZonesCommande(),
        fetchPlats()
      ]);

      // Prendre la zone de commande ouverte la plus récente
      const activeZone = zonesData.find((z: ZoneCommande) => {
        const zoneDate = new Date(z.date);
        const today = new Date();
        return zoneDate >= today && z.statut === 'ouvert';
      });

      setZone(activeZone || null);
      setPlats(platsData);

      if (activeZone) {
        // Vérifier si le membre a déjà une commande
        const memberOrder = activeZone.commandes.find(
          (cmd: any) => cmd.memberId === member.id
        );

        if (memberOrder) {
          setExistingOrder(memberOrder);
          // Remplir le panier avec la commande existante
          const existingCart: { [platId: string]: number } = {};
          memberOrder.items.forEach((item: any) => {
            // Convertir l'ID en string pour la cohérence
            existingCart[String(item.platId)] = item.quantite;
          });
          setCart(existingCart);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement du menu:', error);
      setError('Erreur lors du chargement du menu. Les endpoints /zonesCommande et /menu doivent être configurés sur votre serveur.');
    } finally {
      setLoading(false);
    }
  };

  const updateCartItem = async (platId: string, quantity: number) => {
    const newQuantity = Math.max(0, quantity);

    // Mettre à jour le panier localement
    const newCart = {
      ...cart,
      [platId]: newQuantity,
    };

    // Si quantité = 0, supprimer l'item du panier
    if (newQuantity === 0) {
      delete newCart[platId];
    }

    setCart(newCart);

    // Sauvegarder automatiquement (avec gestion d'erreur)
    await saveOrder(newCart);
  };

  const saveOrder = async (updatedCart: { [platId: string]: number }) => {
    if (!zone) return;

    setSaving(true);
    try {
      // Préparer les items de la commande
      const orderItems = Object.entries(updatedCart)
        .filter(([_, quantity]) => quantity > 0)
        .map(([platId, quantity]) => {
          const plat = findPlatById(platId);
          if (!plat) return null;
          return {
            platId: Number(platId), // Convertir en nombre pour correspondre à la structure
            platNom: plat.nom,
            quantite: quantity,
            prix: plat.prix,
          };
        })
        .filter(item => item !== null);

      // Récupérer la zone actuelle depuis l'API pour éviter les conflits
      const currentZonesData = await fetchZonesCommande();
      const currentZone = currentZonesData.find((z: ZoneCommande) => z.id === zone.id);

      if (!currentZone) {
        console.error('Zone non trouvée');
        setError('Zone de commande non trouvée');
        return;
      }

      // Préparer les commandes mises à jour
      let updatedCommandes = [...currentZone.commandes];

      if (orderItems.length === 0) {
        // Si pas d'items, supprimer la commande du membre
        updatedCommandes = updatedCommandes.filter(
          (cmd) => cmd.memberId !== member.id
        );
        setExistingOrder(null);
      } else {
        // Déterminer le statut de la commande
        const commandeStatut = determineOrderStatus(orderItems, zone);

        // Créer ou mettre à jour la commande
        const orderData = {
          memberId: member.id,
          memberName: `${member.prenom} ${member.nom}`,
          items: orderItems,
          total: calculateTotal(updatedCart),
          statut: commandeStatut,
          dateCommande: existingOrder ? existingOrder.dateCommande : new Date().toISOString(),
        };

        // Vérifier si le membre a déjà une commande
        const existingOrderIndex = updatedCommandes.findIndex(
          (cmd) => cmd.memberId === member.id
        );

        if (existingOrderIndex >= 0) {
          // Mettre à jour la commande existante
          updatedCommandes[existingOrderIndex] = orderData;
        } else {
          // Ajouter une nouvelle commande
          updatedCommandes.push(orderData);
        }

        setExistingOrder(orderData);
      }

      // Mettre à jour la zone avec les nouvelles commandes
      const updatedZone = {
        ...currentZone,
        commandes: updatedCommandes,
      };

      await updateZoneCommande(zone.id, updatedZone);
      setLastSaved(new Date());
      setError(''); // Clear any previous errors
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      setError('Erreur lors de la sauvegarde. Vérifiez que les endpoints /zonesCommande sont configurés.');

      // En cas d'erreur, marquer la commande existante comme erreur si elle existe
      if (existingOrder) {
        setExistingOrder({
          ...existingOrder,
          statut: 'erreur'
        });
      }
    } finally {
      setSaving(false);
    }
  };

  // Nouvelle fonction pour déterminer le statut de la commande
  const determineOrderStatus = (orderItems: any[], zone: ZoneCommande): 'confirmee' | 'en_attente' | 'erreur' => {
    // Vérifier si tous les plats commandés sont encore disponibles
    const allPlatsAvailable = orderItems.every(item => {
      const plat = findPlatById(String(item.platId));
      return plat && plat.disponible && zone.platsDisponibles.some(id => String(id) === String(item.platId));
    });

    if (!allPlatsAvailable) {
      return 'erreur'; // Certains plats ne sont plus disponibles
    }

    // Vérifier si la date limite est dépassée
    const isDeadlinePassed = new Date() > new Date(zone.dateLimiteCommande);
    if (isDeadlinePassed) {
      return 'erreur'; // Date limite dépassée
    }

    // Vérifier si la zone est encore ouverte
    if (zone.statut !== 'ouvert') {
      return 'erreur'; // Zone fermée
    }

    // Si tout va bien, la commande est confirmée
    return 'confirmee';
  };

  const calculateTotal = (cartData: { [platId: string]: number }) => {
    let total = 0;
    Object.entries(cartData).forEach(([platId, quantity]) => {
      const plat = findPlatById(platId);
      if (plat) {
        total += plat.prix * quantity;
      }
    });
    return total;
  };

  const findPlatById = (platId: string): Plat | null => {
    // Gérer les IDs en string et en nombre
    return plats.find((plat) => String(plat.id) === String(platId)) || null;
  };

  const getAvailablePlatsByCategory = () => {
    if (!zone) return { entrees: [], plats: [], desserts: [], boissons: [] };

    const availablePlats = plats.filter(plat =>
      // Gérer les IDs en string et en nombre
      zone.platsDisponibles.some(id => String(id) === String(plat.id)) && plat.disponible
    );

    return {
      entrees: availablePlats.filter(p => p.categorie === 'entree'),
      plats: availablePlats.filter(p => p.categorie === 'plat'),
      desserts: availablePlats.filter(p => p.categorie === 'dessert'),
      boissons: availablePlats.filter(p => p.categorie === 'boisson'),
    };
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });

  const formatLimitDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });

  const renderMenuSection = (
    title: string,
    items: Plat[],
    icon: React.ReactNode
  ) => (
    <div className="space-y-3">
      <h3 className="font-semibold flex items-center gap-2">
        {icon}
        {title}
      </h3>
      <div className="space-y-2">
        {items.map((plat) => (
          <div
            key={plat.id}
            className="flex items-center justify-between p-3 border rounded-lg"
          >
            <div className="flex-1">
              <h4 className="font-medium">{plat.nom}</h4>
              {plat.description && (
                <p className="text-sm text-gray-600">{plat.description}</p>
              )}
              {plat.allergenes && plat.allergenes.length > 0 && (
                <div className="flex gap-1 mt-1">
                  {plat.allergenes.map((allergene) => (
                    <Badge
                      key={allergene}
                      variant="outline"
                      className="text-xs"
                    >
                      {allergene}
                    </Badge>
                  ))}
                </div>
              )}
              <p className="text-lg font-semibold text-green-600 mt-1">
                {plat.prix.toFixed(2)} €
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  updateCartItem(String(plat.id), (cart[String(plat.id)] || 0) - 1)
                }
                disabled={(cart[String(plat.id)] || 0) === 0 || saving}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="w-8 text-center font-medium">
                {cart[String(plat.id)] || 0}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  updateCartItem(String(plat.id), (cart[String(plat.id)] || 0) + 1)
                }
                disabled={saving}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="w-full">
        <div className="text-center py-4">Chargement...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        <div className="text-center py-4 text-red-500 bg-red-50 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  if (!zone) {
    return (
      <div className="w-full">
        <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">
          <UtensilsCrossed className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p>Aucun menu disponible pour le moment</p>
          <p className="text-sm mt-1">
            {plats.length > 0 ? 'La zone sera bientôt disponible.' : 'Aucun plat n\'est encore configuré.'}
          </p>
        </div>
      </div>
    );
  }

  const hasItems = Object.values(cart).some((qty) => qty > 0);
  const isDeadlinePassed = new Date() > new Date(zone.dateLimiteCommande);
  const totalPrice = calculateTotal(cart);
  const platsByCategory = getAvailablePlatsByCategory();

  return (
    <div className="w-full space-y-4">
      {/* En-tête du menu */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">{zone.nom}</h3>
          {existingOrder && (
            <Badge
              variant={
                existingOrder.statut === 'confirmee' ? 'default' :
                existingOrder.statut === 'erreur' ? 'destructive' :
                'secondary'
              }
            >
              {existingOrder.statut === 'confirmee' ? 'Confirmée' :
               existingOrder.statut === 'erreur' ? 'Erreur' :
               existingOrder.statut === 'en_attente' ? 'En attente' :
               existingOrder.statut}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="h-4 w-4" />
          <span>
            Jusqu'au {formatLimitDate(zone.dateLimiteCommande)}
          </span>
        </div>
      </div>

      {/* Indicateur de sauvegarde */}
      {(saving || lastSaved) && (
        <div className="flex items-center gap-2 text-sm">
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
              <span className="text-blue-600">Sauvegarde en cours...</span>
            </>
          ) : (
            <>
              <Check className="h-3 w-3 text-green-600" />
              <span className="text-green-600">
                Sauvegardé à {lastSaved?.toLocaleTimeString('fr-FR')}
              </span>
            </>
          )}
        </div>
      )}

      {isDeadlinePassed ? (
        <div className="text-center py-4 text-orange-600 bg-orange-50 rounded-lg">
          ⚠️ La date limite pour commander est dépassée
        </div>
      ) : (
        <div className="space-y-4">
          {/* Sections du menu */}
          {platsByCategory.entrees.length > 0 && (
            <>
              {renderMenuSection('Entrées', platsByCategory.entrees, '🥗')}
              <Separator />
            </>
          )}

          {platsByCategory.plats.length > 0 && (
            <>
              {renderMenuSection('Plats', platsByCategory.plats, '🍽️')}
              <Separator />
            </>
          )}

          {platsByCategory.desserts.length > 0 && (
            <>
              {renderMenuSection('Desserts', platsByCategory.desserts, '🍰')}
              <Separator />
            </>
          )}

          {platsByCategory.boissons.length > 0 && (
            <>
              {renderMenuSection('Boissons', platsByCategory.boissons, '🥤')}
            </>
          )}

          {/* Récapitulatif total (affiché seulement s'il y a des items) */}
          {hasItems && (
            <div className="sticky bottom-0 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Total de votre commande</span>
                <span className="text-lg font-bold text-green-600">
                  {totalPrice.toFixed(2)} €
                </span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-gray-500">
                  {existingOrder?.statut === 'confirmee' ? 'Commande confirmée et sauvegardée' :
                   existingOrder?.statut === 'erreur' ? 'Erreur dans la commande - Vérifiez les plats' :
                   'Votre commande est automatiquement sauvegardée'}
                </p>
                {existingOrder?.statut === 'erreur' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => loadMenu()}
                    className="text-xs"
                  >
                    Actualiser
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
