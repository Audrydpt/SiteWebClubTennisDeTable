import { Search } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { ForensicResult } from '../lib/types';
import forensicResultsHeap from '../lib/data-structure/heap';
import { Button } from '@/components/ui/button';

interface ResultsProps {
  results: ForensicResult[];
  isSearching: boolean;
  progress: number | null;
}

// Function to generate random test data
const generateRandomResult = (): ForensicResult => ({
  id: crypto.randomUUID(),
  imageData: `https://picsum.photos/seed/${Math.random()}/300/200`,
  timestamp: new Date().toISOString(),
  score: Math.random(), // Random score between 0 and 1
  cameraId: `Camera-${Math.floor(Math.random() * 10)}`,
});

// Helper function to avoid nested ternaries
const getScoreBackgroundColor = (score: number) => {
  if (score > 0.7) return 'rgba(220, 38, 38, 0.8)'; // Red for high scores
  if (score > 0.4) return 'rgba(245, 158, 11, 0.8)'; // Orange for medium scores
  return 'rgba(0, 0, 0, 0.7)'; // Black for low scores
};

export default function Results({
  results,
  isSearching,
  progress,
}: ResultsProps) {
  const [testMode, setTestMode] = useState(false);
  const [testResults, setTestResults] = useState<ForensicResult[]>([]);

  // Generate stable skeleton IDs
  const skeletonIds = useMemo(
    () =>
      Array.from({ length: 8 }, () =>
        Math.random().toString(36).substring(2, 15)
      ),
    []
  );
  useEffect(() => {
    if (!testMode) {
      // Clear test data when disabling test mode
      setTestResults([]);
      forensicResultsHeap.clear();
      return () => {};
    }

    const intervalId = setInterval(() => {
      const newResult = generateRandomResult();
      forensicResultsHeap.addResult(newResult);
      setTestResults(forensicResultsHeap.getBestResults());
    }, 1000);

    return () => clearInterval(intervalId);
  }, [testMode]);

  // Use either real results or test results based on test mode
  const displayResults = testMode ? testResults : results;

  // Sort results by score in descending order to place high scores at the top
  const sortedResults = useMemo(
    () => [...displayResults].sort((a, b) => b.score - a.score),
    [displayResults]
  );

  // Results are already sorted by the heap in useSearch, so we can use them directly
  const renderSearchResults = () => {
    if (displayResults.length > 0) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedResults.map((result: ForensicResult) => (
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
                <div
                  className="absolute top-2 right-2 text-white rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: getScoreBackgroundColor(result.score),
                  }}
                >
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

    if ((isSearching && progress !== 100) || testMode) {
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
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-lg font-semibold">Résultats de recherche</h2>
        <Button
          variant={testMode ? 'destructive' : 'outline'}
          size="sm"
          onClick={() => setTestMode(!testMode)}
        >
          {testMode ? 'Arrêter Test Heap' : 'Tester Heap'}
        </Button>
      </div>

      {progress !== null && progress < 100 && !testMode && (
        <div className="mt-2 mb-4">
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground mt-1">
            Progression: {progress}%
          </p>
        </div>
      )}

      {testMode && (
        <div className="mb-4 bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded-md">
          <p className="text-sm text-yellow-800 dark:text-yellow-300">
            Mode test actif: {displayResults.length} résultats | Un nouveau
            résultat toutes les secondes
          </p>
        </div>
      )}

      <ScrollArea className="h-[calc(100%-3rem)] pb-9">
        {renderSearchResults()}
      </ScrollArea>
    </>
  );
}
