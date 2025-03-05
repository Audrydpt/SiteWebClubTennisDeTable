import { useState } from 'react';

export default function useSearch(sessionId: string) {
  const [progress, setProgress] = useState<number | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);

  const startSearch = async (duration: number) => {
    try {
      const response = await fetch(
        `https://192.168.20.145/front-api/forensics?duration=${duration}`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            Authorization: `X-Session-Id ${sessionId}`,
          },
        }
      );
      const guid = await response.json();
      setJobId(guid);
    } catch (error) {
      console.error('❌ Erreur lors du démarrage de la recherche:', error);
    }
  };

  const initWebSocket = () => {
    if (!jobId) {
      console.error(
        "⚠️ Aucune recherche en cours, impossible d'init WebSocket."
      );
      return;
    }

    const newWs = new WebSocket(
      `wss://192.168.20.145/front-api/forensics/${jobId}`
    );
    setWs(newWs);

    newWs.onopen = () => console.log('✅ WebSocket connecté !');
    newWs.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.progress !== undefined) {
        setProgress(data.progress);
        console.log(`📊 Progression: ${data.progress}%`);
      } else if (data.error) {
        console.error('⚠️ WebSocket erreur:', data.error);
      }
    };
    newWs.onerror = (event) => console.error('❌ WebSocket erreur:', event);
    newWs.onclose = (event) =>
      console.log(
        `🔴 WebSocket fermé, code: ${event.code}, raison: ${event.reason}`
      );
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

  return { startSearch, initWebSocket, closeWebSocket, progress };
}
