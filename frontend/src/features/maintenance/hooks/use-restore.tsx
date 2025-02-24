import { useState } from 'react';
import { fetchApi } from '../lib/utils/api';

interface RestorePoint {
  firmware: string;
  hostname: string;
  ip: string;
  date: string;
  streams: string;
  unit: string;
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

  const uploadBackup = async (file: File): Promise<string> => {
    setIsLoading(true);
    try {
      if (!file.name.endsWith('.mvb')) {
        throw new Error('Le fichier doit être au format .mvb');
      }

      const reader = new FileReader();

      const base64Data = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          const cleanBase64 = result.split(',')[1];
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          cleanBase64
            ? resolve(cleanBase64)
            : reject(new Error("Erreur d'encodage du fichier"));
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      console.log('Base64 Data:', `${base64Data.substring(0, 100)}...`);

      const response = await fetchApi<{ restorePoint: string }>(
        '/restorePoint',
        sessionId,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: file.name, data: base64Data }),
        }
      );

      if (response.error) throw new Error(response.error);

      console.log('Restore Point ID:', response.data!.restorePoint);
      return response.data!.restorePoint;
    } catch (err) {
      console.error('Erreur lors de l’envoi du fichier:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getRestorePointInfo = async (
    pointId: string
  ): Promise<RestorePoint> => {
    setIsLoading(true);
    try {
      console.log('Fetching restore point info for ID:', pointId);
      const response = await fetchApi<RestorePoint>(
        `/restorePoint/${pointId}`,
        sessionId
      );

      console.log('Raw restore point response:', response);

      if (response.error) throw new Error(response.error);

      const data = response.data!;

      // Extract stream data from response
      const streamData = Object.entries(data)
        .filter(([key]) => key.startsWith('stream') && key.endsWith('_name'))
        .reduce(
          (acc, [key, value]) => {
            const streamId = key.replace('_name', '');
            acc[streamId] = value as string;
            return acc;
          },
          {} as Record<string, string>
        );

      console.log('Processed stream data:', streamData);

      // Create final restore point with stream data
      const finalRestorePoint = {
        firmware: data.firmware,
        hostname: data.hostname,
        ip: data.ip,
        date: data.date,
        unit: data.unit,
        streams: data.streams,
        streamData,
      };

      console.log('Final restore point object:', finalRestorePoint);
      setRestorePoint(finalRestorePoint);
      return finalRestorePoint;
    } finally {
      setIsLoading(false);
    }
  };

  const restoreBackup = async (options: RestoreOptions): Promise<void> => {
    setIsLoading(true);
    try {
      const restorePointId = await uploadBackup(options.file);
      const pointInfo = await getRestorePointInfo(restorePointId);

      if (!pointInfo) {
        console.error('Impossible de récupérer les informations du backup.');
        return;
      }

      setRestorePoint(pointInfo);

      await fetchApi('/restore', sessionId, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restorePoint: restorePointId,
          global: options.global,
          streams: options.streams,
        }),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return { restoreBackup, isLoading, error, restorePoint };
}
