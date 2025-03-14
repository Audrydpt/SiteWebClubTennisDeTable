import { useCallback, useEffect, useRef, useState } from 'react';
import { FormData as CustomFormData, formatQuery } from '../lib/format-query';

export interface ForensicResult {
  id: string;
  imageData: string;
  timestamp: string;
  score: number;
  cameraId: string;
}

// New interface for forensic task
interface ForensicTask {
  guid: string;
  status: string;
}

export default function useSearch(sessionId: string) {
  const [progress, setProgress] = useState<number | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [results, setResults] = useState<ForensicResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [manualClose, setManualClose] = useState(false);

  // Ajout d'un état pour suivre les requêtes d'annulation en cours
  const [isCancelling, setIsCancelling] = useState(false);

  // Références pour WebSocket et AbortController
  const wsRef = useRef<WebSocket | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const metadataQueue = useRef<{
    timestamp?: string;
    score?: number;
    camera?: string;
  }>({});

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
        setManualClose(false);
        setIsCancelling(false);

        // Créer un nouvel AbortController pour cette requête
        abortControllerRef.current = new AbortController();

        // Format query and make API call
        const queryData = formatQuery(formData);

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
    [sessionId, cleanupResources]
  );

  // Add this function inside the useSearch hook
  const checkTaskStatus = useCallback(
    async (taskJobId: string): Promise<boolean> => {
      try {
        console.log('🔍 Vérification du statut de la tâche:', taskJobId);

        const response = await fetch(`${process.env.MAIN_API_URL}/forensics`, {
          headers: {
            Authorization: `X-Session-Id ${sessionId}`,
          },
        });

        if (!response.ok) {
          console.error(
            `❌ Erreur lors de la vérification: ${response.status}`
          );
          return false;
        }

        const tasks = await response.json();
        const task = tasks.find((t: ForensicTask) => t.guid === taskJobId);

        if (!task) {
          console.log('⚠️ Tâche non trouvée dans la liste');
          return false;
        }

        const status = task.status?.toLowerCase();
        console.log(`📊 Statut de la tâche ${taskJobId}: ${status}`);

        // Only return true if the task is pending or running
        return status === 'pending' || status === 'running';
      } catch (error) {
        console.error('❌ Erreur lors de la vérification du statut:', error);
        return false;
      }
    },
    [sessionId]
  );

  const initWebSocket = useCallback(
    (jobIdParam?: string) => {
      const wsJobId = jobIdParam || jobId;
      if (!wsJobId) {
        console.error(
          '⚠️ Pas de jobId disponible pour initialiser le WebSocket'
        );
        return;
      }

      // Don't initialize if manual close was requested or if cancellation is in progress
      if (manualClose || isCancelling) {
        console.log(
          '🚫 WebSocket initialization skipped - closing or cancelling'
        );
        return;
      }

      // Fermer la connexion existante si présente
      if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
        wsRef.current.close(1000, 'New connection requested');
      }

      // Déterminer le hostname
      let { hostname } = window.location;
      try {
        hostname = new URL(process.env.MAIN_API_URL!).hostname;
      } catch {
        // Ignorer l'erreur
      }

      // Créer une nouvelle connexion WebSocket
      try {
        const ws = new WebSocket(
          `wss://${hostname}/front-api/forensics/${wsJobId}`
        );
        wsRef.current = ws;

        // Gestionnaires d'événements WebSocket
        ws.onopen = () => {
          console.log('✅ WebSocket connecté pour job', wsJobId);
        };

        ws.onmessage = (event) => {
          // Skip processing if manual close was requested
          if (manualClose || isCancelling) {
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

              if (data.progress !== undefined) {
                setProgress(data.progress);

                if (data.progress === 100) {
                  setIsSearching(false);
                  setTimeout(() => {
                    if (
                      wsRef.current &&
                      wsRef.current.readyState === WebSocket.OPEN
                    ) {
                      wsRef.current.close(1000, 'Search completed');
                    }
                  }, 500);
                }
              }

              if (data.error) {
                console.error('⚠️ WebSocket erreur:', data.error);
                setIsSearching(false);
              }
            } catch (error) {
              console.error(
                '❌ Erreur de parsing des données WebSocket:',
                error
              );
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
              cameraId: metadataQueue.current.camera ?? 'unknown',
            };

            setResults((prev) => [...prev, newResult]);
          }
        };

        ws.onerror = (event) => {
          console.error('❌ Erreur WebSocket', event);
        };

        ws.onclose = async (event) => {
          console.log(
            `🔴 WebSocket fermé, code: ${event.code}, raison: ${event.reason || 'Non spécifiée'}`
          );

          // Only attempt reconnection if it wasn't a normal closure or manual action
          if (
            wsJobId &&
            !manualClose &&
            !isCancelling &&
            event.code !== 1000 &&
            event.code !== 1001 &&
            isSearching
          ) {
            try {
              // Check if task is still active before reconnecting
              const isTaskActive = await checkTaskStatus(wsJobId);

              if (isTaskActive) {
                console.log('🔄 Reconnexion - tâche toujours active');
                // Delay to avoid immediate reconnection attempts
                setTimeout(() => initWebSocket(wsJobId), 2000);
              } else {
                console.log(
                  '🛑 Pas de reconnexion - tâche inactive ou terminée'
                );
                setIsSearching(false);
              }
            } catch (error) {
              console.error(
                '❌ Erreur lors de la vérification pour reconnexion:',
                error
              );
              setIsSearching(false);
            }
          } else {
            // Normal closure or manual action, stop searching
            setIsSearching(false);
          }
        };
      } catch (error) {
        console.error('❌ Erreur lors de la création du WebSocket:', error);
        setIsSearching(false);
      }
    },
    [jobId, manualClose, isCancelling, isSearching, checkTaskStatus]
  );

  const closeWebSocket = useCallback(() => {
    // Vérifier si une annulation est déjà en cours
    if (isCancelling) {
      console.log('🔄 Une annulation est déjà en cours, ignoré');
      return Promise.resolve();
    }

    // Marquer comme en cours d'annulation pour éviter les doubles appels
    setIsCancelling(true);
    setManualClose(true);

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
  }, [sessionId, isSearching, jobId, isCancelling]);

  return {
    startSearch,
    initWebSocket,
    closeWebSocket,
    progress,
    results,
    isSearching,
    jobId,
  };
}
