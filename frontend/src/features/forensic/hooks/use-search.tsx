/* eslint-disable no-console,@typescript-eslint/no-explicit-any,@typescript-eslint/no-shadow,consistent-return,no-promise-executor-return,@typescript-eslint/no-unused-vars,react-hooks/exhaustive-deps,@typescript-eslint/naming-convention,@stylistic/indent,no-plusplus */
import { useCallback, useEffect, useRef, useState } from 'react';

import useLatest from '@/hooks/use-latest';
import { useAuth } from '@/providers/auth-context';

import { SortType } from '../components/ui/buttons.tsx';
import forensicResultsHeap from '../lib/data-structure/heap.tsx';
import { FormData as CustomFormData, formatQuery } from '../lib/format-query';
import { ForensicResult, SourceProgress } from '../lib/types';
import { isForensicTaskCompleted } from './use-jobs.tsx';

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

  const wsRef = useRef<WebSocket | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [displayResults, setDisplayResults] = useState<ForensicResult[]>([]);

  const currentPageRef = useRef<number>(1);
  const [wsState, setWsState] = useState<
    'closed' | 'connecting' | 'open' | 'closing'
  >('closed');
  const wsLockRef = useRef<boolean>(false);
  const wsOperationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptRef = useRef<number>(0);
  const MAX_RECONNECT_ATTEMPTS = 5;
  const WS_CONNECTION_COOLDOWN = 300; // ms entre fermeture et nouvelle connexion

  const [progressByJobId, setProgressByJobId] = useState<
    Record<string, number | null>
  >({});
  const [sourceProgressByJobId, setSourceProgressByJobId] = useState<
    Record<string, SourceProgress[]>
  >({});

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

      // Vérifications préalables
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

      // Système de verrouillage pour éviter les initialisations multiples
      if (wsLockRef.current) {
        console.log('🔒 Opération WebSocket déjà en cours, demande ignorée');
        return;
      }

      wsLockRef.current = true;

      // Fonction pour libérer le verrou après un délai
      const releaseLock = (delay = 500) => {
        if (wsOperationTimeoutRef.current) {
          clearTimeout(wsOperationTimeoutRef.current);
        }
        wsOperationTimeoutRef.current = setTimeout(() => {
          wsLockRef.current = false;
          wsOperationTimeoutRef.current = null;
        }, delay);
      };

      // Fermer proprement la connexion existante
      const closeExistingConnection = () =>
        new Promise<void>((resolve) => {
          if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
            console.log('🔄 Fermeture de la connexion WebSocket existante...');
            setWsState('closing');

            const onCloseHandler = () => {
              wsRef.current = null;
              setWsState('closed');
              resolve();
            };

            wsRef.current.addEventListener('close', onCloseHandler, {
              once: true,
            });
            wsRef.current.close(1000, 'Nouvelle connexion demandée');

            // Timeout de sécurité
            setTimeout(() => {
              if (wsRef.current) {
                console.log('⚠️ Timeout sur la fermeture WebSocket');
                wsRef.current = null;
                setWsState('closed');
                resolve();
              }
            }, 1000);
          } else {
            setWsState('closed');
            resolve();
          }
        });

      // Séquence de fermeture puis nouvelle connexion
      closeExistingConnection()
        .then(
          () =>
            // Délai entre fermeture et nouvelle connexion
            new Promise<void>((resolve) =>
              setTimeout(resolve, WS_CONNECTION_COOLDOWN)
            )
        )
        .then(() => {
          // Vérifier à nouveau les conditions après le délai
          if (latestIsCancelling.current || currentPageRef.current !== 1) {
            console.log(
              '🛑 Création de WebSocket annulée - conditions ont changé'
            );
            releaseLock();
            return;
          }

          let { hostname } = window.location;
          try {
            hostname =
              new URL(process.env.MAIN_API_URL || '').hostname || hostname;
          } catch {
            console.error('❌ Erreur lors de la récupération du hostname');
          }

          try {
            console.log(
              `🔌 Création d'une nouvelle connexion WebSocket pour ${id}...`
            );
            setWsState('connecting');

            const ws = new WebSocket(
              `wss://${hostname}/front-api/forensics/${id}`
            );
            wsRef.current = ws;

            ws.onopen = () => {
              console.log('✅ WebSocket connecté pour le job', id);
              setWsState('open');
              reconnectAttemptRef.current = 0;
              releaseLock();
            };

            ws.onmessage = (event) => {
              // Ignorer le traitement si annulation en cours
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
                    setProgress(data.progress);
                    metadataQueue.current.progress = data.progress;
                    if (jobId) {
                      setProgressByJobId((prev) => ({
                        ...prev,
                        [jobId]: data.progress,
                      }));
                    }

                    // Mise à jour de la progression par source
                    if (data.guid) {
                      setSourceProgress((prev) => {
                        const updated = prev.map((source) =>
                          source.sourceId === data.guid
                            ? { ...source, progress: data.progress }
                            : source
                        );

                        // Enregistrer aussi la progression par source pour ce jobId spécifique
                        if (jobId) {
                          setSourceProgressByJobId((prev) => ({
                            ...prev,
                            [jobId]: updated,
                          }));
                        }

                        return updated;
                      });
                    }
                  } else if (data.type === 'detection') {
                    // Vérification explicite que nous avons un frame_uuid
                    if (!data.frame_uuid) {
                      console.warn('⚠️ Detection reçue sans frame_uuid', data);
                      return;
                    }

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
              setWsState('closed');

              if (
                event.code === 1006 &&
                !latestIsCancelling.current &&
                latestIsSearching.current &&
                reconnectAttemptRef.current < MAX_RECONNECT_ATTEMPTS
              ) {
                const delay = Math.min(
                  1000 * 2 ** reconnectAttemptRef.current,
                  10000
                );
                reconnectAttemptRef.current++;

                console.log(
                  `🔄 Tentative de reconnexion ${reconnectAttemptRef.current}/${MAX_RECONNECT_ATTEMPTS} dans ${delay}ms`
                );
                setTimeout(() => initWebSocket(id), delay);
              } else if (event.code !== 1000 && event.code !== 1001) {
                setIsSearching(false);
              }

              releaseLock(1000);
            };
          } catch (error) {
            console.error('❌ Erreur lors de la création du WebSocket:', error);
            setWsState('closed');
            setIsSearching(false);
            releaseLock();
          }
        })
        .catch((err) => {
          console.error(
            '❌ Erreur dans la séquence de connexion WebSocket:',
            err
          );
          setWsState('closed');
          releaseLock();
        });
    },
    [latestIsCancelling, latestIsSearching, latestType, isCancelling]
  );

  // Clean up WebSocket et AbortController
  useEffect(
    () => () => {
      cleanupResources();
    },
    [cleanupResources]
  );

  /* const getProgressForJob = useCallback(
    (jobId: string | null) => {
      if (!jobId) return null;
      return progressByJobId[jobId] ?? null;
    },
    [progressByJobId]
  );

  const getSourceProgressForJob = useCallback(
    (jobId: string | null) => {
      if (!jobId) return [];
      return sourceProgressByJobId[jobId] ?? [];
    },
    [sourceProgressByJobId]
  ); */

  const cleanupWebSocket = useCallback(() => {
    console.log(
      '🔍 État du WebSocket avant fermeture:',
      wsRef.current
        ? ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'][wsRef.current.readyState]
        : 'Non initialisé'
    );

    // Ne rien faire si une opération est déjà en cours
    if (wsLockRef.current) {
      console.log('⚠️ Fermeture ignorée - opération WebSocket déjà en cours');
      return;
    }

    wsLockRef.current = true;

    // Fermer WebSocket s'il existe
    if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
      console.log('🔒 Fermeture de la connexion WebSocket...');
      setWsState('closing');

      const onCloseHandler = () => {
        console.log('✅ WebSocket correctement fermé');
        wsRef.current = null;
        setWsState('closed');
        wsLockRef.current = false;
      };

      wsRef.current.addEventListener('close', onCloseHandler, { once: true });
      wsRef.current.close(1000, 'Fermeture manuelle');

      // Timeout de sécurité
      setTimeout(() => {
        if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
          console.log('⚠️ Fermeture forcée du WebSocket');
          wsRef.current = null;
          setWsState('closed');
          wsLockRef.current = false;
        }
      }, 1000);
    } else {
      wsLockRef.current = false;
    }
  }, []);

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
    setIsSearching(false);
    setJobId(null);
    setResults([]);
    setDisplayResults([]);
    setProgress(null);
    setSourceProgress([]);
    setType(null);
    setIsCancelling(false);
    setProgressByJobId({});
    setSourceProgressByJobId({});
    setWsState('closed');
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
      currentPageRef.current = page;

      console.log(`🔄 Changement de page: ${currentPageTracked} -> ${page}`);
      setCurrentPageTracked(page);

      // Récupérer le statut actuel de la tâche
      const jobStatus = await getJobStatus(jobId);
      console.log(`📊 Statut actuel du job ${jobId}: ${jobStatus}`);

      const taskIsStillRunning = jobStatus === 'STARTED';

      /*
      console.log(`🔎 DEBUG: État avant restauration pour job ${jobId}:`);
      console.log('🔎 progressByJobId:', progressByJobId);
      console.log('🔎 sourceProgressByJobId:', sourceProgressByJobId);

       */

      const existingProgress = progressByJobId[jobId];
      if (existingProgress !== undefined) {
        console.log(
          `✅ Restauration progress pour job ${jobId}: ${existingProgress}`
        );
        setProgress(existingProgress);
      } else {
        console.log(`⚠️ Aucune progression sauvegardée pour job ${jobId}`);
      }

      const existingSourceProgress = sourceProgressByJobId[jobId];
      if (existingSourceProgress && existingSourceProgress.length > 0) {
        console.log(
          `✅ Restauration sourceProgress pour job ${jobId}: ${existingSourceProgress.length} sources`
        );
        setSourceProgress(existingSourceProgress);
      } else {
        console.log(
          `⚠️ Aucune progression des sources sauvegardée pour job ${jobId}`
        );
      }

      // Gestion du WebSocket - uniquement pour page 1 et tâche en cours
      if (page !== 1) {
        // Pour les autres pages, on ferme simplement le WebSocket
        console.log('📴 Page différente de 1, fermeture du WebSocket');
        cleanupWebSocket();
      } else if (taskIsStillRunning) {
        // Vérifier si on a déjà un WebSocket actif pour ce jobId
        const hasActiveConnection =
          wsRef.current &&
          wsRef.current.readyState === WebSocket.OPEN &&
          latestJobId.current === jobId;

        if (hasActiveConnection) {
          console.log(
            `✅ WebSocket déjà connecté pour le job ${jobId}, pas de réinitialisation nécessaire`
          );
        } else {
          console.log(
            `🔄 Initialisation WebSocket pour job ${jobId} en cours...`
          );

          // Si une opération WebSocket est déjà en cours, attendre qu'elle se termine
          if (wsLockRef.current) {
            console.log(
              '⏳ Attente de la fin de lopération WebSocket en cours...'
            );
            await new Promise((resolve) => setTimeout(resolve, 500));
          }

          // Fermer d'abord toute connexion existante
          await new Promise<void>((resolve) => {
            if (
              wsRef.current &&
              wsRef.current.readyState !== WebSocket.CLOSED
            ) {
              console.log(
                '🔄 Fermeture de la connexion WebSocket existante...'
              );
              const onCloseHandler = () => {
                console.log('✅ WebSocket fermé avec succès');
                resolve();
              };
              wsRef.current.addEventListener('close', onCloseHandler, {
                once: true,
              });
              wsRef.current.close(1000, 'Nouvelle connexion demandée');
              // Timeout de sécurité
              setTimeout(() => {
                console.log(
                  "⚠️ Délai d'attente dépassé pour la fermeture du WebSocket"
                );
                resolve();
              }, 1000);
            } else {
              console.log('✅ Aucun WebSocket actif à fermer');
              resolve();
            }
          });

          // Attendre un court délai avant d'initialiser une nouvelle connexion
          await new Promise((resolve) => setTimeout(resolve, 300));

          // Vérifier à nouveau que les conditions sont toujours valides
          if (currentPageRef.current === 1 && !latestIsCancelling.current) {
            console.log("🔌 Initialisation d'une nouvelle connexion WebSocket");
            setTimeout(() => {
              initWebSocket(jobId, true);
            }, 100);
          }
        }
      }

      setJobId(jobId);
      if (!skipHistory && page === 1) {
        forensicResultsHeap.clear();
      }
      if (!skipLoadingState) setIsSearching(taskIsStillRunning);

      // Utilisation des nouveaux endpoints avec paramètres de tri
      const endpoint = sortType === 'date' ? 'by-date' : 'by-score';
      console.log(`🌐 Requête API pour ${jobId}/${endpoint} page ${page}`);
      const paginatedResponse = await fetch(
        `${process.env.MAIN_API_URL}/forensics/${jobId}/${endpoint}?page=${page}&desc=${sortOrder === 'desc'}`
      );

      if (!paginatedResponse.ok)
        throw new Error(`Erreur API pagination: ${paginatedResponse.status}`);

      const pageData = await paginatedResponse.json();
      console.log(`📦 Données reçues pour job ${jobId}:`, {
        resultsCount: pageData.results?.length || 0,
        total: pageData.total,
        status: pageData.status,
      });

      const {
        results = [],
        total = 0,
        total_pages = 0,
        page: currentPage = page,
        page_size = FORENSIC_PAGINATION_ITEMS,
        status = jobStatus,
        sources_progress = [],
      } = pageData;

      // Traitement des informations de progression
      const sourcesProgressData =
        sources_progress && sources_progress.length > 0
          ? sources_progress.map((source: any) => ({
              sourceId: source.guid,
              sourceName:
                source.source_name || `Source ${source.guid.slice(0, 8)}...`,
              progress: isForensicTaskCompleted(status) ? 100 : source.progress,
              timestamp: source.timestamp || new Date().toISOString(),
              startTime: source.start_time || new Date().toISOString(),
            }))
          : sourceProgressByJobId[jobId] || [];

      // Ne mettre à jour les données de progression que si on a réellement de nouvelles données
      if (sourcesProgressData.length > 0) {
        setSourceProgressByJobId((prev) => {
          console.log(
            `📊 Mise à jour sourceProgressByJobId pour ${jobId}:`,
            sourcesProgressData.length,
            'sources'
          );
          return {
            ...prev,
            [jobId]: sourcesProgressData,
          };
        });

        // Calculer la progression uniquement si on a de nouvelles données
        const currentProgress =
          isForensicTaskCompleted(status) && !isSearching
            ? 100
            : Math.max(
                ...sourcesProgressData.map(
                  (s: { progress: any }) => s.progress || 0
                ),
                0
              );
        // Ne mettre à jour la progression que si elle a changé ou s'il n'y en a pas d'existante
        if (currentProgress > 0 || progressByJobId[jobId] === undefined) {
          setProgress(currentProgress);
          setProgressByJobId((prev) => ({
            ...prev,
            [jobId]: currentProgress,
          }));
        }
      }
      const paginationData = {
        currentPage,
        pageSize: page_size,
        totalPages: total_pages,
        total,
      };

      setPaginationInfo(paginationData);
      // Traitement des résultats de détection - ajustement pour correspondre à la structure API
      const detectionFiltered = results.filter(
        (r: any) => r.type === 'detection'
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
    displayResults,
    setDisplayResults,
    setResults,
    resetSearch,
    testResumeJob,
    paginationInfo,
    updateFirstPageWithRelevantResults,
    handlePageChange,
    currentPageTracked,
    setPaginationInfo,
    sourceProgress,
    sourceProgressByJobId,
    progressByJobId,
    cleanupWebSocket,
  };
}
