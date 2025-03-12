import { useCallback, useEffect, useRef, useState } from 'react';
import { FormData as CustomFormData, formatQuery } from '../lib/format-query';

export interface ForensicResult {
  id: string;
  imageData: string; // URL or Base64 encoded image
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

  // WebSocket connection
  const wsRef = useRef<WebSocket | null>(null);

  // Clean up WebSocket on unmount
  useEffect(
    () => () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    },
    []
  );

  const startSearch = useCallback(
    async (formData: CustomFormData, duration: number) => {
      try {
        // Reset states
        setResults([]);
        setIsSearching(true);
        setManualClose(false);

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
          }
        );

        const data = await response.json();
        const { guid } = data;

        setJobId(guid);
        return guid;
      } catch (error) {
        console.error('❌ Erreur lors du démarrage de la recherche:', error);
        setIsSearching(false);
        throw error;
      }
    },
    [sessionId]
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

      // Don't initialize if manual close was requested
      if (manualClose) {
        console.log(
          '🚫 WebSocket initialization skipped - manual close active'
        );
        return;
      }

      // Fermer la connexion existante si présente
      if (wsRef.current) {
        wsRef.current.close();
      }

      // Déterminer le hostname
      let { hostname } = window.location;
      try {
        hostname = new URL(process.env.MAIN_API_URL!).hostname;
      } catch {
        // Ignorer l'erreur
      }

      // Créer une nouvelle connexion WebSocket
      const ws = new WebSocket(`wss://${hostname}/front-api/forensics/${id}`);
      wsRef.current = ws;
      const lastDate = new Date();
      let lastConfidence = 0;

      // Gestionnaires d'événements WebSocket
      ws.onopen = () => {
        console.log('✅ WebSocket connecté');
      };

      ws.onmessage = (event) => {
        // Skip processing if manual close was requested
        if (manualClose) {
          console.log('🚫 WebSocket message ignored - manual close active');
          return;
        }

        if (typeof event.data === 'string') {
          try {
            const data = JSON.parse(event.data);

            if (data.timestamp) {
              // Parse ISO8601 timestamp properly
              lastDate.setTime(Date.parse(data.timestamp));
              console.log('🕒 Timestamp parsed:', lastDate.toISOString());
            }
            if (data.score) {
              lastConfidence = data.score;
            }

            if (data.progress !== undefined) {
              setProgress(data.progress);

              if (data.progress === 100) {
                setIsSearching(false);
              }
            }

            if (data.error) {
              console.error('⚠️ WebSocket erreur:', data.error);
              setIsSearching(false);
            }
          } catch (error) {
            console.error('❌ Erreur de parsing des données WebSocket:', error);
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
          console.log('🖼️ Image reçue');
        }
      };

      ws.onerror = (event) => {
        console.error('❌ Erreur WebSocket', event);
      };

      ws.onclose = (event) => {
        console.log(
          `🔴 WebSocket fermé, code: ${event.code}, raison: ${event.reason || 'Non spécifiée'}`,
          event
        );

        // Reconnecter seulement si ce n'était pas une fermeture manuelle
        if (id && !manualClose && event.code !== 1000 && event.code !== 1001) {
          console.log('🔄 Reconnexion automatique après fermeture...');
          if (id === jobId) setTimeout(() => initWebSocket(id), 1000);
        } else {
          setIsSearching(false);
        }
      };
    },
    [jobId, manualClose]
  );

  const closeWebSocket = useCallback(() => {
    // Set manual close flag immediately to prevent reconnection
    setManualClose(true);

    // First close the WebSocket connection to stop receiving updates
    if (wsRef.current) {
      console.log('🔒 Closing WebSocket connection before cancellation...');
      wsRef.current.close(1000, 'Client closed connection');
      wsRef.current = null;
    }

    // Reset states immediately
    setIsSearching(false);
    setProgress(null);

    // Then cancel the search via API
    console.log('🛑 Sending cancel request to API...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

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
          console.log('✅ Search cancelled successfully');
        } else {
          console.error(`❌ Failed to cancel search: ${response.status}`);
          // Even if the API call fails, we want to ensure the UI is reset
        }
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          console.warn('⚠️ Cancel request timed out but UI reset completed');
        } else {
          console.error('❌ Error cancelling search:', error);
        }
      })
      .finally(() => {
        // Reset job ID after the API call completes or fails
        setJobId(null);
      });
  }, [sessionId]);

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
