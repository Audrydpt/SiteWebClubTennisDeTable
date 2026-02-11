import { useState } from 'react';
import type { CompteCaisse } from '@/services/type';
import { Button } from '@/components/ui/button';
import { User, ChevronRight } from 'lucide-react';
import ArdoiseDetail from './ArdoiseDetail';

interface ArdoisePanelProps {
  comptes: CompteCaisse[];
  onPayment: (compteId: string, montant: number) => void;
  loading?: boolean;
}

export default function ArdoisePanel({
  comptes,
  onPayment,
  loading,
}: ArdoisePanelProps) {
  const [selectedCompteId, setSelectedCompteId] = useState<string | null>(null);

  const comptesAvecSolde = comptes.filter((c) => c.solde > 0);
  const selectedCompte = comptes.find((c) => c.id === selectedCompteId);

  if (selectedCompte) {
    return (
      <ArdoiseDetail
        compte={selectedCompte}
        onBack={() => setSelectedCompteId(null)}
        onPayment={onPayment}
        loading={loading}
      />
    );
  }

  const totalArdoises = comptesAvecSolde.reduce((sum, c) => sum + c.solde, 0);

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <h2 className="text-white text-lg font-bold">Ardoises</h2>
        <p className="text-gray-400 text-sm">
          {comptesAvecSolde.length} client{comptesAvecSolde.length !== 1 && 's'}{' '}
          avec solde &middot; Total:{' '}
          <span className="text-red-400 font-bold">
            {totalArdoises.toFixed(2)}&euro;
          </span>
        </p>
      </div>

      {comptesAvecSolde.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
          Aucune ardoise en cours
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-2">
          {comptesAvecSolde
            .sort((a, b) => b.solde - a.solde)
            .map((compte) => (
              <Button
                key={compte.id}
                variant="ghost"
                onClick={() => setSelectedCompteId(compte.id)}
                className="w-full h-auto p-3 bg-[#3A3A3A] hover:bg-[#4A4A4A] rounded-xl justify-start"
              >
                <User className="w-4 h-4 text-gray-400 mr-3 shrink-0" />
                <div className="flex-1 text-left min-w-0">
                  <p className="text-white text-sm font-medium truncate">
                    {compte.clientNom}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {compte.clientType === 'membre' ? 'Membre' : 'Externe'}{' '}
                    &middot; Derniere activite:{' '}
                    {new Date(compte.derniereActivite).toLocaleDateString('fr-BE')}
                  </p>
                </div>
                <span className="text-red-400 font-bold text-sm tabular-nums mr-2">
                  {compte.solde.toFixed(2)}&euro;
                </span>
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </Button>
            ))}
        </div>
      )}
    </div>
  );
}
