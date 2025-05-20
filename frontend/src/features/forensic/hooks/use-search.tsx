/* eslint-disable no-console,@typescript-eslint/no-explicit-any,@typescript-eslint/no-shadow,consistent-return,no-promise-executor-return,@typescript-eslint/no-unused-vars,react-hooks/exhaustive-deps,@typescript-eslint/naming-convention,@stylistic/indent */
import { useCallback, useEffect, useRef, useState } from 'react';

import useLatest from '@/hooks/use-latest';
import { useAuth } from '@/providers/auth-context';

import forensicResultsHeap from '../lib/data-structure/heap.tsx';
import { FormData as CustomFormData, formatQuery } from '../lib/format-query';
import { ForensicResult, SourceProgress } from '../lib/types';
import { isForensicTaskCompleted, ForensicTaskStatus } from './use-jobs.tsx';
import { SortType } from '../components/ui/buttons.tsx';

// Number of maximum results to keep
const FORENSIC_PAGINATION_ITEMS = parseInt(
  process.env.FORENSIC_PAGINATION_ITEMS || '12',
  10
);

export default function useSearch() {
  const { sessionId = '' } = useAuth();
  const [progress, setProgress] = useState<number | null>(null);
  const [results, setResults] = useState<ForensicResult[]>([]);
  const [sourceProgress, setSourceProgress] = useState<SourceProgress[]>([]);

  const [jobId, setJobId] = useState<string | null>(null);
  const latestJobId = useLatest(jobId);

  const [isSearching, setIsSearching] = useState(false);
  const latestIsSearching = useLatest(isSearching);

  const [isCancelling, setIsCancelling] = useState(false);
  const latestIsCancelling = useLatest(isCancelling);

  const [type, setType] = useState<string | null>(null);
  const latestType = useLatest(type);

  // Références pour WebSocket et AbortController
  const wsRef = useRef<WebSocket | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [displayResults, setDisplayResults] = useState<ForensicResult[]>([]);

  const currentPageRef = useRef<number>(1);
  const [sortType, setSortType] = useState<SortType>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [paginationInfo, setPaginationInfo] = useState({
    currentPage: 1,
    pageSize: FORENSIC_PAGINATION_ITEMS,
    totalPages: 0,
    total: 0,
  });

  // Ajoutez dans les states existants
  const [currentPageTracked, setCurrentPageTracked] = useState<number>(1);

  const metadataQueue = useRef<{
    timestamp?: string;
    score?: number;
    camera?: string;
    progress?: number;
    attributes?: Record<string, unknown>;
  }>({});

  const initializeSourceProgress = useCallback((selectedSources: string[]) => {
    setSourceProgress(
      selectedSources.map((guid) => ({
        sourceId: guid,
        sourceName: `Source ${guid.slice(0, 8)}...`,
        progress: 0,
        startTime: new Date().toISOString(),
      }))
    );
  }, []);

  const cleanupResources = useCallback(() => {
    // Fermer WebSocket s'il existe
    if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
      wsRef.current.close(1000, 'Component unmounted');
      wsRef.current = null;
    }
    // Annuler toute requête fetch en cours
    if (abortControllerRef.current) {
      abortControllerRef.current.abort('Cleanup');
      abortControllerRef.current = null;
    }
  }, []);

  const getJobStatus = async (jobId: string): Promise<string> => {
    if (!jobId) {
      console.error('❌ Impossible de récupérer le statut: aucun jobId fourni');
      return 'ERROR';
    }

    try {
      const response = await fetch(
        `${process.env.MAIN_API_URL}/forensics/${jobId}`
      );

      if (!response.ok) {
        throw new Error(
          `Erreur lors de la récupération du statut: ${response.status}`
        );
      }

      const data = await response.json();
      console.log(`📊 Statut du job ${jobId}: ${data.status}`);
      return data.status;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération du statut:', error);
      return 'ERROR';
    }
  };

  // Dans la fonction updateFirstPageWithRelevantResults de use-search.tsx
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

  const initWebSocket = useCallback(
    (id: string, page1 = false) => {
      const shouldInit = page1 || currentPageRef.current === 1;

      console.log(
        `🔍 Tentative d'initialisation WebSocket pour job ${id}, page ${currentPageRef.current}`
      );

      if (!shouldInit) {
        console.log('🚫 WebSocket non initialisé - page différente de 1');
        return;
      }

      if (!id) {
        console.error(
          '⚠️ Aucun jobId disponible pour initialiser le WebSocket'
        );
        return;
      }

      if (latestIsCancelling.current) {
        console.log(
          '🚫 Initialisation du WebSocket ignorée – annulation en cours'
        );
        return;
      }

      // AMÉLIORATION : Ajouter un délai avant de fermer une connexion existante
      const closeExistingConnection = () =>
        new Promise<void>((resolve) => {
          if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
            console.log('🔄 Fermeture de la connexion WebSocket existante...');

            // Gérer l'événement de fermeture pour résoudre la promesse
            const onCloseHandler = () => {
              wsRef.current = null;
              resolve();
            };

            wsRef.current.addEventListener('close', onCloseHandler, {
              once: true,
            });
            wsRef.current.close(1000, 'Nouvelle connexion demandée');

            // Timeout de sécurité si la fermeture ne se produit pas
            setTimeout(() => {
              if (wsRef.current) {
                console.log('⚠️ Timeout sur la fermeture WebSocket');
                wsRef.current = null;
                resolve();
              }
            }, 500);
          } else {
            resolve();
          }
        });

      // AMÉLIORATION : Fermer proprement la connexion existante avant d'en créer une nouvelle
      closeExistingConnection().then(() => {
        // Ne pas créer de nouvelle connexion si l'état a changé pendant la fermeture
        if (latestIsCancelling.current || currentPageRef.current !== 1) {
          console.log(
            '🛑 Création de WebSocket annulée - conditions ont changé'
          );
          return;
        }

        // Déterminer le hostname en privilégiant la variable d'environnement si possible
        let { hostname } = window.location;
        try {
          hostname =
            new URL(process.env.MAIN_API_URL || '').hostname || hostname;
        } catch {
          // En cas d'erreur, on garde le hostname par défaut
        }

        try {
          const ws = new WebSocket(
            `wss://${hostname}/front-api/forensics/${id}`
          );
          wsRef.current = ws;

          ws.onopen = () => {
            console.log('✅ WebSocket connecté pour le job', id);
          };

          ws.onmessage = (event) => {
            // Skip processing if cancelling
            if (isCancelling) {
              return;
            }

            if (typeof event.data === 'string') {
              try {
                const data = JSON.parse(event.data);

                // Stocker les métadonnées pour une utilisation ultérieure
                if (data.timestamp)
                  metadataQueue.current.timestamp = data.timestamp;
                if (data.score !== undefined)
                  metadataQueue.current.score = data.score;
                if (data.camera) metadataQueue.current.camera = data.camera;
                if (data.attributes)
                  metadataQueue.current.attributes = data.attributes;

                if (data.type === 'progress' && data.progress !== undefined) {
                  // Mettre à jour la progression
                  setProgress(data.progress);
                  metadataQueue.current.progress = data.progress;

                  // Mise à jour de la progression par source
                  if (data.guid) {
                    setSourceProgress((prev) =>
                      prev.map((source) =>
                        source.sourceId === data.guid
                          ? { ...source, progress: data.progress }
                          : source
                      )
                    );
                  }
                } else if (data.type === 'detection') {
                  // Vérification explicite que nous avons un frame_uuid
                  if (!data.frame_uuid) {
                    console.warn('⚠️ Detection reçue sans frame_uuid', data);
                    return;
                  }

                  console.log('🔍 Detection reçue:', data);

                  // Créer l'URL pour récupérer l'image via API
                  const imageUrl = `${process.env.MAIN_API_URL}/forensics/${id}/frames/${data.frame_uuid}`;

                  // Créer un nouveau résultat avec toutes les métadonnées
                  const newResult: ForensicResult = {
                    id: data.frame_uuid,
                    imageData: imageUrl,
                    timestamp: data.timestamp
                      ? new Date(data.timestamp).toISOString()
                      : new Date().toISOString(),
                    score: data.score ?? 0,
                    progress: data.progress ?? metadataQueue.current.progress,
                    attributes: data.attributes ?? {},
                    cameraId: data.camera ?? 'unknown',
                    type:
                      latestType.current === 'person' ? 'person' : 'vehicle',
                  };

                  console.log('📊 Ajout du résultat:', newResult);

                  // Assurer que nous sommes sur la première page pour l'affichage
                  if (currentPageRef.current === 1) {
                    // Forcer l'ajout au heap et la mise à jour de l'affichage
                    forensicResultsHeap.addResult(newResult);

                    // Récupérer les meilleurs résultats selon les critères de tri
                    const topResults = forensicResultsHeap.getPageResults(
                      1,
                      paginationInfo.pageSize
                    );

                    // Mettre à jour les deux états pour assurer l'affichage
                    setDisplayResults([...topResults]);
                    setResults([...topResults]);

                    console.log('🖼️ Résultats mis à jour:', topResults.length);
                  } else {
                    // Ajouter au heap sans mettre à jour l'affichage
                    forensicResultsHeap.addResult(newResult);
                  }
                } else if (data.error) {
                  console.error('⚠️ WebSocket error:', data.error);
                  setIsSearching(false);
                }
              } catch (error) {
                console.error('❌ WebSocket data parsing error:', error);
              }
            }
          };

          ws.onerror = (event) => {
            console.error('❌ Erreur sur le WebSocket', event);
          };

          ws.onclose = (event) => {
            console.log(
              `🔴 WebSocket fermé – Code: ${event.code}, Raison: ${event.reason || 'Non spécifiée'}`
            );

            // force reconnexion
            if (
              event.code === 1006 &&
              !isForensicTaskCompleted(ForensicTaskStatus.PENDING)
            ) {
              setTimeout(() => initWebSocket(id), 1000);
            }

            // On reconnecte le WS seulement en cas de fermeture anormale
            if (
              latestJobId.current === id &&
              !latestIsCancelling.current &&
              latestIsSearching.current &&
              event.code !== 1000 &&
              event.code !== 1001
            ) {
              setTimeout(() => initWebSocket(id), 1000);
            } else {
              setIsSearching(false);
            }
          };
        } catch (error) {
          console.error('❌ Erreur lors de la création du WebSocket:', error);
          setIsSearching(false);
        }
      });
    },
    [
      latestIsCancelling,
      latestIsSearching,
      latestJobId,
      latestType,
      isCancelling,
      currentPageTracked,
    ]
  );

  // Clean up WebSocket et AbortController on unmount
  useEffect(
    () => () => {
      cleanupResources();
    },
    [cleanupResources]
  );

  const cleanupWebSocket = useCallback(() => {
    // Fermer WebSocket s'il existe
    if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
      console.log(
        '🔒 Fermeture de la connexion WebSocket sans annuler la recherche'
      );
      wsRef.current.close(1000, "Changement d'onglet");
      wsRef.current = null;
    }
  }, []);

  // Dans use-search.tsx, ajoutez une fonction pour réinitialiser la pagination
  const resetPagination = useCallback(() => {
    setPaginationInfo({
      currentPage: 1,
      pageSize: FORENSIC_PAGINATION_ITEMS,
      totalPages: 1,
      total: 0,
    });
  }, []);

  // Modifiez la fonction resetSearch pour inclure la réinitialisation de la pagination
  const resetSearch = useCallback(() => {
    setSourceProgress([]);
    setProgress(null);
    setIsSearching(false);
    setJobId(null);
    setResults([]);
    setDisplayResults([]);
    resetPagination();
  }, [resetPagination]);

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

  const startSearch = useCallback(
    async (formData: CustomFormData) => {
      try {
        // Reset states
        setResults([]);
        setDisplayResults([]);
        setIsSearching(true);
        setIsCancelling(false);
        setType(formData.subjectType);
        forensicResultsHeap.clear();

        resetSearch();

        // Attendre un court délai pour s'assurer que les ressources sont bien libérées
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Créer un nouvel AbortController pour cette requête
        abortControllerRef.current = new AbortController();

        // Format query and make API call
        const queryData = formatQuery(formData);
        const response = await fetch(`${process.env.MAIN_API_URL}/forensics`, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `X-Session-Id ${sessionId}`,
          },
          body: JSON.stringify(queryData),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`API returned status ${response.status}`);
        }

        const data = await response.json();
        const { guid } = data;

        if (!guid) {
          throw new Error('No job ID returned from API');
        }

        // Initialize source progress with selected sources
        const selectedSources = formData.cameras || [];
        initializeSourceProgress(selectedSources);

        setJobId(guid);

        // Initialiser automatiquement le WebSocket après avoir obtenu le guid
        initWebSocket(guid);
        return guid;
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('❌ Erreur lors du démarrage de la recherche:', error);
        }
        setIsSearching(false);
        throw error;
      }
    },
    [sessionId, cleanupWebSocket, initializeSourceProgress, initWebSocket]
  );
  const stopSearch = async (jobId: string) => {
    try {
      setIsSearching(false);

      if (!jobId) {
        console.error(
          "❌ Impossible d'annuler la recherche: aucun jobId fourni"
        );
        return;
      }

      const response = await fetch(
        `${process.env.MAIN_API_URL}/forensics/${jobId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error(`Échec de l'annulation: ${response.statusText}`);
      }
    } catch (error) {
      console.error("❌ Erreur lors de l'annulation de la recherche:", error);
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

  return {
    startSearch,
    stopSearch,
    cleanupResources,
    progress,
    results,
    isSearching,
    jobId,
    sourceProgress,
    displayResults,
    // resumeJob,
    setDisplayResults,
    setResults,
    resetSearch,
    testResumeJob,
    paginationInfo,
    updateFirstPageWithRelevantResults,
    handlePageChange,
    currentPageTracked,
    setPaginationInfo,
  };
}
