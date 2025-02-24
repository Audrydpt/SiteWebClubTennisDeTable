import { useState, useEffect } from 'react';
import { apiService } from '../lib/utils/api';
import { Item } from '../lib/utils/types';

export interface Stream extends Item {
  id: string;
  name: string;
}

export default function useBackup(sessionId: string) {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const generateBackup = async (
    global: boolean,
    selectedStreams: string[]
  ): Promise<void> => {
    try {
      const response = await fetch(`${process.env.BACK_API_URL}/backup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `X-Session-Id ${sessionId}`,
        },
        body: JSON.stringify({
          global,
          streams: selectedStreams,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate backup: ${response.statusText}`);
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get('Content-Disposition');
      const fileName =
        contentDisposition?.split('filename=')[1]?.replace(/"/g, '') ||
        `backup_${new Date().toISOString()}.mvb`;

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    }
  };

  useEffect(() => {
    const fetchStreams = async () => {
      try {
        const response = await apiService.getStreams(sessionId);
        if (response.data) {
          // Use the stream's actual name or ID if name is not available
          const streamData = response.data.map((stream) => ({
            ...stream,
            name: stream.name || `Stream ${stream.id}`,
          }));
          setStreams(streamData);
        } else if (response.error) {
          setError(response.error);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to fetch streams'
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (sessionId) {
      fetchStreams();
    }
  }, [sessionId]);

  return { streams, isLoading, error, generateBackup };
}
