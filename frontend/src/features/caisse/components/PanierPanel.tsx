/* eslint-disable */

import type { LigneCaisse } from '@/services/type';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User, CreditCard, XCircle, AlertTriangle } from 'lucide-react';
import PanierLigne from './PanierLigne';

interface SelectedClient {
  type: 'membre' | 'externe' | 'anonyme' | 'club';
  id?: string;
  nom: string;
}

interface PanierPanelProps {
  lignes: LigneCaisse[];
  selectedClient: SelectedClient | null;
  hasSoldeOuvert: boolean;
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
  hasSoldeOuvert,
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
      {/* Avertissement si pas de caisse ouverte */}
      {!hasSoldeOuvert && lignes.length > 0 && (
        <div className="mb-3 flex items-center gap-2 bg-orange-500/20 border border-orange-500/50 rounded-lg p-2.5 text-orange-400">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span className="text-xs font-medium">Attention : Aucune caisse ouverte</span>
        </div>
      )}

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
                {selectedClient.type === 'membre'
                  ? 'Membre'
                  : selectedClient.type === 'externe'
                  ? 'Externe'
                  : selectedClient.type === 'club'
                  ? 'Équipe/Club'
                  : 'Anonyme'}
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
      <ScrollArea className="flex-1 min-h-0">
        {lignes.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
            Panier vide
          </div>
        ) : (
          <div className="pr-4">
            {lignes.map((ligne) => (
              <PanierLigne
                key={ligne.platId}
                ligne={ligne}
                onUpdateQuantity={onUpdateQuantity}
                onRemove={onRemoveLine}
              />
            ))}
          </div>
        )}
      </ScrollArea>

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
