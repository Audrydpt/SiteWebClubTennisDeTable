/* eslint-disable no-console,@typescript-eslint/no-explicit-any,@typescript-eslint/no-shadow,consistent-return,no-promise-executor-return,@typescript-eslint/no-unused-vars,react-hooks/exhaustive-deps,@typescript-eslint/naming-convention */
import { useCallback, useEffect, useRef, useState } from 'react';

import useLatest from '@/hooks/use-latest';
import { useAuth } from '@/providers/auth-context';

import forensicResultsHeap from '../lib/data-structure/heap.tsx';
import { FormData as CustomFormData, formatQuery } from '../lib/format-query';
import { ForensicResult, SourceProgress } from '../lib/types';
import { isForensicTaskCompleted } from './use-jobs.tsx';

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

  const updateFirstPageWithRelevantResults = (newResult: ForensicResult) => {
    // Ajouter le résultat au heap quelle que soit la page
    forensicResultsHeap.addResult(newResult);
    console.log(`➕ Résultat ajouté au heap (score: ${newResult.score})`);

    // Mettre à jour les résultats affichés seulement si on est sur la page 1
    if (currentPageTracked === 1) {
      // Récupérer les meilleurs résultats pour la première page
      const topResults = forensicResultsHeap.getPageResults(
        1,
        paginationInfo.pageSize
      );

      console.log(
        `🔢 Résultats WS mis à jour: ${topResults.length}/${paginationInfo.pageSize} max`
      );

      // Mettre à jour les résultats affichés
      setDisplayResults([...topResults]);
      setResults(topResults);

      return true;
    }

    console.log(
      `⏭️ Page ${currentPageTracked} active - résultat ajouté au heap mais pas affiché`
    );
    return false;
  };

  const initWebSocket = useCallback(
    (id: string, page1 = false) => {
      const shouldInit = page1 || currentPageTracked === 1;

      console.log(
        `🔍 Tentative d'initialisation WebSocket pour job ${id}, page ${currentPageTracked}`
      );
      // Vérifier si nous sommes sur la page 1, sinon ne pas initialiser le WebSocket
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
      // On ne crée pas la connexion si une fermeture manuelle ou une annulation est en cours.
      if (latestIsCancelling.current) {
        console.log(
          '🚫 Initialisation du WebSocket ignorée – fermeture ou annulation en cours'
        );
        return;
      }

      // Si une connexion existe déjà, on la ferme proprement avant d'en créer une nouvelle.
      if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
        wsRef.current.close(1000, 'Nouvelle connexion demandée');
      }

      // Déterminer le hostname en privilégiant la variable d'environnement si possible
      let { hostname } = window.location;
      try {
        hostname = new URL(process.env.MAIN_API_URL || '').hostname || hostname;
      } catch {
        // En cas d'erreur, on garde le hostname par défaut
      }

      try {
        const ws = new WebSocket(`wss://${hostname}/front-api/forensics/${id}`);
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

              // Store metadata for next image
              if (data.timestamp)
                metadataQueue.current.timestamp = data.timestamp;
              if (data.score !== undefined)
                metadataQueue.current.score = data.score;
              if (data.camera) metadataQueue.current.camera = data.camera;
              if (data.attributes)
                metadataQueue.current.attributes = data.attributes;

              if (data.type === 'progress' && data.progress !== undefined) {
                // Handle source-specific progress by guid
                if (data.guid) {
                  setSourceProgress((prev) => {
                    // Find if we already have this source
                    const existingIndex = prev.findIndex(
                      (s) => s.sourceId === data.guid
                    );

                    let updated;
                    if (existingIndex >= 0) {
                      // Update existing source
                      updated = [...prev];
                      updated[existingIndex] = {
                        ...updated[existingIndex],
                        progress: data.progress,
                        sourceName:
                          data.sourceName || updated[existingIndex].sourceName,
                        timestamp:
                          data.timestamp || updated[existingIndex].timestamp,
                      };
                    } else {
                      // Add new source with guid as sourceId
                      updated = [
                        ...prev,
                        {
                          sourceId: data.guid,
                          sourceName:
                            data.sourceName || `Source ${prev.length + 1}`,
                          progress: data.progress,
                          timestamp: data.timestamp,
                          startTime: new Date().toISOString(),
                        },
                      ];
                    }

                    // Calculate average progress
                    const totalProgress = updated.reduce(
                      (sum, source) => sum + source.progress,
                      0
                    );
                    const averageProgress =
                      updated.length > 0 ? totalProgress / updated.length : 0;

                    // Update the general progress
                    setProgress(averageProgress);

                    return updated;
                  });
                } else {
                  // If no guid, still update the global progress (fallback)
                  setProgress(data.progress);
                }

                // Check if search is complete by checking if ALL sources are at 100%
                if (data.progress === 100) {
                  setSourceProgress((prevSources) => {
                    const updatedSources = [...prevSources];
                    const sourceIndex = updatedSources.findIndex(
                      (s) => s.sourceId === data.guid
                    );
                    if (sourceIndex >= 0) {
                      updatedSources[sourceIndex].progress = 100;
                    }

                    // Only consider search complete when ALL sources reach 100%
                    const allComplete = updatedSources.every(
                      (source) => source.progress === 100
                    );

                    if (allComplete) {
                      console.log('🏁 All searches completed (100%)');
                      setIsSearching(false);

                      setTimeout(() => {
                        if (
                          wsRef.current &&
                          wsRef.current.readyState === WebSocket.OPEN
                        ) {
                          wsRef.current.close(1000, 'All searches completed');
                        }
                      }, 500);
                    }

                    return updatedSources;
                  });
                }
              } else if (data.error) {
                console.error('⚠️ WebSocket error:', data.error);
                setIsSearching(false);
              }
            } catch (error) {
              console.error('❌ WebSocket data parsing error:', error);
            }
          } else if (event.data instanceof Blob) {
            const blob = event.data;
            const imageUrl = URL.createObjectURL(blob);

            // Use current metadata for this image
            const newResult: ForensicResult = {
              id: crypto.randomUUID(),
              imageData: imageUrl,
              timestamp: metadataQueue.current.timestamp
                ? new Date(metadataQueue.current.timestamp).toISOString()
                : new Date().toISOString(),
              score: metadataQueue.current.score ?? 0,
              progress: metadataQueue.current.progress,
              attributes: metadataQueue.current.attributes,
              cameraId: metadataQueue.current.camera ?? 'unknown',
              type: latestType.current === 'person' ? 'person' : 'vehicle',
            };

            const wasRelevantAndAdded =
              updateFirstPageWithRelevantResults(newResult);
            // Mettre à jour la liste complète des résultats uniquement si nécessaire
            if (wasRelevantAndAdded) {
              setResults(forensicResultsHeap.getBestResults());
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

          // On reconnexte le WS seulement en cas de fermeture anormale
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
    skipLoadingState: boolean = false
  ) => {
    try {
      console.log('📌 testResumeJob démarré avec params:', {
        jobId,
        page,
        skipHistory,
        skipLoadingState,
      });

      console.log(`🔄 Changement de page: ${currentPageTracked} -> ${page}`);
      setCurrentPageTracked(page);

      // Gestion du WebSocket selon la page
      if (page !== 1) {
        cleanupWebSocket();
      } else if (wsRef.current?.readyState === WebSocket.CLOSED && jobId) {
        initWebSocket(jobId, true);
      } else if (!wsRef.current && jobId) {
        initWebSocket(jobId, true);
      }

      setJobId(jobId);
      // Ne vidons le heap que lors d'une nouvelle recherche, pas lors des changements de page
      // Ne plus vider le heap ici

      if (!skipLoadingState) setIsSearching(true);

      // Infos globales sur la tâche
      const resultsResponse = await fetch(
        `${process.env.MAIN_API_URL}/forensics/${jobId}`
      );
      if (!resultsResponse.ok)
        throw new Error(`Erreur API: ${resultsResponse.status}`);

      const resultsData = await resultsResponse.json();
      console.log('📋 Données globales récupérées:', resultsData);

      if (!resultsData?.results) {
        console.log('⚠️ Aucun résultat trouvé dans resultsData');
        return {
          results: [],
          pagination: {
            currentPage: page,
            pageSize: 0,
            totalPages: 0,
            total: 0,
          },
        };
      }

      const taskStatus = resultsData.status || 'PENDING';
      const isCompleted = isForensicTaskCompleted(taskStatus);

      console.log(
        `🔍 État de la tâche ${jobId}: ${taskStatus}, isCompleted:`,
        isCompleted
      );

      // Traitement de la progression des sources
      const sourcesProgress = resultsData.results
        .filter((r: { type: string }) => r.type === 'progress')
        .reduce((acc: any, curr: any) => {
          if (!acc[curr.guid]) {
            acc[curr.guid] = {
              sourceId: curr.guid,
              sourceName:
                curr.source_name || `Source ${curr.guid.slice(0, 8)}...`,
              progress: curr.progress,
              timestamp: curr.timestamp || new Date().toISOString(),
              startTime: curr.start_time || new Date().toISOString(),
            };
          } else if (curr.progress > acc[curr.guid].progress) {
            acc[curr.guid].progress = curr.progress;
            acc[curr.guid].timestamp = curr.timestamp;
          }
          return acc;
        }, {});

      console.log('📊 Sources avec progression:', sourcesProgress);

      if (isCompleted) {
        Object.keys(sourcesProgress).forEach((key) => {
          sourcesProgress[key].progress = 100;
        });
        console.log('✅ Toutes les sources mises à 100% car tâche terminée');
      }

      setSourceProgress(Object.values(sourcesProgress));

      let validDetectionResults: ForensicResult[] = [];
      let paginationData = {
        currentPage: page,
        pageSize: FORENSIC_PAGINATION_ITEMS,
        totalPages: 0,
        total: 0,
      };

      console.log('🔍 Chargement des données paginées pour la page:', page);

      // Appel de l'API paginée
      const paginatedResponse = await fetch(
        `${process.env.MAIN_API_URL}/forensics/${jobId}/pages/${page}`
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
      } = pageData;

      console.log(
        `📊 Pagination: ${results.length} résultats sur ${total} total (page ${currentPage}/${total_pages})`
      );

      // Mise à jour des données de pagination
      paginationData = {
        currentPage,
        pageSize: page_size,
        totalPages: total_pages,
        total,
      };

      setPaginationInfo(paginationData);
      console.log('Pagination mise à jour:', paginationData);

      const detectionFiltered = results.filter(
        (r: any) => r.metadata?.type === 'detection'
      );
      console.log(
        `🔍 Filtrage: ${detectionFiltered.length} détections trouvées sur ${results.length} résultats`
      );

      const detectionResults = await Promise.all(
        detectionFiltered.map(async (result: any) => {
          const frameId = result.frame_uuid;
          if (!frameId) {
            console.log('⚠️ Detection sans frameId trouvée');
            return null;
          }

          const imageResponse = await fetch(
            `${process.env.MAIN_API_URL}/forensics/${jobId}/frames/${frameId}`
          );
          if (!imageResponse.ok) {
            console.log(
              `❌ Échec chargement image pour frame ${frameId}: ${imageResponse.status}`
            );
            return null;
          }

          const imageBlob = await imageResponse.blob();
          const imageUrl = URL.createObjectURL(imageBlob);

          return {
            id: frameId,
            imageData: imageUrl,
            timestamp: result.metadata?.timestamp || new Date().toISOString(),
            score: result.metadata?.score || 0,
            cameraId:
              result.metadata?.camera || result.metadata?.source || 'unknown',
            type: 'detection',
            attributes: result.metadata?.attributes || {},
            progress: result.metadata?.progress || 0,
          };
        })
      );

      validDetectionResults = detectionResults.filter(
        (r) => r !== null
      ) as ForensicResult[];

      // TOUJOURS ajouter les résultats au heap, quelle que soit la page
      validDetectionResults.forEach((res: ForensicResult) => {
        forensicResultsHeap.addResult(res);
        console.log(`➕ Résultat ajouté au heap: ${res.id}`);
      });

      // Récupérer les résultats du heap pour la page actuelle
      const pageResults = forensicResultsHeap.getPageResults(
        page,
        paginationData.pageSize
      );
      console.log(
        `📋 Affichage de ${pageResults.length}/${paginationData.pageSize} résultats pour page ${page}`
      );

      setResults(pageResults);
      setDisplayResults(pageResults);

      const returnObj = {
        results: validDetectionResults,
        pagination: paginationData,
      };

      console.log('🏁 Fin de testResumeJob - retourne:', {
        resultCount: returnObj.results.length,
        pagination: returnObj.pagination,
      });

      return returnObj;
    } catch (error) {
      console.error('❌ Erreur dans resumeJobWithPagination:', error);
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
      if (!skipLoadingState) setIsSearching(false);
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

        // C'est ici qu'on vide le heap, uniquement au début d'une nouvelle recherche
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
    [sessionId, resetSearch, initializeSourceProgress, initWebSocket]
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
      if (currentPageTracked === page) return; // Éviter le rechargement inutile

      const previousPage = currentPageTracked;
      setCurrentPageTracked(page);

      // Gérer le WebSocket selon la page
      if (
        page !== 1 &&
        wsRef.current &&
        wsRef.current.readyState === WebSocket.OPEN
      ) {
        wsRef.current.close(1000, 'Navigation vers une autre page');
        wsRef.current = null;
      } else if (page === 1 && previousPage !== 1 && isSearching && jobId) {
        // Réinitialiser le WebSocket uniquement si on revient à la page 1 et qu'une recherche est active
        setTimeout(() => {
          if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
            initWebSocket(jobId);
          }
        }, 50);
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
