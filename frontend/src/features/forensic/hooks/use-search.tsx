/* eslint-disable */
import { useState, useEffect, useRef, useCallback } from 'react';

import { FormData as CustomFormData, formatQuery } from '../lib/format-query';

// Add debug ID type to WebSocket
declare global {
  interface WebSocket {
    _debugId?: string;
  }
}

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

  // Use useRef instead of useState for the WebSocket
  const wsRef = useRef<WebSocket | null>(null);

  // Debug render count and track state changes that trigger re-renders
  const renderCountRef = useRef(0);
  const prevStatesRef = useRef({
    progress,
    jobId,
    results: results.length,
    isSearching,
  });

  useEffect(() => {
    renderCountRef.current += 1;
    const prevStates = prevStatesRef.current;
    const changes = [];

    if (prevStates.progress !== progress) changes.push('progress');
    if (prevStates.jobId !== jobId) changes.push('jobId');
    if (prevStates.results !== results.length) changes.push('results');
    if (prevStates.isSearching !== isSearching) changes.push('isSearching');

    console.log(
      `🔄 useSearch rendered: ${renderCountRef.current} times.${changes.length ? ` Changed: ${changes.join(', ')}` : ''}`
    );

    // Update prev states
    prevStatesRef.current = {
      progress,
      jobId,
      results: results.length,
      isSearching,
    };
  });

  // Clean up WebSocket on unmount
  useEffect(
    () => () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
        console.log('🧹 WebSocket closed during cleanup');
      }
    },
    []
  );

  const startSearch = useCallback(
    async (formData: CustomFormData, duration: number) => {
      try {
        // Reset results when starting a new search
        setResults([]);
        setIsSearching(true);

        // Format the query data according to API requirements
        const queryData = formatQuery(formData);

        console.log('Formatted query:', JSON.stringify(queryData, null, 2));

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

  // Use a stable ref for event handlers to avoid capturing stale state
  const eventHandlersRef = useRef({
    onMessage: (event: MessageEvent) => {
      if (typeof event.data === 'string') {
        try {
          const data = JSON.parse(event.data);
          if (data.progress !== undefined) {
            setProgress(data.progress);
            console.log(`📊 Progression: ${data.progress}%`);

            if (data.progress === 100) {
              setIsSearching(false);
            }
          } else if (data.error) {
            console.error('⚠️ WebSocket erreur:', data.error);
            setIsSearching(false);
          }
        } catch (error) {
          console.error('❌ Error parsing WebSocket data:', error);
        }
      } else if (event.data instanceof Blob) {
        const blob = event.data;
        const imageUrl = URL.createObjectURL(blob);

        const newResult: ForensicResult = {
          id: crypto.randomUUID(),
          imageData: imageUrl,
          timestamp: new Date().toISOString(),
          confidence: 0,
          cameraId: 'unknown',
        };

        setResults((prev) => [...prev, newResult]);
        console.log('🖼️ Image reçue et stockée');
      } else {
        console.warn('⚠️ Received unknown data type from WebSocket');
      }
    },
    onError: (event: Event) => {
      console.error('❌ WebSocket erreur:', event);
      setIsSearching(false);
    },
  });

  // Update event handlers ref to always have access to latest state
  useEffect(() => {
    // Store WebSocket assignment in a closure
    let latestWs = wsRef.current;

    eventHandlersRef.current = {
      onMessage: (event: MessageEvent) => {
        // Verify we're still using the same WebSocket instance
        if (wsRef.current !== latestWs && latestWs) {
          console.warn(
            '⚠️ WebSocket instance changed unexpectedly! Event ignored.'
          );
          return;
        }

        if (typeof event.data === 'string') {
          try {
            const data = JSON.parse(event.data);
            if (data.progress !== undefined) {
              setProgress(data.progress);
              console.log(`📊 Progression: ${data.progress}%`);

              if (data.progress === 100) {
                setIsSearching(false);
              }
            } else if (data.error) {
              console.error('⚠️ WebSocket erreur:', data.error);
              setIsSearching(false);
            }
          } catch (error) {
            console.error('❌ Error parsing WebSocket data:', error);
          }
        } else if (event.data instanceof Blob) {
          const blob = event.data;
          const imageUrl = URL.createObjectURL(blob);

          const newResult: ForensicResult = {
            id: crypto.randomUUID(),
            imageData: imageUrl,
            timestamp: new Date().toISOString(),
            confidence: 0,
            cameraId: 'unknown',
          };

          setResults((prev) => [...prev, newResult]);
          console.log('🖼️ Image reçue et stockée');
        } else {
          console.warn('⚠️ Received unknown data type from WebSocket');
        }
      },
      onError: (event: Event) => {
        // Verify we're still using the same WebSocket instance
        if (wsRef.current !== latestWs && latestWs) {
          console.warn(
            '⚠️ WebSocket instance changed unexpectedly! Error ignored.'
          );
          return;
        }

        console.error('❌ WebSocket erreur:', event);

        // Extract all properties from the event object with proper type annotation
        const eventDetails: Record<string, unknown> = {};
        for (const prop in event) {
          try {
            // Use type assertion to avoid TypeScript error
            eventDetails[prop] = (event as unknown as Record<string, unknown>)[prop];
          } catch (e) {
            eventDetails[prop] = 'Error accessing property';
          }
        }
        console.log(
          '🔍 WebSocket error event details:',
          JSON.stringify(eventDetails, null, 2)
        );

        // Try to access error details specifically
        if ('error' in event) {
          console.log('Error property:', (event as any).error);
        }

        setIsSearching(false);
      },
    };

    return () => {
      // Mark previous handlers as stale on cleanup
      latestWs = null;
    };
  }, []);

  // Additional diagnostic effect to monitor WebSocket reference
  useEffect(() => {
    if (wsRef.current) {
      const currentWs = wsRef.current;
      const wsId = currentWs._debugId || 'unknown';
      console.log(`🔍 Monitoring WebSocket ${wsId}`);

      return () => {
        console.log(
          `🔍 Checking WebSocket ${wsId} reference integrity: ${wsRef.current === currentWs ? 'intact' : 'CHANGED!'}`
        );
      };
    }
  }, [jobId, isSearching]);

  const initWebSocket = useCallback(
    (jobIdParam?: string) => {
      const id = jobIdParam || jobId;
      if (!id) {
        console.error(
          "⚠️ Aucune recherche en cours, impossible d'init WebSocket."
        );
        return;
      }

      // Close existing connection if any
      if (wsRef.current) {
        console.log(
          `🔄 Closing existing WebSocket (ID: ${wsRef.current._debugId || 'unknown'})`
        );
        wsRef.current.close();
      }

      let { hostname } = window.location;
      try {
        hostname = new URL(process.env.MAIN_API_URL!).hostname;
      } catch {
        // Ignore error
      }

      console.log(
        `🔌 Creating new WebSocket connection to wss://${hostname}/front-api/forensics/${id}`
      );
      const newWs = new WebSocket(
        `wss://${hostname}/front-api/forensics/${id}`
      );

      // Add debug ID to track WebSocket instances
      newWs._debugId = `ws_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
      console.log(`🆔 New WebSocket created with ID: ${newWs._debugId}`);

      wsRef.current = newWs;

      newWs.onopen = () =>
        console.log(`✅ WebSocket connecté ! (ID: ${newWs._debugId})`);
      newWs.onmessage = eventHandlersRef.current.onMessage;

      newWs.onerror = (event) => {
        console.error('❌ WebSocket erreur:', event);

        // Extract all properties from the event object with proper type annotation
        const eventDetails: Record<string, unknown> = {};
        for (const prop in event) {
          try {
            // Use type assertion to avoid TypeScript error
            eventDetails[prop] = (event as unknown as Record<string, unknown>)[prop];
          } catch (e) {
            eventDetails[prop] = 'Error accessing property';
          }
        }
        console.log(
          '🔍 WebSocket error event details:',
          JSON.stringify(eventDetails, null, 2)
        );

        // Try to access error details specifically
        if ('error' in event) {
          console.log('Error property:', (event as any).error);
        }

        // Check if the WebSocket reference is still intact
        console.log(
          `📝 Current wsRef.current ID: ${wsRef.current?._debugId || 'null'}`
        );
        console.log(`📝 Error WebSocket ID: ${newWs._debugId || 'unknown'}`);
        console.log(`📝 Reference equality: ${wsRef.current === newWs}`);

        setIsSearching(false);
      };

      newWs.onclose = (event) => {
        console.log(
          `🔴 WebSocket fermé, code: ${event.code}, raison: ${event.reason || 'Non spécifiée'}`
        );

        // Extract all properties from the CloseEvent
        const eventProperties = {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
          type: event.type,
          timeStamp: event.timeStamp,
          target: event.target ? 'WebSocket instance' : 'null',
          currentTarget: event.currentTarget ? 'WebSocket instance' : 'null',
          eventPhase: event.eventPhase,
          bubbles: event.bubbles,
          cancelable: event.cancelable,
          composed: event.composed,
          isTrusted: event.isTrusted,
          defaultPrevented: event.defaultPrevented,
        };

        console.log('🔍 WebSocket close event details:', eventProperties);

        // Check if the WebSocket reference is still intact
        console.log(
          `📝 Current wsRef.current ID: ${wsRef.current?._debugId || 'null'}`
        );
        console.log(`📝 Closed WebSocket ID: ${newWs._debugId || 'unknown'}`);
        console.log(`📝 Reference equality: ${wsRef.current === newWs}`);

        // Try to identify if there's a memory issue
        if (wsRef.current && wsRef.current !== newWs) {
          console.warn(
            '⚠️ WebSocket reference mismatch! The reference has changed unexpectedly.'
          );
        }

        // Log more details based on the close code
        switch (event.code) {
          case 1000:
            console.log('📝 Fermeture normale de la connexion');
            break;
          case 1001:
            console.log('📝 Partie distante fermée (navigateur fermé, etc.)');
            break;
          case 1002:
            console.log('📝 Erreur de protocole');
            break;
          case 1003:
            console.log('📝 Type de données non accepté');
            break;
          case 1005:
            console.log('📝 Pas de code de statut reçu');
            break;
          case 1006:
            console.log(
              '📝 Connexion fermée anormalement (peut-être une différence entre les requêtes?)'
            );
            break;
          case 1007:
            console.log('📝 Format de message invalide');
            break;
          case 1008:
            console.log('📝 Message enfreint les règles');
            break;
          case 1009:
            console.log('📝 Message trop grand');
            break;
          case 1010:
            console.log('📝 Extensions manquantes côté client');
            break;
          case 1011:
            console.log('📝 Erreur inattendue côté serveur');
            break;
          default:
            console.log(`📝 Code de fermeture non standard: ${event.code}`);
        }

        // Log the endpoint that was used
        console.log(`📝 URL WebSocket utilisée: ${newWs.url}`);

        setIsSearching(false);
      };
    },
    [jobId]
  );

  const closeWebSocket = useCallback(() => {
    if (wsRef.current) {
      console.log(
        `🛑 Closing WebSocket manually (ID: ${wsRef.current._debugId || 'unknown'})`
      );
      wsRef.current.close();
      wsRef.current = null;
    } else {
      console.log('⚠️ Aucun WebSocket à fermer');
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