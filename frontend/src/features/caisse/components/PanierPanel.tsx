/* eslint-disable */

import type { LigneCaisse } from '@/services/type';
import { Button } from '@/components/ui/button';
import { User, CreditCard, XCircle } from 'lucide-react';
import PanierLigne from './PanierLigne';

interface SelectedClient {
  type: 'membre' | 'externe' | 'anonyme';
  id?: string;
  nom: string;
}

interface PanierPanelProps {
  lignes: LigneCaisse[];
  selectedClient: SelectedClient | null;
  onUpdateQuantity: (platId: string, delta: number) => void;
  onRemoveLine: (platId: string) => void;
  onClearCart: () => void;
  onOpenClientSelector: () => void;
  onRemoveClient: () => void;
  onPay: () => void;
}

export default function PanierPanel({
  lignes,
  selectedClient,
  onUpdateQuantity,
  onRemoveLine,
  onClearCart,
  onOpenClientSelector,
  onRemoveClient,
  onPay,
}: PanierPanelProps) {
  const total = lignes.reduce((sum, l) => sum + l.sousTotal, 0);

  return (
    <div className="flex flex-col h-full">
      {/* Client */}
      <div className="mb-3">
        {selectedClient ? (
          <div className="flex items-center gap-2 bg-[#3A3A3A] rounded-xl p-3">
            <User className="w-4 h-4 text-[#F1C40F] shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {selectedClient.nom}
              </p>
              <p className="text-gray-400 text-xs">
                {selectedClient.type === 'membre' ? 'Membre' : 'Externe'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onRemoveClient}
              className="h-7 w-7 text-gray-500 hover:text-red-400"
            >
              <XCircle className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            onClick={onOpenClientSelector}
            className="w-full h-11 bg-[#3A3A3A] text-gray-400 hover:bg-[#4A4A4A] hover:text-white rounded-xl"
          >
            <User className="w-4 h-4 mr-2" />
            Associer un client
          </Button>
        )}
      </div>

      {/* Liste des lignes */}
      <div className="flex-1 overflow-y-auto">
        {lignes.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
            Panier vide
          </div>
        ) : (
          lignes.map((ligne) => (
            <PanierLigne
              key={ligne.platId}
              ligne={ligne}
              onUpdateQuantity={onUpdateQuantity}
              onRemove={onRemoveLine}
            />
          ))
        )}
      </div>

      {/* Total + Actions */}
      <div className="mt-auto pt-3 border-t border-[#4A4A4A]">
        <div className="flex items-center justify-between mb-3">
          <span className="text-gray-400 text-sm font-medium">Total</span>
          <span className="text-[#F1C40F] font-bold text-2xl tabular-nums">
            {total.toFixed(2)}&euro;
          </span>
        </div>

        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={onClearCart}
            disabled={lignes.length === 0}
            className="flex-1 h-12 bg-[#3A3A3A] text-gray-400 hover:bg-red-500/20 hover:text-red-400 rounded-xl disabled:opacity-30"
          >
            <XCircle className="w-4 h-4 mr-2" />
            Annuler
          </Button>
          <Button
            onClick={onPay}
            disabled={lignes.length === 0}
            className="flex-[2] h-12 bg-[#F1C40F] text-[#2C2C2C] hover:bg-[#F1C40F]/90 font-bold rounded-xl disabled:opacity-30"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Encaisser
          </Button>
        </div>
      </div>
    </div>
  );
}
