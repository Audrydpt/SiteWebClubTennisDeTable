/* eslint-disable no-console,@typescript-eslint/no-unused-vars,react-hooks/exhaustive-deps */
import { useCallback, useEffect, useRef, useState } from 'react';

import { Card, CardContent } from '@/components/ui/card';

import ForensicForm from './components/form';
import Results from './components/results';
import useJobs from './hooks/use-jobs';
// eslint-disable-next-line import/no-named-as-default
import useSearch from './hooks/use-search';
import forensicResultsHeap from './lib/data-structure/heap.tsx';
import { createSearchFormData } from './lib/format-query';
import ForensicFormProvider from './lib/provider/forensic-form-provider';
import { ForensicFormValues } from './lib/types';
import { SortType } from './components/ui/buttons';

export default function Forensic() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const collapsedWidth = 1;
  const expandedWidth = 350;
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    startSearch,
    stopSearch,
    progress,
    results,
    isSearching,
    sourceProgress,
    resetSearch,
  } = useSearch();

  const {
    tasks: tabJobs,
    handleTabChange: jobsHandleTabChange,
    activeTabIndex,
    getActivePaginationInfo,
    addNewTab,
  } = useJobs();

  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleTabChange = async (tabIndex: string) => {
    setIsTabLoading(true);
    setCurrentPage(1);

    const selectedTab = tabJobs.find((tab) => tab.id === tabIndex);

    resetSearch();
    forensicResultsHeap.clear();
    setDisplayResults([]);
    setResults([]);

    jobsHandleTabChange(tabIndex);

    if (selectedTab?.id) {
      try {
        console.log(
          `Chargement des résultats pour l'onglet ${tabIndex} avec jobId ${selectedTab.id}`
        );

        // Utiliser les variables de tri actuelles
        const response = await testResumeJob(
          selectedTab.id,
          1,
          false,
          true,
          sortType,
          'desc'
        );

        if (response) {
          const { results: jobResults, pagination } = response;
          console.log(
            `Pagination reçue pour l'onglet ${tabIndex}:`,
            pagination
          );
        } else {
          console.log(`Aucune donnée reçue pour l'onglet ${tabIndex}`);
        }
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

      addNewTab(jobId);
      handleTabChange(jobId);
    } catch (error) {
      console.error('Failed to start search:', error);
    }
  };

  const currentWidth = isCollapsed ? collapsedWidth : expandedWidth;

  const activeTabsCount = tabJobs.filter((tab) => tab.id).length;

  useEffect(() => {
    // Ne pas effectuer la mise à jour durant le chargement d'un onglet
    if (isTabLoading) return;

    const dynamicPaginationInfo = getActivePaginationInfo();

    // Vérifier si une mise à jour est réellement nécessaire
    if (
      activeTabIndex &&
      dynamicPaginationInfo?.totalPages > 0 &&
      (paginationInfo.totalPages !== dynamicPaginationInfo.totalPages ||
        paginationInfo.total !== dynamicPaginationInfo.total ||
        paginationInfo.pageSize !== dynamicPaginationInfo.pageSize)
    ) {
      // Mettre à jour uniquement si les valeurs ont réellement changé
      const updatedPaginationInfo = {
        ...dynamicPaginationInfo,
        currentPage,
      };

      setPaginationInfo(updatedPaginationInfo);

      // Mettre à jour la page courante UNIQUEMENT si nécessaire
      // et avec une condition stricte pour éviter les boucles
      if (
        currentPage > dynamicPaginationInfo.totalPages &&
        dynamicPaginationInfo.totalPages > 0 &&
        !isSearching // Important: ne pas modifier pendant une recherche
      ) {
        // Utiliser setTimeout pour briser la boucle de rendu
        setTimeout(() => {
          setCurrentPage(dynamicPaginationInfo.totalPages);
          handlePageChange(dynamicPaginationInfo.totalPages);
        }, 0);
      }
    }
  }, [
    activeTabIndex,
    getActivePaginationInfo,
    activeTabIndex,
    isTabLoading,
    isSearching,
  ]);

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
            onPageChange={handlePaginationChange}
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
