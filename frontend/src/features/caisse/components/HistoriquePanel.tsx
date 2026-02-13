/* eslint-disable */

import { useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Smartphone,
  BookOpen,
  Ban,
  X,
  Check,
  Pencil,
  Trash2,
  Plus,
  Minus,
  User,
  List,
  BarChart3,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  addDays,
  addWeeks,
  addMonths,
  addYears,
  format,
  isToday,
  isThisWeek,
  isThisMonth,
  isThisYear,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import type { TransactionCaisse, LigneCaisse } from '@/services/type';

type Periode = 'jour' | 'semaine' | 'mois' | 'annee';
type Filtre = 'toutes' | 'payee' | 'ardoise' | 'annulee' | 'payconiq';

interface HistoriquePanelProps {
  transactions: TransactionCaisse[];
  onAnnuler: (tx: TransactionCaisse) => void;
  onModifier: (
    tx: TransactionCaisse,
    lignes: LigneCaisse[],
    total: number
  ) => void;
}

function getPeriodRange(
  periode: Periode,
  ref: Date
): { start: Date; end: Date } {
  switch (periode) {
    case 'jour':
      return { start: startOfDay(ref), end: endOfDay(ref) };
    case 'semaine':
      return {
        start: startOfWeek(ref, { weekStartsOn: 1 }),
        end: endOfWeek(ref, { weekStartsOn: 1 }),
      };
    case 'mois':
      return { start: startOfMonth(ref), end: endOfMonth(ref) };
    case 'annee':
      return { start: startOfYear(ref), end: endOfYear(ref) };
  }
}

function getPeriodLabel(periode: Periode, ref: Date): string {
  switch (periode) {
    case 'jour':
      if (isToday(ref)) return "Aujourd'hui";
      return format(ref, 'EEEE d MMMM yyyy', { locale: fr });
    case 'semaine': {
      if (isThisWeek(ref, { weekStartsOn: 1 })) return 'Cette semaine';
      const start = startOfWeek(ref, { weekStartsOn: 1 });
      const end = endOfWeek(ref, { weekStartsOn: 1 });
      return `${format(start, 'd MMM', { locale: fr })} - ${format(end, 'd MMM yyyy', { locale: fr })}`;
    }
    case 'mois':
      if (isThisMonth(ref)) return 'Ce mois';
      return format(ref, 'MMMM yyyy', { locale: fr });
    case 'annee':
      if (isThisYear(ref)) return 'Cette annee';
      return format(ref, 'yyyy');
  }
}

function navigate(periode: Periode, ref: Date, direction: number): Date {
  switch (periode) {
    case 'jour':
      return addDays(ref, direction);
    case 'semaine':
      return addWeeks(ref, direction);
    case 'mois':
      return addMonths(ref, direction);
    case 'annee':
      return addYears(ref, direction);
  }
}

function modePaiementIcon(mode: string) {
  switch (mode) {
    case 'payconiq':
      return <Smartphone className="w-3.5 h-3.5" />;
    case 'ardoise':
      return <BookOpen className="w-3.5 h-3.5" />;
    default:
      return <CreditCard className="w-3.5 h-3.5" />;
  }
}

function modePaiementLabel(mode: string) {
  switch (mode) {
    case 'payconiq':
      return 'Payconiq';
    case 'ardoise':
      return 'Compte';
    default:
      return 'Immediat';
  }
}

// ---- Modal Annulation ----
function AnnulationModal({
  tx,
  onConfirm,
  onClose,
}: {
  tx: TransactionCaisse;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-[#3A3A3A] rounded-2xl w-full max-w-sm mx-4 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold">Annuler la transaction</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        <p className="text-gray-300 text-sm mb-2">
          Etes-vous sur de vouloir annuler cette transaction ?
        </p>
        <div className="bg-[#2C2C2C] rounded-lg p-3 mb-4">
          <p className="text-[#F1C40F] font-bold text-lg tabular-nums">
            {tx.total.toFixed(2)}&euro;
          </p>
          <p className="text-gray-400 text-xs">
            {tx.lignes.map((l) => `${l.quantite}x ${l.platNom}`).join(', ')}
          </p>
          {tx.clientNom && (
            <p className="text-gray-500 text-xs mt-1">Client: {tx.clientNom}</p>
          )}
        </div>
        <p className="text-red-400 text-xs mb-4">
          Le stock sera restaure et la transaction sera marquee comme annulee.
        </p>
        <div className="flex gap-3">
          <Button
            onClick={onClose}
            variant="ghost"
            className="flex-1 h-11 bg-[#4A4A4A] text-white hover:bg-[#5A5A5A] rounded-xl"
          >
            Non, garder
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1 h-11 bg-red-600 text-white hover:bg-red-700 rounded-xl font-bold"
          >
            Oui, annuler
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---- Modal Modification ----
function ModificationModal({
  tx,
  onConfirm,
  onClose,
}: {
  tx: TransactionCaisse;
  onConfirm: (lignes: LigneCaisse[], total: number) => void;
  onClose: () => void;
}) {
  const [lignes, setLignes] = useState<LigneCaisse[]>(
    tx.lignes.map((l) => ({ ...l }))
  );
  const [showConfirm, setShowConfirm] = useState(false);

  const newTotal = lignes.reduce((s, l) => s + l.sousTotal, 0);

  const updateQty = (index: number, delta: number) => {
    setLignes(
      (prev) =>
        prev
          .map((l, i) => {
            if (i !== index) return l;
            const newQty = l.quantite + delta;
            if (newQty <= 0) return null;
            return {
              ...l,
              quantite: newQty,
              sousTotal: newQty * l.prixUnitaire,
            };
          })
          .filter(Boolean) as LigneCaisse[]
    );
  };

  const removeLigne = (index: number) => {
    setLignes((prev) => prev.filter((_, i) => i !== index));
  };

  if (showConfirm) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <div className="bg-[#3A3A3A] rounded-2xl w-full max-w-sm mx-4 p-6 shadow-2xl">
          <h3 className="text-white font-bold mb-3">
            Confirmer la modification
          </h3>
          <div className="bg-[#2C2C2C] rounded-lg p-3 mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Ancien total</span>
              <span className="text-gray-400 line-through tabular-nums">
                {tx.total.toFixed(2)}&euro;
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white font-bold">Nouveau total</span>
              <span className="text-[#F1C40F] font-bold tabular-nums">
                {newTotal.toFixed(2)}&euro;
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setShowConfirm(false)}
              variant="ghost"
              className="flex-1 h-11 bg-[#4A4A4A] text-white hover:bg-[#5A5A5A] rounded-xl"
            >
              Retour
            </Button>
            <Button
              onClick={() => onConfirm(lignes, newTotal)}
              className="flex-1 h-11 bg-[#F1C40F] text-[#2C2C2C] hover:bg-[#F1C40F]/80 rounded-xl font-bold"
            >
              Confirmer
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-[#3A3A3A] rounded-2xl w-full max-w-md mx-4 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold">Modifier la transaction</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <ScrollArea className="max-h-60 mb-4">
          <div className="space-y-2 pr-4">
            {lignes.map((l, i) => (
            <div
              key={`${l.platId}-${i}`}
              className="bg-[#2C2C2C] rounded-lg p-3 flex items-center justify-between"
            >
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm truncate">{l.platNom}</p>
                <p className="text-gray-500 text-xs tabular-nums">
                  {l.prixUnitaire.toFixed(2)}&euro; / unite
                </p>
              </div>
              <div className="flex items-center gap-2 ml-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => updateQty(i, -1)}
                  className="h-7 w-7 bg-[#4A4A4A] text-white hover:bg-[#5A5A5A] rounded-lg"
                >
                  <Minus className="w-3.5 h-3.5" />
                </Button>
                <span className="text-white text-sm w-6 text-center tabular-nums">
                  {l.quantite}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => updateQty(i, 1)}
                  className="h-7 w-7 bg-[#4A4A4A] text-white hover:bg-[#5A5A5A] rounded-lg"
                >
                  <Plus className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeLigne(i)}
                  className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
              <span className="text-[#F1C40F] text-sm font-bold ml-3 tabular-nums w-16 text-right">
                {l.sousTotal.toFixed(2)}&euro;
              </span>
            </div>
          ))}

          {lignes.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-4">
              Aucun article restant
            </p>
          )}
          </div>
        </ScrollArea>

        <div className="flex items-center justify-between bg-[#2C2C2C] rounded-lg p-3 mb-4">
          <span className="text-white font-bold">Total</span>
          <span className="text-[#F1C40F] text-xl font-bold tabular-nums">
            {newTotal.toFixed(2)}&euro;
          </span>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={onClose}
            variant="ghost"
            className="flex-1 h-11 bg-[#4A4A4A] text-white hover:bg-[#5A5A5A] rounded-xl"
          >
            Annuler
          </Button>
          <Button
            onClick={() => setShowConfirm(true)}
            disabled={lignes.length === 0}
            className="flex-1 h-11 bg-[#F1C40F] text-[#2C2C2C] hover:bg-[#F1C40F]/80 rounded-xl font-bold disabled:opacity-30"
          >
            Sauvegarder
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---- Main Panel ----
export default function HistoriquePanel({
  transactions,
  onAnnuler,
  onModifier,
}: HistoriquePanelProps) {
  const [periode, setPeriode] = useState<Periode>('jour');
  const [refDate, setRefDate] = useState(new Date());
  const [filtre, setFiltre] = useState<Filtre>('toutes');
  const [annulationTarget, setAnnulationTarget] =
    useState<TransactionCaisse | null>(null);
  const [modificationTarget, setModificationTarget] =
    useState<TransactionCaisse | null>(null);
  const [expandedTx, setExpandedTx] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'text' | 'chart'>('text');

  const { start, end } = useMemo(
    () => getPeriodRange(periode, refDate),
    [periode, refDate]
  );

  const periodLabel = useMemo(
    () => getPeriodLabel(periode, refDate),
    [periode, refDate]
  );

  const filteredTransactions = useMemo(
    () =>
      transactions
        .filter((t) => {
          const d = new Date(t.dateTransaction);
          return d >= start && d <= end;
        })
        .filter((t) => {
          if (filtre === 'toutes') return true;
          if (filtre === 'payconiq') return t.modePaiement === 'payconiq';
          return t.statut === filtre;
        })
        .sort(
          (a, b) =>
            new Date(b.dateTransaction).getTime() -
            new Date(a.dateTransaction).getTime()
        ),
    [transactions, start, end, filtre]
  );

  const stats = useMemo(() => {
    const periodAll = transactions.filter((t) => {
      const d = new Date(t.dateTransaction);
      return d >= start && d <= end;
    });
    return {
      total: periodAll
        .filter((t) => t.statut !== 'annulee')
        .reduce((s, t) => s + t.total, 0),
      count: periodAll.filter((t) => t.statut !== 'annulee').length,
      payees: periodAll
        .filter((t) => t.statut === 'payee')
        .reduce((s, t) => s + t.total, 0),
      ardoises: periodAll
        .filter((t) => t.statut === 'ardoise')
        .reduce((s, t) => s + t.total, 0),
      payconiq: periodAll
        .filter((t) => t.modePaiement === 'payconiq' && t.statut !== 'annulee')
        .reduce((s, t) => s + t.total, 0),
      annulees: periodAll.filter((t) => t.statut === 'annulee').length,
    };
  }, [transactions, start, end]);

  // Chart data computations
  const periodTransactions = useMemo(
    () =>
      transactions.filter((t) => {
        const d = new Date(t.dateTransaction);
        return d >= start && d <= end && t.statut !== 'annulee';
      }),
    [transactions, start, end]
  );

  const revenueByPeriod = useMemo(() => {
    const groups: Record<string, number> = {};
    periodTransactions.forEach((t) => {
      const d = new Date(t.dateTransaction);
      let key: string;
      switch (periode) {
        case 'jour':
          key = format(d, 'HH:00', { locale: fr });
          break;
        case 'semaine':
          key = format(d, 'EEE', { locale: fr });
          break;
        case 'mois':
          key = format(d, 'dd/MM', { locale: fr });
          break;
        case 'annee':
          key = format(d, 'MMM', { locale: fr });
          break;
      }
      groups[key] = (groups[key] || 0) + t.total;
    });
    return Object.entries(groups).map(([label, revenue]) => ({
      label,
      revenue: Math.round(revenue * 100) / 100,
    }));
  }, [periodTransactions, periode]);

  const paymentDistribution = useMemo(() => {
    const immediat = periodTransactions
      .filter((t) => t.modePaiement === 'immediat')
      .reduce((s, t) => s + t.total, 0);
    const payconiq = periodTransactions
      .filter((t) => t.modePaiement === 'payconiq')
      .reduce((s, t) => s + t.total, 0);
    const ardoise = periodTransactions
      .filter((t) => t.modePaiement === 'ardoise')
      .reduce((s, t) => s + t.total, 0);
    return [
      { name: 'Immediat', value: Math.round(immediat * 100) / 100, color: '#22C55E' },
      { name: 'Payconiq', value: Math.round(payconiq * 100) / 100, color: '#FF4785' },
      { name: 'Compte', value: Math.round(ardoise * 100) / 100, color: '#3B82F6' },
    ].filter((d) => d.value > 0);
  }, [periodTransactions]);

  const topProducts = useMemo(() => {
    const productMap: Record<string, { name: string; total: number; qty: number }> = {};
    periodTransactions.forEach((t) => {
      t.lignes.forEach((l) => {
        if (!productMap[l.platId]) {
          productMap[l.platId] = { name: l.platNom, total: 0, qty: 0 };
        }
        productMap[l.platId].total += l.sousTotal;
        productMap[l.platId].qty += l.quantite;
      });
    });
    return Object.values(productMap)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 8)
      .map((p) => ({
        ...p,
        total: Math.round(p.total * 100) / 100,
      }));
  }, [periodTransactions]);

  const revenueTrend = useMemo(() => {
    const groups: Record<string, number> = {};
    periodTransactions.forEach((t) => {
      const d = new Date(t.dateTransaction);
      let key: string;
      switch (periode) {
        case 'jour':
          key = format(d, 'HH:00', { locale: fr });
          break;
        case 'semaine':
          key = format(d, 'EEE', { locale: fr });
          break;
        case 'mois':
          key = format(d, 'dd', { locale: fr });
          break;
        case 'annee':
          key = format(d, 'MMM', { locale: fr });
          break;
      }
      groups[key] = (groups[key] || 0) + t.total;
    });
    let cumul = 0;
    return Object.entries(groups).map(([label, val]) => {
      cumul += val;
      return { label, cumul: Math.round(cumul * 100) / 100 };
    });
  }, [periodTransactions, periode]);

  const periodes: { id: Periode; label: string }[] = [
    { id: 'jour', label: 'Jour' },
    { id: 'semaine', label: 'Semaine' },
    { id: 'mois', label: 'Mois' },
    { id: 'annee', label: 'Annee' },
  ];

  const filtres: { id: Filtre; label: string }[] = [
    { id: 'toutes', label: 'Toutes' },
    { id: 'payee', label: 'Payees' },
    { id: 'payconiq', label: 'Payconiq' },
    { id: 'ardoise', label: 'Comptes' },
    { id: 'annulee', label: 'Annulees' },
  ];

  const handleChangePeriode = (p: Periode) => {
    setPeriode(p);
    setRefDate(new Date());
  };

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Onglets période */}
      <div className="flex gap-1 mb-3">
        {periodes.map((p) => (
          <Button
            key={p.id}
            variant="ghost"
            onClick={() => handleChangePeriode(p.id)}
            className={`flex-1 h-9 rounded-lg text-sm ${
              periode === p.id
                ? 'bg-[#F1C40F] text-[#2C2C2C] hover:bg-[#F1C40F]/90'
                : 'bg-[#3A3A3A] text-gray-400 hover:bg-[#4A4A4A] hover:text-white'
            }`}
          >
            {p.label}
          </Button>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setRefDate(navigate(periode, refDate, -1))}
          className="h-8 w-8 text-gray-400 hover:text-white"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <span className="text-white font-bold text-sm capitalize">
          {periodLabel}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setRefDate(navigate(periode, refDate, 1))}
          className="h-8 w-8 text-gray-400 hover:text-white"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-[#3A3A3A] rounded-xl p-3">
          <p className="text-gray-400 text-xs">Total</p>
          <p className="text-[#F1C40F] text-lg font-bold tabular-nums">
            {stats.total.toFixed(2)}&euro;
          </p>
          <p className="text-gray-500 text-xs">{stats.count} ventes</p>
        </div>
        <div className="bg-[#3A3A3A] rounded-xl p-3">
          <p className="text-gray-400 text-xs">Payees</p>
          <p className="text-green-400 text-lg font-bold tabular-nums">
            {stats.payees.toFixed(2)}&euro;
          </p>
          {stats.payconiq > 0 && (
            <p className="text-pink-400 text-xs tabular-nums">
              dont {stats.payconiq.toFixed(2)}&euro; Payconiq
            </p>
          )}
        </div>
        <div className="bg-[#3A3A3A] rounded-xl p-3">
          <p className="text-gray-400 text-xs">Comptes</p>
          <p className="text-blue-400 text-lg font-bold tabular-nums">
            {stats.ardoises.toFixed(2)}&euro;
          </p>
        </div>
      </div>

      {/* Filtres + toggle vue */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-1.5 flex-wrap">
          {filtres.map((f) => (
            <Button
              key={f.id}
              variant="ghost"
              onClick={() => setFiltre(f.id)}
              className={`h-8 px-3 rounded-lg text-xs ${
                filtre === f.id
                  ? 'bg-[#F1C40F] text-[#2C2C2C] hover:bg-[#F1C40F]/90'
                  : 'bg-[#3A3A3A] text-gray-400 hover:bg-[#4A4A4A] hover:text-white'
              }`}
            >
              {f.label}
            </Button>
          ))}
        </div>
        <div className="flex gap-1 bg-[#3A3A3A] rounded-lg p-1 shrink-0 ml-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewMode('text')}
            className={`h-7 w-7 rounded ${
              viewMode === 'text'
                ? 'bg-[#F1C40F] text-[#2C2C2C]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <List className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewMode('chart')}
            className={`h-7 w-7 rounded ${
              viewMode === 'chart'
                ? 'bg-[#F1C40F] text-[#2C2C2C]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Contenu: Graphiques ou Liste */}
      {viewMode === 'chart' ? (
        <ScrollArea className="flex-1 min-h-0">
          <div className="space-y-4 pr-4">
          {/* Bar chart: Revenue par période */}
          <div className="bg-[#3A3A3A] rounded-xl p-4">
            <p className="text-gray-400 text-sm mb-3">Chiffre d'affaires</p>
            {revenueByPeriod.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={revenueByPeriod}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#4A4A4A" />
                  <XAxis dataKey="label" stroke="#9CA3AF" fontSize={11} />
                  <YAxis stroke="#9CA3AF" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#3A3A3A', border: 'none', borderRadius: '8px' }}
                    labelStyle={{ color: '#9CA3AF' }}
                    itemStyle={{ color: '#F1C40F' }}
                    formatter={(value: number) => [`${value.toFixed(2)}€`, 'CA']}
                  />
                  <Bar dataKey="revenue" fill="#F1C40F" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-sm text-center py-8">Aucune donnee</p>
            )}
          </div>

          {/* Pie chart: Répartition paiements */}
          <div className="bg-[#3A3A3A] rounded-xl p-4">
            <p className="text-gray-400 text-sm mb-3">Modes de paiement</p>
            {paymentDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={paymentDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                    fontSize={11}
                  >
                    {paymentDistribution.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#3A3A3A', border: 'none', borderRadius: '8px' }}
                    formatter={(value: number) => [`${value.toFixed(2)}€`]}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '12px', color: '#9CA3AF' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-sm text-center py-8">Aucune donnee</p>
            )}
          </div>

          {/* Line chart: Tendance cumulative CA */}
          <div className="bg-[#3A3A3A] rounded-xl p-4">
            <p className="text-gray-400 text-sm mb-3">Tendance cumulative</p>
            {revenueTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={revenueTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#4A4A4A" />
                  <XAxis dataKey="label" stroke="#9CA3AF" fontSize={11} />
                  <YAxis stroke="#9CA3AF" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#3A3A3A', border: 'none', borderRadius: '8px' }}
                    labelStyle={{ color: '#9CA3AF' }}
                    itemStyle={{ color: '#22C55E' }}
                    formatter={(value: number) => [`${value.toFixed(2)}€`, 'Cumul']}
                  />
                  <Line
                    type="monotone"
                    dataKey="cumul"
                    stroke="#22C55E"
                    strokeWidth={2}
                    dot={{ fill: '#22C55E', r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-sm text-center py-8">Aucune donnee</p>
            )}
          </div>

          {/* Bar chart horizontal: Top produits */}
          <div className="bg-[#3A3A3A] rounded-xl p-4">
            <p className="text-gray-400 text-sm mb-3">Top produits (quantite)</p>
            {topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height={Math.max(150, topProducts.length * 32)}>
                <BarChart data={topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#4A4A4A" />
                  <XAxis type="number" stroke="#9CA3AF" fontSize={11} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    stroke="#9CA3AF"
                    fontSize={11}
                    width={90}
                    tick={{ fill: '#D1D5DB' }}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#3A3A3A', border: 'none', borderRadius: '8px' }}
                    formatter={(value: number, name: string) => {
                      if (name === 'qty') return [`${value}`, 'Quantite'];
                      return [`${value.toFixed(2)}€`, 'CA'];
                    }}
                  />
                  <Bar dataKey="qty" fill="#F1C40F" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-sm text-center py-8">Aucune donnee</p>
            )}
          </div>
          </div>
        </ScrollArea>
      ) : (
      <ScrollArea className="flex-1 min-h-0">
        <div className="space-y-2 pr-4">
        {filteredTransactions.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
            Aucune transaction pour cette periode
          </div>
        ) : (
          filteredTransactions.map((tx) => {
            const isExpanded = expandedTx === tx.id;
            const isAnnulee = tx.statut === 'annulee';

            return (
              <div
                key={tx.id}
                className={`bg-[#3A3A3A] rounded-xl p-3 cursor-pointer transition-colors hover:bg-[#424242] ${
                  isAnnulee ? 'opacity-60' : ''
                }`}
                onClick={() => setExpandedTx(isExpanded ? null : tx.id)}
              >
                {/* Ligne 1: statut + mode paiement + total */}
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
                          ? 'Compte'
                          : 'Annulee'}
                    </span>
                    <span className="flex items-center gap-1 text-gray-500 text-xs">
                      {modePaiementIcon(tx.modePaiement)}
                      {modePaiementLabel(tx.modePaiement)}
                    </span>
                  </div>
                  <span
                    className={`font-bold text-sm tabular-nums ${
                      isAnnulee ? 'text-red-400 line-through' : 'text-[#F1C40F]'
                    }`}
                  >
                    {tx.total.toFixed(2)}&euro;
                  </span>
                </div>

                {/* Ligne 2: articles + heure */}
                <div className="flex items-center justify-between">
                  <p className="text-gray-500 text-xs truncate mr-2">
                    {tx.lignes
                      .map((l) => `${l.quantite}x ${l.platNom}`)
                      .join(', ')}
                  </p>
                  <span className="text-gray-500 text-xs shrink-0">
                    {new Date(tx.dateTransaction).toLocaleTimeString('fr-BE', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {/* Ligne 3: client + opérateur */}
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center gap-2">
                    {tx.clientNom && (
                      <span className="flex items-center gap-1 text-gray-400 text-xs">
                        <User className="w-3 h-3" />
                        {tx.clientNom}
                      </span>
                    )}
                  </div>
                  <span className="text-gray-600 text-xs">{tx.operateur}</span>
                </div>

                {/* Expanded: détails + actions */}
                {isExpanded && (
                  <div
                    className="mt-3 pt-3 border-t border-[#4A4A4A]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Détail articles */}
                    <div className="space-y-1 mb-3">
                      {tx.lignes.map((l, i) => (
                        <div
                          key={`${l.platId}-${i}`}
                          className="flex items-center justify-between text-xs"
                        >
                          <span className="text-gray-300">
                            {l.quantite}x {l.platNom}
                          </span>
                          <span className="text-gray-400 tabular-nums">
                            {l.prixUnitaire.toFixed(2)}&euro; &rarr;{' '}
                            {l.sousTotal.toFixed(2)}&euro;
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    {!isAnnulee && (
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          onClick={() => setModificationTarget(tx)}
                          className="flex-1 h-9 bg-[#4A4A4A] text-white hover:bg-[#5A5A5A] rounded-lg text-xs"
                        >
                          <Pencil className="w-3.5 h-3.5 mr-1.5" />
                          Modifier
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => setAnnulationTarget(tx)}
                          className="flex-1 h-9 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-lg text-xs"
                        >
                          <Ban className="w-3.5 h-3.5 mr-1.5" />
                          Annuler
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
        </div>
      </ScrollArea>
      )}

      {/* Modals */}
      {annulationTarget && (
        <AnnulationModal
          tx={annulationTarget}
          onConfirm={() => {
            onAnnuler(annulationTarget);
            setAnnulationTarget(null);
          }}
          onClose={() => setAnnulationTarget(null)}
        />
      )}
      {modificationTarget && (
        <ModificationModal
          tx={modificationTarget}
          onConfirm={(lignes, total) => {
            onModifier(modificationTarget, lignes, total);
            setModificationTarget(null);
          }}
          onClose={() => setModificationTarget(null)}
        />
      )}
    </div>
  );
}
