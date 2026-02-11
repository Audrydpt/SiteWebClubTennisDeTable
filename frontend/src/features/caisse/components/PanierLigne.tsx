import type { LigneCaisse } from '@/services/type';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Trash2 } from 'lucide-react';

interface PanierLigneProps {
  ligne: LigneCaisse;
  onUpdateQuantity: (platId: string, delta: number) => void;
  onRemove: (platId: string) => void;
}

export default function PanierLigne({
  ligne,
  onUpdateQuantity,
  onRemove,
}: PanierLigneProps) {
  return (
    <div className="flex items-center gap-2 py-2 border-b border-[#4A4A4A]">
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate">{ligne.platNom}</p>
        <p className="text-gray-400 text-xs">
          {ligne.prixUnitaire.toFixed(2)}&euro; / unite
        </p>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onUpdateQuantity(ligne.platId, -1)}
          className="h-8 w-8 rounded-lg bg-[#4A4A4A] text-white hover:bg-[#555]"
        >
          <Minus className="w-3 h-3" />
        </Button>
        <span className="text-white font-bold text-sm w-8 text-center tabular-nums">
          {ligne.quantite}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onUpdateQuantity(ligne.platId, 1)}
          className="h-8 w-8 rounded-lg bg-[#4A4A4A] text-white hover:bg-[#555]"
        >
          <Plus className="w-3 h-3" />
        </Button>
      </div>

      <span className="text-[#F1C40F] font-bold text-sm w-16 text-right tabular-nums">
        {ligne.sousTotal.toFixed(2)}&euro;
      </span>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => onRemove(ligne.platId)}
        className="h-8 w-8 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}
