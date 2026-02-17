/* eslint-disable */

import { useMemo } from 'react';
import type { CompteCaisse } from '@/services/type';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, User } from 'lucide-react';

interface ComptesActifsPanelProps {
  comptes: CompteCaisse[];
  onSelectClient?: (client: {
    type: 'membre' | 'externe';
    id: string;
    nom: string;
  }) => void;
}

// Fonction pour formater le nom de façon compacte : Prénom + initiale du nom
function formatCompactName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];

  // Le prénom est le premier mot, le nom est le dernier
  const prenom = parts[0];
  const nom = parts[parts.length - 1];

  return `${prenom} ${nom.charAt(0).toUpperCase()}.`;
}

// Fonction pour formater la date relative
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor(diffMs / (1000 * 60));

  if (diffMins < 60) {
    return `il y a ${diffMins} min`;
  } else if (diffHours < 24) {
    return `il y a ${diffHours}h`;
  } else {
    return `il y a ${Math.floor(diffHours / 24)}j`;
  }
}

export default function ComptesActifsPanel({
  comptes,
  onSelectClient,
}: ComptesActifsPanelProps) {
  // Filtrer les comptes actifs dans les 48 dernières heures avec un solde > 0
  const comptesRecents = useMemo(() => {
    const now = new Date();
    const heures48Ago = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    return comptes
      .filter((compte) => {
        const derniereActivite = new Date(compte.derniereActivite);
        return derniereActivite >= heures48Ago && compte.solde > 0;
      })
      .sort((a, b) => a.clientNom.localeCompare(b.clientNom, 'fr'));
  }, [comptes]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-[#4A4A4A]">
        <Clock className="w-3.5 h-3.5 text-orange-400" />
        <span className="text-xs text-white font-medium">Comptes du jour</span>
        {comptesRecents.length > 0 && (
          <span className="ml-auto text-xs text-orange-400 font-semibold bg-orange-400/20 px-1.5 py-0.5 rounded-full">
            {comptesRecents.length}
          </span>
        )}
      </div>

      {/* Liste des comptes */}
      <ScrollArea className="flex-1 min-h-0">
        {comptesRecents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-24 text-gray-500">
            <User className="w-6 h-6 mb-1.5 opacity-30" />
            <span className="text-xs">Aucun compte actif</span>
            <span className="text-xs text-gray-600">dans les 48h</span>
          </div>
        ) : (
          <div className="space-y-1.5 pr-1">
            {comptesRecents.map((compte) => (
              <div
                key={compte.id}
                onClick={() =>
                  onSelectClient?.({
                    type: compte.clientType,
                    id: compte.clientId,
                    nom: compte.clientNom,
                  })
                }
                className="bg-[#3A3A3A] rounded-lg p-2 hover:bg-[#404040] hover:ring-1 hover:ring-[#F1C40F]/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-white text-xs font-medium truncate flex-1">
                    {formatCompactName(compte.clientNom)}
                  </span>
                  <span className="text-orange-400 font-bold text-xs whitespace-nowrap">
                    {compte.solde.toFixed(2)}€
                  </span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-[10px] text-gray-500">
                    {compte.clientType === 'membre' ? 'Membre' : 'Externe'}
                  </span>
                  <span className="text-[10px] text-gray-500">
                    {formatRelativeTime(compte.derniereActivite)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
