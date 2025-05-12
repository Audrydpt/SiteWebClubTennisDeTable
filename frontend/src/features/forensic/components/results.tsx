/* eslint-disable @typescript-eslint/no-unused-vars,prettier/prettier,@typescript-eslint/no-explicit-any,no-console,no-else-return,consistent-return,react-hooks/exhaustive-deps,import/no-named-as-default */
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';

import useJobs from '../hooks/use-jobs';
import useSearch from '../hooks/use-search.tsx';
import forensicResultsHeap from '../lib/data-structure/heap';
import { calculateTimeRemaining } from '../lib/estimation/estimation';
import { ForensicResult, SourceProgress } from '../lib/types';
import { SortType } from './ui/buttons';
import Display from './ui/display.tsx';
import ForensicHeader from './ui/header';
import MultiProgress from './ui/multi-progress';

interface ResultsProps {
  results: ForensicResult[];
  isSearching: boolean;
  progress: number | null;
  sourceProgress: SourceProgress[];
  onTabChange?: (tabIndex: string) => void;
  isTabLoading?: boolean;
  currentPage: number;
  onPageChange: (page: number) => void;
  paginationInfo: {
    currentPage: number;
    pageSize: number;
    totalPages: number;
    total: number;
  };
  sortType: SortType;
  setSortType: (type: SortType) => void;
  sortOrder: 'asc' | 'desc';
  toggleSortOrder: () => void;
}

