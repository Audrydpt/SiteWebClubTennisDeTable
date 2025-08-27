/* eslint-disable */
import { useState } from 'react';
import { PlusCircle, Users, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  const [searchTerm, setSearchTerm] = useState<string>('');

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
    setSearchTerm(''); // Reset search when player is added
  };

  const removePlayer = (playerId: string) => {
    if (onSelectionChange && selectedPlayers) {
      const newSelection = selectedPlayers.filter((id) => id !== playerId);
      onSelectionChange(newSelection);
    }
  };

  // Filtrer les membres disponibles en excluant ceux déjà sélectionnés
  const availableMembers = membres.filter(
    (membre) => !selectedPlayers.includes(membre.id)
  );

  // Filtrer les membres selon le terme de recherche
  const filteredMembers = availableMembers.filter((membre) => {
    if (!searchTerm) return true;

    const search = searchTerm.toLowerCase();
    const nom = (membre.nom || '').toLowerCase();
    const prenom = (membre.prenom || '').toLowerCase();
    const classement = (membre.classement || '').toLowerCase();

    return (
      nom.includes(search) ||
      prenom.includes(search) ||
      classement.includes(search) ||
      `${prenom} ${nom}`.toLowerCase().includes(search)
    );
  });

  return (
    <div className="space-y-4">
      {title && (
        <h4 className="font-medium flex items-center gap-2">
          <Users className="h-4 w-4" />
          {title}
        </h4>
      )}

      <div className="space-y-2">
        {/* Barre de recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Rechercher par nom, prénom ou classement..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            disabled={disabled}
          />
        </div>

        {/* Sélecteur avec résultats filtrés */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Select
            value={joueurSelectionne}
            onValueChange={setJoueurSelectionne}
            disabled={disabled}
          >
            <SelectTrigger className="flex-1">
              <SelectValue
                placeholder={
                  filteredMembers.length === 0
                    ? searchTerm
                      ? 'Aucun résultat trouvé...'
                      : 'Choisir un joueur...'
                    : 'Choisir un joueur...'
                }
              />
            </SelectTrigger>
            <SelectContent>
              {filteredMembers.length > 0 ? (
                filteredMembers.map((membre) => (
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
                ))
              ) : (
                <SelectItem value="no-results" disabled>
                  <span className="text-gray-400 italic">
                    {searchTerm
                      ? 'Aucun joueur trouvé'
                      : 'Aucun joueur disponible'}
                  </span>
                </SelectItem>
              )}
            </SelectContent>
          </Select>

          <Button
            onClick={handleAddPlayer}
            disabled={
              disabled ||
              !joueurSelectionne ||
              selectedPlayers.length >= maxPlayers ||
              filteredMembers.length === 0
            }
            size="sm"
          >
            <PlusCircle className="h-4 w-4 mr-1" />
            Ajouter
          </Button>
        </div>

        {/* Afficher le nombre de résultats si recherche active */}
        {searchTerm && (
          <p className="text-xs text-gray-500">
            {filteredMembers.length} joueur
            {filteredMembers.length > 1 ? 's' : ''} trouvé
            {filteredMembers.length > 1 ? 's' : ''}
          </p>
        )}
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
