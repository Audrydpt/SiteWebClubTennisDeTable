/* eslint-disable */
import { Target, CheckCircle, XCircle, Info } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Commande } from '@/services/type.ts';

interface GlobalOrderBarProps {
  currentUserTotal: number;
  commandes: Commande[];
}

export function GlobalOrderBar({
  currentUserTotal,
  commandes,
}: GlobalOrderBarProps) {
  const THRESHOLD_1 = 250;  // Premier palier

  // Calculate total from the open commande only
  const commandesTotal = commandes
    .filter(commande => commande.statut === 'open')
    .reduce((total, commande) => total + parseFloat(commande.total || '0'), 0);

  const globalTotal = currentUserTotal + commandesTotal;

  // Count unique members from open commandes only
  const uniqueMembers = new Set();
  commandes
    .filter(commande => commande.statut === 'open')
    .forEach((commande) => {
      commande.members.forEach((member) => {
        uniqueMembers.add(member.memberId);
      });
    });
  const totalParticipants = uniqueMembers.size + (currentUserTotal > 0 ? 1 : 0);

  // Déterminer le statut et la progression pour le premier palier uniquement
  const isThreshold1Reached = globalTotal >= THRESHOLD_1;
  const progress = Math.min((globalTotal / THRESHOLD_1) * 100, 100);

  let statusIcon;
  let statusText;
  let statusColor;
  let barColor;

  if (!isThreshold1Reached) {
    // Pas encore 250€
    statusIcon = XCircle;
    statusText = `${(THRESHOLD_1 - globalTotal).toFixed(2)}€ manquants pour le palier de 250€`;
    statusColor = 'text-red-600';
    barColor = 'bg-red-500';
  } else {
    // Palier atteint
    statusIcon = CheckCircle;
    statusText = 'Palier de 250€ atteint ! 🎉';
    statusColor = 'text-green-600';
    barColor = 'bg-green-500';
  }

  const StatusIcon = statusIcon;

  return (
    <div className="space-y-4 mb-6">
      <Card className="border-2 border-[#F1C40F] bg-white shadow-sm">
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
                  Objectif: {THRESHOLD_1}€
                </p>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-200">
            {/* Barre de progression */}
            <div className="w-full bg-gray-200 rounded-full h-4 relative">
              <div
                className={`h-4 rounded-full ${barColor} transition-all duration-500`}
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Labels des paliers */}
            <div className="flex justify-between mt-2 text-xs text-gray-600 font-medium">
              <span>0€</span>
              <span>250€</span>
            </div>

            {/* Indicateurs de paliers atteints */}
            <div className="flex justify-between mt-2 items-center">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-xs text-gray-500 mt-1">Début</span>
              </div>
              <div className="flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full ${isThreshold1Reached ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className="text-xs text-gray-500 mt-1">250€</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Message informatif si le palier n'est pas atteint */}
      {!isThreshold1Reached && (
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Important :</strong> La commande ne pourra être passée qu'une fois le palier de 250€ atteint.
            Sans ce montant minimum, pas de réduction de -25%, la commande groupée ne pourra pas être validée
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
