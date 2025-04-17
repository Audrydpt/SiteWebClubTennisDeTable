/* eslint-disable @typescript-eslint/no-unused-vars,prettier/prettier,@typescript-eslint/no-explicit-any,no-console,no-else-return,consistent-return */
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
}

export default function Results({
  results: propsResults,
  isSearching,
  progress,
  sourceProgress,
  onTabChange,
  activeTabIndex,
  isTabLoading,
}: ResultsProps) {
  const [sortType, setSortType] = useState<SortType>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showSourceDetails, setShowSourceDetails] = useState(false);
  const { resumeJob, displayResults, setDisplayResults } = useSearch();
  const { tabJobs, handleTabChange: defaultHandleTabChange } = useJobs();
  const initialLoadComplete = useRef(false);
  const previousTabIndex = useRef<number | undefined>(activeTabIndex);
  const isLoadingRef = useRef(false); // Pour éviter les chargements multiples
  const requestTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const handleTabChange = onTabChange || defaultHandleTabChange;
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [hasActiveJob, setHasActiveJob] = useState(false);

  // Vérifier s'il y a un job actif dans localStorage
  useEffect(() => {
    const checkForActiveJob = () => {
      const jobId = localStorage.getItem('currentJobId');
      setHasActiveJob(!!jobId);
    };

    checkForActiveJob();

    // Surveiller les changements de localStorage
    window.addEventListener('storage', checkForActiveJob);
    return () => {
      window.removeEventListener('storage', checkForActiveJob);
    };
  }, []);

  // Mettre à jour l'état hasActiveJob quand un job est démarré ou arrêté
  useEffect(() => {
    setHasActiveJob(!!localStorage.getItem('currentJobId'));
  }, [propsResults, displayResults]);

  // Modifier l'useEffect existant pour le chargement initial
  useEffect(() => {
    // Activer le skeleton au chargement initial
    setIsInitialLoading(true);
  }, []);

  // Ajouter un nouvel useEffect qui observe les résultats
  useEffect(() => {
    // Si nous avons des résultats (soit depuis props, soit depuis displayResults)
    // alors nous pouvons désactiver le skeleton loader
    if ((propsResults && propsResults.length > 0) ||
      (displayResults && displayResults.length > 0)) {
      // Ajouter un petit délai pour une transition plus fluide
      const timer = setTimeout(() => {
        setIsInitialLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [propsResults, displayResults]);
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

  useEffect(() => {
    // Fonction pour charger automatiquement les résultats avec mécanisme anti-rebond
    const autoLoadResults = async () => {
      // Si déjà en cours de chargement, on ignore
      if (isLoadingRef.current || isSearching || isTabLoading) {
        return;
      }

      const lastJobId = localStorage.getItem('currentJobId');
      if (!lastJobId) {
        setHasActiveJob(false);
        return;
      }

      setHasActiveJob(true);
      const shouldLoad = !initialLoadComplete.current ||
        previousTabIndex.current !== activeTabIndex;

      if (shouldLoad) {
        // Annuler tout timeout en attente
        if (requestTimeoutRef.current) {
          clearTimeout(requestTimeoutRef.current);
        }

        // Configurer un nouveau timeout pour regrouper les demandes rapprochées
        requestTimeoutRef.current = setTimeout(async () => {
          try {
            isLoadingRef.current = true; // Verrouiller pour éviter les appels multiples
            console.log('Chargement automatique des résultats...');
            await resumeJob(lastJobId);
            initialLoadComplete.current = true;
          } catch (error) {
            console.error('Erreur lors du chargement automatique:', error);
          } finally {
            isLoadingRef.current = false;  // Déverrouiller
            requestTimeoutRef.current = null;
          }
        }, 300); // Délai de regroupement (300ms)
      }

      // Toujours mettre à jour la référence de l'onglet actif
      previousTabIndex.current = activeTabIndex;
    };

    autoLoadResults();

    // Nettoyage du timeout en cas de démontage du composant
    return () => {
      if (requestTimeoutRef.current) {
        clearTimeout(requestTimeoutRef.current);
      }
    };
  }, [resumeJob, isSearching, activeTabIndex, isTabLoading]);

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
      setHasActiveJob(true);
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

  const renderProgressSection = () => {
    // Ne pas afficher la barre de progression normale si l'onglet est en cours de chargement
    if (!hasActiveJob || progress === null || isTabLoading) {
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
        loading={isInitialLoading}
      />
      <ScrollArea className="h-[calc(100%-3rem)] pb-1">
        <div className="space-y-4">
          {/* Progress section inside ScrollArea */}
          {renderProgressSection()}

          {/* N'afficher le Display que s'il y a un job actif */}
          {hasActiveJob || isSearching ? (
            <Display
              results={resultsToDisplay}
              isSearching={isSearching}
              progress={progress}
              sortType={sortType}
              sortOrder={sortOrder}
              isTabLoading={isTabLoading || isInitialLoading}
            />
          ) : (
            <div className="flex h-[50vh] items-center justify-center text-muted-foreground">
              Sélectionnez une caméra et lancez une recherche
            </div>
          )}
        </div>
      </ScrollArea>
    </>
  );
}