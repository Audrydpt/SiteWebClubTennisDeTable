import { Loader, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface SubmitProps {
  isSearching: boolean;
  isInitializing: boolean;
  canStartSearch: boolean;
  onCancel: () => Promise<void>;
}

export default function Submit({
  isSearching,
  isInitializing,
  canStartSearch,
  onCancel,
}: SubmitProps) {
  // Helper function to render button content based on state
  const renderButtonContent = () => {
    if (isSearching) {
      return (
        <>
          <span className="animate-spin mr-2">◌</span> Recherche en cours...
        </>
      );
    }
    if (!canStartSearch) {
      return (
        <>
          <Loader className="mr-2" size={16} /> Veuillez patienter...
        </>
      );
    }
    return (
      <>
        <Search className="mr-2" size={16} /> Lancer la recherche
      </>
    );
  };

  return (
    <div className="sticky bottom-0 left-0 right-0 pt-4 pb-4 z-50">
      <Button
        type="submit"
        className="w-full"
        disabled={isSearching || !canStartSearch}
        title={
          !canStartSearch && !isSearching
            ? 'Veuillez patienter avant de relancer une recherche'
            : ''
        }
      >
        {renderButtonContent()}
      </Button>

      <Button
        onClick={onCancel}
        variant="outline"
        size="sm"
        className="w-full mt-2"
        disabled={!isSearching || isInitializing}
        title={
          isInitializing
            ? "Impossible d'annuler pendant l'initialisation"
            : 'Annuler la recherche'
        }
      >
        Annuler la recherche
      </Button>
    </div>
  );
}
