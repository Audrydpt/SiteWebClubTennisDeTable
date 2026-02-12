/* eslint-disable */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, CreditCard, BookOpen, Check, Smartphone, ArrowLeft } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface PaiementModalProps {
  total: number;
  clientNom: string | null;
  onPayImmediat: () => void;
  onPayArdoise: () => void;
  onPayPayconiq: () => void;
  onClose: () => void;
  loading?: boolean;
  success?: boolean;
  payconiqUrl?: string;
}

export default function PaiementModal({
  total,
  clientNom,
  onPayImmediat,
  onPayArdoise,
  onPayPayconiq,
  onClose,
  loading,
  success,
  payconiqUrl,
}: PaiementModalProps) {
  const [showQR, setShowQR] = useState(false);

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <div className="bg-[#3A3A3A] rounded-2xl w-full max-w-sm mx-4 p-8 shadow-2xl flex flex-col items-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
            <Check className="w-8 h-8 text-white" />
          </div>
          <p className="text-white text-lg font-bold mb-1">Paiement enregistre</p>
          <p className="text-[#F1C40F] text-2xl font-bold">{total.toFixed(2)}&euro;</p>
        </div>
      </div>
    );
  }

  if (showQR) {
    return (
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
              onClick={onClose}
              className="h-8 w-8 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="text-center mb-4">
            <p className="text-[#F1C40F] text-3xl font-bold tabular-nums">
              {total.toFixed(2)}&euro;
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
            onClick={() => {
              onPayPayconiq();
              setShowQR(false);
            }}
            disabled={loading}
            className="w-full h-14 bg-[#FF4785] text-white hover:bg-[#FF4785]/80 font-bold text-base rounded-xl"
          >
            <Check className="w-5 h-5 mr-2" />
            {loading ? 'Traitement...' : 'Paiement effectue'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-[#3A3A3A] rounded-2xl w-full max-w-sm mx-4 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white text-lg font-bold">Encaisser</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            disabled={loading}
            className="h-8 w-8 text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="text-center mb-6">
          <p className="text-[#F1C40F] text-4xl font-bold tabular-nums">
            {total.toFixed(2)}&euro;
          </p>
          {clientNom && (
            <p className="text-gray-400 text-sm mt-1">{clientNom}</p>
          )}
        </div>

        <div className="space-y-3">
          <Button
            onClick={onPayImmediat}
            disabled={loading}
            className="w-full h-14 bg-green-600 text-white hover:bg-green-700 font-bold text-base rounded-xl"
          >
            <CreditCard className="w-5 h-5 mr-2" />
            {loading ? 'Traitement...' : 'Paiement immediat'}
          </Button>

          <Button
            onClick={() => setShowQR(true)}
            disabled={loading}
            className="w-full h-14 bg-[#FF4785] text-white hover:bg-[#FF4785]/80 font-bold text-base rounded-xl"
          >
            <Smartphone className="w-5 h-5 mr-2" />
            Payconiq
          </Button>

          <Button
            onClick={onPayArdoise}
            disabled={loading || !clientNom}
            className="w-full h-14 bg-blue-600 text-white hover:bg-blue-700 font-bold text-base rounded-xl disabled:opacity-30"
          >
            <BookOpen className="w-5 h-5 mr-2" />
            {loading ? 'Traitement...' : 'Mettre sur compte'}
          </Button>

          {!clientNom && (
            <p className="text-gray-500 text-xs text-center">
              Un client doit etre selectionne pour le compte
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
