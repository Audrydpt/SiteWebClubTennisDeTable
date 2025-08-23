'use client';

import { useState } from 'react';
import { PlusCircle, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Member } from '@/services/type.ts';

interface PlayerSelectorProps {
  membres: Member[];
  onPlayerSelect?: (player: Member) => void;
  disabled?: boolean;
  selectedPlayers?: string[];
  onSelectionChange?: (joueurs: string[]) => void;
  maxPlayers?: number;
  title?: string;
}

// eslint-disable-next-line import/prefer-default-export
export function PlayerSelector({
  membres,
  onPlayerSelect,
  disabled = false,
  selectedPlayers = [],
  onSelectionChange,
  maxPlayers = 4,
  title = 'Sélectionner un joueur',
}: PlayerSelectorProps) {
  const [joueurSelectionne, setJoueurSelectionne] = useState<string>('');

  const handleAddPlayer = () => {
    if (!joueurSelectionne) return;

    const membre = membres.find((m) => m.id === joueurSelectionne);
    if (!membre) return;

    if (onPlayerSelect) {
      onPlayerSelect(membre);
    }

    if (onSelectionChange && selectedPlayers) {
      const newSelection = [...selectedPlayers, joueurSelectionne];
      onSelectionChange(newSelection);
    }

    setJoueurSelectionne('');
  };

  const removePlayer = (playerId: string) => {
    if (onSelectionChange && selectedPlayers) {
      const newSelection = selectedPlayers.filter((id) => id !== playerId);
      onSelectionChange(newSelection);
    }
  };

  const availableMembers = membres.filter(
    (membre) => !selectedPlayers.includes(membre.id)
  );

  return (
    <div className="space-y-4">
      {title && (
        <h4 className="font-medium flex items-center gap-2">
          <Users className="h-4 w-4" />
          {title}
        </h4>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <Select
          value={joueurSelectionne}
          onValueChange={setJoueurSelectionne}
          disabled={disabled}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Choisir un joueur..." />
          </SelectTrigger>
          <SelectContent>
            {availableMembers.map((membre) => (
              <SelectItem key={membre.id} value={membre.id}>
                <div className="flex items-center gap-2">
                  <span>
                    {membre.prenom} {membre.nom}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({membre.classement || 'N/A'})
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          onClick={handleAddPlayer}
          disabled={
            disabled ||
            !joueurSelectionne ||
            selectedPlayers.length >= maxPlayers
          }
          size="sm"
        >
          <PlusCircle className="h-4 w-4 mr-1" />
          Ajouter
        </Button>
      </div>

      {/* Show selected players when using onSelectionChange mode */}
      {onSelectionChange && selectedPlayers.length > 0 && (
        <div className="space-y-2">
          {selectedPlayers.map((playerId) => {
            const member = membres.find((m) => m.id === playerId);
            if (!member) return null;

            return (
              <div
                key={playerId}
                className="flex items-center justify-between bg-gray-50 p-2 rounded-lg"
              >
                <span className="text-sm">
                  {member.prenom} {member.nom} ({member.classement || 'N/A'})
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removePlayer(playerId)}
                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                >
                  ×
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
