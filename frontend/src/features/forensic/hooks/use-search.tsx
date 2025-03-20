/* eslint-disable no-console */
import { useCallback, useEffect, useRef, useState } from 'react';

import useLatest from '@/hooks/use-latest';

import { FormData as CustomFormData, formatQuery } from '../lib/format-query';
import { ForensicResult, SourceProgress } from '../lib/types';
import forensicResultsHeap from '@/features/forensic/lib/data-structure/heap.tsx';

export default function useSearch(sessionId: string) {
  const [progress, setProgress] = useState<number | null>(null);
  const [results, setResults] = useState<ForensicResult[]>([]);
  const [sourceProgress, setSourceProgress] = useState<SourceProgress[]>([]);

  const [isInitializing, setIsInitializing] = useState(false);

  const [jobId, setJobId] = useState<string | null>(null);
  const latestJobId = useLatest(jobId);

  const [isSearching, setIsSearching] = useState(false);
  const latestIsSearching = useLatest(isSearching);

  const [isCancelling, setIsCancelling] = useState(false);
  const latestIsCancelling = useLatest(isCancelling);

  // Références pour WebSocket et AbortController
  const wsRef = useRef<WebSocket | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

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
      }))
    );
  }, []);

  // Fonction pour nettoyer toutes les ressources
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

  // Clean up WebSocket et AbortController on unmount
  useEffect(
    () => () => {
      cleanupResources();
    },
    [cleanupResources]
  );

  const startSearch = useCallback(
    async (formData: CustomFormData, duration: number) => {
      try {
        // S'assurer que toutes les ressources précédentes sont bien fermées
        cleanupResources();

        // Reset states
        setResults([]);
        setIsSearching(true);
        setIsCancelling(false);
        setIsInitializing(true);

        forensicResultsHeap.clear();

        // Créer un nouvel AbortController pour cette requête
        abortControllerRef.current = new AbortController();

        // Format query and make API call
        const queryData = formatQuery(formData);
        console.log('queryData', queryData);

        const response = await fetch(
          `${process.env.MAIN_API_URL}/forensics?duration=${duration}`,
          {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
              Authorization: `X-Session-Id ${sessionId}`,
            },
            body: JSON.stringify(queryData),
            signal: abortControllerRef.current.signal,
          }
        );

        if (!response.ok) {
          throw new Error(`API returned status ${response.status}`);
        }

        const data = await response.json();
        const { guid } = data;

        if (!guid) {
          throw new Error('No job ID returned from API');
        }

        setJobId(guid);
        // ajouter un délai de 2 sec pour stopper spam
        setTimeout(() => {
          setIsInitializing(false);
        }, 2000);
        return guid;
      } catch (error) {
        // Ne pas logger d'erreur si c'est une annulation intentionnelle
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('❌ Erreur lors du démarrage de la recherche:', error);
        }
        setIsSearching(false);
        setIsInitializing(false);
        throw error;
      }
    },
    [sessionId, cleanupResources]
  );

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

      // Si une connexion existe déjà, on la ferme proprement avant d’en créer une nouvelle.
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
                        // Store timestamp from the WebSocket message
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
                          // Include timestamp from the WebSocket message
                          timestamp: data.timestamp,
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

                // Check if search is complete
                if (data.progress === 100) {
                  console.log('🏁 Search completed (100%)');
                  setIsSearching(false);

                  setTimeout(() => {
                    if (
                      wsRef.current &&
                      wsRef.current.readyState === WebSocket.OPEN
                    ) {
                      wsRef.current.close(1000, 'Recherche terminée');
                    }
                  }, 500);
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

  const closeWebSocket = useCallback(() => {
    // Vérifier si une annulation est déjà en cours
    if (isCancelling || isInitializing) {
      console.log('🔄 Une annulation est déjà en cours, ignoré');
      return Promise.resolve();
    }

    // Marquer comme en cours d'annulation pour éviter les doubles appels
    setIsCancelling(true);

    console.log("🔒 Démarrage de la procédure d'annulation de recherche");

    // Créer un nouvel AbortController pour la requête d'annulation
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Si la recherche n'est pas active ou qu'il n'y a pas de WebSocket, juste réinitialiser
    if (!isSearching || !jobId) {
      console.log('⚠️ Pas de recherche active à annuler');
      setIsSearching(false);
      setProgress(null);
      setJobId(null);
      setIsCancelling(false);
      return Promise.resolve();
    }

    // D'abord fermer le WebSocket s'il existe - FORCE CODE 1000
    if (wsRef.current) {
      if (
        wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING
      ) {
        console.log('🔒 Fermeture de la connexion WebSocket avec code 1000...');
        // Force close avec code 1000 (fermeture normale)
        wsRef.current.close(1000, 'Client cancelled search');
      }
      wsRef.current = null;
    }

    // Réinitialiser les états du UI immédiatement
    setIsSearching(false);
    setProgress(null);

    // Timeout pour la requête DELETE
    const timeoutId = setTimeout(() => {
      if (controller && !controller.signal.aborted) {
        controller.abort('Timeout');
      }
    }, 5000);

    // Puis annuler la recherche via l'API
    return fetch(`${process.env.MAIN_API_URL}/forensics?duration=5`, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `X-Session-Id ${sessionId}`,
      },
      signal: controller.signal,
    })
      .then((response) => {
        clearTimeout(timeoutId);
        if (response.ok) {
          console.log("✅ Recherche annulée avec succès via l'API");
        } else {
          console.error(`❌ Échec de l'annulation: ${response.status}`);
        }
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          console.warn(
            "⚠️ La requête d'annulation a expiré, mais l'UI a été réinitialisé"
          );
        } else {
          console.error("❌ Erreur lors de l'annulation:", error);
        }
      })
      .finally(() => {
        // Reset job ID et état d'annulation
        setJobId(null);
        setIsCancelling(false);
        // S'assurer que isSearching est bien à false
        setIsSearching(false);
      });
  }, [sessionId, isSearching, jobId, isCancelling, isInitializing]);

  return {
    startSearch,
    initWebSocket,
    closeWebSocket,
    progress,
    results,
    isSearching,
    jobId,
    isInitializing,
    sourceProgress,
    initializeSourceProgress,
  };
}
