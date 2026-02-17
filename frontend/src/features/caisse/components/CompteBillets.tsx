/* eslint-disable */
import { useState, useMemo } from 'react';
import { X, Calculator, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CompteBilletsProps {
  montantCash: number; // montant actuel en caisse (cash uniquement)
  onClose: () => void;
}

const BILLETS: { valeur: number; label: string }[] = [
  { valeur: 500, label: '500 €' },
  { valeur: 200, label: '200 €' },
  { valeur: 100, label: '100 €' },
  { valeur: 50, label: '50 €' },
  { valeur: 20, label: '20 €' },
  { valeur: 10, label: '10 €' },
  { valeur: 5, label: '5 €' },
];

const PIECES: { valeur: number; label: string }[] = [
  { valeur: 2, label: '2 €' },
  { valeur: 1, label: '1 €' },
  { valeur: 0.5, label: '50 ¢' },
  { valeur: 0.2, label: '20 ¢' },
  { valeur: 0.1, label: '10 ¢' },
  { valeur: 0.05, label: '5 ¢' },
  { valeur: 0.02, label: '2 ¢' },
  { valeur: 0.01, label: '1 ¢' },
];

export default function CompteBillets({
  montantCash,
  onClose,
}: CompteBilletsProps) {
  const [quantites, setQuantites] = useState<Record<number, number>>({});

  const updateQty = (valeur: number, delta: number) => {
    setQuantites((prev) => {
      const current = prev[valeur] ?? 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [valeur]: next };
    });
  };

  const handleInput = (valeur: number, raw: string) => {
    const parsed = parseInt(raw, 10);
    setQuantites((prev) => ({
      ...prev,
      [valeur]: isNaN(parsed) || parsed < 0 ? 0 : parsed,
    }));
  };

  const montantCompte = useMemo(() => {
    return [...BILLETS, ...PIECES].reduce((sum, { valeur }) => {
      return sum + (quantites[valeur] ?? 0) * valeur;
    }, 0);
  }, [quantites]);

  const ecart = montantCompte - montantCash;
  const ecartAbs = Math.abs(ecart);
  const isExact = ecartAbs < 0.005;
  const isPositif = ecart > 0.005;

  const ecartColor = isExact
    ? 'text-green-400'
    : isPositif
      ? 'text-blue-400'
      : 'text-red-400';

  const ecartBg = isExact
    ? 'bg-green-400/10 border border-green-400/30'
    : isPositif
      ? 'bg-blue-400/10 border border-blue-400/30'
      : 'bg-red-400/10 border border-red-400/30';

  const EcartIcon = isExact ? Minus : isPositif ? TrendingUp : TrendingDown;

  const renderLigne = (valeur: number, label: string, isBillet: boolean) => {
    const qty = quantites[valeur] ?? 0;
    const sousTotal = qty * valeur;

    return (
      <div
        key={valeur}
        className="flex items-center gap-3 py-2 px-3 rounded-lg bg-[#3A3A3A]"
      >
        {/* Badge valeur */}
        <div
          className={`min-w-[56px] text-center px-2 py-1 rounded-md text-sm font-bold ${
            isBillet
              ? 'bg-[#F1C40F]/20 text-[#F1C40F]'
              : 'bg-gray-600/40 text-gray-300'
          }`}
        >
          {label}
        </div>

        {/* Contrôle quantité */}
        <div className="flex items-center gap-1 flex-1">
          <button
            onClick={() => updateQty(valeur, -1)}
            className="w-7 h-7 flex items-center justify-center rounded bg-[#4A4A4A] text-gray-300 hover:bg-[#5A5A5A] active:scale-95 text-lg leading-none select-none"
          >
            −
          </button>
          <input
            type="number"
            min={0}
            value={qty === 0 ? '' : qty}
            placeholder="0"
            onChange={(e) => handleInput(valeur, e.target.value)}
            className="w-14 h-7 text-center bg-[#4A4A4A] text-white text-sm rounded border-none outline-none tabular-nums"
          />
          <button
            onClick={() => updateQty(valeur, 1)}
            className="w-7 h-7 flex items-center justify-center rounded bg-[#4A4A4A] text-gray-300 hover:bg-[#5A5A5A] active:scale-95 text-lg leading-none select-none"
          >
            +
          </button>
        </div>

        {/* Sous-total */}
        <div className="min-w-[70px] text-right">
          {sousTotal > 0 ? (
            <span className="text-white text-sm font-semibold tabular-nums">
              {sousTotal.toFixed(2)} €
            </span>
          ) : (
            <span className="text-gray-600 text-sm">—</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#2C2C2C] rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Calculator className="w-5 h-5 text-[#F1C40F]" />
            <h2 className="text-white font-bold text-lg">Comptage de caisse</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {/* Billets */}
          <div>
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">
              Billets
            </p>
            <div className="space-y-2">
              {BILLETS.map(({ valeur, label }) =>
                renderLigne(valeur, label, true)
              )}
            </div>
          </div>

          {/* Pièces */}
          <div>
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">
              Pièces
            </p>
            <div className="space-y-2">
              {PIECES.map(({ valeur, label }) =>
                renderLigne(valeur, label, false)
              )}
            </div>
          </div>
        </div>

        {/* Footer — résumé comparaison */}
        <div className="px-6 py-4 border-t border-white/10 space-y-3">
          {/* Ligne comparaison */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-[#3A3A3A] rounded-xl p-3">
              <p className="text-gray-500 text-xs mb-1">Caisse (calculé)</p>
              <p className="text-[#F1C40F] font-bold text-lg tabular-nums">
                {montantCash.toFixed(2)} €
              </p>
            </div>
            <div className="bg-[#3A3A3A] rounded-xl p-3">
              <p className="text-gray-500 text-xs mb-1">Compté</p>
              <p className="text-white font-bold text-lg tabular-nums">
                {montantCompte.toFixed(2)} €
              </p>
            </div>
            <div className={`rounded-xl p-3 ${ecartBg}`}>
              <p className="text-gray-400 text-xs mb-1">Écart</p>
              <div className="flex items-center justify-center gap-1">
                <EcartIcon className={`w-4 h-4 ${ecartColor}`} />
                <p className={`font-bold text-lg tabular-nums ${ecartColor}`}>
                  {isExact
                    ? '0.00 €'
                    : `${isPositif ? '+' : '-'}${ecartAbs.toFixed(2)} €`}
                </p>
              </div>
            </div>
          </div>

          {/* Message */}
          <div
            className={`rounded-lg px-4 py-2 text-sm text-center font-medium ${ecartBg} ${ecartColor}`}
          >
            {isExact && 'Caisse équilibrée ✓'}
            {!isExact &&
              isPositif &&
              `Excédent de ${ecartAbs.toFixed(2)} € en caisse`}
            {!isExact &&
              !isPositif &&
              `Manque ${ecartAbs.toFixed(2)} € en caisse`}
          </div>

          <Button
            onClick={onClose}
            className="w-full h-11 bg-[#3A3A3A] text-gray-200 hover:bg-[#4A4A4A] rounded-xl font-medium"
          >
            Fermer
          </Button>
        </div>
      </div>
    </div>
  );
}
