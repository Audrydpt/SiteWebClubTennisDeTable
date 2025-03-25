/* eslint-disable no-console */
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

  const startSearch = useCallback(
    async (formData: CustomFormData) => {
      console.log('hi');
      try {
        // Reset states
        setResults([]);
        setIsSearching(true);
        setIsCancelling(false);
        forensicResultsHeap.clear();

        // S'assurer que toutes les ressources précédentes sont bien fermées
        cleanupResources();

        // Annuler toute recherche en cours via l'API:
        await fetch(`${process.env.MAIN_API_URL}/forensics`, {
          method: 'DELETE',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `X-Session-Id ${sessionId}`,
          },
        });

        // Créer un nouvel AbortController pour cette requête
        abortControllerRef.current = new AbortController();

        // Format query and make API call
        const queryData = formatQuery(formData);
        console.log('queryData', queryData);

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
        // Ne pas logger d'erreur si c'est une annulation intentionnelle
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('❌ Erreur lors du démarrage de la recherche:', error);
        }
        setIsSearching(false);
        throw error;
      }
    },
    [sessionId, cleanupResources, initializeSourceProgress, initWebSocket]
  );

  const stopSearch = useCallback(() => {
    // Vérifier si une annulation est déjà en cours
    if (isCancelling) {
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
    return fetch(`${process.env.MAIN_API_URL}/forensics`, {
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
  }, [sessionId, isSearching, jobId, isCancelling]);

  return {
    startSearch,
    stopSearch,
    progress,
    results,
    isSearching,
    jobId,
    sourceProgress,
  };
}
