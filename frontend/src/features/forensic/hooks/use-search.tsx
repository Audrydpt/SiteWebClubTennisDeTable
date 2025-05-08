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
    // Si nous ne sommes pas sur la page 1, ne pas mettre à jour l'affichage
    if (currentPageTracked !== 1) {
      // Ajouter quand même au heap pour futures références
      console.log("💾 Résultat ajouté au heap (page ≠ 1, pas d'affichage)");
      forensicResultsHeap.addResult(newResult);
      return false;
    }

    // Vérifier si le résultat est plus pertinent que le minimum de la première page
    const shouldAdd = forensicResultsHeap.shouldAddResult(
      newResult,
      1,
      paginationInfo.pageSize
    );

    if (shouldAdd) {
      // Ajouter le résultat au heap
      forensicResultsHeap.addResult(newResult);
      console.log(`➕ Résultat ajouté au heap (score: ${newResult.score})`);

      // Récupérer les meilleurs résultats pour la première page
      const topResults = forensicResultsHeap.getPageResults(
        1,
        paginationInfo.pageSize
      );

      // S'assurer qu'on ne dépasse jamais la taille de la page
      const limitedResults = topResults.slice(0, paginationInfo.pageSize);
      console.log(
        `🔢 Résultats WS: ${limitedResults.length}/${paginationInfo.pageSize} max`
      );

      // Mettre à jour les résultats affichés avec limitation stricte
      setDisplayResults([...limitedResults]);

      // Mettre à jour la liste complète des résultats uniquement si nécessaire
      if (limitedResults.length > 0) {
        // Ne pas mettre à jour results avec tous les résultats du heap
        // Utiliser seulement les résultats paginés
        setResults(limitedResults);
        console.log(
          `📊 Heap contient ${forensicResultsHeap.getCount()} résultats au total`
        );
      }

      return true;
    }

    console.log(
      `⏭️ Résultat ignoré (score: ${newResult.score}) - pas assez pertinent`
    );
    return false;
  };

  const initWebSocket = useCallback(
    (id: string) => {
      // Vérifier si nous sommes sur la page 1, sinon ne pas initialiser le WebSocket
      if (currentPageTracked !== 1) {
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

  /* const resumeJob = async (jobId: string, skipHistory: boolean = false) => {
    try {
      setJobId(jobId);

      // Ne pas effacer le heap si on veut simplement changer d'onglet
      if (!skipHistory) {
        forensicResultsHeap.clear();
      }

      // Récupérer les informations de la tâche
      const resultsResponse = await fetch(
        `${process.env.MAIN_API_URL}/forensics/${jobId}`
      );
      if (!resultsResponse.ok)
        throw new Error(`Erreur API: ${resultsResponse.status}`);

      const resultsData = await resultsResponse.json();

      if (resultsData?.results) {
        // Vérifier l'état de la tâche pour déterminer le comportement
        const taskStatus = resultsData.status || 'PENDING';
        const isCompleted = ['SUCCESS', 'FAILURE', 'REVOKED'].includes(
          taskStatus
        );

        console.log(`🔍 État de la tâche ${jobId}: ${taskStatus}`);

        // Traitement des données de progression des sources
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

        // Forcer la progression à 100% pour toutes les sources si la tâche est terminée
        if (isCompleted) {
          Object.keys(sourcesProgress).forEach((key) => {
            sourcesProgress[key].progress = 100;
          });
        }

        setSourceProgress(Object.values(sourcesProgress));

        let validDetectionResults: ForensicResult[] = [];

        // IMPORTANT: Pour les tâches terminées, toujours charger l'historique complet
        if (!skipHistory || isCompleted) {
          // Récupérer les résultats de détection avec leurs images
          const detectionResults = await Promise.all(
            resultsData.results
              .filter((r: any) => r.metadata?.type === 'detection')
              .map(async (result: any) => {
                const frameId = result.frame_uuid;
                const imageResponse = await fetch(
                  `${process.env.MAIN_API_URL}/forensics/${jobId}/frames/${frameId}`
                );

                if (!imageResponse.ok) {
                  console.error(
                    `Erreur lors du chargement de l'image pour ${frameId}`
                  );
                  return null;
                }

                const imageBlob = await imageResponse.blob();
                const imageUrl = URL.createObjectURL(imageBlob);

                return {
                  id: frameId,
                  imageData: imageUrl,
                  timestamp:
                    result.metadata?.timestamp || new Date().toISOString(),
                  score: result.metadata?.score || 0,
                  cameraId:
                    result.metadata?.camera ||
                    result.metadata?.source ||
                    'unknown',
                  type: 'detection',
                  attributes: result.metadata?.attributes || {},
                  progress: result.metadata?.progress || 0,
                };
              })
          );

          // Filtrer les nulls résultant de l'échec de chargement d'images
          validDetectionResults = detectionResults.filter(
            (result) => result !== null
          ) as ForensicResult[];

          validDetectionResults.forEach((res: ForensicResult) =>
            forensicResultsHeap.addResult(res)
          );

          console.log(
            '🧠 Détections valides récupérées:',
            validDetectionResults.length
          );
        } else {
          // En mode skipHistory pour tâches en cours uniquement, ne pas charger les images
          console.log(
            '⏭️ Chargement des résultats historiques ignoré (mode skipHistory, tâche en cours)'
          );
        }

        // Définir la progression à 100% si la tâche est terminée
        if (isCompleted) {
          setProgress(100);
        } else {
          const maxProgress = Math.max(
            ...Object.values(sourcesProgress).map((s: any) => s.progress || 0),
            0
          );
          setProgress(maxProgress);
        }

        // Si la tâche n'est pas terminée, relancer le WebSocket
        if (!isCompleted) {
          console.log('🔄 Tâche en cours, initialisation du WebSocket...');
          setIsSearching(true);
          initWebSocket(jobId);
        } else {
          console.log('✅ Tâche terminée, affichage des résultats uniquement');
          setIsSearching(false);
        }
        // Ne pas conditionner cette mise à jour par validDetectionResults.length > 0
        const bestResults = forensicResultsHeap.getBestResults();
        setResults(bestResults);
        setDisplayResults(bestResults);

        console.log('📊 Mise à jour des résultats:', bestResults.length);

        return skipHistory && !isCompleted ? [] : validDetectionResults;
      }

      return [];
    } catch (error) {
      console.error('Erreur lors de la reprise du job:', error);
      setResults([]);
      setDisplayResults([]);
      setProgress(null);
      setSourceProgress([]);
      setIsSearching(false);
      return [];
    }
  };
 */
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

      setCurrentPageTracked(page);

      if (page !== 1) {
        cleanupWebSocket();
      }

      setJobId(jobId);
      if (!skipHistory && page === 1) {
        forensicResultsHeap.clear();
      }
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

      // Vider le heap si on n'est pas sur la page 1
      if (page > 1) {
        forensicResultsHeap.clear();
      }

      // Appel de l'API paginée - CETTE PARTIE DOIT TOUJOURS S'EXÉCUTER
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

      // Gestion des résultats selon la page
      if (page === 1 && isSearching) {
        // Pour la page 1 en recherche active: ajouter au heap
        validDetectionResults.forEach((res: ForensicResult) => {
          forensicResultsHeap.addResult(res);
          console.log(`➕ Résultat ajouté au heap depuis resumeJob: ${res.id}`);
        });

        // Utiliser les meilleurs résultats du heap pour la page 1
        const bestResults = forensicResultsHeap.getPageResults(
          1,
          paginationData.pageSize
        );
        console.log(
          `📋 Résultats limités à ${bestResults.length}/${paginationData.pageSize} pour page 1`
        );

        setResults(bestResults);
        setDisplayResults(bestResults);
      } else {
        // Pour les autres pages: utiliser directement les résultats sans heap
        const limitedResults = validDetectionResults.slice(
          0,
          paginationData.pageSize
        );
        console.log(
          `📑 Page ${page}: ${limitedResults.length}/${paginationData.pageSize} résultats`
        );

        setResults(limitedResults);
        setDisplayResults(limitedResults);
      }
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
