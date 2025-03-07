/* eslint-disable no-console */
import { useState } from 'react';

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
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [results, setResults] = useState<ForensicResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const startSearch = async (formData: CustomFormData, duration: number) => {
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
  };

  const initWebSocket = (jobIdParam?: string) => {
    const id = jobIdParam || jobId;
    if (!id) {
      console.error(
        "⚠️ Aucune recherche en cours, impossible d'init WebSocket."
      );
      return;
    }

    let { hostname } = window.location;
    try {
      hostname = new URL(process.env.MAIN_API_URL!).hostname;
    } catch {
      // Ignore error
    }

    const newWs = new WebSocket(`wss://${hostname}/front-api/forensics/${id}`);
    setWs(newWs);

    newWs.onopen = () => console.log('✅ WebSocket connecté !');
    newWs.onmessage = (event) => {
      // Handle text data (JSON) differently than binary data (Blob)
      if (typeof event.data === 'string') {
        try {
          const data = JSON.parse(event.data);
          if (data.progress !== undefined) {
            setProgress(data.progress);
            console.log(`📊 Progression: ${data.progress}%`);

            // Mark search as complete when progress reaches 100%
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
        // Handle binary data (JPEG)
        const blob = event.data;
        const imageUrl = URL.createObjectURL(blob);

        // Create a new result with the image URL
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
    };
    newWs.onerror = (event) => {
      console.error('❌ WebSocket erreur:', event);
      setIsSearching(false);
    };
    newWs.onclose = (event) => {
      console.log(
        `🔴 WebSocket fermé, code: ${event.code}, raison: ${event.reason}`
      );
      setIsSearching(false);
    };
  };

  const closeWebSocket = () => {
    if (ws) {
      ws.close();
      console.log('🛑 WebSocket fermé manuellement');
      setWs(null);
    } else {
      console.log('⚠️ Aucun WebSocket à fermer');
    }
  };

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
