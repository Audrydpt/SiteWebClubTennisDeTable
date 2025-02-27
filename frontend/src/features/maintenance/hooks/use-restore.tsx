import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../lib/utils/api';

interface Stream {
  id: string;
  name: string;
}

interface RestorePoint {
  id: string;
  firmware: string;
  hostname: string;
  ip: string;
  date: string;
  streams: number;
  unit: boolean;
  streamData: Record<string, string>;
}

interface RestoreOptions {
  file: File;
  streams: Array<{ from: string; to: string }>;
  global: boolean;
}

export default function useRestore(sessionId: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restorePoint, setRestorePoint] = useState<RestorePoint | null>(null);

  const { data: serverStreams = [] } = useQuery<Stream[]>({
    queryKey: ['streams', sessionId],
    queryFn: async () => {
      const response = await apiService.getStreams(sessionId);
      if (response.error) {
        throw new Error(response.error);
      }
      return (
        response.data?.map((stream) => ({
          id: stream.id,
          name: stream.name || `Stream ${stream.id}`,
        })) || []
      );
    },
    enabled: !!sessionId,
  });

  const uploadBackup = async (file: File): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      if (!file.name.endsWith('.mvb')) {
        throw new Error('The file must be in .mvb format');
      }

      const reader = new FileReader();
      const base64Data = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          const cleanBase64 = result.split(',')[1];
          if (cleanBase64) {
            resolve(cleanBase64);
          } else {
            reject(new Error('File encoding error'));
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const response = await fetch(`${process.env.BACK_API_URL}/restorePoint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `X-Session-Id ${sessionId}`,
        },
        body: JSON.stringify({ fileName: file.name, data: base64Data }),
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.restorePoint;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getRestorePointInfo = async (pointId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.BACK_API_URL}/restorePoint/${pointId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `X-Session-Id ${sessionId}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to retrieve backup info: ${response.statusText}`
        );
      }

      const data = await response.json();

      const streamData = Object.entries(data)
        .filter(([key]) => key.startsWith('stream') && key.endsWith('_name'))
        .reduce(
          (acc, [key, value]) => {
            const streamId = key.match(/stream(\d+)_name/)?.[1];
            if (streamId) {
              acc[streamId] = value as string;
            }
            return acc;
          },
          {} as Record<string, string>
        );

      setRestorePoint({
        id: pointId,
        firmware: data.firmware,
        hostname: data.hostname,
        ip: data.ip,
        date: data.date,
        streams: parseInt(data.streams, 10),
        unit: data.unit === '1',
        streamData,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const restoreBackup = async (options: RestoreOptions): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      if (!restorePoint?.id) {
        throw new Error('No restore point ID available');
      }

      const body = {
        restorePoint: restorePoint.id,
        global: options.global,
        streams: options.streams,
      };

      const response = await fetch(`${process.env.BACK_API_URL}/restore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `X-Session-Id ${sessionId}`,
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        return;
      }
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `Error during restore: ${response.statusText}`
        );
      } else {
        throw new Error(`Error during restore: ${response.statusText}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const reboot = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.BACK_API_URL}/reboot`, {
        method: 'PUT',
        headers: {
          Authorization: `X-Session-Id ${sessionId}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Reboot failed: ${response.statusText}`);
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('Failed to fetch')) {
        return;
      }
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    uploadBackup,
    getRestorePointInfo,
    restoreBackup,
    reboot,
    isLoading,
    error,
    restorePoint,
    serverStreams,
  };
}
