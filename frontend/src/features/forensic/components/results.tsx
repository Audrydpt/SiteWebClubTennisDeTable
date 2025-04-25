/* eslint-disable @typescript-eslint/no-unused-vars,prettier/prettier,@typescript-eslint/no-explicit-any,no-console,no-else-return,consistent-return,react-hooks/exhaustive-deps */
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useMemo, useRef, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ForensicResult, SourceProgress } from '../lib/types';
import { calculateTimeRemaining } from '@/features/forensic/lib/estimation/estimation';
import useSearch from '../hooks/use-search.tsx';
import useJobs from '../hooks/use-jobs';
import MultiProgress from '@/features/forensic/components/ui/multi-progress';
import forensicResultsHeap from '@/features/forensic/lib/data-structure/heap';
import ForensicHeader from './ui/header';
import { SortType } from './ui/buttons';
import Display from './ui/display';

interface ResultsProps {
  results: ForensicResult[];
  isSearching: boolean;
  progress: number | null;
  sourceProgress: SourceProgress[];
  onTabChange?: (tabIndex: number) => void;
  activeTabIndex?: number;
  isTabLoading?: boolean;
  onDeleteTab?: (tabIndex: number) => void;
  onDeleteAllTabs?: () => void;
}

export default function Results({
  results: propsResults,
  isSearching,
  progress,
  sourceProgress,
  onTabChange,
  activeTabIndex,
  isTabLoading,
  onDeleteTab,
  onDeleteAllTabs,
}: ResultsProps) {
  const [sortType, setSortType] = useState<SortType>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showSourceDetails, setShowSourceDetails] = useState(false);
  const { resumeJob, displayResults, setDisplayResults } = useSearch();
  const { tabJobs, handleTabChange: defaultHandleTabChange, getActiveJobId } = useJobs();
  const isLoadingRef = useRef(false);
  const requestTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadedJobsRef = useRef<Set<string>>(new Set());
  const handleTabChange = onTabChange || defaultHandleTabChange;
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Fonction modifiée pour éviter les logs excessifs
  const resultsToDisplay = useMemo(() => {
    const activeTab = tabJobs.find(tab => tab.tabIndex === activeTabIndex);
    if (activeTab?.isNew === true || (activeTabIndex && !activeTab)) {
      return [];
    }
    return propsResults && propsResults.length > 0 ? propsResults : displayResults;
  }, [displayResults, propsResults, activeTabIndex, tabJobs]);

  const forceCleanupResults = () => {
    forensicResultsHeap.clear();
    setDisplayResults([]);
  };

  const hasActiveJob = useMemo(() => {
    const activeJobId = getActiveJobId();
    const activeTab = tabJobs.find(tab => tab.tabIndex === activeTabIndex);
    if (activeTab?.isNew === true) {
      return false;
    }

    return !!activeJobId || (resultsToDisplay && resultsToDisplay.length > 0);
  }, [getActiveJobId, resultsToDisplay, tabJobs, activeTabIndex]);

  // Effet pour nettoyer les résultats lors du changement d'onglet
  useEffect(() => {
    const activeTab = tabJobs.find((tab) => tab.tabIndex === activeTabIndex);
    const isNewTab = activeTab?.isNew === true;
    if (isNewTab) {
      forceCleanupResults();
    }
  }, [activeTabIndex, tabJobs]);

  // Effet pour désactiver l'état de chargement initial
  useEffect(() => {
    // Cas 1: Si nous avons des résultats
    if ((propsResults && propsResults.length > 0) ||
      (displayResults && displayResults.length > 0)) {
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
        console.log('❌ Chargement déjà en cours, abandon du chargement automatique');
        return;
      }
      const activeTab = tabJobs.find((tab) => tab.tabIndex === activeTabIndex);
      const jobId = activeTab?.jobId;
      if (!jobId) {
        return;
      }
      if (loadedJobsRef.current.has(jobId)) {
        return;
      }
      isLoadingRef.current = true;

      try {
        loadedJobsRef.current.add(jobId);
        await resumeJob(jobId, false);
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
  }, [activeTabIndex, tabJobs, resumeJob]);

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
  };

  const timeEstimates = useMemo(
    () => calculateTimeRemaining(sourceProgress),
    [sourceProgress]
  );

  const clearResults = () => {
    forensicResultsHeap.clear();
    setDisplayResults([]);
  };

  const renderProgressSection = () => {
    if (!isSearching && (!hasActiveJob || progress === null || isTabLoading)) {
      return null;
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
        sortType={sortType}
        setSortType={setSortType}
        sortOrder={sortOrder}
        toggleSortOrder={toggleSortOrder}
        clearResults={clearResults}
        tabJobs={tabJobs}
        activeTabIndex={activeTabIndex}
        onTabChange={handleTabChange}
        loading={isInitialLoading}
        setIsLoading={setIsInitialLoading}
        onDeleteTab={onDeleteTab}
        onDeleteAllTabs={onDeleteAllTabs}
      />
      <ScrollArea className="h-[calc(100%-3rem)] pb-1">
        <div className="space-y-4">
          {/* Progress section inside ScrollArea */}
          {renderProgressSection()}

          {(() => {
            const activeTab = tabJobs.find(tab => tab.tabIndex === activeTabIndex);
            const isNew = activeTab?.isNew === true;

            if (isNew) {
              return (
                <div className="flex h-[50vh] items-center justify-center text-muted-foreground">
                  Sélectionnez une caméra et lancez une recherche
                </div>
              );
            } else if (hasActiveJob && !isSearching && progress === 100 &&
              (!resultsToDisplay || resultsToDisplay.length === 0)) {
              return (
                <div className="flex h-[50vh] items-center justify-center text-muted-foreground">
                  Aucun résultat trouvé
                </div>
              );
            } else if (hasActiveJob || isSearching || resultsToDisplay?.length > 0) {
              return (
                <Display
                  results={resultsToDisplay}
                  isSearching={isSearching}
                  progress={progress}
                  sortType={sortType}
                  sortOrder={sortOrder}
                  isTabLoading={isTabLoading || isInitialLoading}
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