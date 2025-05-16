// useSearch.tsx - Hook de recherche indépendant
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/providers/auth-context';
import { FormData as CustomFormData, formatQuery } from '../lib/format-query';
import { SourceProgress } from '../lib/types';
import { ForensicTaskStatus } from './use-jobs';
import { SortType } from '../components/ui/buttons';

// Types pour les callbacks
interface UseSearchOptions {
  onResultsReceived?: (result: any) => void;
  onSourceProgressUpdate?: (sourceProgress: SourceProgress[]) => void;
  onStatusChange?: (isSearching: boolean) => void;
  onJobIdChange?: (jobId: string | null) => void;
  onProgressUpdate?: (progress: number | null) => void;
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
  const metadataQueue = useRef<{ [key: string]: any }>({});

  // Fonctions de rappel extraites des options
  const {
    onResultsReceived,
    onSourceProgressUpdate,
    onStatusChange,
    onJobIdChange,
    onProgressUpdate,
  } = options;

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

  // Initialisation de la progression des sources
  const initializeSourceProgress = useCallback(
    (selectedSources: string[]) => {
      const initialProgress: SourceProgress[] = selectedSources.map(
        (sourceId) => ({
          sourceId,
          sourceName: `Source ${sourceId.slice(0, 8)}...`,
          progress: 0,
          timestamp: new Date().toISOString(),
          startTime: new Date().toISOString(),
        })
      );

      setSourceProgress(initialProgress);
      if (onSourceProgressUpdate) onSourceProgressUpdate(initialProgress);
    },
    [onSourceProgressUpdate]
  );

  // Nettoyage des ressources
  const cleanupResources = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    metadataQueue.current = {};
  }, []);

  // Requête pour obtenir le statut d'un job
  const getJobStatus = async (jobId: string): Promise<string> => {
    try {
      const response = await fetch(
        `${process.env.MAIN_API_URL}/forensics/${jobId}/status`
      );

      if (!response.ok) {
        throw new Error(`Échec récupération statut: ${response.statusText}`);
      }

      const data = await response.json();
      return data.status;
    } catch (error) {
      console.error(`Erreur récupération statut pour job ${jobId}:`, error);
      return ForensicTaskStatus.FAILURE;
    }
  };

  // Initialisation du WebSocket
  const initWebSocket = useCallback(
    (jobId: string, page1 = false) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        console.log('WebSocket déjà ouvert, fermeture avant réinitialisation');
        wsRef.current.close(1000, 'Réinitialisation');
      }

      // Création d'une nouvelle connexion WebSocket
      const wsUrl = `${process.env.WS_API_URL}/ws/forensics/${jobId}`;
      console.log(`Initialisation WebSocket: ${wsUrl}`);

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => console.log(`WebSocket connecté pour ${jobId}`);

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === 'detection') {
          if (onResultsReceived) {
            onResultsReceived(data);
          }
        } else if (data.type === 'progress') {
          // Mise à jour de la progression
          const updatedProgress = [...sourceProgress];
          const sourceIndex = updatedProgress.findIndex(
            (src) => src.sourceId === data.source_id
          );

          if (sourceIndex !== -1) {
            updatedProgress[sourceIndex].progress = data.progress || 0;
            setSourceProgress(updatedProgress);
            if (onSourceProgressUpdate) onSourceProgressUpdate(updatedProgress);
          }

          // Calcul de la progression globale
          const globalProgress = Math.round(
            updatedProgress.reduce((acc, src) => acc + (src.progress || 0), 0) /
              updatedProgress.length
          );

          setProgress(globalProgress);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket erreur:', error);
      };

      ws.onclose = (event) => {
        console.log(`WebSocket fermé: ${event.code} - ${event.reason}`);
        wsRef.current = null;
      };
    },
    [sourceProgress, onResultsReceived, onSourceProgressUpdate]
  );

  // Nettoyage du WebSocket
  const cleanupWebSocket = useCallback(() => {
    if (wsRef.current) {
      console.log('Fermeture du WebSocket');
      wsRef.current.close(1000, 'Nettoyage');
      wsRef.current = null;
    }
  }, []);

  // Démarrage d'une recherche
  const startSearch = useCallback(
    async (formData: CustomFormData) => {
      try {
        cleanupWebSocket();
        cleanupResources();

        setProgress(0);
        setIsSearching(true);

        const payload = formatQuery(formData);
        console.log('Lancement recherche avec payload:', payload);

        // Initialiser la progression des sources
        initializeSourceProgress(
          payload.sources.map((source: any) => source.source_id)
        );

        const response = await fetch(`${process.env.MAIN_API_URL}/forensics`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: sessionId,
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`Échec démarrage recherche: ${response.statusText}`);
        }

        const data = await response.json();
        const newJobId = data.task_id;

        console.log(`Recherche démarrée, ID: ${newJobId}`);
        setJobId(newJobId);

        // Initialiser le WebSocket pour les résultats en temps réel
        setTimeout(() => initWebSocket(newJobId, true), 500);

        return newJobId;
      } catch (error) {
        console.error('Erreur démarrage recherche:', error);
        setIsSearching(false);
        setProgress(null);
        throw error;
      }
    },
    [
      cleanupWebSocket,
      cleanupResources,
      initializeSourceProgress,
      sessionId,
      initWebSocket,
    ]
  );

  // Arrêt d'une recherche
  const stopSearch = async (jobId: string) => {
    try {
      setIsSearching(false);

      if (!jobId) {
        console.error("Impossible d'arrêter la recherche: ID manquant");
        return;
      }

      const response = await fetch(
        `${process.env.MAIN_API_URL}/forensics/${jobId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: sessionId,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Échec de l'annulation: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Erreur lors de l'annulation de la recherche:", error);
    }
  };

  // Réinitialisation de la recherche
  const resetSearch = useCallback(() => {
    cleanupWebSocket();
    cleanupResources();
    setSourceProgress([]);
    setProgress(null);
    setIsSearching(false);
    setJobId(null);
  }, [cleanupWebSocket, cleanupResources]);

  // Nettoyage au démontage du composant
  useEffect(
    () => () => {
      cleanupWebSocket();
      cleanupResources();
    },
    [cleanupWebSocket, cleanupResources]
  );

  return {
    startSearch,
    stopSearch,
    resetSearch,
    isSearching,
    progress,
    sourceProgress,
    jobId,
    getJobStatus,
    initWebSocket,
    cleanupWebSocket,
  };
}
