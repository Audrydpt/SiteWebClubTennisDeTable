/* eslint-disable */
import { useMemo, useState } from 'react';
import CompteBillets from './CompteBillets';
import type { SoldeCaisse } from '@/services/type';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Banknote,
  Smartphone,
  BookOpen,
  XCircle,
  Calculator,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface SoldePanelProps {
  solde: SoldeCaisse;
  onCloturer: () => void;
  loading?: boolean;
}

export default function SoldePanel({
  solde,
  onCloturer,
  loading,
}: SoldePanelProps) {
  const [showComptage, setShowComptage] = useState(false);

  const stats = useMemo(() => {
    let totalCash = 0;
    let totalPayconiq = 0;
    let totalComptesCash = 0;
    let totalComptesPayconiq = 0;

    for (const tx of solde.transactions) {
      switch (tx.type) {
        case 'vente_cash':
          totalCash += tx.montant;
          break;
        case 'vente_payconiq':
          totalPayconiq += tx.montant;
          break;
        case 'compte_cash':
          totalComptesCash += tx.montant;
          totalCash += tx.montant;
          break;
        case 'compte_payconiq':
          totalComptesPayconiq += tx.montant;
          totalPayconiq += tx.montant;
          break;
      }
    }

    // Le montant actuel ne compte que le cash (pas le Payconiq qui n'est pas physique)
    const montantActuel = solde.montantInitial + totalCash;

    return {
      totalCash,
      totalPayconiq,
      totalComptes: totalComptesCash + totalComptesPayconiq,
      totalComptesDetail: {
        cash: totalComptesCash,
        payconiq: totalComptesPayconiq,
      },
      montantActuel,
    };
  }, [solde]);

  const dateOuverture = new Date(solde.dateOuverture);
  const isToday =
    format(dateOuverture, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="h-full flex flex-col min-h-0">
      {showComptage && (
        <CompteBillets
          montantCash={stats.montantActuel}
          onClose={() => setShowComptage(false)}
        />
      )}
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-white text-lg font-bold">Solde de caisse</h2>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowComptage(true)}
              className="h-9 px-4 bg-[#F1C40F] text-[#2C2C2C] hover:bg-[#F1C40F]/90 rounded-lg font-semibold"
            >
              <Calculator className="w-4 h-4 mr-2" />
              Comptage
            </Button>
            <Button
              onClick={onCloturer}
              disabled={loading}
              className="h-9 px-4 bg-red-600 text-white hover:bg-red-700 rounded-lg disabled:opacity-30"
            >
              <XCircle className="w-4 h-4 mr-2" />
              {loading ? 'Clôture...' : 'Clôturer'}
            </Button>
          </div>
        </div>
        <p className="text-gray-400 text-sm">
          Ouvert{' '}
          {isToday
            ? "aujourd'hui"
            : `le ${format(dateOuverture, 'd MMMM yyyy', { locale: fr })}`}{' '}
          à {format(dateOuverture, 'HH:mm', { locale: fr })}
        </p>
      </div>

      {/* Montant actuel */}
      <div className="bg-[#3A3A3A] rounded-xl p-5 mb-4">
        <p className="text-gray-400 text-sm mb-1">
          Montant actuel en caisse (Cash uniquement)
        </p>
        <div className="flex items-baseline gap-2">
          <p className="text-[#F1C40F] text-4xl font-bold tabular-nums">
            {stats.montantActuel.toFixed(2)}&euro;
          </p>
          <p className="text-gray-500 text-sm">
            (Initial: {solde.montantInitial.toFixed(2)}&euro;)
          </p>
        </div>
      </div>

      {/* Répartition */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Cash */}
        <div className="bg-[#3A3A3A] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Banknote className="w-5 h-5 text-green-400" />
            <p className="text-gray-400 text-sm font-medium">Cash</p>
          </div>
          <p className="text-white text-2xl font-bold tabular-nums">
            {stats.totalCash.toFixed(2)}&euro;
          </p>
          <p className="text-gray-500 text-xs mt-1">
            {
              solde.transactions.filter(
                (t) => t.type === 'vente_cash' || t.type === 'compte_cash'
              ).length
            }{' '}
            transaction
            {solde.transactions.filter(
              (t) => t.type === 'vente_cash' || t.type === 'compte_cash'
            ).length !== 1 && 's'}
          </p>
        </div>

        {/* Payconiq */}
        <div className="bg-[#3A3A3A] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Smartphone className="w-5 h-5 text-[#FF4785]" />
            <p className="text-gray-400 text-sm font-medium">Payconiq</p>
            <span className="ml-auto text-xs text-gray-500">(virtuel)</span>
          </div>
          <p className="text-white text-2xl font-bold tabular-nums">
            {stats.totalPayconiq.toFixed(2)}&euro;
          </p>
          <p className="text-gray-500 text-xs mt-1">
            {
              solde.transactions.filter(
                (t) =>
                  t.type === 'vente_payconiq' || t.type === 'compte_payconiq'
              ).length
            }{' '}
            transaction
            {solde.transactions.filter(
              (t) => t.type === 'vente_payconiq' || t.type === 'compte_payconiq'
            ).length !== 1 && 's'}
          </p>
        </div>
      </div>

      {/* Comptes réglés */}
      <div className="bg-[#3A3A3A] rounded-xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-5 h-5 text-blue-400" />
          <p className="text-gray-400 text-sm font-medium">Comptes réglés</p>
        </div>
        <div className="flex items-baseline gap-3 mb-2">
          <p className="text-white text-2xl font-bold tabular-nums">
            {stats.totalComptes.toFixed(2)}&euro;
          </p>
          <p className="text-gray-500 text-xs">
            {
              solde.transactions.filter(
                (t) => t.type === 'compte_cash' || t.type === 'compte_payconiq'
              ).length
            }{' '}
            paiement
            {solde.transactions.filter(
              (t) => t.type === 'compte_cash' || t.type === 'compte_payconiq'
            ).length !== 1 && 's'}
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>Cash: {stats.totalComptesDetail.cash.toFixed(2)}&euro;</span>
          <span>
            Payconiq: {stats.totalComptesDetail.payconiq.toFixed(2)}&euro;
          </span>
        </div>
      </div>

      {/* Historique */}
      <div className="flex-1 min-h-0">
        <p className="text-gray-400 text-sm font-medium mb-2">
          Dernières transactions
        </p>
        <ScrollArea className="h-full">
          <div className="space-y-2 pr-4">
            {solde.transactions.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">
                Aucune transaction
              </p>
            ) : (
              solde.transactions
                .slice()
                .reverse()
                .map((tx) => {
                  const isVente = tx.type.startsWith('vente_');
                  const isCash = tx.type.endsWith('_cash');
                  const IconComponent = isCash ? Banknote : Smartphone;
                  const iconColor = isCash
                    ? 'text-green-400'
                    : 'text-[#FF4785]';

                  return (
                    <div
                      key={tx.id}
                      className="py-2 px-3 rounded-lg bg-[#3A3A3A] flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <IconComponent className={`w-4 h-4 ${iconColor}`} />
                        <div>
                          <p className="text-white text-sm">
                            {isVente ? 'Vente' : 'Paiement compte'}
                            {tx.compteName && ` - ${tx.compteName}`}
                          </p>
                          <p className="text-gray-500 text-xs">
                            {format(new Date(tx.date), 'HH:mm', { locale: fr })}
                          </p>
                        </div>
                      </div>
                      <span className="text-green-400 font-bold text-sm tabular-nums">
                        +{tx.montant.toFixed(2)}&euro;
                      </span>
                    </div>
                  );
                })
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
