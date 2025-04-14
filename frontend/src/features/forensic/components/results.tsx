/* eslint-disable @typescript-eslint/no-unused-vars,prettier/prettier,@typescript-eslint/no-explicit-any,no-console,no-else-return */
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useMemo, useState } from 'react';

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
}

export default function Results({
  results: propsResults,
  isSearching,
  progress,
  sourceProgress,
}: ResultsProps) {
  const [sortType, setSortType] = useState<SortType>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showSourceDetails, setShowSourceDetails] = useState(false);
  const { resumeJob, displayResults, setDisplayResults } = useSearch();
  const { tabJobs, activeTabIndex, handleTabChange } = useJobs();

  // Clear results function
  const clearResults = () => {
    forensicResultsHeap.clear();

    // Pour les résultats de recherche en cours
    if (displayResults.length > 0) {
      // Réinitialiser l'état local des résultats affichés via setDisplayResults
      // qui provient du hook useSearch
      setDisplayResults([]);
    }
  };

  const resultsToDisplay = useMemo(() => {
    // Toujours afficher propsResults s'ils sont disponibles
    if (propsResults && propsResults.length > 0) {
      return propsResults;
    } else {
      return displayResults;
    }
  }, [displayResults, propsResults]);

  const handleResumeLastSearch = async () => {
    const lastJobId = localStorage.getItem('currentJobId');
    if (lastJobId) {
      await resumeJob(lastJobId);
      // Les résultats seront déjà mis à jour dans displayResults
    }
  };

  // Toggle sort order
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
        handleResumeLastSearch={handleResumeLastSearch}
        clearResults={clearResults}
        tabJobs={tabJobs}
        activeTabIndex={activeTabIndex}
        onTabChange={handleTabChange}
      />
      <ScrollArea className="h-[calc(100%-3rem)] pb-1">
        <div className="space-y-4">
          {/* Progress section inside ScrollArea */}
          {renderProgressSection()}

          {/* Results using the new Display component */}
          <Display
            results={resultsToDisplay}
            isSearching={isSearching}
            progress={progress}
            jobId={tabJobs.find(tab => tab.tabIndex === activeTabIndex)?.jobId}
            sortType={sortType}
            sortOrder={sortOrder}
          />
        </div>
      </ScrollArea>
    </>
  );
}