/* eslint-disable no-console */
import { useCallback, useEffect, useRef, useState } from 'react';

import { FormData as CustomFormData, formatQuery } from '../lib/format-query';
import { ForensicResult } from '../lib/types';
import forensicResultsHeap from '../lib/data-structure/heap';

// Interface for forensic task
interface ForensicTask {
  guid: string;
  status: string;
}

export default function useSearch(sessionId: string) {
  const [progress, setProgress] = useState<number | null>(null);
  const [results, setResults] = useState<ForensicResult[]>([]);

  const [jobId, setJobId] = useState<string | null>(null);

  const [isSearching, setIsSearching] = useState(false);

  const [isCancelling, setIsCancelling] = useState(false);

  // References
  const wsRef = useRef<WebSocket | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectCountRef = useRef<number>(0);
  const MAX_RECONNECT_ATTEMPTS = 5;

  const metadataQueue = useRef<{
    timestamp?: string;
    score?: number;
    camera?: string;
    progress?: number;
    attributes?: Record<string, unknown>;
  }>({});

  // Clear all resources and timers
  const cleanupResources = useCallback(() => {
    // Clear any pending reconnection timeout
    if (reconnectTimeoutRef.current !== null) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Close WebSocket if exists
    if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
      try {
        wsRef.current.close(1000, 'Cleanup');
      } catch (e) {
        console.warn('Error closing WebSocket:', e);
      }
      wsRef.current = null;
    }

    // Abort any ongoing fetch request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort('Cleanup');
      abortControllerRef.current = null;
    }

    // Reset reconnect counter
    reconnectCountRef.current = 0;
  }, []);

  // Clean up on unmount
  useEffect(
    () => () => {
      cleanupResources();
    },
    [cleanupResources]
  );

  // Check if a task is still active
  const checkTaskStatus = useCallback(
    async (taskJobId: string): Promise<boolean> => {
      try {
        console.log('🔍 Checking task status:', taskJobId);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(`${process.env.MAIN_API_URL}/forensics`, {
          headers: {
            Authorization: `X-Session-Id ${sessionId}`,
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          console.error(`❌ Status check error: ${response.status}`);
          return false;
        }

        const tasks = await response.json();
        const task = tasks.find((t: ForensicTask) => t.guid === taskJobId);

        if (!task) {
          console.log('⚠️ Task not found in list');
          return false;
        }

        const status = task.status?.toLowerCase();
        console.log(`📊 Task ${taskJobId} status: ${status}`);

        return status === 'pending' || status === 'running';
      } catch (error) {
        console.error('❌ Status check error:', error);
        return false;
      }
    },
    [sessionId]
  );

  // Initialize WebSocket connection
  const initWebSocket = useCallback(
    (taskJobId: string) => {
      if (!taskJobId) {
        console.error('⚠️ No job ID available for WebSocket');
        return;
      }

      // Don't attempt reconnection if we've reached max attempts
      if (reconnectCountRef.current >= MAX_RECONNECT_ATTEMPTS) {
        console.warn(
          `⚠️ Maximum reconnection attempts (${MAX_RECONNECT_ATTEMPTS}) reached`
        );
        setIsSearching(false);
        setProgress(100); // Mark as completed to avoid stuck UI
        return;
      }

      // Close existing connection if present
      if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
        try {
          wsRef.current.close(1000, 'New connection requested');
        } catch (e) {
          console.warn('Error closing existing WebSocket:', e);
        }
        wsRef.current = null;
      }

      // Determine the hostname
      let { hostname } = window.location;
      try {
        const apiUrl = process.env.MAIN_API_URL;
        if (apiUrl) {
          const url = new URL(apiUrl);
          hostname = url.hostname;
        }
      } catch (e) {
        console.warn(
          'Failed to parse API URL, using window.location.hostname:',
          e
        );
      }

      try {
        console.log(
          `🔌 Connecting WebSocket for job ${taskJobId} (attempt ${reconnectCountRef.current + 1})`
        );

        // Create the WebSocket connection
        const ws = new WebSocket(
          `wss://${hostname}/front-api/forensics/${taskJobId}`
        );
        wsRef.current = ws;

        // Connection timeout - if it doesn't connect within 10 seconds, retry
        const connectionTimeoutId = setTimeout(() => {
          if (ws.readyState !== WebSocket.OPEN) {
            console.warn('⏱️ WebSocket connection timeout');
            ws.close(4000, 'Connection timeout');
          }
        }, 10000);

        // WebSocket event handlers
        ws.onopen = () => {
          console.log('✅ WebSocket connected for job', taskJobId);
          clearTimeout(connectionTimeoutId);
          // Reset reconnection counter on successful connection
          reconnectCountRef.current = 0;
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

              if (data.progress !== undefined) {
                setProgress(data.progress);
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
              }

              if (data.error) {
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
          console.error('❌ WebSocket error', event);
          clearTimeout(connectionTimeoutId);
        };

        ws.onclose = async (event) => {
          clearTimeout(connectionTimeoutId);

          console.log(
            `🔴 WebSocket closed, code: ${event.code}, reason: ${event.reason || 'Not specified'}`
          );

          // Only attempt reconnection for unexpected closure during active search
          if (
            taskJobId &&
            !isCancelling &&
            isSearching &&
            event.code !== 1000 &&
            event.code !== 1001
          ) {
            try {
              // Check if task is still active before reconnecting
              const isTaskActive = await checkTaskStatus(taskJobId);

              if (isTaskActive) {
                console.log('🔄 Reconnecting - task still active');

                // Increment reconnect counter
                reconnectCountRef.current += 1;

                // Delay with exponential backoff (1s, 2s, 4s, 8s...)
                const reconnectDelay = Math.min(
                  1000 * 2 ** (reconnectCountRef.current - 1),
                  10000
                );

                // Clear any existing timeout
                if (reconnectTimeoutRef.current !== null) {
                  window.clearTimeout(reconnectTimeoutRef.current);
                }

                reconnectTimeoutRef.current = window.setTimeout(() => {
                  reconnectTimeoutRef.current = null;
                  initWebSocket(taskJobId);
                }, reconnectDelay);

                console.log(`⏱️ Will attempt reconnect in ${reconnectDelay}ms`);
              } else {
                console.log('🛑 No reconnection - task inactive or completed');
                setIsSearching(false);
                setProgress(100);
              }
            } catch (error) {
              console.error('❌ Error checking for reconnection:', error);
              setIsSearching(false);
            }
          } else if (isSearching && event.code === 1000) {
            // Normal closure during search indicates completion
            console.log('🏁 Search completed (WS close)');
            setIsSearching(false);
            setProgress(100);
          }
        };
      } catch (error) {
        console.error('❌ Error creating WebSocket:', error);
        setIsSearching(false);
      }
    },
    [isCancelling, isSearching, checkTaskStatus]
  );

  // Start a new search
  const startSearch = useCallback(
    async (formData: CustomFormData, duration: number) => {
      try {
        // Ensure all previous resources are closed
        cleanupResources();

        // Reset states
        forensicResultsHeap.clear();
        setResults([]);
        setProgress(0);
        setIsSearching(true);
        setIsCancelling(false);
        reconnectCountRef.current = 0;

        // Create new AbortController
        const controller = new AbortController();
        abortControllerRef.current = controller;

        // Format query and make API call
        const queryData = formatQuery(formData);
        console.log('🚀 Starting forensic search', { duration });

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
            signal: controller.signal,
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

        console.log(`✅ Search started with job ID: ${guid}`);
        setJobId(guid);

        // Initialize WebSocket with the new job ID
        initWebSocket(guid);

        return guid;
      } catch (error) {
        // Don't log error if it's an intentional cancellation
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('❌ Error starting search:', error);
        }
        setIsSearching(false);
        setProgress(null);
        throw error;
      }
    },
    [sessionId, cleanupResources, initWebSocket]
  );

  // Cancel ongoing search
  const closeWebSocket = useCallback(() => {
    if (isCancelling) {
      console.log('🔄 Cancellation already in progress');
      return Promise.resolve();
    }

    setIsCancelling(true);
    console.log('🔒 Starting search cancellation procedure');

    // Create a new AbortController for the cancellation request
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // If there's no active search or job ID, just reset
    if (!isSearching || !jobId) {
      console.log('⚠️ No active search to cancel');
      setIsSearching(false);
      setProgress(null);
      setJobId(null);
      setIsCancelling(false);
      return Promise.resolve();
    }

    // First close the WebSocket if it exists
    if (wsRef.current) {
      if (
        wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING
      ) {
        console.log('🔒 Closing WebSocket connection with code 1000...');
        try {
          wsRef.current.close(1000, 'Client cancelled search');
        } catch (e) {
          console.warn('Error closing WebSocket during cancellation:', e);
        }
      }
      wsRef.current = null;
    }

    // Reset UI states immediately
    setIsSearching(false);
    setProgress(null);

    // Timeout for DELETE request
    const timeoutId = setTimeout(() => {
      if (controller && !controller.signal.aborted) {
        controller.abort('Timeout');
      }
    }, 5000);

    // Cancel the search via API
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
          console.log('✅ Search cancelled successfully via API');
        } else {
          console.error(`❌ Cancellation failed: ${response.status}`);
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
