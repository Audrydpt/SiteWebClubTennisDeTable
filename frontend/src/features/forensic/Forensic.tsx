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
  } = useJobs();

  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleSearch = async (data: ForensicFormValues) => {
    if (isSearching) {
      return;
    }

    try {
      const searchFormData = createSearchFormData(data);
      await startSearch(searchFormData);
    } catch (error) {
      console.error('Failed to start search:', error);
    }
  };

  const handleTabChange = async (tabIndex: number) => {
    // Activer l'état de chargement
    setIsTabLoading(true);

    // 1. Fermer proprement la connexion WebSocket du job actuel sans l'annuler
    cleanupWebSocket();

    // 2. Mettre à jour l'onglet actif
    jobsHandleTabChange(tabIndex);

    // 3. Vider le heap pour éviter le mélange des résultats
    forensicResultsHeap.clear();

    // 4. Réinitialiser l'affichage pour le nouvel onglet
    setDisplayResults([]);

    // 5. Récupérer le jobId associé au nouvel onglet
    const selectedTab = tabJobs.find((tab) => tab.tabIndex === tabIndex);

    if (selectedTab?.jobId) {
      console.log(
        `Chargement des résultats pour l'onglet ${tabIndex}, job ${selectedTab.jobId}`
      );

      try {
        // 6. Reprendre le job en chargeant les résultats historiques
        await resumeJob(selectedTab.jobId, false);
      } catch (error) {
        console.error(
          `Erreur lors du chargement du job ${selectedTab.jobId}:`,
          error
        );
      } finally {
        // Désactiver l'état de chargement une fois terminé
        setIsTabLoading(false);
      }
    } else {
      // Pas de job pour cet onglet, désactiver l'état de chargement
      setIsTabLoading(false);
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
                addNewTab={addNewTab}
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
