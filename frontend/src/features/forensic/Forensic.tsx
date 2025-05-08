/* eslint-disable no-console,@typescript-eslint/no-unused-vars,react-hooks/exhaustive-deps */
import { useCallback, useEffect, useRef, useState } from 'react';

import { Card, CardContent } from '@/components/ui/card';

import ForensicForm from './components/form';
import Results from './components/results';
import useJobs from './hooks/use-jobs';
import useSearch from './hooks/use-search';
import forensicResultsHeap from './lib/data-structure/heap.tsx';
import { createSearchFormData } from './lib/format-query';
import ForensicFormProvider from './lib/provider/forensic-form-provider';
import { ForensicFormValues } from './lib/types';

export default function Forensic() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const collapsedWidth = 1;
  const expandedWidth = 350;
  const containerRef = useRef<HTMLDivElement>(null);
  const [isTabLoading, setIsTabLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const {
    startSearch,
    stopSearch,
    progress,
    results,
    isSearching,
    sourceProgress,
    // resumeJob,
    setDisplayResults,
    resetSearch,
    setResults,
    testResumeJob,
    paginationInfo,
    handlePageChange,
    currentPageTracked,
  } = useSearch();

  const {
    tabJobs,
    handleTabChange: jobsHandleTabChange,
    activeTabIndex,
    addNewTab,
    selectLeftmostTab,
    deleteTab,
    fetchTasks,
    deleteAllTasks,
    getActiveJobId,
  } = useJobs();

  const handlePaginationChange = useCallback(
    async (page: number) => {
      console.log(`Changement vers page ${page}`);
      setCurrentPage(page);

      // Utiliser la fonction handlePageChange du hook useSearch
      handlePageChange(page);

      // Récupérer le job actif depuis l'onglet actif
      const activeTab = tabJobs.find((tab) => tab.tabIndex === activeTabIndex);
      const activeJobId = activeTab?.jobId;

      if (!activeJobId) {
        console.error(
          `Impossible de charger la page ${page} : aucun job actif`
        );
        return;
      }

      try {
        setIsLoading(true);
        await testResumeJob(activeJobId, page, true, true);
      } catch (error) {
        console.error(`Erreur lors du chargement de la page ${page}:`, error);
      } finally {
        setIsLoading(false);
      }
    },
    [tabJobs, activeTabIndex, testResumeJob, setIsLoading, handlePageChange]
  );

  const handleDeleteAllTabs = () => {
    deleteAllTasks();
    forensicResultsHeap.clear();
    setDisplayResults([]);
    setIsTabLoading(false);
  };

  const handleStopSearch = async () => {
    const activeJob = getActiveJobId();
    if (activeJob) {
      stopSearch(activeJob);
    }
  };

  const handleDeleteTab = (tabIndex: number) => {
    if (activeTabIndex === tabIndex) {
      const newActiveTabIndex = tabJobs[0]?.tabIndex || 1;
      jobsHandleTabChange(newActiveTabIndex);
    }
    deleteTab(tabIndex);
    resetSearch();
    forensicResultsHeap.clear();
    setDisplayResults([]);
  };

  const handleAddNewTab = () => {
    forensicResultsHeap.clear();
    setDisplayResults([]);
    setCurrentPage(1);

    setIsTabLoading(false);

    addNewTab(() => {
      resetSearch();
      forensicResultsHeap.clear();
      setDisplayResults([]);

      setTimeout(() => {
        setDisplayResults([]);
      }, 100);
    });
  };

  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleTabChange = async (tabIndex: number) => {
    setIsTabLoading(true);
    setCurrentPage(1);

    const selectedTab = tabJobs.find((tab) => tab.tabIndex === tabIndex);
    const isNewTab = selectedTab?.isNew === true;

    resetSearch(); // Cette fonction doit maintenant réinitialiser également la pagination
    forensicResultsHeap.clear();
    setDisplayResults([]);
    setResults([]);

    jobsHandleTabChange(tabIndex);

    if (isNewTab) {
      setIsTabLoading(false);
      return;
    }

    if (selectedTab?.jobId) {
      try {
        console.log(
          `Chargement des résultats pour l'onglet ${tabIndex} avec jobId ${selectedTab.jobId}`
        );

        // Utiliser testResumeJob pour charger à la fois les résultats et les infos de pagination
        const response = await testResumeJob(
          selectedTab.jobId,
          1, // Toujours commencer à la page 1 lors d'un changement d'onglet
          false,
          true // skipLoadingState pour éviter des états de chargement en double
        );

        if (response) {
          const { results: jobResults, pagination } = response;
          console.log(
            `Pagination reçue pour l'onglet ${tabIndex}:`,
            pagination
          );
        }

        // Maintenant les infos de pagination sont bien mises à jour via testResumeJob
        // qui met à jour le state paginationInfo dans useSearch
      } catch (error) {
        console.error(
          `Erreur lors du chargement de l'onglet ${tabIndex}:`,
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
        const selectedTabIndex = await selectLeftmostTab();
        jobsHandleTabChange(selectedTabIndex);
      }
    } catch (error) {
      console.error('Failed to start search:', error);
    }
  };

  const currentWidth = isCollapsed ? collapsedWidth : expandedWidth;

  const activeTabsCount = tabJobs.filter((tab) => tab.jobId).length;

  useEffect(() => {
    const loadExistingJobs = async () => {
      try {
        setIsTabLoading(true);
        const updatedTabJobs = await fetchTasks();

        const tabWithJob =
          updatedTabJobs?.find((tab) => tab.jobId) ||
          tabJobs.find((tab) => tab.jobId);

        if (tabWithJob) {
          console.log('✅ Onglet avec jobId trouvé:', tabWithJob);

          handleTabChange(tabWithJob.tabIndex);
          await new Promise((resolve) => {
            setTimeout(resolve, 50);
          });
          if (tabWithJob.jobId) {
            // await resumeJob(tabWithJob.jobId, false);
            await testResumeJob(tabWithJob.jobId, currentPage, false);
          }
        } else if (updatedTabJobs?.length > 0) {
          handleTabChange(updatedTabJobs[0].tabIndex);
        }
      } catch (error) {
        console.error('❌ Erreur lors du chargement des jobs:', error);
      } finally {
        setTimeout(() => {
          setIsTabLoading(false);
        }, 300);
      }
    };
    loadExistingJobs();
  }, []);

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
                {isCollapsed ? '' : 'Recherche vidéo'}
              </h1>
            </div>

            <ForensicFormProvider>
              <ForensicForm
                onSubmit={handleSearch}
                isSearching={isSearching}
                stopSearch={handleStopSearch}
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
            onDeleteTab={handleDeleteTab}
            onDeleteAllTabs={handleDeleteAllTabs}
            currentPage={currentPage}
            onPageChange={handlePaginationChange}
            paginationInfo={paginationInfo}
          />
        </CardContent>
      </Card>
    </div>
  );
}
