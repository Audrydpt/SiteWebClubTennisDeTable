/* eslint-disable no-console,@typescript-eslint/no-explicit-any,@typescript-eslint/no-unused-vars,react-hooks/exhaustive-deps */
// use-results.tsx - Hook pour la gestion des résultats, tri et pagination
import { useCallback, useEffect, useRef, useState } from 'react';
import forensicResultsHeap from '../lib/data-structure/heap';
import { ForensicResult, SourceProgress } from '../lib/types';
import { SortType } from '../components/ui/buttons';
import { ForensicTaskStatus, isForensicTaskCompleted } from './use-jobs';

// Nombre maximum de résultats à afficher par page
const FORENSIC_PAGINATION_ITEMS = parseInt(
  process.env.FORENSIC_PAGINATION_ITEMS || '12',
  10
);

interface UseForensicResultsOptions {
  onPageChange?: (page: number, jobId: string | null) => void;
  onMessageReceived?: (message: any) => void;
  onReturnToFirstPage?: (jobId: string) => void;
}

export default function useForensicResults(
  options: UseForensicResultsOptions = {}
) {
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

  // Nouvel état pour les métadonnées de pagination de toutes les tâches
  const [tasksMetadata, setTasksMetadata] = useState<
    Record<
      string,
      {
        count: number;

        total_pages: number;
      }
    >
  >({});

  // Pour garder trace de l'ID de job actif
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  const fetchTasksMetadata = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.MAIN_API_URL}/forensics`);

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }

      const data = await response.json();

      if (data.tasks) {
        setTasksMetadata(data.tasks);

        // Si un jobId actif est défini, mettre à jour les infos de pagination
        if (activeJobId && data.tasks[activeJobId]) {
          const taskInfo = data.tasks[activeJobId];
          setPaginationInfo((prev) => ({
            ...prev,
            total: taskInfo.count || 0,
            totalPages:
              taskInfo.total_pages ||
              Math.ceil((taskInfo.count || 0) / prev.pageSize),
          }));
        }

        return data.tasks;
      }

      return {};
    } catch (error) {
      console.error('Erreur lors de la récupération des métadonnées:', error);
      return {};
    }
  }, [activeJobId]);

  // Actualisation périodique des métadonnées toutes les 4 secondes
  useEffect(() => {
    // Appel initial
    fetchTasksMetadata();

    // Configuration de l'intervalle pour les actualisations suivantes
    const intervalId = setInterval(fetchTasksMetadata, 4000);

    // Nettoyage à la destruction du composant
    return () => {
      clearInterval(intervalId);
    };
  }, [fetchTasksMetadata]);

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

  // Fonction pour mettre à jour le tri
  const updateSorting = useCallback(() => {
    if (results.length === 0) return;

    setIsLoading(true);

    setTimeout(() => {
      const sortedResults = [...results];

      if (sortType === 'date') {
        sortedResults.sort((a, b) => {
          const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
          const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
          return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        });
      } else if (sortType === 'score') {
        sortedResults.sort((a, b) =>
          sortOrder === 'asc' ? a.score - b.score : b.score - a.score
        );
      }

      setDisplayResults(sortedResults);
      setIsLoading(false);
    }, 150);
  }, [results, sortType, sortOrder]);

  // Fonction pour inverser l'ordre de tri
  const toggleSortOrder = useCallback(() => {
    setSortOrder((prevOrder) => (prevOrder === 'asc' ? 'desc' : 'asc'));
  }, []);

  // Effet pour réappliquer le tri quand le type ou l'ordre change
  useEffect(() => {
    updateSorting();
  }, [updateSorting, sortType, sortOrder]);

  // Méthode pour mettre à jour les résultats pertinents en première page
  const updateFirstPageWithRelevantResults = useCallback(
    (newResult: ForensicResult) => {
      // Si nous ne sommes pas sur la page 1, ne pas mettre à jour l'affichage
      if (currentPageRef.current !== 1) {
        console.log("💾 Résultat ajouté au heap (page ≠ 1, pas d'affichage)");
        forensicResultsHeap.addResult(newResult);
        return false;
      }

      let shouldAdd = false;

      // Pour le tri par date, on veut toujours ajouter le résultat
      if (sortType === 'date') {
        shouldAdd = true;
      } else {
        // Pour le tri par score, on utilise la logique existante
        shouldAdd = forensicResultsHeap.shouldAddResult(
          newResult,
          1,
          paginationInfo.pageSize
        );
      }

      if (shouldAdd) {
        // Ajouter le résultat au heap
        forensicResultsHeap.addResult(newResult);
        console.log(
          `➕ Résultat ajouté au heap (${
            sortType === 'date' ? 'tri par date' : `score: ${newResult.score}`
          })`
        );

        // Récupérer les résultats pour la première page selon le critère de tri
        let topResults;
        if (sortType === 'date') {
          // Pour le tri par date, récupérer tous les résultats et les trier par date
          const allResults = [...forensicResultsHeap.getAllResults()];
          allResults.sort((a, b) => {
            const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
            const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
            return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
          });
          topResults = allResults.slice(0, paginationInfo.pageSize);
        } else {
          // Pour le tri par score, utiliser la méthode existante
          topResults = forensicResultsHeap.getPageResults(
            1,
            paginationInfo.pageSize
          );
        }

        // S'assurer qu'on ne dépasse jamais la taille de la page
        const limitedResults = topResults.slice(0, paginationInfo.pageSize);
        console.log(
          `🔢 Résultats WS: ${limitedResults.length}/${paginationInfo.pageSize} max (tri: ${sortType})`
        );

        // Mettre à jour les résultats affichés avec limitation stricte
        setDisplayResults([...limitedResults]);

        // Mettre à jour la liste complète des résultats
        if (limitedResults.length > 0) {
          setResults(limitedResults);
          console.log(
            `📊 Heap contient ${forensicResultsHeap.size()} résultats au total`
          );
        }

        return true;
      }

      if (sortType === 'score') {
        console.log(
          `⏭️ Résultat ignoré (score: ${newResult.score}) - pas assez pertinent`
        );
      }
      return false;
    },
    [sortType, sortOrder, paginationInfo.pageSize]
  );

  // Fonction pour traiter les messages WebSocket en temps réel
  const handleWebSocketMessage = useCallback(
    (event: MessageEvent) => {
      if (typeof event.data !== 'string') return;

      try {
        const data = JSON.parse(event.data);

        // Appeler le callback externe si configuré
        if (options.onMessageReceived) {
          options.onMessageReceived(data);
        }

        // Traiter les résultats de détection
        if (data.type === 'detection') {
          const result: ForensicResult = {
            id: data.frame_uuid,
            timestamp: data.timestamp,
            score: data.score || 0,
            type: data.type || 'detection',
            cameraId: data.camera_id || data.camera,
            camera: data.camera,
            imageData: '',
            metadata: data.attributes || {},
          };

          // Ajouter le résultat
          updateFirstPageWithRelevantResults(result);

          // Mise à jour de la pagination
          setPaginationInfo((prev) => ({
            ...prev,
            total: forensicResultsHeap.size(),
            totalPages: Math.ceil(forensicResultsHeap.size() / prev.pageSize),
          }));
        }
      } catch (e) {
        console.error('Erreur lors du traitement du message WebSocket:', e);
      }
    },
    [options.onMessageReceived, updateFirstPageWithRelevantResults]
  );

  // Fonction pour récupérer le statut d'un job
  const getJobStatus = async (jobId: string): Promise<ForensicTaskStatus> => {
    try {
      const response = await fetch(
        `${process.env.MAIN_API_URL}/forensics/${jobId}`
      );

      if (!response.ok) {
        throw new Error(`Erreur API status: ${response.status}`);
      }

      const data = await response.json();
      return data.status as ForensicTaskStatus; // Conversion explicite du statut
    } catch (error) {
      console.error(
        `Erreur lors de la vérification du statut du job ${jobId}:`,
        error
      );
      return 'UNKNOWN' as ForensicTaskStatus; // Valeur par défaut avec conversion
    }
  };

  const handlePageChange = useCallback(
    async (page: number) => {
      if (page === currentPage || !activeJobId) return;

      const isReturningToFirstPage = page === 1 && currentPage > 1;

      setIsLoading(true);
      setCurrentPage(page);
      currentPageRef.current = page;

      // Utiliser les métadonnées de tâche si disponibles, sinon conserver les valeurs actuelles
      const previousTotal =
        tasksMetadata[activeJobId]?.count !== undefined
          ? tasksMetadata[activeJobId].count
          : paginationInfo.total;

      const previousTotalPages =
        tasksMetadata[activeJobId]?.total_pages !== undefined
          ? tasksMetadata[activeJobId].total_pages
          : paginationInfo.totalPages;

      // Mettre à jour la pagination avec des valeurs stables
      setPaginationInfo((prev) => ({
        ...prev,
        currentPage: page,
        total: previousTotal || prev.total,
        totalPages: previousTotalPages || prev.totalPages,
      }));

      try {
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        await loadJobResults(activeJobId, false, page);

        // Si on revient à la page 1, vérifier si la recherche est toujours active
        if (isReturningToFirstPage) {
          // Vérifier si le job est toujours en cours
          const jobStatus = await getJobStatus(activeJobId);
          const isSearchActive = !isForensicTaskCompleted(jobStatus);

          // Si le job est actif et qu'on a une callback, l'appeler pour réactiver le WebSocket
          if (isSearchActive && options.onReturnToFirstPage) {
            options.onReturnToFirstPage(activeJobId);
          }
        }

        if (options.onPageChange) {
          options.onPageChange(page, activeJobId);
        }
      } catch (error) {
        console.error('Erreur lors du changement de page:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [
      currentPage,
      activeJobId,
      paginationInfo,
      tasksMetadata,
      options.onPageChange,
      options.onReturnToFirstPage,
    ]
  );

  // Fonction pour charger les résultats d'un job
  const loadJobResults = useCallback(
    async (
      jobId: string,
      resetData: boolean = false,
      page: number = currentPage
    ) => {
      setIsLoading(true);

      if (resetData) {
        resetResults();
      }

      setActiveJobId(jobId);
      currentPageRef.current = page;
      setCurrentPage(page);

      try {
        // Utilisation des nouveaux endpoints avec paramètres de tri
        const endpoint = sortType === 'date' ? 'by-date' : 'by-score';
        const paginatedResponse = await fetch(
          `${process.env.MAIN_API_URL}/forensics/${jobId}/${endpoint}?page=${page}&page_size=${paginationInfo.pageSize}&desc=${sortOrder === 'desc'}`
        );

        if (!paginatedResponse.ok) {
          throw new Error(`Erreur API (${paginatedResponse.status})`);
        }

        const pageData = await paginatedResponse.json();
        console.log('📄 Données de pagination reçues:', pageData);

        const {
          results: apiResults,
          page: apiPage,
          page_size: apiPageSize,
          total_pages: apiTotalPages,
          total: apiTotal,
        } = pageData;

        // Mise à jour des données de pagination
        const paginationData = {
          currentPage: apiPage,
          pageSize: apiPageSize,
          totalPages: apiTotalPages,
          total: apiTotal,
        };

        setPaginationInfo(paginationData);
        console.log('Pagination mise à jour:', paginationData);

        // Traitement des résultats
        const detectionFiltered = apiResults.filter(
          (result: any) => result && result.frame_uuid
        );
        console.log(
          `🔍 ${detectionFiltered.length} résultats filtrés pour traitement`
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

        const validResults = detectionResults.filter(
          (result): result is ForensicResult => result !== null
        );
        console.log(`✅ ${validResults.length} résultats valides récupérés`);

        if (page === 1) {
          // Pour la première page, mettre à jour le heap
          forensicResultsHeap.clear();
          validResults.forEach((result) =>
            forensicResultsHeap.addResult(result)
          );
        }

        setResults(validResults);
        setDisplayResults(validResults);

        return {
          results: validResults,
          paginationInfo: paginationData,
        };
      } catch (error) {
        console.error('❌ Erreur dans loadJobResults:', error);
        return {
          results: [],
          paginationInfo,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [currentPage, sortType, sortOrder, paginationInfo.pageSize, resetResults]
  );

  return {
    // États
    results: displayResults,
    displayResults,
    isLoading,
    isTabLoading,
    currentPage,
    sortType,
    sortOrder,
    paginationInfo,
    activeJobId,
    tasksMetadata,

    // Méthodes de modification des états
    setResults,
    setDisplayResults,
    setIsLoading,
    setIsTabLoading,
    setCurrentPage,
    setSortType,
    setPaginationInfo,

    // Actions
    loadJobResults,
    resetResults,
    toggleSortOrder,
    handlePageChange,
    handleWebSocketMessage,
    updateFirstPageWithRelevantResults,
  };
}
