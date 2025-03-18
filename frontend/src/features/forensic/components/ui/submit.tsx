import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface SubmitProps {
  isSearching: boolean;
  progress: number | null;
  onCancel: () => Promise<void>;
}

export default function Submit({
  isSearching,
  progress,
  onCancel,
}: SubmitProps) {
  return (
    <div className="sticky bottom-0 left-0 right-0 pt-4 pb-4 z-50">
      <Button type="submit" className="w-full" disabled={isSearching}>
        {isSearching ? (
          <>
            <span className="animate-spin mr-2">◌</span> Recherche en cours...
          </>
        ) : (
          <>
            <Search className="mr-2" size={16} /> Lancer la recherche
          </>
        )}
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

      {isSearching && (
        <>
          <Progress value={progress ?? 0} className="h-2 mt-2" />
          <p className="text-xs text-muted-foreground mt-1 text-center">
            {progress !== null
              ? `${progress.toFixed(1)}% terminé`
              : 'Initialisation de la recherche...'}
          </p>
        </>
      )}
    </div>
  );
}
