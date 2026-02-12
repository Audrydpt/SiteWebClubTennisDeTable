/* eslint-disable */
import { useState } from 'react';
import type { CompteCaisse } from '@/services/type';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, CreditCard } from 'lucide-react';

interface ArdoiseDetailProps {
  compte: CompteCaisse;
  onBack: () => void;
  onPayment: (compteId: string, montant: number) => void;
  loading?: boolean;
}

export default function ArdoiseDetail({
  compte,
  onBack,
  onPayment,
  loading,
}: ArdoiseDetailProps) {
  const [montant, setMontant] = useState(compte.solde.toFixed(2));

  const handlePay = () => {
    const val = parseFloat(montant);
    if (val > 0 && val <= compte.solde) {
      onPayment(compte.id, val);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="h-9 w-9 text-gray-400 hover:text-white rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-white text-lg font-bold">{compte.clientNom}</h2>
          <p className="text-gray-400 text-xs">
            {compte.clientType === 'membre' ? 'Membre' : 'Externe'}
          </p>
        </div>
      </div>

      <div className="bg-[#3A3A3A] rounded-xl p-4 mb-4">
        <p className="text-gray-400 text-sm">Solde du</p>
        <p className="text-red-400 text-3xl font-bold tabular-nums">
          {compte.solde.toFixed(2)}&euro;
        </p>
      </div>

      <div className="bg-[#3A3A3A] rounded-xl p-4 mb-4">
        <p className="text-gray-400 text-sm mb-2">Enregistrer un paiement</p>
        <div className="flex gap-2">
          <Input
            type="number"
            step="0.01"
            min="0.01"
            max={compte.solde}
            value={montant}
            onChange={(e) => setMontant(e.target.value)}
            className="h-12 text-lg bg-[#4A4A4A] border-none text-white rounded-xl"
          />
          <Button
            onClick={handlePay}
            disabled={
              loading ||
              !montant ||
              parseFloat(montant) <= 0 ||
              parseFloat(montant) > compte.solde
            }
            className="h-12 px-6 bg-green-600 text-white hover:bg-green-700 rounded-xl disabled:opacity-30"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            {loading ? '...' : 'Payer'}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <p className="text-gray-400 text-sm font-medium mb-2">Historique</p>
        <div className="space-y-1">
          {[...compte.historique].reverse().map((entry, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-2 px-3 rounded-lg bg-[#3A3A3A]"
            >
              <div>
                <p className="text-white text-sm">
                  {entry.type === 'consommation' ? 'Consommation' : 'Paiement'}
                </p>
                <p className="text-gray-500 text-xs">
                  {new Date(entry.date).toLocaleDateString('fr-BE')}{' '}
                  {new Date(entry.date).toLocaleTimeString('fr-BE', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <span
                className={`font-bold text-sm tabular-nums ${
                  entry.type === 'consommation' ? 'text-red-400' : 'text-green-400'
                }`}
              >
                {entry.type === 'consommation' ? '+' : '-'}
                {entry.montant.toFixed(2)}&euro;
              </span>
            </div>
          ))}
          {compte.historique.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-4">
              Aucun historique
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
