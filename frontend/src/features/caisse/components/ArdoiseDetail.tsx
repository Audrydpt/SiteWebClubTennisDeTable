/* eslint-disable */
import { useState } from 'react';
import type { CompteCaisse } from '@/services/type';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, CreditCard, Smartphone, X, Check } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface ArdoiseDetailProps {
  compte: CompteCaisse;
  onBack: () => void;
  onPayment: (compteId: string, montant: number) => void;
  onPaymentPayconiq: (compteId: string, montant: number) => void;
  loading?: boolean;
  payconiqUrl?: string;
}

export default function ArdoiseDetail({
  compte,
  onBack,
  onPayment,
  onPaymentPayconiq,
  loading,
  payconiqUrl,
}: ArdoiseDetailProps) {
  const [montant, setMontant] = useState(compte.solde.toFixed(2));
  const [showQR, setShowQR] = useState(false);

  const handlePay = () => {
    const val = parseFloat(montant);
    if (val > 0 && val <= compte.solde) {
      onPayment(compte.id, val);
    }
  };

  const handlePayPayconiq = () => {
    const val = parseFloat(montant);
    if (val > 0 && val <= compte.solde) {
      setShowQR(true);
    }
  };

  const confirmPayconiq = () => {
    const val = parseFloat(montant);
    if (val > 0 && val <= compte.solde) {
      onPaymentPayconiq(compte.id, val);
      setShowQR(false);
    }
  };

  return (
    <>
      {/* Modal QR Code Payconiq */}
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
              {loading ? 'Traitement...' : 'Paiement effectue'}
            </Button>
          </div>
        </div>
      )}

      {/* Contenu principal */}
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
          <Button
            onClick={handlePayPayconiq}
            disabled={
              loading ||
              !montant ||
              parseFloat(montant) <= 0 ||
              parseFloat(montant) > compte.solde
            }
            className="h-12 px-6 bg-[#FF4785] text-white hover:bg-[#FF4785]/80 rounded-xl disabled:opacity-30"
          >
            <Smartphone className="w-4 h-4 mr-2" />
            Payconiq
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="pr-4">
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
                    {new Date(entry.date).toLocaleDateString('fr-BE')}
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
      </ScrollArea>
    </div>
    </>
  );
}

