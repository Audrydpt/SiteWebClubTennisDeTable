/* eslint-disable no-console,@typescript-eslint/no-shadow */
// useSearch.tsx - Hook de recherche indépendant
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/providers/auth-context';
import { FormData as CustomFormData, formatQuery } from '../lib/format-query';
import { ForensicResult, SourceProgress } from '../lib/types';

// Types pour les callbacks
interface UseSearchOptions {
  onSourceProgressUpdate?: (sourceProgress: SourceProgress[]) => void;
  onStatusChange?: (isSearching: boolean) => void;
  onJobIdChange?: (jobId: string | null) => void;
  onProgressUpdate?: (progress: number | null) => void;
  onResultReceived?: (result: ForensicResult) => void;
}

export default function useSearch(options: UseSearchOptions = {}) {
  const { sessionId = '' } = useAuth();
  const [progress, setProgress] = useState<number | null>(null);
  const [sourceProgress, setSourceProgress] = useState<SourceProgress[]>([]);
  const [jobId, setJobId] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [type, setType] = useState<string | null>(null);

  // Références pour WebSocket et AbortController
  const wsRef = useRef<WebSocket | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentPageRef = useRef<number>(1);

  // Références pour suivre les états les plus récents
  const latestJobId = useRef<string | null>(null);
  const latestIsCancelling = useRef<boolean>(false);
  const latestIsSearching = useRef<boolean>(false);
  const latestType = useRef<string | null>(null);

  // Fonctions de rappel extraites des options
  const {
    onSourceProgressUpdate,
    onStatusChange,
    onJobIdChange,
    onProgressUpdate,
  } = options;

  // Mise à jour des références
  useEffect(() => {
    latestJobId.current = jobId;
  }, [jobId]);

  useEffect(() => {
    latestIsCancelling.current = isCancelling;
  }, [isCancelling]);

  useEffect(() => {
    latestIsSearching.current = isSearching;
  }, [isSearching]);

  useEffect(() => {
    latestType.current = type;
  }, [type]);

  // Mise à jour des callbacks externes
  useEffect(() => {
    if (onStatusChange) onStatusChange(isSearching);
  }, [isSearching, onStatusChange]);

  useEffect(() => {
    if (onJobIdChange) onJobIdChange(jobId);
  }, [jobId, onJobIdChange]);

  useEffect(() => {
    if (onProgressUpdate) onProgressUpdate(progress);
  }, [progress, onProgressUpdate]);

  useEffect(() => {
    if (onSourceProgressUpdate) onSourceProgressUpdate(sourceProgress);
  }, [sourceProgress, onSourceProgressUpdate]);

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

  // Nettoyage des ressources
  const cleanupResources = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'Nettoyage des ressources');
      wsRef.current = null;
    }
  }, []);

  // Requête pour obtenir le statut d'un job
  const getJobStatus = async (jobId: string): Promise<string> => {
    try {
      const response = await fetch(
        `${process.env.MAIN_API_URL}/forensics/${jobId}`
      );

      if (!response.ok) {
        throw new Error(`Erreur API status: ${response.status}`);
      }

      const data = await response.json();
      return data.status;
    } catch (error) {
      console.error(
        `Erreur lors de la vérification du statut du job ${jobId}:`,
        error
      );
      return 'UNKNOWN';
    }
  };

  const initWebSocket = useCallback(
    (id: string, page1 = false) => {
      const shouldInit = page1 || currentPageRef.current === 1;

      console.log(
        `🔍 Tentative d'initialisation WebSocket pour job ${id}, page ${currentPageRef.current}`
      );

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

      // AMÉLIORATION : Ajouter un délai avant de fermer une connexion existante
      const closeExistingConnection = () =>
        new Promise<void>((resolve) => {
          if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
            console.log('🔄 Fermeture de la connexion WebSocket existante...');

            // Gérer l'événement de fermeture pour résoudre la promesse
            const onCloseHandler = () => {
              wsRef.current = null;
              resolve();
            };

            wsRef.current.addEventListener('close', onCloseHandler, {
              once: true,
            });
            wsRef.current.close(1000, 'Nouvelle connexion demandée');

            // Timeout de sécurité si la fermeture ne se produit pas
            setTimeout(() => {
              if (wsRef.current) {
                console.log('⚠️ Timeout sur la fermeture WebSocket');
                wsRef.current = null;
                resolve();
              }
            }, 500);
          } else {
            resolve();
          }
        });

      // AMÉLIORATION : Fermer proprement la connexion existante avant d'en créer une nouvelle
      closeExistingConnection().then(() => {
        // Ne pas créer de nouvelle connexion si l'état a changé pendant la fermeture
        if (latestIsCancelling.current || currentPageRef.current !== 1) {
          console.log(
            '🛑 Création de WebSocket annulée - conditions ont changé'
          );
          return;
        }

        // Déterminer le hostname en privilégiant la variable d'environnement si possible
        let { hostname } = window.location;
        try {
          hostname =
            new URL(process.env.MAIN_API_URL || '').hostname || hostname;
        } catch {
          // En cas d'erreur, on garde le hostname par défaut
        }

        try {
          const ws = new WebSocket(
            `wss://${hostname}/front-api/forensics/${id}`
          );
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
                  // Ajouter ici la logique de mise à jour de la progression
                  metadataQueue.current.progress = data.progress;

                  // Mettre à jour l'état de progression global
                  setProgress(data.progress);

                  // Si les informations de source sont disponibles, mettre à jour la progression de cette source
                  if (data.source_id) {
                    setSourceProgress((prevSourcesProgress) =>
                      prevSourcesProgress.map((source) =>
                        source.sourceId === data.source_id
                          ? { ...source, progress: data.progress }
                          : source
                      )
                    );
                  }
                } else if (data.error) {
                  // Logique de gestion d'erreur existante
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
                type: latestType.current === 'person' ? 'person' : 'vehicle',
              };

              // Utiliser le callback pour traiter le nouveau résultat
              if (options.onResultReceived) {
                options.onResultReceived(newResult);
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

            // force reconnexion
            if (event.code === 1006) {
              setTimeout(() => initWebSocket(id), 1000);
            }

            // On reconnecte le WS seulement en cas de fermeture anormale
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
      });

      console.log('🔄 Initialisation WebSocket - FIN');
    },
    [
      latestIsCancelling,
      latestIsSearching,
      latestJobId,
      latestType,
      isCancelling,
      currentPageRef,
    ]
  );

  // Nettoyage du WebSocket
  const cleanupWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close(100, 'Nettoyage manuel');
      wsRef.current = null;
    }
  }, []);

  const startSearch = useCallback(
    async (formData: CustomFormData) => {
      try {
        // Reset states
        setIsSearching(true);
        setIsCancelling(false);
        setType(formData.subjectType);
        setProgress(null);

        // Nettoyer les ressources existantes
        cleanupResources();

        // Attendre un court délai pour s'assurer que les ressources sont bien libérées
        setTimeout(() => {}, 100);

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
        currentPageRef.current = 1;

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
    [sessionId, cleanupResources, initializeSourceProgress, initWebSocket]
  );

  // Arrêt d'une recherche
  const stopSearch = async () => {
    if (!jobId || !isSearching) {
      console.warn("Impossible d'arrêter: aucune recherche en cours");
      return false;
    }

    try {
      setIsCancelling(true);

      // Arrêter la recherche en cours
      const response = await fetch(
        `${process.env.MAIN_API_URL}/forensics/${jobId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Erreur lors de l'arrêt de la recherche: ${response.status}`
        );
      }

      // Nettoyage des ressources
      cleanupResources();
      setIsSearching(false);
      setProgress(100);

      return true;
    } catch (error) {
      console.error("Erreur lors de l'arrêt de la recherche:", error);
      return false;
    } finally {
      setIsCancelling(false);
    }
  };

  // Réinitialisation de la recherche
  const resetSearch = useCallback(() => {
    setProgress(null);
    setSourceProgress([]);
    setIsSearching(false);
    cleanupResources();
  }, [cleanupResources]);

  // Nettoyage au démontage du composant
  useEffect(
    () => () => {
      cleanupResources();
    },
    [cleanupResources]
  );

  // Mise à jour de la page courante
  const setCurrentPage = useCallback((page: number) => {
    currentPageRef.current = page;
  }, []);

  return {
    startSearch,
    stopSearch,
    resetSearch,
    progress,
    isSearching,
    isCancelling,
    sourceProgress,
    jobId,
    type,
    initWebSocket,
    cleanupWebSocket,
    getJobStatus,
    setCurrentPage,
  };
}
