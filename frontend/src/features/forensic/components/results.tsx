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
}: ResultsProps) {
  const [sortType, setSortType] = useState<SortType>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showSourceDetails, setShowSourceDetails] = useState(false);
  const { resumeJob, displayResults, setDisplayResults } = useSearch();
  const { tabJobs, handleTabChange: defaultHandleTabChange, getActiveJobId } = useJobs();
  const initialLoadComplete = useRef(false);
  const previousTabIndex = useRef<number | undefined>(activeTabIndex);
  const isLoadingRef = useRef(false);
  const requestTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const handleTabChange = onTabChange || defaultHandleTabChange;
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Modifiez la fonction resultsToDisplay pour ajouter des logs détaillés
  const resultsToDisplay = useMemo(() => {
    // Rechercher l'onglet actif dans tabJobs
    const activeTab = tabJobs.find(tab => tab.tabIndex === activeTabIndex);

    console.log('🔍 Calcul des résultats à afficher:', {
      activeTabIndex,
      activeTab,
      propsResultsLength: propsResults?.length || 0,
      displayResultsLength: displayResults?.length || 0,
      isNew: activeTab?.isNew,
      hasJobId: !!activeTab?.jobId
    });

    // Vérification explicite: si activeTabIndex est défini mais qu'aucun onglet ne correspond
    // (car tabJobs n'est pas encore synchronisé), considérer comme nouvel onglet
    if (activeTab?.isNew === true || (activeTabIndex && !activeTab)) {
      console.log("📋 Retour d'un tableau vide pour le nouvel onglet");
      return [];
    }

    // Sinon, logique existante
    const results = propsResults && propsResults.length > 0 ? propsResults : displayResults;
    console.log(`📊 Utilisation des ${propsResults && propsResults.length > 0 ? 'propsResults' : 'displayResults'} (${results?.length || 0} éléments)`);
    return results;
  }, [displayResults, propsResults, activeTabIndex, tabJobs]);

  /* Remplacer les deux fonctions forceCleanupResults par cette version unique */
  const forceCleanupResults = () => {
    console.log('🧹 AVANT nettoyage - État heap:', {
      heapSize: forensicResultsHeap.getBestResults().length, // Correction: utiliser getBestResults().length au lieu de size()
      displayResultsLength: displayResults?.length || 0
    });

    // Effacer les deux sources de données
    forensicResultsHeap.clear();
    setDisplayResults([]);

    console.log('🧹 APRÈS nettoyage - État heap:', {
      heapSize: forensicResultsHeap.getBestResults().length // Correction: utiliser getBestResults().length au lieu de size()
    });
  };

  const hasActiveJob = useMemo(() => {
    const activeJobId = getActiveJobId();
    const activeTab = tabJobs.find(tab => tab.tabIndex === activeTabIndex);

    // Si l'onglet est nouveau, on considère qu'il n'a pas de job actif
    if (activeTab?.isNew === true) {
      console.log('🔄 hasActiveJob forcé à FALSE pour nouvel onglet');
      return false;
    }

    const result = !!activeJobId || (resultsToDisplay && resultsToDisplay.length > 0);
    return result;
  }, [getActiveJobId, resultsToDisplay, tabJobs, activeTabIndex]);

  const clearResults = () => {
    // Effacer les résultats dans le heap
    forensicResultsHeap.clear();

    // Mettre à jour les états
    setDisplayResults([]);
  };

  // Supprimer le premier useEffect (lignes 108-120) qui n'utilise pas de valeur par défaut
  // et ne garder que celui-ci avec la valeur par défaut :
  useEffect(() => {
    const activeTab = tabJobs.find(tab => tab.tabIndex === activeTabIndex);
    const hasJobId = !!activeTab?.jobId;

    // Si l'onglet n'a pas de jobId, on considère qu'il est nouveau
    // tout en préservant la valeur isNew si elle est déjà définie
    const isNew = activeTab?.isNew ?? (!hasJobId);

    console.log('⚡ Changement onglet - Vérification nettoyage:', {
      activeTabIndex,
      isNew,
      hasJobId
    });

    // La condition reste inchangée car elle vérifie déjà isNew === true && !jobId
    if (activeTab && activeTab.isNew === true && !activeTab.jobId) {
      console.log('⚡ Déclenchement du nettoyage pour nouvel onglet');
      forceCleanupResults();
    }
  }, [activeTabIndex, tabJobs]);


  useEffect(() => {
    // Cas 1: Si nous avons des résultats, désactiver le chargement
    if ((propsResults && propsResults.length > 0) ||
      (displayResults && displayResults.length > 0)) {
      const timer = setTimeout(() => {
        setIsInitialLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    }

    // Cas 2: Si la recherche est terminée (progress = 100%), désactiver le chargement
    if (progress === 100 && !isSearching) {
      const timer = setTimeout(() => {
        setIsInitialLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    }

    // Cas 3: Si des onglets avec des tâches sont chargés
    if (tabJobs && tabJobs.filter(tab => tab.jobId).length > 0) {
      const timer = setTimeout(() => {
        setIsInitialLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    }

    // Délai de sécurité pour éviter un chargement infini
    const fallbackTimer = setTimeout(() => {
      console.log('Désactivation forcée du chargement initial après délai de sécurité');
      setIsInitialLoading(false);
    }, 3000);

    return () => clearTimeout(fallbackTimer);
  }, [propsResults, displayResults, progress, isSearching, tabJobs]);

  useEffect(() => {
    const autoLoadResults = async () => {
      // Ajoutons une vérification de loading plus stricte qui inclut isTabLoading
      if (isLoadingRef.current || isSearching || isTabLoading) {
        console.log('❌ Chargement déjà en cours, abandon du chargement automatique');
        return;
      }

      const activeJobId = getActiveJobId();
      if (!activeJobId) {
        return;
      }

      // Vérifions si nous avons déjà des résultats pour éviter le double chargement
      if (resultsToDisplay && resultsToDisplay.length > 0) {
        console.log('✅ Résultats déjà disponibles, évitement du double chargement');
        initialLoadComplete.current = true;
        return;
      }

      if (!initialLoadComplete.current || previousTabIndex.current !== activeTabIndex) {
        try {
          isLoadingRef.current = true;

          if (requestTimeoutRef.current) {
            clearTimeout(requestTimeoutRef.current);
          }

          // Délai pour éviter trop d'appels rapprochés
          requestTimeoutRef.current = setTimeout(async () => {
            await resumeJob(activeJobId, false);
            initialLoadComplete.current = true;
            setIsInitialLoading(false); // Force désactiver le chargement
            isLoadingRef.current = false;
          }, 300);
        } catch (error) {
          console.error('Erreur lors du chargement des résultats:', error);
          isLoadingRef.current = false;
        }
      }

      previousTabIndex.current = activeTabIndex;
    };

    autoLoadResults();

    return () => {
      if (requestTimeoutRef.current) {
        clearTimeout(requestTimeoutRef.current);
      }
    };
  }, [resumeJob, isSearching, activeTabIndex, isTabLoading, getActiveJobId]);

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
  };

  const timeEstimates = useMemo(
    () => calculateTimeRemaining(sourceProgress),
    [sourceProgress]
  );

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

  // Pour déboguer
  useEffect(() => {
    console.log("État d'affichage:", {
      hasActiveJob,
      isInitialLoading,
      resultsCount: resultsToDisplay?.length || 0,
      isSearching,
      progress
    });
  }, [hasActiveJob, isInitialLoading, resultsToDisplay, isSearching, progress]);

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