export default function Results({
  results: propsResults,
  isSearching,
  progress,
  sourceProgress,
  onTabChange,
  isTabLoading,
  currentPage,
  onPageChange,
  paginationInfo,
  sortType,
  setSortType,
  sortOrder,
  toggleSortOrder,
}: ResultsProps) {
  const [showSourceDetails, setShowSourceDetails] = useState(false);
  const { /* resumeJob, */ displayResults, setDisplayResults, testResumeJob } =
    useSearch();
  const {
    tasks: tabJobs,
    handleTabChange: defaultHandleTabChange,
    activeTabIndex,
  } = useJobs();
  const isLoadingRef = useRef(false);
  const requestTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadedJobsRef = useRef<Set<string>>(new Set());
  const handleTabChange = onTabChange || defaultHandleTabChange;
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Fonction modifiée pour éviter les logs excessifs
  const resultsToDisplay = useMemo(() => {
    const activeTab = tabJobs.find((tab) => tab.id === activeTabIndex);
    if (activeTabIndex && !activeTab) {
      return [];
    }
    return propsResults && propsResults.length > 0
      ? propsResults
      : displayResults;
  }, [displayResults, propsResults, activeTabIndex, tabJobs]);

  const hasActiveJob = useMemo(
    () => !!activeTabIndex || (resultsToDisplay && resultsToDisplay.length > 0),
    [activeTabIndex, resultsToDisplay, tabJobs, activeTabIndex]
  );

  // Effet pour désactiver l'état de chargement initial
  useEffect(() => {
    // Cas 1: Si nous avons des résultats
    if (
      (propsResults && propsResults.length > 0) ||
      (displayResults && displayResults.length > 0)
    ) {
      const timer = setTimeout(() => {
        setIsInitialLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    }

    // Cas 2: Si la recherche est terminée
    if (progress === 100 && !isSearching) {
      const timer = setTimeout(() => {
        setIsInitialLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    }

    // Délai de sécurité pour éviter un chargement infini
    const fallbackTimer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 3000);

    return () => clearTimeout(fallbackTimer);
  }, [propsResults, displayResults, progress, isSearching]);

  // Effet pour charger automatiquement les résultats
  useEffect(() => {
    const autoLoadResults = async () => {
      if (isLoadingRef.current) {
        console.log(
          '❌ Chargement déjà en cours, abandon du chargement automatique'
        );
        return;
      }
      const activeTab = tabJobs.find((tab) => tab.id === activeTabIndex);
      const jobId = activeTab?.id;
      if (!jobId) {
        return;
      }
      if (loadedJobsRef.current.has(jobId)) {
        return;
      }
      isLoadingRef.current = true;

      try {
        loadedJobsRef.current.add(jobId);
        // await resumeJob(jobId, false);
        await testResumeJob(jobId, 1, false, false, sortType, 'desc');
      } catch (error) {
        console.error('Erreur lors du chargement des résultats:', error);
      } finally {
        setTimeout(() => {
          isLoadingRef.current = false;
        }, 500);
      }
    };
    if (requestTimeoutRef.current) {
      clearTimeout(requestTimeoutRef.current);
    }
    requestTimeoutRef.current = setTimeout(autoLoadResults, 100);

    return () => {
      if (requestTimeoutRef.current) {
        clearTimeout(requestTimeoutRef.current);
      }
    };
  }, [activeTabIndex, tabJobs, /* resumeJob, */ testResumeJob]);

  const timeEstimates = useMemo(
    () => calculateTimeRemaining(sourceProgress),
    [sourceProgress]
  );

  const clearResults = () => {
    forensicResultsHeap.clear();
    setDisplayResults([]);
  };

  const renderProgressSection = () => {
    if (!activeTabIndex && !hasActiveJob && !isSearching) {
      return null;
    }

    if (!hasActiveJob || progress === null || isTabLoading) {
      return (
        <div className="space-y-2 mb-6">
          <div className="flex justify-between items-center">
            <div className="h-4 bg-muted/80 rounded w-32 animate-pulse" />
            <div className="h-3 bg-muted/60 rounded w-24 animate-pulse" />
          </div>
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted/40">
            <div
              className="absolute inset-y-0 left-0 w-1/3 bg-primary/50 rounded-full"
              style={{
                animation: 'pulse 1.5s infinite ease-in-out',
                opacity: 0.7,
              }}
            />
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3">
            {[1, 2, 3].map((n) => (
              <div key={`source-${n}`} className="flex flex-col space-y-1">
                <div className="h-3 bg-muted/60 rounded w-3/4 animate-pulse" />
                <div className="h-2 bg-muted/40 rounded w-full animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      );
    }

    let statusText: string;
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
                {progress !== null ? progress.toFixed(0) : 0}%
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

        <MultiProgress
          sourceProgress={sourceProgress}
          showSourceDetails={showSourceDetails}
          setShowSourceDetails={setShowSourceDetails}
        />
      </div>
    );
  };

  return (
    <>
      <ForensicHeader
        onTabChange={handleTabChange}
        sortType={sortType}
        setSortType={setSortType}
        sortOrder={sortOrder}
        toggleSortOrder={toggleSortOrder}
        clearResults={clearResults}
        loading={isInitialLoading}
        setIsLoading={setIsInitialLoading}
      />
      <ScrollArea className="h-[calc(100%-3rem)] pb-6">
        <div className="space-y-4 pb-6">
          {/* Progress section inside ScrollArea */}
          {renderProgressSection()}

          {/* Results display */}

          {(() => {
            const activeTab = tabJobs.find((tab) => tab.id === activeTabIndex);

            if (!activeTabIndex) {
              return (
                <div className="flex h-[50vh] items-center justify-center text-muted-foreground">
                  Sélectionnez une caméra et lancez une recherche
                </div>
              );
            } else if (
              hasActiveJob &&
              !isSearching &&
              progress === 100 &&
              (!resultsToDisplay || resultsToDisplay.length === 0)
            ) {
              return (
                <div className="flex h-[50vh] items-center justify-center text-muted-foreground">
                  Aucun résultat trouvé
                </div>
              );
            } else if (
              hasActiveJob ||
              isSearching ||
              resultsToDisplay?.length > 0
            ) {
              return (
                <Display
                  results={resultsToDisplay}
                  isSearching={isSearching}
                  progress={progress}
                  sortType={sortType}
                  sortOrder={sortOrder}
                  isTabLoading={isTabLoading || isInitialLoading}
                  currentPage={currentPage}
                  onPageChange={onPageChange}
                  paginationInfo={paginationInfo}
                />
              );
            } else {
              return (
                <div className="flex h-[50vh] items-center justify-center text-muted-foreground">
                  Sélectionnez une caméra et lancez une recherche
                </div>
              );
            }
          })()}
        </div>
      </ScrollArea>
    </>
  );
}
