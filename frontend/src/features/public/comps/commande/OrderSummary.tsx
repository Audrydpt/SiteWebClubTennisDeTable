/* eslint-disable */
import { Trash2, ShoppingCart, Package, Edit, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Mousse, Bois, Autre, CommandeItem } from '@/services/type.ts';
import { ReactNode } from 'react';

interface OrderSummaryProps {
  mousses: Mousse[];
  bois: Bois[];
  autres: Autre[];
  onRemoveMousse: (index: number) => void;
  onRemoveBois: (index: number) => void;
  onRemoveAutre: (index: number) => void;
  onSave: () => void;
  isLoading: boolean;
  memberName: string;
  userItems: CommandeItem[];
  userCommandedTotal: number;
  onEditItem: (item: CommandeItem) => void;
  onDeleteItem: (item: CommandeItem) => ReactNode;
  isOrderOpen?: boolean;
}

export function OrderSummary({
  mousses,
  bois,
  autres,
  onRemoveMousse,
  onRemoveBois,
  onRemoveAutre,
  onSave,
  isLoading,
  memberName,
  userItems = [],
  userCommandedTotal = 0,
  onEditItem,
  onDeleteItem,
  isOrderOpen = true,
}: OrderSummaryProps) {
  const totalItems = mousses.length + bois.length + autres.length;
  const totalPrice = [
    ...mousses.map((m) => (m.prix || 0) * (m.quantity || 1)),
    ...bois.map((b) => (b.prix || 0) * (b.quantity || 1)),
    ...autres.map((a) => (a.prix || 0) * (a.quantity || 1)),
  ].reduce((sum, price) => sum + price, 0);

  return (
    <Card className="sticky top-6 bg-white shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="bg-[#F1C40F] p-3 rounded-full">
            <ShoppingCart className="w-5 h-5 text-[#3A3A3A]" />
          </div>
          Ma commande
          {totalItems > 0 && (
            <Badge
              variant="secondary"
              className="bg-[#F1C40F] text-[#3A3A3A] rounded-full"
            >
              {totalItems}
            </Badge>
          )}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Commande pour {memberName}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Articles déjà commandés */}
        {userItems.length > 0 && (
          <>
            <div className="flex items-center gap-2 text-sm font-medium text-green-700">
              <Package className="w-4 h-4" />
              Articles déjà commandés
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {userItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 bg-green-50 rounded-lg border border-green-200"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate text-green-800">
                      {item.name}
                    </p>
                    <p className="text-xs text-green-600">
                      {item.fournisseur} • {item.category} • Qté: {item.quantity} • Prix unitaire: {parseFloat(item.price).toFixed(2)}€
                      {item.epaisseur && ` • ${item.epaisseur}`}
                      {item.couleur && ` • ${item.couleur}`}
                      {item.type && ` • ${item.type}`}
                      {item.description && ` • ${item.description}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-sm text-green-700 mr-2">
                      {(parseFloat(item.price) * parseInt(item.quantity)).toFixed(2)} €
                    </span>
                    {onEditItem && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-full"
                        onClick={() => onEditItem(item)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                    )}
                    {onDeleteItem && onDeleteItem(item)}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center text-sm font-medium text-green-700">
              <span>Sous-total commandé</span>
              <span>{userCommandedTotal.toFixed(2)} €</span>
            </div>
            <Separator />
          </>
        )}

        {totalItems === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <div className="bg-gray-100 p-4 rounded-full w-fit mx-auto mb-3">
              <ShoppingCart className="w-12 h-12 text-gray-400" />
            </div>
            <p>Votre panier est vide</p>
            <p className="text-sm">Ajoutez des articles pour commencer</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 text-sm font-medium">
              <ShoppingCart className="w-4 h-4" />
              Nouveaux articles à ajouter
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {mousses.map((mousse, index) => (
                <div
                  key={`mousse-${index}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {mousse.nom}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {mousse.marque} • {mousse.epaisseur} • {mousse.couleur}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">
                      {((mousse.prix || 0) * (mousse.quantity || 1)).toFixed(2)} €
                    </span>
                    <span className="text-xs text-muted-foreground">
                      (Qté: {mousse.quantity || 1})
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full"
                      onClick={() => onRemoveMousse(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {bois.map((b, index) => (
                <div
                  key={`bois-${index}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {b.nom}
                    </p>
                    <p className="text-xs text-muted-foreground">{b.marque} • {b.type}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">
                      {((b.prix || 0) * (b.quantity || 1)).toFixed(2)} €
                    </span>
                    <span className="text-xs text-muted-foreground">
                      (Qté: {b.quantity || 1})
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full"
                      onClick={() => onRemoveBois(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {autres.map((autre, index) => (
                <div
                  key={`autre-${index}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{autre.nom}</p>
                    <p className="text-xs text-muted-foreground">
                      {autre.marque}
                      {autre.description && ` • ${autre.description}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">
                      {((autre.prix || 0) * (autre.quantity || 1)).toFixed(2)} €
                    </span>
                    <span className="text-xs text-muted-foreground">
                      (Qté: {autre.quantity || 1})
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full"
                      onClick={() => onRemoveAutre(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            <div className="flex justify-between items-center text-sm text-muted-foreground border-t pt-2">
              <span>Total</span>
              <span>{totalPrice.toFixed(2)} €</span>
            </div>

            {userCommandedTotal > 0 && (
              <div className="flex justify-between items-center text-lg font-bold">
              <span>Total général</span>
              <span className="text-[#F1C40F]">{(userCommandedTotal + totalPrice).toFixed(2)} €</span>
          </div>
            )}

            <Button
              onClick={onSave}
              disabled={isLoading || totalItems === 0 || !isOrderOpen}
              className="w-full bg-[#F1C40F] hover:bg-[#F39C12] text-[#3A3A3A] font-medium"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : !isOrderOpen ? (
                'Commande fermée'
              ) : (
                `Enregistrer (${totalItems} article${totalItems > 1 ? 's' : ''})`
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
