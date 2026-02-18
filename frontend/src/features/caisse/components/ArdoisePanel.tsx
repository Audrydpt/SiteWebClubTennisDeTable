/* eslint-disable */
import { useState } from 'react';
import {
  User,
  ChevronRight,
  Settings,
  ChevronDown,
  ChevronUp,
  ClipboardList,
} from 'lucide-react';
import type {
  Member,
  ClientCaisse,
  CompteCaisse,
  TransactionCaisse,
} from '@/services/type';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import ArdoiseDetail, { type TransferItem } from './ArdoiseDetail';
import ClientsManagerPanel from './ClientsManagerPanel';
import ImportCompteAncien from './ImportCompteAncien';

interface ArdoisePanelProps {
  comptes: CompteCaisse[];
  transactions: TransactionCaisse[];
  membres: Member[];
  clientsExternes: ClientCaisse[];
  onPayment: (compteId: string, montant: number) => void;
  onPaymentPayconiq: (compteId: string, montant: number) => void;
  onClientUpdated: (client: ClientCaisse) => void;
  onClientDeleted: (clientId: string) => void;
  onCompteImported: () => void;
  /**
   * Appelé quand l'utilisateur valide un transfert depuis un compte externe.
   * La logique métier (créer/mettre à jour les comptes membres) est gérée dans CaissePage.
   */
  onTransfer: (compteId: string, transfers: TransferItem[]) => void;
  loading?: boolean;
  payconiqUrl?: string;
  onCascadeComplete?: () => void;
}

type ArdoiseView = 'list' | 'detail' | 'clients' | 'import';

export default function ArdoisePanel({
  comptes,
  transactions,
  membres,
  clientsExternes,
  onPayment,
  onPaymentPayconiq,
  onClientUpdated,
  onClientDeleted,
  onCompteImported,
  onTransfer,
  loading,
  payconiqUrl,
  onCascadeComplete,
}: ArdoisePanelProps) {
  const [view, setView] = useState<ArdoiseView>('list');
  const [selectedCompteId, setSelectedCompteId] = useState<string | null>(null);
  const [showRegles, setShowRegles] = useState(false);

  const comptesAvecSolde = comptes
    .filter((c) => c.solde !== 0)
    .sort((a, b) => a.clientNom.localeCompare(b.clientNom, 'fr'));

  const comptesRegles = comptes
    .filter((c) => c.solde === 0)
    .sort((a, b) => a.clientNom.localeCompare(b.clientNom, 'fr'));

  const selectedCompte = comptes.find((c) => c.id === selectedCompteId);

  if (view === 'detail') {
    if (!selectedCompte) return null;
    return (
      <ArdoiseDetail
        compte={selectedCompte}
        transactions={transactions}
        membres={membres}
        comptes={comptes}
        onBack={() => {
          setSelectedCompteId(null);
          setView('list');
        }}
        onPayment={onPayment}
        onPaymentPayconiq={onPaymentPayconiq}
        onTransfer={onTransfer}
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
        onCascadeComplete={onCascadeComplete}
      />
    );
  }

  if (view === 'import') {
    return (
      <ImportCompteAncien
        membres={membres}
        clientsExternes={clientsExternes}
        comptes={comptes}
        onBack={() => setView('list')}
        onImported={onCompteImported}
      />
    );
  }

  const totalArdoises = comptesAvecSolde.reduce((sum, c) => sum + c.solde, 0);

  const renderCompteButton = (compte: CompteCaisse) => (
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
          {compte.clientType === 'membre' ? 'Membre' : 'Externe'} &middot;{' '}
          {new Date(compte.derniereActivite).toLocaleDateString('fr-BE')}
        </p>
      </div>
      {compte.solde > 0 ? (
        <span className="text-red-400 font-bold text-sm tabular-nums mr-2">
          {compte.solde.toFixed(2)}&euro;
        </span>
      ) : compte.solde < 0 ? (
        <span className="text-blue-400 font-bold text-xs tabular-nums mr-2">
          +{Math.abs(compte.solde).toFixed(2)}&euro; crédit
        </span>
      ) : (
        <span className="text-green-500 font-bold text-xs tabular-nums mr-2">
          Réglé
        </span>
      )}
      <ChevronRight className="w-4 h-4 text-gray-500" />
    </Button>
  );

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-white text-lg font-bold">Comptes</h2>
          <p className="text-gray-400 text-sm">
            {comptesAvecSolde.length} compte
            {comptesAvecSolde.length !== 1 && 's'} en cours &middot; Total:{' '}
            <span className="text-red-400 font-bold">
              {totalArdoises.toFixed(2)}&euro;
            </span>
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={() => setView('import')}
            className="h-9 px-3 bg-[#3A3A3A] text-gray-400 hover:text-[#F1C40F] hover:bg-[#4A4A4A] rounded-xl text-sm shrink-0"
            title="Encoder un ancien compte papier"
          >
            <ClipboardList className="w-4 h-4 mr-2" />
            Importer
          </Button>
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
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="space-y-2 pr-4">
          {comptesAvecSolde.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">
              Aucun compte en cours
            </p>
          ) : (
            comptesAvecSolde.map(renderCompteButton)
          )}

          {comptesRegles.length > 0 && (
            <div className="pt-2">
              <button
                onClick={() => setShowRegles((v) => !v)}
                className="w-full flex items-center gap-2 py-2 px-3 rounded-xl text-gray-500 hover:text-gray-300 hover:bg-[#3A3A3A] transition-colors"
              >
                <div className="h-px flex-1 bg-[#4A4A4A]" />
                <span className="text-xs font-medium shrink-0">
                  {showRegles ? 'Masquer' : 'Voir'} les comptes réglés (
                  {comptesRegles.length})
                </span>
                {showRegles ? (
                  <ChevronUp className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                )}
                <div className="h-px flex-1 bg-[#4A4A4A]" />
              </button>

              {showRegles && (
                <div className="space-y-2 mt-2">
                  {comptesRegles.map(renderCompteButton)}
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
