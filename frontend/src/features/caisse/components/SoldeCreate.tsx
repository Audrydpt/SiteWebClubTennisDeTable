/* eslint-disable */
import { useState } from 'react';
import { PiggyBank } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SoldeCreateProps {
  onCreateSolde: (montantInitial: number) => void;
  loading?: boolean;
}

export default function SoldeCreate({
  onCreateSolde,
  loading,
}: SoldeCreateProps) {
  const [montant, setMontant] = useState('20.00');

  const handleCreate = () => {
    const val = parseFloat(montant);
    if (val > 0) {
      onCreateSolde(val);
    }
  };

  return (
    <div className="h-full flex items-center justify-center">
      <div className="bg-[#3A3A3A] rounded-2xl p-8 max-w-md w-full">
        <div className="flex items-center justify-center mb-6">
          <div className="h-16 w-16 rounded-full bg-[#F1C40F]/20 flex items-center justify-center">
            <PiggyBank className="w-8 h-8 text-[#F1C40F]" />
          </div>
        </div>

        <h2 className="text-white text-2xl font-bold text-center mb-2">
          Créer un nouveau solde
        </h2>
        <p className="text-gray-400 text-sm text-center mb-6">
          Entrez le montant initial de la caisse
        </p>

        <div className="mb-6">
          <label className="text-gray-400 text-sm mb-2 block">
            Montant initial
          </label>
          <div className="relative">
            <Input
              type="number"
              step="0.01"
              min="0"
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              className="h-14 text-2xl font-bold text-center bg-[#4A4A4A] border-none text-white rounded-xl pr-12"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">
              &euro;
            </span>
          </div>
        </div>

        <Button
          onClick={handleCreate}
          disabled={loading || !montant || parseFloat(montant) <= 0}
          className="w-full h-14 bg-[#F1C40F] text-[#2C2C2C] hover:bg-[#F1C40F]/90 font-bold text-lg rounded-xl disabled:opacity-30"
        >
          {loading ? 'Création...' : 'Ouvrir la caisse'}
        </Button>

        <p className="text-gray-500 text-xs text-center mt-4">
          Ce montant servira de base pour suivre l'encaissement de la journée
        </p>
      </div>
    </div>
  );
}
