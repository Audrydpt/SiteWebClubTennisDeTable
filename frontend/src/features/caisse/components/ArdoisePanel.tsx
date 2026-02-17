import { useState } from 'react';
import { User, ChevronRight, Settings } from 'lucide-react';
import type {
  Member,
  ClientCaisse,
  CompteCaisse,
  TransactionCaisse,
} from '@/services/type';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import ArdoiseDetail from './ArdoiseDetail';
import ClientsManagerPanel from './ClientsManagerPanel';

interface ArdoisePanelProps {
  comptes: CompteCaisse[];
  transactions: TransactionCaisse[];
  membres: Member[];
  clientsExternes: ClientCaisse[];
  onPayment: (compteId: string, montant: number) => void;
  onPaymentPayconiq: (compteId: string, montant: number) => void;
  onClientUpdated: (client: ClientCaisse) => void;
  onClientDeleted: (clientId: string) => void;
  loading?: boolean;
  payconiqUrl?: string;
}

type ArdoiseView = 'list' | 'detail' | 'clients';

export default function ArdoisePanel({
  comptes,
  transactions,
  membres,
  clientsExternes,
  onPayment,
  onPaymentPayconiq,
  onClientUpdated,
  onClientDeleted,
  loading,
  payconiqUrl,
}: ArdoisePanelProps) {
  const [view, setView] = useState<ArdoiseView>('list');
  const [selectedCompteId, setSelectedCompteId] = useState<string | null>(null);

  const comptesAvecSolde = comptes.filter((c) => c.solde > 0);
  const selectedCompte = comptes.find((c) => c.id === selectedCompteId);

  if (view === 'detail' && selectedCompte) {
    return (
      <ArdoiseDetail
        compte={selectedCompte}
        transactions={transactions}
        onBack={() => {
          setSelectedCompteId(null);
          setView('list');
        }}
        onPayment={onPayment}
        onPaymentPayconiq={onPaymentPayconiq}
        loading={loading}
        payconiqUrl={payconiqUrl}
      />
    );
  }

  if (view === 'clients') {
    return (
      <ClientsManagerPanel
        membres={membres}
        clientsExternes={clientsExternes}
        comptes={comptes}
        onBack={() => setView('list')}
        onClientUpdated={onClientUpdated}
        onClientDeleted={onClientDeleted}
      />
    );
  }

  const totalArdoises = comptesAvecSolde.reduce((sum, c) => sum + c.solde, 0);

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-white text-lg font-bold">Comptes</h2>
          <p className="text-gray-400 text-sm">
            {comptesAvecSolde.length} client
            {comptesAvecSolde.length !== 1 && 's'} avec solde &middot; Total:{' '}
            <span className="text-red-400 font-bold">
              {totalArdoises.toFixed(2)}&euro;
            </span>
          </p>
        </div>

        <Button
          variant="ghost"
          onClick={() => setView('clients')}
          className="h-9 px-3 bg-[#3A3A3A] text-gray-400 hover:text-white hover:bg-[#4A4A4A] rounded-xl text-sm shrink-0"
          title="Gérer les clients"
        >
          <Settings className="w-4 h-4 mr-2" />
          Clients
        </Button>
      </div>

      {comptesAvecSolde.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
          Aucun compte en cours
        </div>
      ) : (
        <ScrollArea className="flex-1 min-h-0">
          <div className="space-y-2 pr-4">
            {comptesAvecSolde
              .sort((a, b) => b.solde - a.solde)
              .map((compte) => (
                <Button
                  key={compte.id}
                  variant="ghost"
                  onClick={() => {
                    setSelectedCompteId(compte.id);
                    setView('detail');
                  }}
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
                      {new Date(compte.derniereActivite).toLocaleDateString(
                        'fr-BE'
                      )}
                    </p>
                  </div>
                  <span className="text-red-400 font-bold text-sm tabular-nums mr-2">
                    {compte.solde.toFixed(2)}&euro;
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </Button>
              ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
