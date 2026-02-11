import { useMemo, useState } from 'react';
import type { TransactionCaisse } from '@/services/type';
import { Button } from '@/components/ui/button';

interface HistoriquePanelProps {
  transactions: TransactionCaisse[];
}

type Filtre = 'toutes' | 'payee' | 'ardoise';

export default function HistoriquePanel({
  transactions,
}: HistoriquePanelProps) {
  const [filtre, setFiltre] = useState<Filtre>('toutes');

  const today = new Date().toISOString().split('T')[0];

  const todayTransactions = useMemo(
    () =>
      transactions
        .filter((t) => t.dateTransaction.startsWith(today))
        .filter((t) => filtre === 'toutes' || t.statut === filtre)
        .sort(
          (a, b) =>
            new Date(b.dateTransaction).getTime() -
            new Date(a.dateTransaction).getTime()
        ),
    [transactions, filtre, today]
  );

  const stats = useMemo(() => {
    const todayAll = transactions.filter((t) =>
      t.dateTransaction.startsWith(today)
    );
    return {
      total: todayAll
        .filter((t) => t.statut !== 'annulee')
        .reduce((s, t) => s + t.total, 0),
      count: todayAll.filter((t) => t.statut !== 'annulee').length,
      payees: todayAll
        .filter((t) => t.statut === 'payee')
        .reduce((s, t) => s + t.total, 0),
      ardoises: todayAll
        .filter((t) => t.statut === 'ardoise')
        .reduce((s, t) => s + t.total, 0),
    };
  }, [transactions, today]);

  const filtres: { id: Filtre; label: string }[] = [
    { id: 'toutes', label: 'Toutes' },
    { id: 'payee', label: 'Payees' },
    { id: 'ardoise', label: 'Ardoises' },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <h2 className="text-white text-lg font-bold">Historique du jour</h2>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-[#3A3A3A] rounded-xl p-3">
          <p className="text-gray-400 text-xs">Total</p>
          <p className="text-[#F1C40F] text-xl font-bold tabular-nums">
            {stats.total.toFixed(2)}&euro;
          </p>
          <p className="text-gray-500 text-xs">{stats.count} ventes</p>
        </div>
        <div className="bg-[#3A3A3A] rounded-xl p-3">
          <p className="text-gray-400 text-xs">Payees</p>
          <p className="text-green-400 text-xl font-bold tabular-nums">
            {stats.payees.toFixed(2)}&euro;
          </p>
        </div>
        <div className="bg-[#3A3A3A] rounded-xl p-3">
          <p className="text-gray-400 text-xs">Ardoises</p>
          <p className="text-blue-400 text-xl font-bold tabular-nums">
            {stats.ardoises.toFixed(2)}&euro;
          </p>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 mb-3">
        {filtres.map((f) => (
          <Button
            key={f.id}
            variant="ghost"
            onClick={() => setFiltre(f.id)}
            className={`h-9 px-4 rounded-lg text-sm ${
              filtre === f.id
                ? 'bg-[#F1C40F] text-[#2C2C2C] hover:bg-[#F1C40F]/90'
                : 'bg-[#3A3A3A] text-gray-400 hover:bg-[#4A4A4A] hover:text-white'
            }`}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Liste */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {todayTransactions.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
            Aucune transaction aujourd'hui
          </div>
        ) : (
          todayTransactions.map((tx) => (
            <div
              key={tx.id}
              className="bg-[#3A3A3A] rounded-xl p-3"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      tx.statut === 'payee'
                        ? 'bg-green-500/20 text-green-400'
                        : tx.statut === 'ardoise'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {tx.statut === 'payee'
                      ? 'Payee'
                      : tx.statut === 'ardoise'
                        ? 'Ardoise'
                        : 'Annulee'}
                  </span>
                  {tx.clientNom && (
                    <span className="text-gray-400 text-xs">{tx.clientNom}</span>
                  )}
                </div>
                <span className="text-[#F1C40F] font-bold text-sm tabular-nums">
                  {tx.total.toFixed(2)}&euro;
                </span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-gray-500 text-xs truncate mr-2">
                  {tx.lignes.map((l) => `${l.quantite}x ${l.platNom}`).join(', ')}
                </p>
                <span className="text-gray-500 text-xs shrink-0">
                  {new Date(tx.dateTransaction).toLocaleTimeString('fr-BE', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
