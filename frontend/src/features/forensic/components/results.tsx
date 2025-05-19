/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useMemo, useRef, useState } from 'react';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';

import useJobs from '../hooks/use-jobs';
import { ForensicResult, SourceProgress } from '../lib/types';
import { SortType } from './ui/buttons';
import Display from './ui/display';
import ForensicHeader from './ui/header';
import MultiProgress from './ui/multi-progress';
import { calculateTimeRemaining } from '../lib/estimation/estimation';

interface ResultsProps {
  results: ForensicResult[];
  isSearching: boolean;
  progress: number | null;
  sourceProgress: SourceProgress[];
  onTabChange: (tabIndex: string) => void;
  isTabLoading: boolean;
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
  results,
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
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<
    string | null
  >(null);
  const { tasks, activeTabIndex, deleteTab } = useJobs();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [showSourceDetails, setShowSourceDetails] = useState<boolean>(false);

  // Calcul du temps restant estimé lorsque la progression change
  useEffect(() => {
    if (!isSearching || !sourceProgress.length) {
      setEstimatedTimeRemaining(null);
      return;
    }

    const timeRemaining = calculateTimeRemaining(sourceProgress);
    setEstimatedTimeRemaining(timeRemaining.combined);
  }, [sourceProgress, isSearching]);

  // Détermination de la hauteur disponible pour le défilement
  const availableHeight = useMemo(() => {
    // Hauteur de base pour le contenu
    let height = 'calc(100vh - 300px)';

    // Ajuster la hauteur en fonction des éléments visibles
    if (isSearching && progress !== null) {
      height = 'calc(100vh - 430px)';
    } else if (tasks.length > 0) {
      height = 'calc(100vh - 370px)';
    }

    return height;
  }, [isSearching, progress, tasks.length]);

  // Gestion des onglets
  const handleTabClick = (tabId: string) => {
    if (tabId === activeTabIndex) return;
    onTabChange(tabId);
  };

  // Rendu de l'en-tête avec les onglets
  const renderHeader = () => (
    <ForensicHeader
      sortType={sortType}
      setSortType={setSortType}
      sortOrder={sortOrder}
      toggleSortOrder={toggleSortOrder}
      clearResults={() => {}} // Fonction requise
      onTabChange={handleTabClick}
      loading={isTabLoading}
      setIsLoading={() => {}}
    />
  );

  // Rendu des barres de progression pendant la recherche
  const renderProgress = () => {
    if (!isSearching || progress === null) return null;

    return (
      <div className="mb-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Progression globale : {progress.toFixed(1)}%
          </div>
          {estimatedTimeRemaining && (
            <div className="text-sm text-muted-foreground">
              Temps restant estimé : {estimatedTimeRemaining}
            </div>
          )}
        </div>
        <Progress value={progress} />
        {sourceProgress.length > 0 && (
          <MultiProgress
            sourceProgress={sourceProgress}
            showSourceDetails={showSourceDetails}
            setShowSourceDetails={setShowSourceDetails}
          />
        )}
      </div>
    );
  };

  // Rendu du contenu principal (résultats ou message d'état)
  const renderContent = () => {
    if (isTabLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-lg font-medium mb-2">Chargement...</div>
            <div className="text-sm text-muted-foreground">
              Les résultats sont en cours de chargement, veuillez patienter.
            </div>
          </div>
        </div>
      );
    }

    if (results.length === 0 && !isSearching) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-lg font-medium mb-2">Aucun résultat</div>
            <div className="text-sm text-muted-foreground">
              Lancez une recherche pour obtenir des résultats.
            </div>
          </div>
        </div>
      );
    }

    return (
      <ScrollArea ref={scrollAreaRef} className="h-full pr-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {results.map((result) => (
            <Display
              key={result.id}
              results={[result]}
              isSearching={isSearching}
              progress={progress}
              sortType={sortType}
              sortOrder={sortOrder}
              isTabLoading={isTabLoading}
              currentPage={currentPage}
              onPageChange={onPageChange}
              paginationInfo={paginationInfo}
            />
          ))}
        </div>
      </ScrollArea>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {renderHeader()}
      {renderProgress()}
      <div
        className="flex-1 overflow-hidden"
        style={{ height: availableHeight }}
      >
        {renderContent()}
      </div>
    </div>
  );
}
