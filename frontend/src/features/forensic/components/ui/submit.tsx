import { Search } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface SubmitProps {
  isSearching: boolean;
  onCancel: () => Promise<void>;
}

export default function Submit({ isSearching, onCancel }: SubmitProps) {
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

  return (
    <div className="sticky bottom-0 left-0 right-0 pt-4 pb-4 z-50">
      <Button type="submit" className="w-full" disabled={isSearching}>
        {renderButtonContent()}
      </Button>
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
