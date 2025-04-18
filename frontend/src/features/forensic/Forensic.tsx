/* eslint-disable no-console,@typescript-eslint/no-unused-vars */
import { useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';

import useSearch from './hooks/use-search';
import useJobs from './hooks/use-jobs';
import { createSearchFormData } from './lib/format-query';

import ForensicForm from './components/form';
import Results from './components/results';
import ForensicFormProvider from './lib/provider/forensic-form-provider';
import { ForensicFormValues } from './lib/types';
import forensicResultsHeap from './lib/data-structure/heap.tsx';

export default function Forensic() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const collapsedWidth = 1;
  const expandedWidth = 350;
  const containerRef = useRef<HTMLDivElement>(null);
  const [isTabLoading, setIsTabLoading] = useState(false);

  const {
    startSearch,
    stopSearch,
    progress,
    results,
    isSearching,
    sourceProgress,
    resumeJob,
    setDisplayResults,
    cleanupWebSocket,
  } = useSearch();

  const {
    tabJobs,
    handleTabChange: jobsHandleTabChange,
    activeTabIndex,
    addNewTab,
    selectLeftmostTab,
  } = useJobs();

  const handleAddNewTab = () => {
    addNewTab(cleanupWebSocket);
  };

  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleTabChange = async (tabIndex: number) => {
    setIsTabLoading(true);

    // Récupérer le jobId associé au nouvel onglet
    const selectedTab = tabJobs.find((tab) => tab.tabIndex === tabIndex);
    const currentJobId = localStorage.getItem('currentJobId');

    // Ne pas nettoyer la WebSocket si on change vers un onglet
    // avec le même jobId que celui qui vient d'être créé
    if (!selectedTab?.jobId || selectedTab.jobId !== currentJobId) {
      cleanupWebSocket();
    }

    // Mettre à jour l'onglet actif
    jobsHandleTabChange(tabIndex);
    forensicResultsHeap.clear();
    setDisplayResults([]);

    if (selectedTab?.jobId) {
      try {
        await resumeJob(selectedTab.jobId, false);
      } catch (error) {
        console.error(
          `Erreur lors du chargement du job ${selectedTab.jobId}:`,
          error
        );
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

      if (jobId) {
        // Stocker le nouveau jobId dans le localStorage immédiatement
        localStorage.setItem('currentJobId', jobId);

        // Mettre à jour les tabJobs sans déclencher handleTabChange
        // qui appellerait cleanupWebSocket
        const selectedTabIndex = await selectLeftmostTab();

        // Ne pas appeler handleTabChange car cela fermerait la WebSocket
        // déjà ouverte par startSearch

        // Au lieu de cela, mettre à jour directement l'UI
        jobsHandleTabChange(selectedTabIndex);
      }
    } catch (error) {
      console.error('Failed to start search:', error);
    }
  };

  const currentWidth = isCollapsed ? collapsedWidth : expandedWidth;

  const activeTabsCount = tabJobs.filter((tab) => tab.jobId).length;

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
                className={`${isCollapsed ? 'text-sm' : 'text-lg'} font-semibold truncate`}
              >
                {isCollapsed ? '' : 'Recherche vidéo'}
              </h1>
            </div>

            <ForensicFormProvider>
              <ForensicForm
                onSubmit={handleSearch}
                isSearching={isSearching}
                stopSearch={stopSearch}
                isCollapsed={isCollapsed}
                addNewTab={handleAddNewTab}
                tabLength={activeTabsCount}
              />
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
            activeTabIndex={activeTabIndex}
            isTabLoading={isTabLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
