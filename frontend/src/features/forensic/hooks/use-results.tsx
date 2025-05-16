import { useCallback, useEffect, useRef, useState } from 'react';

import forensicResultsHeap from '../lib/data-structure/heap';
import { ForensicResult } from '../lib/types';
import useJobs, { isForensicTaskCompleted } from './use-jobs';
import useSearch from './use-search';
import { SortType } from '../components/ui/buttons';

// Nombre maximum de résultats à afficher par page
const FORENSIC_PAGINATION_ITEMS = parseInt(
  process.env.FORENSIC_PAGINATION_ITEMS || '12',
  10
);

export default function useForensicResults() {
  // États de base pour les résultats et l'affichage
  const [results, setResults] = useState<ForensicResult[]>([]);
  const [displayResults, setDisplayResults] = useState<ForensicResult[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const currentPageRef = useRef<number>(1);

  // États pour le chargement
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isTabLoading, setIsTabLoading] = useState<boolean>(false);

  // États pour le tri
  const [sortType, setSortType] = useState<SortType>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // État pour la pagination
  const [paginationInfo, setPaginationInfo] = useState({
    currentPage: 1,
    pageSize: FORENSIC_PAGINATION_ITEMS,
    totalPages: 0,
    total: 0,
  });

  // Utiliser les hooks existants
  const {
    testResumeJob,
    resetSearch,
    setDisplayResults: searchSetDisplayResults,
    setResults: searchSetResults,
  } = useSearch();
  const { activeTabIndex, getActivePaginationInfo } = useJobs();

  // Fonction pour basculer l'ordre de tri
  const toggleSortOrder = useCallback(() => {
    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  }, []);

  // Fonction pour changer de page
  const handlePageChange = useCallback(
    async (page: number) => {
      console.log(`Changement vers page ${page}`);
      setCurrentPage(page);
      currentPageRef.current = page;

      if (!activeTabIndex) {
        console.error('Impossible de charger la page : aucun job actif');
        return;
      }

      try {
        setIsLoading(true);
        await testResumeJob(
          activeTabIndex,
          page,
          true,
          false,
          sortType,
          sortOrder
        );
      } catch (error) {
        console.error(`Erreur lors du chargement de la page ${page}:`, error);
      } finally {
        setIsLoading(false);
      }
    },
    [testResumeJob, activeTabIndex, sortType, sortOrder]
  );

  // Fonction pour charger les résultats d'un job
  const loadJobResults = useCallback(
    async (jobId: string, forceReset: boolean = false) => {
      setIsTabLoading(true);
      setCurrentPage(1);
      currentPageRef.current = 1;

      if (forceReset) {
        resetSearch();
        forensicResultsHeap.clear();
        setDisplayResults([]);
        setResults([]);
      }

      try {
        console.log(`Chargement des résultats pour le job ${jobId}`);
        const response = await testResumeJob(
          jobId,
          1,
          false,
          true,
          sortType,
          sortOrder
        );

        if (response) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { results: jobResults, pagination } = response;
          console.log('Pagination reçue:', pagination);
        }
      } catch (error) {
        console.error(`Erreur lors du chargement du job ${jobId}:`, error);
      } finally {
        setIsTabLoading(false);
      }
    },
    [resetSearch, testResumeJob, sortType, sortOrder]
  );

  // Fonction pour ajouter un résultat en temps réel
  const addRealTimeResult = useCallback(
    (newResult: ForensicResult) => {
      // Si nous ne sommes pas sur la page 1, ne pas mettre à jour l'affichage
      if (currentPageRef.current !== 1) {
        forensicResultsHeap.addResult(newResult);
        return false;
      }

      // Toujours ajouter le résultat au heap
      forensicResultsHeap.addResult(newResult);

      // Récupérer les résultats selon le critère de tri actuel
      let topResults;
      if (sortType === 'date') {
        const allResults = [...forensicResultsHeap.getAllResults()];
        allResults.sort((a, b) => {
          const dateA = new Date(a.timestamp).getTime();
          const dateB = new Date(b.timestamp).getTime();
          return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
        });
        topResults = allResults.slice(0, paginationInfo.pageSize);

        const isInTopResults = topResults.some((r) => r.id === newResult.id);
        if (!isInTopResults) {
          return false;
        }
      } else {
        const shouldAdd = forensicResultsHeap.shouldAddResult(
          newResult,
          1,
          paginationInfo.pageSize
        );

        if (!shouldAdd) {
          return false;
        }

        topResults = forensicResultsHeap.getPageResults(
          1,
          paginationInfo.pageSize
        );
      }

      // Mettre à jour les résultats affichés
      setDisplayResults([...topResults]);
      setResults(topResults);
      return true;
    },
    [sortType, sortOrder, paginationInfo.pageSize]
  );

  // Fonction pour réinitialiser les résultats
  const resetResults = useCallback(() => {
    forensicResultsHeap.clear();
    setDisplayResults([]);
    setResults([]);
    setPaginationInfo({
      currentPage: 1,
      pageSize: FORENSIC_PAGINATION_ITEMS,
      totalPages: 0,
      total: 0,
    });
    setCurrentPage(1);
    currentPageRef.current = 1;
  }, []);

  // Synchroniser la pagination avec les informations du job actif
  useEffect(() => {
    if (isTabLoading) return;

    const dynamicPaginationInfo = getActivePaginationInfo();

    if (
      activeTabIndex &&
      dynamicPaginationInfo?.totalPages > 0 &&
      (paginationInfo.totalPages !== dynamicPaginationInfo.totalPages ||
        paginationInfo.total !== dynamicPaginationInfo.total ||
        paginationInfo.pageSize !== dynamicPaginationInfo.pageSize)
    ) {
      const updatedPaginationInfo = {
        ...dynamicPaginationInfo,
        currentPage,
      };

      setPaginationInfo(updatedPaginationInfo);

      if (
        currentPage > dynamicPaginationInfo.totalPages &&
        dynamicPaginationInfo.totalPages > 0 &&
        !isLoading
      ) {
        setTimeout(() => {
          setCurrentPage(dynamicPaginationInfo.totalPages);
          handlePageChange(dynamicPaginationInfo.totalPages);
        }, 0);
      }
    }
  }, [
    activeTabIndex,
    getActivePaginationInfo,
    isTabLoading,
    isLoading,
    currentPage,
    handlePageChange,
    paginationInfo.totalPages,
    paginationInfo.total,
    paginationInfo.pageSize,
  ]);

  const updateFirstPageWithRelevantResults = (
    newResult: ForensicResult,
    currentSortType: SortType = 'score',
    currentSortOrder: 'asc' | 'desc' = 'desc'
  ) => {
    // Si nous ne sommes pas sur la page 1, ne pas mettre à jour l'affichage
    if (currentPageRef.current !== 1) {
      forensicResultsHeap.addResult(newResult);
      return false;
    }

    // Toujours ajouter le résultat au heap pour le conserver
    forensicResultsHeap.addResult(newResult);

    // Récupérer les résultats pour la première page selon le critère de tri actuel
    let topResults;
    if (currentSortType === 'date') {
      // Pour le tri par date, récupérer tous les résultats et les trier par date
      const allResults = [...forensicResultsHeap.getAllResults()];
      allResults.sort((a, b) => {
        const dateA = new Date(a.timestamp).getTime();
        const dateB = new Date(b.timestamp).getTime();
        return currentSortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      });
      topResults = allResults.slice(0, paginationInfo.pageSize);

      // Vérifier si le nouveau résultat fait partie des résultats à afficher
      const isInTopResults = topResults.some((r) => r.id === newResult.id);
      if (!isInTopResults) {
        return false;
      }
    } else {
      // Pour le tri par score, utiliser la méthode existante
      const shouldAdd = forensicResultsHeap.shouldAddResult(
        newResult,
        1,
        paginationInfo.pageSize
      );

      if (!shouldAdd) {
        return false;
      }

      topResults = forensicResultsHeap.getPageResults(
        1,
        paginationInfo.pageSize
      );
    }

    // Mettre à jour les résultats affichés
    setDisplayResults([...topResults]);
    setResults(topResults);
    return true;
  };

  const resetPagination = useCallback(() => {
    setPaginationInfo({
      currentPage: 1,
      pageSize: FORENSIC_PAGINATION_ITEMS,
      totalPages: 1,
      total: 0,
    });
  }, []);

  const testResumeJob = async (
    jobId: string,
    page: number = 1,
    skipHistory: boolean = false,
    skipLoadingState: boolean = false,
    sortType: SortType = 'score',
    sortOrder: 'asc' | 'desc' = 'desc'
  ) => {
    try {
      console.log('📌 testResumeJob démarré avec params:', {
        jobId,
        page,
        skipHistory,
        skipLoadingState,
        sortType,
        sortOrder,
      });

      currentPageRef.current = page;

      console.log(`🔄 Changement de page: ${currentPageTracked} -> ${page}`);
      setCurrentPageTracked(page);

      // Récupérer le statut actuel de la tâche
      const jobStatus = await getJobStatus(jobId);
      console.log(`📊 Statut actuel du job ${jobId}: ${jobStatus}`);

      const taskIsStillRunning = jobStatus === 'STARTED';

      // Gestion du WebSocket pour la page 1
      if (page !== 1) {
        console.log('📴 Page différente de 1, fermeture du WebSocket');
        cleanupWebSocket();
      } else if (taskIsStillRunning) {
        console.log(
          '🔄 Page 1 avec recherche active, initialisation forcée du WebSocket'
        );
        // Fermer d'abord toute connexion existante
        if (wsRef.current) {
          wsRef.current.close(1000, 'Réinitialisation pour page 1');
          wsRef.current = null;
        }
        // Puis forcer la réinitialisation
        setTimeout(() => {
          initWebSocket(jobId, true);
        }, 50);
      }

      setJobId(jobId);
      if (!skipHistory && page === 1) {
        forensicResultsHeap.clear();
      }
      if (!skipLoadingState) setIsSearching(taskIsStillRunning);

      // Utilisation des nouveaux endpoints avec paramètres de tri
      const endpoint = sortType === 'date' ? 'by-date' : 'by-score';
      const paginatedResponse = await fetch(
        `${process.env.MAIN_API_URL}/forensics/${jobId}/${endpoint}?page=${page}&desc=${sortOrder === 'desc'}`
      );

      if (!paginatedResponse.ok)
        throw new Error(`Erreur API pagination: ${paginatedResponse.status}`);

      const pageData = await paginatedResponse.json();
      console.log('📄 Données de pagination reçues:', pageData);

      const {
        results = [],
        total = 0,
        total_pages = 0,
        page: currentPage = page,
        page_size = FORENSIC_PAGINATION_ITEMS,
        status = jobStatus, // Utiliser le statut récupéré ou celui de la réponse
        sources_progress = [],
      } = pageData;

      // Traitement des informations de progression
      const sourcesProgressData = sources_progress.map((source: any) => ({
        sourceId: source.guid,
        sourceName:
          source.source_name || `Source ${source.guid.slice(0, 8)}...`,
        progress: isForensicTaskCompleted(status) ? 100 : source.progress,
        timestamp: source.timestamp || new Date().toISOString(),
        startTime: source.start_time || new Date().toISOString(),
      }));

      setSourceProgress(sourcesProgressData);
      setProgress(
        isForensicTaskCompleted(status)
          ? 100
          : Math.max(
            ...sourcesProgressData.map(
              (s: { progress: any }) => s.progress || 0
            ),
            0
          )
      );

      // Mise à jour des données de pagination
      const paginationData = {
        currentPage,
        pageSize: page_size,
        totalPages: total_pages,
        total,
      };

      setPaginationInfo(paginationData);
      console.log('Pagination mise à jour:', paginationData);

      // Traitement des résultats de détection - ajustement pour correspondre à la structure API
      const detectionFiltered = results.filter(
        (r: any) => r.type === 'detection'
      );
      console.log(
        `🔍 Filtrage: ${detectionFiltered.length} détections trouvées sur ${results.length} résultats`
      );

      // Récupération des images pour les résultats filtrés
      const detectionResults = await Promise.all(
        detectionFiltered.map(async (result: any) => {
          const frameId = result.frame_uuid;
          if (!frameId) {
            return null;
          }

          try {
            const imageResponse = await fetch(
              `${process.env.MAIN_API_URL}/forensics/${jobId}/frames/${frameId}`
            );

            if (!imageResponse.ok) {
              console.error(
                `Erreur chargement image ${frameId}: ${imageResponse.status}`
              );
              return null;
            }

            const imageBlob = await imageResponse.blob();
            const imageUrl = URL.createObjectURL(imageBlob);

            return {
              id: frameId,
              timestamp: result.timestamp,
              score: result.score || 0,
              type: result.type || 'detection',
              cameraId: result.camera_id || result.camera,
              camera: result.camera,
              imageData: imageUrl,
              metadata: result.attributes || {},
            };
          } catch (error) {
            console.error(`Erreur traitement image ${frameId}:`, error);
            return null;
          }
        })
      );

      const validDetectionResults = detectionResults.filter(
        (r) => r !== null
      ) as ForensicResult[];

      // Gestion des résultats selon la page
      if (page === 1) {
        validDetectionResults.forEach((res: ForensicResult) => {
          forensicResultsHeap.addResult(res);
        });

        // Toujours obtenir les résultats du heap pour la cohérence
        const bestResults = forensicResultsHeap.getPageResults(
          1,
          paginationInfo.pageSize
        );

        setResults(bestResults);
        setDisplayResults(bestResults);

        if (taskIsStillRunning) {
          console.log(
            '🔄 Tâche toujours en cours, réinitialisation forcée du WebSocket'
          );
          initWebSocket(jobId, true);
          setIsSearching(true);
        } else {
          setIsSearching(false);
        }
      } else {
        setResults(validDetectionResults);
        setDisplayResults(validDetectionResults);
      }

      return {
        results: validDetectionResults,
        pagination: paginationData,
      };
    } catch (error) {
      console.error('❌ Erreur dans testResumeJob:', error);
      setResults([]);
      setDisplayResults([]);
      setProgress(null);
      setSourceProgress([]);
      setIsSearching(false);
      return {
        results: [],
        pagination: {
          currentPage: page,
          pageSize: FORENSIC_PAGINATION_ITEMS,
          totalPages: 0,
          total: 0,
        },
      };
    } finally {
      if (!skipLoadingState) {
        setIsSearching(false);
        setProgress(100);
      }
    }
  };

  const handlePageChange = useCallback(
    (page: number) => {
      const previousPage = currentPageTracked;
      setCurrentPageTracked(page);
      currentPageRef.current = page;

      // Si on quitte la page 1, fermer le WebSocket
      if (
        page !== 1 &&
        wsRef.current &&
        wsRef.current.readyState === WebSocket.OPEN
      ) {
        console.log('🚫 Fermeture du WebSocket - navigation hors de la page 1');
        wsRef.current.close(1000, 'Navigation vers une autre page');
        wsRef.current = null;
      }

      // Si on revient à la page 1 et qu'une recherche est en cours, forcer la réinitialisation du WebSocket
      if (page === 1 && previousPage !== 1 && isSearching && jobId) {
        console.log('🔄 Retour à la page 1 - réinitialisation du WebSocket');
        setIsSearching(true);

        // Forcer la fermeture de toute connexion existante
        if (wsRef.current) {
          wsRef.current.close(1000, 'Réinitialisation pour page 1');
          wsRef.current = null;
        }

        // Différer légèrement l'initialisation pour s'assurer que currentPageTracked est mis à jour
        setTimeout(() => {
          console.log('⚡ Initialisation forcée du WebSocket pour la page 1');
          initWebSocket(jobId);
        }, 50);

        return;
      }

      // Charger les données de la nouvelle page
      if (jobId) {
        testResumeJob(jobId, page, isSearching);
      }
    },
    [currentPageTracked, isSearching, jobId, initWebSocket, testResumeJob]
  );

  // Recharger les résultats lorsque les options de tri changent
  useEffect(() => {
    if (activeTabIndex && !isLoading && !isTabLoading) {
      console.log(
        `🔄 Rechargement suite au changement de tri: ${sortType} (${sortOrder})`
      );

      setCurrentPage(1);
      currentPageRef.current = 1;

      forensicResultsHeap.clear();
      setDisplayResults([]);
      setResults([]);

      testResumeJob(activeTabIndex, 1, false, false, sortType, sortOrder);
    }
  }, [
    sortType,
    sortOrder,
    activeTabIndex,
    isLoading,
    isTabLoading,
    testResumeJob,
  ]);

  // Synchroniser les états avec useSearch pour la compatibilité
  useEffect(() => {
    searchSetDisplayResults(displayResults);
    searchSetResults(results);
  }, [displayResults, results, searchSetDisplayResults, searchSetResults]);

  return {
    results,
    displayResults,
    isLoading,
    isTabLoading,
    setIsTabLoading,
    currentPage,
    sortType,
    setSortType,
    sortOrder,
    toggleSortOrder,
    paginationInfo,
    setPaginationInfo,
    handlePageChange,
    loadJobResults,
    addRealTimeResult,
    resetResults,
    setResults,
    setDisplayResults,
  };
}
