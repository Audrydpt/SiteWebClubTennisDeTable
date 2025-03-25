/* eslint-disable @typescript-eslint/no-unused-vars,prettier/prettier */
import {
  ChevronDown,
  ChevronUp,
  Search,
  SortAsc,
  SortDesc,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Toggle } from '@/components/ui/toggle';

import forensicResultsHeap from '../lib/data-structure/heap';
import { ForensicResult, SourceProgress } from '../lib/types';
import {
  calculateTimeRemaining,
  formatTimeRemaining,
} from '@/features/forensic/lib/estimation/estimation';

// Enum to represent different sort types
type SortType = 'score' | 'date';

interface ResultsProps {
  results: ForensicResult[];
  isSearching: boolean;
  progress: number | null;
  sourceProgress: SourceProgress[];
}

// Function to generate random test data
const generateRandomResult = (): ForensicResult => ({
  id: crypto.randomUUID(),
  imageData: `https://picsum.photos/seed/${Math.random()}/300/200`,
  timestamp: new Date(
    Date.now() - Math.floor(Math.random() * 86400000)
  ).toISOString(), // Random date within the last 24h
  score: Math.random(), // Random score between 0 and 1
  cameraId: `Camera-${Math.floor(Math.random() * 10)}`,
  attributes: {
    color: {
      red: Math.random(),
      green: Math.random(),
      blue: Math.random(),
    },
    type: {
      person: Math.random(),
      car: Math.random(),
      truck: Math.random(),
    },
  },
  progress: Math.floor(Math.random() * 100),
});

// Helper function to avoid nested ternaries
const getScoreBackgroundColor = (score: number) => {
  if (score > 0.7) return 'rgba(220, 38, 38, 0.8)'; // Red for high scores
  if (score > 0.4) return 'rgba(245, 158, 11, 0.8)'; // Orange for medium scores
  return 'rgba(0, 0, 0, 0.7)'; // Black for low scores
};

// Helper to extract camera name and IP from camera ID
const extractCameraInfo = (cameraId: string) => {
  // If cameraId has a structure like "Camera Name (192.168.1.1)"
  const match = cameraId.match(/^(.+?)\s*\(([^)]+)\)$/);
  if (match) {
    return {
      name: match[1].trim(),
      ip: match[2].trim(),
    };
  }

  // Default case - just return the ID as name and unknown IP
  return {
    name: cameraId !== 'unknown' ? cameraId : 'Caméra inconnue',
    ip: 'IP inconnue',
  };
};

