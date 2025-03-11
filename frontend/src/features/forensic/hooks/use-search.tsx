/* eslint-disable no-console */
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

        // Cancel previous search if any
        await fetch(`${process.env.MAIN_API_URL}/forensics`, {
          method: 'DELETE',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `X-Session-Id ${sessionId}`,
          },
        });

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
        if (typeof event.data === 'string') {
          try {
            const data = JSON.parse(event.data);

            if (data.timestamp) {
              console.log('🕒 Timestamp:', data.timestamp);
              lastDate.setTime(data.timestamp);
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
            timestamp: lastDate.toLocaleTimeString(),
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

        // Reconnecter systématiquement si nous avons un jobId
        if (id && event.code !== 1000 && event.code !== 1001) {
          console.log('🔄 Reconnexion automatique après fermeture...');
          setTimeout(() => initWebSocket(id), 1000);
        } else {
          setIsSearching(false);
        }
      };
    },
    [jobId]
  );

  const closeWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

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
