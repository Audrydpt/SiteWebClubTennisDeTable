import { useCallback, useEffect, useRef, useState } from 'react';
import { FormData as CustomFormData, formatQuery } from '../lib/format-query';

export interface ForensicResult {
  id: string;
  imageData: string;
  timestamp: string;
  confidence: number;
  cameraId: string;
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
    []
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

  const initWebSocket = useCallback(
    (jobIdParam?: string) => {
      const id = jobIdParam || jobId;
      if (!id) {
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
        const ws = new WebSocket(`wss://${hostname}/front-api/forensics/${id}`);
        wsRef.current = ws;
        const lastDate = new Date();
        let lastConfidence = 0;

        // Gestionnaires d'événements WebSocket
        ws.onopen = () => {
          console.log('✅ WebSocket connecté pour job', id);
        };

        ws.onmessage = (event) => {
          // Skip processing if manual close was requested
          if (manualClose || isCancelling) {
            return;
          }

          if (typeof event.data === 'string') {
            try {
              const data = JSON.parse(event.data);

              if (data.timestamp) {
                lastDate.setTime(Date.parse(data.timestamp));
              }
              if (data.score) {
                lastConfidence = data.score;
              }

              if (data.progress !== undefined) {
                setProgress(data.progress);

                if (data.progress === 100) {
                  setIsSearching(false);
                  // Fermeture propre après avoir atteint 100%
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

            const newResult: ForensicResult = {
              id: crypto.randomUUID(),
              imageData: imageUrl,
              timestamp: lastDate.toISOString(),
              confidence: lastConfidence,
              cameraId: 'unknown',
            };

            setResults((prev) => [...prev, newResult]);
          }
        };

        ws.onerror = (event) => {
          console.error('❌ Erreur WebSocket', event);
        };

        ws.onclose = (event) => {
          console.log(
            `🔴 WebSocket fermé, code: ${event.code}, raison: ${event.reason || 'Non spécifiée'}`
          );

          // Reconnecter seulement si ce n'était pas une fermeture manuelle ou une annulation
          if (
            id &&
            !manualClose &&
            !isCancelling &&
            event.code !== 1000 &&
            event.code !== 1001 &&
            isSearching
          ) {
            console.log('🔄 Reconnexion automatique après fermeture...');
            // Délai plus long pour éviter les reconnexions trop rapides
            setTimeout(() => initWebSocket(id), 2000);
          } else {
            // Si la fermeture était intentionnelle ou si le code est normal, on arrête la recherche
            setIsSearching(false);
          }
        };
      } catch (error) {
        console.error('❌ Erreur lors de la création du WebSocket:', error);
        setIsSearching(false);
      }
    },
    [jobId, manualClose, isCancelling, isSearching]
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
