/* eslint-disable */
import { useState, useMemo } from 'react';
import type { CompteCaisse, TransactionCaisse, Member } from '@/services/type';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ArrowLeft,
  CreditCard,
  Smartphone,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  ArrowRightLeft,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface TransferItem {
  memberId: string;
  memberName: string;
  montant: number;
}

interface ArdoiseDetailProps {
  compte: CompteCaisse;
  transactions: TransactionCaisse[];
  membres: Member[];
  comptes: CompteCaisse[];
  onBack: () => void;
  onPayment: (compteId: string, montant: number) => void;
  onPaymentPayconiq: (compteId: string, montant: number) => void;
  onTransfer: (compteId: string, transfers: TransferItem[]) => void;
  loading?: boolean;
  payconiqUrl?: string;
}

function buildGroupedHistory(entries: CompteCaisse['historique']) {
  const groups: Record<string, typeof entries> = {};
  for (const entry of entries) {
    const dateKey = format(new Date(entry.date), 'yyyy-MM-dd');
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(entry);
  }
  return Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([dateKey, items]) => ({
      dateKey,
      dateLabel: format(new Date(dateKey), 'EEEE d MMMM yyyy', { locale: fr }),
      entries: [...items].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
    }));
}

export default function ArdoiseDetail({
  compte,
  transactions,
  membres,
  comptes,
  onBack,
  onPayment,
  onPaymentPayconiq,
  onTransfer,
  loading,
  payconiqUrl,
}: ArdoiseDetailProps) {
  const [montant, setMontant] = useState(compte.solde.toFixed(2));
  const [showQR, setShowQR] = useState(false);
  const [showFullHistory, setShowFullHistory] = useState(false);

  // ---- Transfer modal ----
  const [showTransfer, setShowTransfer] = useState(false);
  const [transfers, setTransfers] = useState<TransferItem[]>([]);

  const calcEqualSplit = (list: TransferItem[]): TransferItem[] => {
    if (list.length === 0) return list;
    const each = Math.floor((compte.solde / list.length) * 100) / 100;
    const remainder =
      Math.round((compte.solde - each * (list.length - 1)) * 100) / 100;
    return list.map((t, i) => ({
      ...t,
      montant: i === list.length - 1 ? remainder : each,
    }));
  };

  const addMember = (memberId: string) => {
    const m = membres.find((x) => String(x.id) === memberId);
    if (!m) return;
    setTransfers(
      calcEqualSplit([
        ...transfers,
        { memberId, memberName: `${m.prenom} ${m.nom}`, montant: 0 },
      ])
    );
  };

  const removeMember = (memberId: string) => {
    setTransfers(
      calcEqualSplit(transfers.filter((t) => t.memberId !== memberId))
    );
  };

  const updateMontant = (memberId: string, val: string) => {
    setTransfers((prev) =>
      prev.map((t) =>
        t.memberId === memberId ? { ...t, montant: parseFloat(val) || 0 } : t
      )
    );
  };

  const transferTotal = transfers.reduce((s, t) => s + (t.montant || 0), 0);
  const isBalanced = Math.abs(transferTotal - compte.solde) < 0.01;
  const transferValid =
    transfers.length >= 1 &&
    transfers.length <= 4 &&
    isBalanced &&
    transfers.every((t) => t.montant > 0);
  const availableMembres = membres.filter(
    (m) => !transfers.some((t) => t.memberId === String(m.id))
  );

  const handleConfirmTransfer = () => {
    if (!transferValid) return;
    onTransfer(compte.id, transfers);
    setShowTransfer(false);
    setTransfers([]);
  };

  // ---- Payment ----
  const handlePay = () => {
    const val = parseFloat(montant);
    if (val > 0) onPayment(compte.id, val);
  };

  const handlePayPayconiq = () => {
    const val = parseFloat(montant);
    if (val > 0) setShowQR(true);
  };

  const confirmPayconiq = () => {
    const val = parseFloat(montant);
    if (val > 0) {
      onPaymentPayconiq(compte.id, val);
      setShowQR(false);
    }
  };

  const montantVal = parseFloat(montant) || 0;
  const creditGenere =
    compte.solde > 0 && montantVal > compte.solde
      ? Math.round((montantVal - compte.solde) * 100) / 100
      : 0;

  const transactionMap = useMemo(() => {
    const map = new Map<string, TransactionCaisse>();
    transactions.forEach((tx) => map.set(tx.id, tx));
    return map;
  }, [transactions]);

  const lastPaymentDate = useMemo(() => {
    const payments = compte.historique
      .filter((e) => e.type === 'paiement')
      .map((e) => new Date(e.date).getTime());
    if (payments.length === 0) return null;
    return Math.max(...payments);
  }, [compte.historique]);

  const currentCycleEntries = useMemo(
    () =>
      compte.historique.filter(
        (e) =>
          e.type === 'consommation' &&
          (lastPaymentDate === null ||
            new Date(e.date).getTime() > lastPaymentDate)
      ),
    [compte.historique, lastPaymentDate]
  );

  const fullHistoryEntries = useMemo(
    () => compte.historique,
    [compte.historique]
  );
  const groupedCurrentCycle = useMemo(
    () => buildGroupedHistory(currentCycleEntries),
    [currentCycleEntries]
  );
  const groupedFullHistory = useMemo(
    () => buildGroupedHistory(fullHistoryEntries),
    [fullHistoryEntries]
  );
  const groupedHistory = showFullHistory
    ? groupedFullHistory
    : groupedCurrentCycle;
  const oldEntriesCount =
    fullHistoryEntries.length - currentCycleEntries.length;

  const renderEntry = (
    entry: CompteCaisse['historique'][number],
    i: number
  ) => {
    const tx =
      entry.type === 'consommation'
        ? transactionMap.get(entry.transactionId)
        : null;
    const isPaiement = entry.type === 'paiement';
    return (
      <div
        key={`${entry.transactionId}-${i}`}
        className={`py-2 px-3 rounded-lg ${isPaiement ? 'bg-[#2A3A2A] border border-green-800/40' : 'bg-[#3A3A3A]'}`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p
              className={`text-sm font-medium ${isPaiement ? 'text-green-400' : 'text-white'}`}
            >
              {isPaiement
                ? `Paiement${entry.modePaiement === 'payconiq' ? ' (Payconiq)' : ' (Cash)'}`
                : 'Consommation'}
            </p>
            <p className="text-gray-500 text-xs">
              {new Date(entry.date).toLocaleTimeString('fr-BE', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          <span
            className={`font-bold text-sm tabular-nums ${isPaiement ? 'text-green-400' : 'text-red-400'}`}
          >
            {isPaiement ? '-' : '+'}
            {entry.montant.toFixed(2)}&euro;
          </span>
        </div>
        {tx && tx.lignes.length > 0 && (
          <div className="mt-1.5 pt-1.5 border-t border-[#4A4A4A]">
            {tx.lignes.map((ligne, li) => (
              <div
                key={`${ligne.platId}-${li}`}
                className="flex items-center justify-between text-xs py-0.5"
              >
                <span className="text-gray-400">
                  {ligne.quantite}x {ligne.platNom}
                </span>
                <span className="text-gray-500 tabular-nums">
                  {ligne.sousTotal.toFixed(2)}&euro;
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* ---- Modal QR Payconiq ---- */}
      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-[#3A3A3A] rounded-2xl w-full max-w-sm mx-4 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowQR(false)}
                className="h-8 w-8 text-gray-400 hover:text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h2 className="text-white text-lg font-bold">Payconiq</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowQR(false)}
                className="h-8 w-8 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="text-center mb-4">
              <p className="text-[#F1C40F] text-3xl font-bold tabular-nums">
                {parseFloat(montant).toFixed(2)}&euro;
              </p>
              <p className="text-gray-400 text-sm mt-1">
                Scannez avec l'app Payconiq
              </p>
              {creditGenere > 0 && (
                <p className="text-blue-400 text-xs mt-2 bg-blue-500/10 rounded-lg px-3 py-1.5">
                  ⚡ Inclut {creditGenere.toFixed(2)}&euro; de crédit
                </p>
              )}
            </div>
            <div className="flex justify-center mb-6">
              <div className="bg-white rounded-xl p-4">
                <QRCodeSVG
                  value={payconiqUrl || ''}
                  size={200}
                  level="M"
                  bgColor="#FFFFFF"
                  fgColor="#000000"
                />
              </div>
            </div>
            <Button
              onClick={confirmPayconiq}
              disabled={loading}
              className="w-full h-14 bg-[#FF4785] text-white hover:bg-[#FF4785]/80 font-bold text-base rounded-xl"
            >
              <Check className="w-5 h-5 mr-2" />
              {loading ? 'Traitement...' : 'Paiement effectué'}
            </Button>
          </div>
        </div>
      )}

      {/* ---- Modal Transfert vers membres ---- */}
      {showTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-[#2C2C2C] rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#4A4A4A] shrink-0">
              <div>
                <h2 className="text-white text-lg font-bold flex items-center gap-2">
                  <ArrowRightLeft className="w-5 h-5 text-[#F1C40F]" />
                  Transférer vers membres
                </h2>
                <p className="text-gray-400 text-xs mt-0.5">
                  Solde à répartir :{' '}
                  <span className="text-red-400 font-bold">
                    {compte.solde.toFixed(2)}€
                  </span>{' '}
                  · {compte.clientNom}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowTransfer(false);
                  setTransfers([]);
                }}
                className="h-8 w-8 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <ScrollArea className="flex-1 min-h-0">
              <div className="p-5 space-y-3">
                {transfers.length === 0 && (
                  <p className="text-center py-6 text-gray-500 text-sm">
                    Sélectionnez jusqu'à 4 membres.
                    <br />
                    <span className="text-xs text-gray-600">
                      Le montant sera réparti équitablement par défaut.
                    </span>
                  </p>
                )}

                {/* Membres sélectionnés */}
                {transfers.map((t) => {
                  const cpt = comptes.find((c) => c.clientId === t.memberId);
                  return (
                    <div
                      key={t.memberId}
                      className="bg-[#3A3A3A] rounded-xl p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">
                            {t.memberName}
                          </p>
                          {cpt && (
                            <p className="text-gray-500 text-xs">
                              Ardoise actuelle :{' '}
                              <span
                                className={
                                  cpt.solde > 0
                                    ? 'text-red-400'
                                    : 'text-green-400'
                                }
                              >
                                {cpt.solde.toFixed(2)}€
                              </span>{' '}
                              → après :{' '}
                              <span
                                className={
                                  cpt.solde + t.montant > 0
                                    ? 'text-red-400'
                                    : 'text-green-400'
                                }
                              >
                                {(cpt.solde + t.montant).toFixed(2)}€
                              </span>
                            </p>
                          )}
                          {!cpt && (
                            <p className="text-gray-500 text-xs">
                              Nouveau compte créé avec {t.montant.toFixed(2)}€
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={t.montant}
                            onChange={(e) =>
                              updateMontant(t.memberId, e.target.value)
                            }
                            className="h-9 w-24 text-right bg-[#4A4A4A] border-none text-white rounded-lg text-sm tabular-nums"
                          />
                          <span className="text-gray-400 text-sm">€</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeMember(t.memberId)}
                          className="h-8 w-8 text-gray-500 hover:text-red-400 shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}

                {/* Dropdown ajout membre */}
                {transfers.length < 4 && availableMembres.length > 0 && (
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) addMember(e.target.value);
                    }}
                    className="h-10 w-full px-3 bg-[#3A3A3A] text-gray-400 rounded-xl border-none text-sm"
                  >
                    <option value="">+ Ajouter un membre…</option>
                    {[...availableMembres]
                      .sort((a, b) =>
                        `${a.prenom} ${a.nom}`.localeCompare(
                          `${b.prenom} ${b.nom}`,
                          'fr'
                        )
                      )
                      .map((m) => {
                        const cpt = comptes.find(
                          (c) => c.clientId === String(m.id)
                        );
                        return (
                          <option key={m.id} value={String(m.id)}>
                            {m.prenom} {m.nom}
                            {cpt && cpt.solde > 0
                              ? ` — ardoise: ${cpt.solde.toFixed(2)}€`
                              : ''}
                          </option>
                        );
                      })}
                  </select>
                )}

                {/* Résumé balance */}
                {transfers.length > 0 && (
                  <div
                    className={`rounded-xl p-3 flex items-center justify-between text-sm transition-colors ${
                      isBalanced
                        ? 'bg-green-900/20 border border-green-800/40'
                        : 'bg-red-900/20 border border-red-800/40'
                    }`}
                  >
                    <span className="text-gray-400">Total réparti</span>
                    <div className="flex items-center gap-2">
                      {!isBalanced && (
                        <AlertCircle className="w-4 h-4 text-red-400" />
                      )}
                      <span
                        className={`font-bold tabular-nums ${isBalanced ? 'text-green-400' : 'text-red-400'}`}
                      >
                        {transferTotal.toFixed(2)}€ / {compte.solde.toFixed(2)}€
                      </span>
                    </div>
                  </div>
                )}

                {/* Lien recalcul égal */}
                {transfers.length > 1 && !isBalanced && (
                  <button
                    type="button"
                    onClick={() => setTransfers(calcEqualSplit(transfers))}
                    className="w-full text-xs text-[#F1C40F] hover:text-[#F1C40F]/80 py-1 transition-colors text-center"
                  >
                    ↺ Répartir équitablement
                  </button>
                )}
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="p-5 border-t border-[#4A4A4A] flex gap-3 shrink-0">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowTransfer(false);
                  setTransfers([]);
                }}
                className="flex-1 h-12 bg-[#3A3A3A] text-gray-400 hover:bg-[#4A4A4A] rounded-xl"
              >
                Annuler
              </Button>
              <Button
                onClick={handleConfirmTransfer}
                disabled={!transferValid || loading}
                className="flex-1 h-12 bg-[#F1C40F] text-[#2C2C2C] hover:bg-[#F1C40F]/90 font-bold rounded-xl disabled:opacity-30"
              >
                <ArrowRightLeft className="w-4 h-4 mr-2" />
                {loading ? 'Transfert...' : 'Confirmer'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ---- Contenu principal ---- */}
      <div className="h-full flex flex-col min-h-0">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-9 w-9 text-gray-400 hover:text-white rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h2 className="text-white text-lg font-bold">{compte.clientNom}</h2>
            <p className="text-gray-400 text-xs">
              {compte.clientType === 'membre' ? 'Membre' : 'Externe'}
            </p>
          </div>
          {/* Bouton Transférer — uniquement externe avec solde */}
          {compte.clientType === 'externe' && compte.solde > 0 && (
            <Button
              variant="ghost"
              onClick={() => {
                setTransfers([]);
                setShowTransfer(true);
              }}
              className="h-9 px-3 bg-[#3A3A3A] text-[#F1C40F] hover:bg-[#4A4A4A] rounded-lg text-sm shrink-0"
              title="Transférer le solde vers des membres"
            >
              <ArrowRightLeft className="w-4 h-4 mr-1.5" />
              Transférer
            </Button>
          )}
        </div>

        <div className="bg-[#3A3A3A] rounded-xl p-4 mb-4">
          {compte.solde > 0 ? (
            <>
              <p className="text-gray-400 text-sm">Solde dû</p>
              <p className="text-red-400 text-3xl font-bold tabular-nums">
                {compte.solde.toFixed(2)}&euro;
              </p>
            </>
          ) : compte.solde < 0 ? (
            <>
              <p className="text-gray-400 text-sm">Crédit disponible</p>
              <p className="text-green-400 text-3xl font-bold tabular-nums">
                +{Math.abs(compte.solde).toFixed(2)}&euro;
              </p>
              <p className="text-gray-500 text-xs mt-1">
                Les prochaines consommations seront déduites de ce crédit
              </p>
            </>
          ) : (
            <>
              <p className="text-gray-400 text-sm">Solde dû</p>
              <p className="text-green-400 text-3xl font-bold tabular-nums">
                0.00&euro;
              </p>
            </>
          )}
        </div>

        <div className="bg-[#3A3A3A] rounded-xl p-4 mb-4">
          <p className="text-gray-400 text-sm mb-2">Enregistrer un paiement</p>
          <div className="flex gap-2">
            <Input
              type="number"
              step="0.01"
              min="0.01"
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              className="h-12 text-lg bg-[#4A4A4A] border-none text-white rounded-xl"
            />
            <Button
              onClick={handlePay}
              disabled={loading || !montant || montantVal <= 0}
              className="h-12 px-6 bg-green-600 text-white hover:bg-green-700 rounded-xl disabled:opacity-30"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              {loading ? '...' : 'Payer'}
            </Button>
            <Button
              onClick={handlePayPayconiq}
              disabled={loading || !montant || montantVal <= 0}
              className="h-12 px-6 bg-[#FF4785] text-white hover:bg-[#FF4785]/80 rounded-xl disabled:opacity-30"
            >
              <Smartphone className="w-4 h-4 mr-2" />
              Payconiq
            </Button>
          </div>
          {/* Indicateur de crédit généré */}
          {creditGenere > 0 && (
            <div className="mt-3 flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 rounded-xl px-3 py-2">
              <span className="text-blue-400 text-lg font-bold">⚡</span>
              <div className="flex-1 min-w-0">
                <p className="text-blue-300 text-sm font-medium">
                  Crédite {creditGenere.toFixed(2)}&euro; sur le compte
                </p>
                <p className="text-blue-400/70 text-xs">
                  Règle {compte.solde.toFixed(2)}&euro; de dette · +
                  {creditGenere.toFixed(2)}&euro; de crédit pour les prochaines
                  consommations
                </p>
              </div>
            </div>
          )}
        </div>

        <ScrollArea className="flex-1 min-h-0">
          <div className="pr-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400 text-sm font-medium">
                {showFullHistory
                  ? 'Historique complet'
                  : 'Consommations en cours'}
              </p>
              {oldEntriesCount > 0 && (
                <button
                  onClick={() => setShowFullHistory((v) => !v)}
                  className="flex items-center gap-1 text-xs text-[#F1C40F] hover:text-[#F1C40F]/80 transition-colors"
                >
                  {showFullHistory ? (
                    <>
                      <ChevronUp className="w-3.5 h-3.5" />
                      Masquer l'ancien historique
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3.5 h-3.5" />
                      Voir tout ({oldEntriesCount} ancienne
                      {oldEntriesCount > 1 ? 's' : ''})
                    </>
                  )}
                </button>
              )}
            </div>

            {groupedHistory.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">
                Aucune consommation en cours
              </p>
            ) : (
              <div className="space-y-4">
                {groupedHistory.map((group) => (
                  <div key={group.dateKey}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-px flex-1 bg-[#4A4A4A]" />
                      <span className="text-[#F1C40F] text-xs font-bold uppercase tracking-wide px-2.5 py-0.5 bg-[#3A3A3A] rounded-full capitalize border border-[#F1C40F]/30">
                        {group.dateLabel}
                      </span>
                      <div className="h-px flex-1 bg-[#4A4A4A]" />
                    </div>
                    <div className="space-y-1">
                      {group.entries.map((entry, i) => renderEntry(entry, i))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </>
  );
}
