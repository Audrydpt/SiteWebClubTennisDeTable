import { Search, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SubmitProps {
  isSearching: boolean;
  onCancel: () => Promise<void>;
  onAddTab?: () => void; // Nouvelle prop pour gérer l'ajout d'un onglet
  activeTabCount?: number; // Nombre d'onglets actifs
}

export default function Submit({
  isSearching,
  onCancel,
  onAddTab,
  activeTabCount = 0,
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
    return (
      <>
        <Search className="mr-2" size={16} /> Lancer la recherche
      </>
    );
  };

  const canAddTab = activeTabCount < 5;

  return (
    <div className="sticky bottom-0 left-0 right-0 pt-4 pb-4 z-50">
      <div className="flex items-center gap-2">
        <Button type="submit" className="w-full flex-1" disabled={isSearching}>
          {renderButtonContent()}
        </Button>
        {onAddTab && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="flex-shrink-0 h-10 w-10"
            onClick={onAddTab}
            disabled={!canAddTab}
            title={
              canAddTab
                ? 'Ajouter un nouvel onglet'
                : "Nombre maximum d'onglets atteint"
            }
          >
            <Plus size={16} />
          </Button>
        )}
      </div>
      <Button
        onClick={onCancel}
        variant="outline"
        size="sm"
        className="w-full mt-2"
        disabled={!isSearching}
      >
        Annuler la recherche
      </Button>
    </div>
  );
}
