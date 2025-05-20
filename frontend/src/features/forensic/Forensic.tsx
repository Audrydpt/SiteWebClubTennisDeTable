/* eslint-disable no-console,@typescript-eslint/no-unused-vars,react-hooks/exhaustive-deps,@typescript-eslint/no-use-before-define */
import { useCallback, useEffect, useRef, useState } from 'react';

import { Card, CardContent } from '@/components/ui/card';

import ForensicForm from './components/form';
import Results from './components/results';
import useJobs, {
  ForensicTaskStatus,
  isForensicTaskCompleted,
} from './hooks/use-jobs';
import forensicResultsHeap from './lib/data-structure/heap';
// eslint-disable-next-line import/no-named-as-default
import useSearch from './hooks/use-search';
import useForensicResults from './hooks/use-results';
import { createSearchFormData } from './lib/format-query';
import ForensicFormProvider from './lib/provider/forensic-form-provider';
import { ForensicFormValues } from './lib/types';

export default function Forensic() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const collapsedWidth = 1;
  const expandedWidth = 350;
  const containerRef = useRef<HTMLDivElement>(null);

  // Hook de recherche pour la gestion des résultats, pagination et tri
  const {
    results,
    displayResults,
    isLoading,
    isTabLoading,
    setIsTabLoading,
    currentPage,
    setCurrentPage,
    sortType,
    setSortType,
    sortOrder,
    toggleSortOrder,
    paginationInfo,
    tasksMetadata,
    handlePageChange,
    loadJobResults,
    resetResults,
    setResults,
    setDisplayResults,
    setPaginationInfo,
    updateFirstPageWithRelevantResults,
  } = useForensicResults();

  const {
    startSearch,
    stopSearch,
    progress,
    isSearching,
    sourceProgress,
    resetSearch,
    initWebSocket,
    getJobStatus,
  } = useSearch({
    onResultReceived: (result) => {
      // Ajoute le résultat au heap et met à jour l'affichage si nécessaire
      if (updateFirstPageWithRelevantResults(result)) {
        // Seulement mettre à jour l'état si nous sommes sur la première page
        if (currentPage === 1) {
          // Récupérer les résultats triés depuis le heap
          let topResults;
          if (sortType === 'date') {
            topResults = forensicResultsHeap.getTopByDate(
              paginationInfo.pageSize,
              sortOrder === 'desc'
            );
          } else {
            topResults = forensicResultsHeap.getTopByScore(
              paginationInfo.pageSize,
              sortOrder === 'desc'
            );
          }

          // Mise à jour synchronisée des résultats affichés
          setResults(topResults);
          setDisplayResults(topResults);

          // Mettre à jour les informations de pagination
          // Dans la fonction onResultReceived du useSearch (dans Forensic.tsx)
          setPaginationInfo((prev) => {
            // Toujours utiliser tasksMetadata pour le job actif quand disponible
            if (activeTabIndex && tasksMetadata[activeTabIndex]) {
              const taskInfo = tasksMetadata[activeTabIndex];
              return {
                ...prev,
                currentPage,
                total: taskInfo.count || 0,
                totalPages:
                  taskInfo.total_pages ||
                  Math.ceil((taskInfo.count || 0) / prev.pageSize),
              };
            }
            // Fallback uniquement si les métadonnées ne sont pas disponibles
            return {
              ...prev,
              total: forensicResultsHeap.size(),
              totalPages: Math.ceil(forensicResultsHeap.size() / prev.pageSize),
            };
          });
        }
      }
    },
    onReturnToFirstPage: (jobId: string) => {
      // Vérifier si une recherche est encore en cours pour ce job
      if (jobId && !isSearching) {
        console.log('Reconnexion au WebSocket car retour à la page 1');

        // Récupérer le statut du job pour s'assurer qu'il est toujours actif
        getJobStatus(jobId)
          .then((status) => {
            if (!isForensicTaskCompleted(status as ForensicTaskStatus)) {
              initWebSocket(jobId);
            }
          })
          .catch((error) => {
            console.error(
              'Erreur lors de la vérification du statut du job:',
              error
            );
          });
      }
    },
  });

  // Hook pour la gestion des onglets/tâches
  const {
    tasks: tabJobs,
    handleTabChange: jobsHandleTabChange,
    activeTabIndex,
    addNewTab,
  } = useJobs();

  useEffect(() => {
    // Ne recharger que si un onglet est actif et qu'on n'est pas déjà en train de charger
    if (activeTabIndex && !isLoading && !isTabLoading) {
      console.log(
        `🔄 Rechargement suite au changement de tri: ${sortType} (${sortOrder})`
      );

      // Réinitialiser à la première page
      setCurrentPage(1);

      // Recharger les données avec le nouveau tri
      loadJobResults(
        activeTabIndex,
        true,
        1 // Toujours revenir à la première page
      );
    }
  }, [sortType, sortOrder]);

  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleTabChange = async (tabIndex: string) => {
    setIsTabLoading(true);

    // Réinitialiser à la première page
    setCurrentPage(1);

    const selectedTab = tabJobs.find((tab) => tab.id === tabIndex);

    // Réinitialisation complète
    resetSearch();
    resetResults();

    // Mettre à jour l'onglet actif
    jobsHandleTabChange(tabIndex);

    if (selectedTab?.id) {
      try {
        // Mettre à jour la pagination immédiatement avec les métadonnées
        if (tasksMetadata[selectedTab.id]) {
          const taskInfo = tasksMetadata[selectedTab.id];
          setPaginationInfo((prev) => ({
            ...prev,
            currentPage: 1,
            total: taskInfo.count || 0,
            totalPages:
              taskInfo.total_pages ||
              Math.ceil((taskInfo.count || 0) / prev.pageSize),
          }));
        }

        await loadJobResults(selectedTab.id, true);
      } catch (error) {
        console.error('Erreur lors du chargement des résultats:', error);
      }
    }

    setIsTabLoading(false);
  };

  const handleSearch = async (data: ForensicFormValues) => {
    if (isSearching) {
      return;
    }

    try {
      const searchFormData = createSearchFormData(data);
      const jobId = await startSearch(searchFormData);

      addNewTab(jobId);
      handleTabChange(jobId);
    } catch (error) {
      console.error('Failed to start search:', error);
    }
  };

  const currentWidth = isCollapsed ? collapsedWidth : expandedWidth;

  return (
    <div ref={containerRef} className="flex h-full">
      <div
        className="relative transition-all duration-300 ease-in-out"
        style={{
          width: `${currentWidth}px`,
          minWidth: `${currentWidth}px`,
          flexShrink: 0,
        }}
      >
        {/* Panneau du formulaire */}
        <Card className="h-[calc(100vh-2rem)] overflow-hidden flex flex-col">
          <CardContent
            className={`${isCollapsed ? 'p-2' : 'p-4'} h-full flex flex-col`}
          >
            <div
              className={`${isCollapsed ? 'mb-2' : 'mb-4'} flex items-center justify-between pointer-events-auto`}
            >
              <h1
                className={`${
                  isCollapsed ? 'scale-0 w-0' : 'scale-100 w-auto'
                } transition-all text-xl font-bold tracking-tight`}
              >
                Recherche vidéo
              </h1>
            </div>

            <ForensicFormProvider>
              <ForensicForm onSubmit={handleSearch} />
            </ForensicFormProvider>
          </CardContent>
        </Card>

        {/* Poignée pour réduire/agrandir le panneau */}
        <button
          className="absolute top-0 right-0 w-4 h-full cursor-pointer z-30 bg-transparent border-none p-0"
          type="button"
          onClick={handleToggleCollapse}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              handleToggleCollapse();
            }
          }}
          aria-label={
            isCollapsed ? 'Expand search panel' : 'Collapse search panel'
          }
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          <div className="absolute top-0 right-0 w-1 h-full bg-border hover:bg-primary/70 hover:w-2 transition-all" />
        </button>
      </div>

      {/* Panneau des résultats */}
      <Card className="h-[calc(100vh-2rem)] overflow-hidden flex-1 ml-2">
        <CardContent className="p-10 pb-8 h-full">
          <Results
            results={results}
            isSearching={isSearching}
            progress={progress}
            sourceProgress={sourceProgress}
            onTabChange={handleTabChange}
            isTabLoading={isTabLoading || isLoading}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            paginationInfo={paginationInfo}
            sortType={sortType}
            setSortType={setSortType}
            sortOrder={sortOrder}
            toggleSortOrder={toggleSortOrder}
          />
        </CardContent>
      </Card>
    </div>
  );
}
