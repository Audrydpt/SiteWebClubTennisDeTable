import { Search } from 'lucide-react';
import { useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { ForensicResult } from '../hooks/use-search';

interface ResultsProps {
  results: ForensicResult[];
  isSearching: boolean;
  progress: number | null;
}

export default function Results({
  results,
  isSearching,
  progress,
}: ResultsProps) {
  // Generate stable skeleton IDs
  const skeletonIds = useMemo(
    () =>
      Array.from({ length: 8 }, () =>
        Math.random().toString(36).substring(2, 15)
      ),
    []
  );

  const renderSearchResults = () => {
    if (results.length > 0) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {results.map((result: ForensicResult) => (
            <div
              key={result.id}
              className="border rounded-md overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-card"
            >
              <div className="relative">
                <img
                  src={result.imageData}
                  alt="Forensic result"
                  className="w-full h-auto object-cover aspect-[16/9]"
                />
                <div className="absolute top-2 right-2 bg-black/70 text-white rounded-full px-2 py-0.5 text-xs font-medium">
                  {(result.score * 100).toFixed(1)}%
                </div>
              </div>
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold truncate">
                    {result.cameraId !== 'unknown'
                      ? result.cameraId
                      : 'Caméra inconnue'}
                  </h4>
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <svg
                    className="w-3.5 h-3.5 mr-1.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {new Date(result.timestamp).toLocaleString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (isSearching && progress !== 100) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {skeletonIds.map((id) => (
            <div
              key={`skeleton-${id}`}
              className="border rounded-md overflow-hidden shadow-sm"
            >
              <div className="bg-muted w-full aspect-[16/9] animate-pulse" />
              <div className="p-3">
                <div className="h-4 bg-muted rounded w-3/4 mb-1 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (progress === 100) {
      return (
        <div className="flex h-[50vh] items-center justify-center text-muted-foreground">
          Aucun résultat trouvé
        </div>
      );
    }

    return (
      <div className="flex flex-col h-[50vh] items-center justify-center text-muted-foreground">
        <Search className="mb-2 opacity-30" size={48} />
        <p>Sélectionnez une caméra et lancez une recherche</p>
      </div>
    );
  };

  return (
    <>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Résultats de recherche</h2>
        {progress !== null && progress < 100 && (
          <div className="mt-2">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground mt-1">
              Progression: {progress}%
            </p>
          </div>
        )}
      </div>

      <ScrollArea className="h-[calc(100%-3rem)]">
        {renderSearchResults()}
      </ScrollArea>
    </>
  );
}