export default function Results({
  results,
  isSearching,
  progress,
  sourceProgress,
}: ResultsProps) {
  const [testMode, setTestMode] = useState(false);
  const [testResults, setTestResults] = useState<ForensicResult[]>([]);
  const [sortType, setSortType] = useState<SortType>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [showSourceDetails, setShowSourceDetails] = useState(false);

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

  // Sort results based on current sort type and order
  const sortedResults = useMemo(() => {
    if (!displayResults.length) return [];

    return [...displayResults].sort((a, b) => {
      if (sortType === 'score') {
        return sortOrder === 'desc' ? b.score - a.score : a.score - b.score;
      }
      // Sort by date
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
  }, [displayResults, sortType, sortOrder]);

  const toggleSortType = () => {
    setSortType(sortType === 'score' ? 'date' : 'score');
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
  };

  const timeEstimates = useMemo(
    () => calculateTimeRemaining(sourceProgress),
    [sourceProgress]
  );

  // Add logs in the renderProgressSection function
  const renderProgressSection = () => {
    if (progress === null) {
      return null;
    }

    // Determine the status text based on conditions
    let statusText = '';
    if (progress === 100) {
      statusText = '';
    } else if (timeEstimates.combined) {
      statusText = `• Temps restant : ${timeEstimates.combined}`;
    } else {
      statusText = '• Calcul du temps restant...';
    }

    return (
      <div className="mt-2 mb-6 space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <p className="text-sm font-medium text-foreground">
              Progression :{' '}
              <span className="text-primary font-semibold">
              {progress.toFixed(0)}%
            </span>
              <span className="text-muted-foreground ml-2 text-xs font-medium">
              {statusText}
            </span>
            </p>
          </div>
          {sourceProgress.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 hover:bg-muted/80"
              onClick={() => setShowSourceDetails(!showSourceDetails)}
            >
              {showSourceDetails
                ? 'Masquer les détails'
                : 'Afficher les détails'}
              {showSourceDetails ? (
                <ChevronUp className="ml-1 h-4 w-4" />
              ) : (
                <ChevronDown className="ml-1 h-4 w-4" />
              )}
            </Button>
          )}
        </div>

        <Progress value={progress} className="w-full" />

        {sourceProgress.length > 0 && (
          <Collapsible
            open={showSourceDetails}
            onOpenChange={setShowSourceDetails}
            className="space-y-3 mt-3"
          >
            <CollapsibleContent className="bg-muted rounded-lg p-3 transition-all">
              <div className="grid gap-3">
                {sourceProgress.map((source) => {
                  // Get camera name from the sourceId using extractCameraInfo
                  const cameraInfo = extractCameraInfo(source.sourceId);
                  // const sourceTimeEstimate =
                  // timeEstimates.individual[source.sourceId];

                  return (
                    <div
                      key={source.sourceId}
                      className="space-y-1.5 border-b border-foreground/50 pb-3 last:border-0 last:pb-0"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">
                            {cameraInfo.name}
                          </span>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            {source.timestamp && (
                              <span className="flex items-center">
                                <svg
                                  className="w-3 h-3 mr-1 inline-block"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <circle cx="12" cy="12" r="10" />
                                  <polyline points="12 6 12 12 16 14" />
                                </svg>
                                {new Date(source.timestamp).toLocaleString(
                                  'fr-FR',
                                  {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  }
                                )}
                              </span>
                            )}
                            {source.progress > 0 &&
                              source.progress < 100 &&
                              timeEstimates.individual[source.sourceId] && (
                                <span className="flex items-center">
                                  <svg
                                    className="w-3 h-3 mr-1 inline-block"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M17 8h2a2 2 0 0 1 2 2v2m-2 8H5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h10" />
                                    <path d="M22 16H13c-2 0-2-4-4-4H7" />
                                  </svg>
                                  {timeEstimates.individual[source.sourceId]}
                                </span>
                            )}
                          </div>
                        </div>
                        <span
                          className={`text-sm font-medium px-2 py-0.5 rounded-full ${
                            source.progress >= 100
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-muted/10 text-primary/80'
                          }`}
                        >
                          {source.progress.toFixed(0)}%
                        </span>
                      </div>
                      <Progress value={source.progress} className="w-full" />
                    </div>
                  );
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    );
  };

  // Render expanded image modal
  const renderExpandedImageModal = () => {
    if (!expandedImage) return null;

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
        onClick={() => setExpandedImage(null)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setExpandedImage(null);
        }}
        role="presentation"
        tabIndex={-1}
      >
        <div className="relative max-w-[90%] max-h-[90%]">
          <button
            className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full p-2"
            onClick={(e) => {
              e.stopPropagation();
              setExpandedImage(null);
            }}
            aria-label="Fermer"
            type="button"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <img
            src={expandedImage}
            alt="Résultat agrandi"
            className="max-w-full max-h-[85vh] object-contain"
          />
        </div>
      </div>
    );
  };

  // Results are already sorted by the heap in useSearch, so we can use them directly
  const renderSearchResults = () => {
    if (displayResults.length > 0) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedResults.map((result: ForensicResult) => {
            const timestamp = new Date(result.timestamp);

            return (
              <Popover key={result.id}>
                <PopoverTrigger asChild>
                  <div className="border rounded-md overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-card cursor-pointer relative group">
                    <div className="relative">
                      <img
                        src={result.imageData}
                        alt="Forensic result"
                        className="w-full h-auto object-cover aspect-[16/9]"
                      />
                      <div
                        className="absolute top-2 right-2 text-white rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{
                          backgroundColor: getScoreBackgroundColor(
                            result.score
                          ),
                        }}
                      >
                        {(result.score * 100).toFixed(1)}%
                      </div>

                      {/* Add expand button */}
                      <button
                        className="absolute bottom-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedImage(result.imageData);
                        }}
                        aria-label="Agrandir l'image"
                        type="button"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="15 3 21 3 21 9" />
                          <polyline points="9 21 3 21 3 15" />
                          <line x1="21" y1="3" x2="14" y2="10" />
                          <line x1="3" y1="21" x2="10" y2="14" />
                        </svg>
                      </button>
                    </div>
                    <div className="p-4 space-y-2">
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
                        {timestamp.toLocaleString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-2">
                    <h3 className="font-medium text-sm">Métadonnées</h3>
                    <div className="grid grid-cols-2 gap-1 text-sm">
                      <div className="text-muted-foreground">Type:</div>
                      <div>{result.type || 'detection'}</div>

                      <div className="text-muted-foreground">Caméra:</div>
                      <div>
                        {
                          extractCameraInfo(result.camera || result.cameraId)
                            .name
                        }
                      </div>

                      <div className="text-muted-foreground">Score:</div>
                      <div>{(result.score * 100).toFixed(1)}%</div>

                      <div className="text-muted-foreground">Timestamp:</div>
                      <div>
                        {timestamp.toLocaleString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </div>
                    </div>

                    {/* Full raw data */}
                    <div className="mt-1">
                      <details>
                        <summary className="text-sm font-medium cursor-pointer">
                          Données brutes
                        </summary>
                        <div className="text-xs bg-muted p-2 mt-2 rounded-md overflow-auto max-h-48">
                          <pre className="whitespace-pre-wrap">
                            {JSON.stringify(result, null, 2)}
                          </pre>
                        </div>
                      </details>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            );
          })}
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
        <div className="flex gap-2">
          {/* Sort controls */}
          <div className="flex items-center gap-1 mr-2 border rounded-lg overflow-hidden">
            <Toggle
              pressed={sortType === 'score'}
              onPressedChange={() => sortType !== 'score' && toggleSortType()}
              size="sm"
              className="rounded-none border-r data-[state=on]:bg-accent"
              aria-label="Trier par score"
              title="Trier par score"
            >
              Score
            </Toggle>
            <Toggle
              pressed={sortType === 'date'}
              onPressedChange={() => sortType !== 'date' && toggleSortType()}
              size="sm"
              className="rounded-none data-[state=on]:bg-accent"
              aria-label="Trier par date"
              title="Trier par date"
            >
              Date
            </Toggle>
          </div>

          {/* Order toggle */}
          <Button
            variant="outline"
            size="icon"
            onClick={toggleSortOrder}
            className="h-8 w-8"
            title={
              sortOrder === 'desc' ? 'Ordre décroissant' : 'Ordre croissant'
            }
          >
            {sortOrder === 'desc' ? (
              <SortDesc className="h-4 w-4" />
            ) : (
              <SortAsc className="h-4 w-4" />
            )}
          </Button>
          {/*
          <Button
            variant={testMode ? 'destructive' : 'outline'}
            size="sm"
            onClick={() => setTestMode(!testMode)}
          >
            {testMode ? 'Arrêter' : 'Tester'}
          </Button>
          */}
        </div>
      </div>

      {testMode && (
        <div className="mb-4 bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded-md">
          <p className="text-sm text-yellow-800 dark:text-yellow-300">
            Mode test actif: {displayResults.length} résultats | Un nouveau
            résultat toutes les secondes
          </p>
        </div>
      )}
      <ScrollArea className="h-[calc(100%-3rem)] pb-1">
        <div className="space-y-4">
          {/* Progress section inside ScrollArea */}
          {renderProgressSection()}

          {/* Results */}
          {renderSearchResults()}
        </div>
      </ScrollArea>

      {renderExpandedImageModal()}
    </>
  );
}
