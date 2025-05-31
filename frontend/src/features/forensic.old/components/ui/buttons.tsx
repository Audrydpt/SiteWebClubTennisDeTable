/* eslint-disable @typescript-eslint/no-unused-vars,react/no-unused-prop-types */
import { Trash2 } from 'lucide-react';

import DeleteConfirmation from '@/components/confirm-delete';
import { Button } from '@/components/ui/button';

import useJobs from '../../hooks/use-jobs';

export type SortType = 'score' | 'date';

interface SortButtonsProps {
  sortType?: SortType;
  setSortType?: (type: SortType) => void;
  sortOrder?: 'asc' | 'desc';
  toggleSortOrder?: () => void;
  clearResults?: () => void;
}

export function SortButtons({
  sortType = 'score',
  setSortType = () => {},
  /* sortOrder,
  toggleSortOrder, */
  clearResults = () => {},
}: SortButtonsProps) {
  // Fonction pour gérer le reset complet

  const { deleteAllTasks } = useJobs();

  const handleReset = () => {
    deleteAllTasks();
    clearResults();
  };

  return (
    <div className="flex gap-2">
      {/* Contrôles de tri */}
      <div className="flex items-center gap-1 mr-2">
        <Button
          variant={sortType === 'score' ? 'default' : 'outline-solid'}
          size="sm"
          onClick={() => setSortType('score')}
        >
          Score
        </Button>
        <Button
          variant={sortType === 'date' ? 'default' : 'outline-solid'}
          size="sm"
          onClick={() => setSortType('date')}
        >
          Date
        </Button>
      </div>

      {/* Bouton pour basculer l'ordre 
      <Button
        variant="outline"
        size="icon"
        onClick={toggleSortOrder}
        className="size-8"
        title={sortOrder === 'desc' ? 'Ordre décroissant' : 'Ordre croissant'}
      >
        {sortOrder === 'desc' ? (
          <SortDesc className="size-4" />
        ) : (
          <SortAsc className="size-4" />
        )}
      </Button>
      */}

      {/* Bouton pour vider les résultats avec confirmation */}
      <DeleteConfirmation
        onDelete={handleReset}
        title="Supprimer tous les résultats"
        description="Êtes-vous sûr de vouloir supprimer tous les onglets et résultats ? Cette action est irréversible."
        confirmText="Supprimer tout"
      >
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground hover:text-destructive"
          title="Vider les résultats"
        >
          <Trash2 className="size-4" />
        </Button>
      </DeleteConfirmation>
    </div>
  );
}
