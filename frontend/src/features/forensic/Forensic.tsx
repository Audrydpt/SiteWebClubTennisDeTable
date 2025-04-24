/* eslint-disable no-console,@typescript-eslint/no-unused-vars,react-hooks/exhaustive-deps */
import { useRef, useState, useEffect } from 'react';
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
    setResults,
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
  } = useJobs();

  const handleDeleteAllTabs = () => {
    // Supprimer tous les onglets
    deleteAllTasks();

    // Nettoyer les résultats
    forensicResultsHeap.clear();
    setDisplayResults([]);

    // Réinitialiser l'état de recherche globale
    setIsTabLoading(false);
  };

  const handleDeleteTab = (tabIndex: number) => {
    // Si l'onglet actif est supprimé, on change vers le premier onglet
    if (activeTabIndex === tabIndex) {
      const newActiveTabIndex = tabJobs[0]?.tabIndex || 1;
      jobsHandleTabChange(newActiveTabIndex);
    }

    // Supprimer l'onglet
    deleteTab(tabIndex);
  };

  const handleAddNewTab = () => {
    // Nettoyage complet des résultats
    forensicResultsHeap.clear();
    setDisplayResults([]);

    // Réinitialiser l'état de recherche globale
    setIsTabLoading(false);

    // Créer le nouvel onglet avec un callback de nettoyage renforcé
    addNewTab(() => {
      cleanupWebSocket();
      forensicResultsHeap.clear();
      setDisplayResults([]);

      // Forcer une réinitialisation du DOM après un court délai
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

    // Récupérer le jobId associé au nouvel onglet
    const selectedTab = tabJobs.find((tab) => tab.tabIndex === tabIndex);
    const isNewTab = selectedTab?.isNew === true;

    console.log('Changement vers onglet:', {
      tabIndex,
      isNew: isNewTab,
      hasJobId: Boolean(selectedTab?.jobId),
    });

    // Nettoyer la WebSocket précédente
    cleanupWebSocket();

    // Forcer la réinitialisation des résultats AVANT de changer l'onglet
    forensicResultsHeap.clear();
    setDisplayResults([]);

    // IMPORTANT: réinitialiser aussi les résultats dans le hook useSearch
    // Ajoutez cette ligne pour réinitialiser propsResults
    setResults([]);

    // Mettre à jour l'onglet actif
    jobsHandleTabChange(tabIndex);

    // Pour un nouvel onglet, ne pas charger de résultats
    if (isNewTab) {
      console.log('Nouvel onglet détecté, pas de chargement de résultats');
      setIsTabLoading(false);
      return;
    }

    if (selectedTab?.jobId) {
      try {
        await resumeJob(selectedTab.jobId, false);
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

      if (jobId) {
        // Mettre à jour les tabJobs sans déclencher handleTabChange
        const selectedTabIndex = await selectLeftmostTab();

        // Ne pas appeler handleTabChange car cela fermerait la WebSocket
        // déjà ouverte par startSearch
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
        setIsTabLoading(true); // Activer le skeleton loader
        console.log('🔍 Démarrage du chargement des jobs existants');

        // Récupérer les tâches existantes et leurs onglets associés
        const updatedTabJobs = await fetchTasks();
        console.log(
          '📊 État des tabJobs après fetchTasks:',
          updatedTabJobs || []
        );

        // Chercher un onglet avec un jobId
        const tabWithJob =
          updatedTabJobs?.find((tab) => tab.jobId) ||
          tabJobs.find((tab) => tab.jobId);

        if (tabWithJob) {
          console.log('✅ Onglet avec jobId trouvé:', tabWithJob);

          // Sélectionner explicitement l'onglet
          handleTabChange(tabWithJob.tabIndex);

          // Délai court pour laisser le changement d'onglet s'appliquer
          await new Promise((resolve) => {
            setTimeout(resolve, 50);
          });

          // Charger les résultats pour cet onglet
          if (tabWithJob.jobId) {
            console.log(
              '🚀 Chargement des résultats pour jobId:',
              tabWithJob.jobId
            );
            await resumeJob(tabWithJob.jobId, false);
            console.log('✅ Résultats chargés avec succès');
          }
        } else {
          console.log('ℹ️ Aucun onglet avec jobId trouvé');
          // Si pas d'onglet avec jobId, sélectionner le premier onglet
          if (updatedTabJobs?.length > 0) {
            handleTabChange(updatedTabJobs[0].tabIndex);
          }
        }

        console.log('🏁 Fin du chargement des jobs existants');
      } catch (error) {
        console.error('❌ Erreur lors du chargement des jobs:', error);
      } finally {
        // Désactiver l'état de chargement avec un léger délai
        // pour éviter un clignotement du skeleton loader
        setTimeout(() => {
          setIsTabLoading(false);
        }, 300);
      }
    };

    // Exécuter uniquement au montage du composant
    loadExistingJobs();
  }, []); // Dépendances vides pour n'exécuter qu'au montage

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
            onDeleteTab={handleDeleteTab}
            onDeleteAllTabs={handleDeleteAllTabs}
          />
        </CardContent>
      </Card>
    </div>
  );
}
