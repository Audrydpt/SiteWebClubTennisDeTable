/* eslint-disable */
import { Target, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Mousse, Bois, Autre, Commande } from '@/services/type.ts';

interface GlobalOrderBarProps {
  currentUserTotal: number;
  mousses: Mousse[];
  bois: Bois[];
  autres: Autre[];
  commandes: Commande[];
}

export function GlobalOrderBar({
  currentUserTotal,
  commandes,
}: GlobalOrderBarProps) {
  const THRESHOLD_1 = 250; // First threshold
  const THRESHOLD_2 = 1000; // Second threshold
  const THRESHOLD_3 = 2000; // Final threshold

  // Calculate total from all commandes
  const commandesTotal = commandes.reduce(
    (total, commande) => total + parseFloat(commande.total || '0'),
    0
  );

  const globalTotal = currentUserTotal + commandesTotal;

  // Count unique members from all commandes
  const uniqueMembers = new Set();
  commandes.forEach((commande) => {
    commande.items.forEach((item) => {
      uniqueMembers.add(item.memberId);
    });
  });
  const totalParticipants = uniqueMembers.size + (currentUserTotal > 0 ? 1 : 0);

  const isThreshold1Reached = globalTotal >= THRESHOLD_1;
  const isThreshold2Reached = globalTotal >= THRESHOLD_2;
  const isThreshold3Reached = globalTotal >= THRESHOLD_3;

  let statusIcon;
  let statusText;
  let statusColor;
  let barColor;
  let currentThreshold;
  let progress;

  if (!isThreshold1Reached) {
    statusIcon = XCircle;
    statusText = `${(THRESHOLD_1 - globalTotal).toFixed(2)}€ manquants pour le 1er palier`;
    statusColor = 'text-red-600';
    barColor = 'bg-red-500';
    currentThreshold = THRESHOLD_1;
    progress = (globalTotal / THRESHOLD_1) * 100;
  } else if (!isThreshold2Reached) {
    statusIcon = AlertTriangle;
    statusText = `${(THRESHOLD_2 - globalTotal).toFixed(2)}€ manquants pour le 2ème palier`;
    statusColor = 'text-orange-600';
    barColor = 'bg-green-500';
    currentThreshold = THRESHOLD_2;
    progress =
      ((globalTotal - THRESHOLD_1) / (THRESHOLD_2 - THRESHOLD_1)) * 100;
  } else if (!isThreshold3Reached) {
    statusIcon = CheckCircle;
    statusText = `${(THRESHOLD_3 - globalTotal).toFixed(2)}€ manquants pour le palier final`;
    statusColor = 'text-green-600';
    barColor = 'bg-green-500';
    currentThreshold = THRESHOLD_3;
    progress =
      ((globalTotal - THRESHOLD_2) / (THRESHOLD_3 - THRESHOLD_2)) * 100;
  } else {
    statusIcon = CheckCircle;
    statusText = 'Tous les paliers atteints !';
    statusColor = 'text-green-600';
    barColor = 'bg-green-500';
    currentThreshold = THRESHOLD_3;
    progress = 100;
  }

  const StatusIcon = statusIcon;

  return (
    <Card className="border-2 border-[#F1C40F] bg-white shadow-sm mb-6">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[#F1C40F] p-2 rounded-full">
              <Target className="w-5 h-5 text-[#3A3A3A]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Commande Groupée
              </h3>
              <p className="text-sm text-gray-600">
                {totalParticipants} participant
                {totalParticipants > 1 ? 's' : ''} • {globalTotal.toFixed(2)}€
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <StatusIcon className={`w-5 h-5 ${statusColor}`} />
            <div className="text-right">
              <p className={`text-sm font-medium ${statusColor}`}>
                {statusText}
              </p>
              <p className="text-xs text-gray-500">
                Paliers: {THRESHOLD_1}€ • {THRESHOLD_2}€ • {THRESHOLD_3}€
              </p>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full ${barColor} transition-all duration-500`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>
              {!isThreshold1Reached
                ? '0€'
                : !isThreshold2Reached
                  ? `${THRESHOLD_1}€`
                  : !isThreshold3Reached
                    ? `${THRESHOLD_2}€`
                    : `${THRESHOLD_3}€`}
            </span>
            <span>
              {!isThreshold1Reached
                ? `${THRESHOLD_1}€`
                : !isThreshold2Reached
                  ? `${THRESHOLD_2}€`
                  : !isThreshold3Reached
                    ? `${THRESHOLD_3}€`
                    : 'Terminé'}
            </span>
          </div>
          <div className="flex justify-between mt-1">
            <div
              className={`w-2 h-2 rounded-full ${isThreshold1Reached ? 'bg-green-500' : 'bg-gray-300'}`}
            />
            <div
              className={`w-2 h-2 rounded-full ${isThreshold2Reached ? 'bg-green-500' : 'bg-gray-300'}`}
            />
            <div
              className={`w-2 h-2 rounded-full ${isThreshold3Reached ? 'bg-green-500' : 'bg-gray-300'}`}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
