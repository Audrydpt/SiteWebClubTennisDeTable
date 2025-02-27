import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../lib/utils/api';

export interface Stream {
  id: string;
  name: string;
}

export default function useBackup(sessionId: string) {
  const [error, setError] = useState<string | null>(null);

  const { data: streams = [], isLoading } = useQuery<Stream[]>({
    queryKey: ['streams', sessionId],
    queryFn: async () => {
      const response = await apiService.getStreams(sessionId);
      if (response.error) {
        throw new Error(response.error);
      }
      return (
        response.data?.map((stream) => ({
          ...stream,
          name: stream.name || `Stream ${stream.id}`,
        })) || []
      );
    },
    enabled: !!sessionId,
  });

  const generateBackup = async (
    global: boolean,
    selectedStreams: string[]
  ): Promise<string> => {
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

      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const uploadResponse = await fetch(
        `${process.env.BACK_API_URL}/restorePoint`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `X-Session-Id ${sessionId}`,
          },
          body: JSON.stringify({
            fileName,
            data: base64Data,
          }),
        }
      );

      if (!uploadResponse.ok) {
        throw new Error(
          `Failed to upload backup: ${uploadResponse.statusText}`
        );
      }

      const { restorePoint } = await uploadResponse.json();

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return restorePoint;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      return '';
    }
  };

  return {
    streams,
    isLoading,
    error,
    generateBackup,
  };
}
