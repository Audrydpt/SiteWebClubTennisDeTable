/* eslint-disable no-console,@typescript-eslint/no-explicit-any,@typescript-eslint/no-shadow,consistent-return,no-promise-executor-return,@typescript-eslint/no-unused-vars */
import { useCallback, useEffect, useRef, useState } from 'react';

import useLatest from '@/hooks/use-latest';
import { useAuth } from '@/providers/auth-context';

import forensicResultsHeap from '../lib/data-structure/heap.tsx';
import { FormData as CustomFormData, formatQuery } from '../lib/format-query';
import { ForensicResult, SourceProgress } from '../lib/types';

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

  // Références pour WebSocket et AbortController
  const wsRef = useRef<WebSocket | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [displayResults, setDisplayResults] = useState<ForensicResult[]>([]);

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

  const initWebSocket = useCallback(
    (id: string) => {
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
            };

            // Add to heap and get sorted results
            forensicResultsHeap.addResult(newResult);
            setResults(forensicResultsHeap.getBestResults());
            setDisplayResults(forensicResultsHeap.getBestResults());
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
    [latestIsCancelling, latestIsSearching, latestJobId, isCancelling]
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

  const resumeJob = async (jobId: string, skipHistory: boolean = false) => {
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

  const startSearch = useCallback(
    async (formData: CustomFormData) => {
      try {
        // Reset states
        setResults([]);
        setDisplayResults([]);
        setIsSearching(true);
        setIsCancelling(false);
        forensicResultsHeap.clear();

        // Au lieu d'annuler la recherche précédente via DELETE,
        // simplement nettoyer le WebSocket
        cleanupWebSocket();

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

  return {
    startSearch,
    stopSearch,
    cleanupResources,
    cleanupWebSocket,
    progress,
    results,
    isSearching,
    jobId,
    sourceProgress,
    displayResults,
    resumeJob,
    setDisplayResults,
    setResults,
  };
}
