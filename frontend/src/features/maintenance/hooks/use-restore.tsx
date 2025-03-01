import { useMutation, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useEffect, useState } from 'react';

import useLocalStorage from '@/hooks/use-localstorage';
import { useAuth } from '@/providers/auth-context';
import { apiService } from '../lib/utils/api';

export interface Stream {
  id: string;
  name: string;
}

export interface RestorePoint {
  id: string;
  firmware: string;
  hostname: string;
  ip: string;
  date: string;
  streams: number;
  unit: boolean;
  streamData: Record<string, string>;
}

export interface RestoreMapping {
  from: string;
  to: string;
}

export interface RestoreOptions {
  restorePointId: string;
  streams: RestoreMapping[];
  global: boolean;
}

export function useRestore() {
  const { sessionId } = useAuth();
  const [restorePoint, setRestorePoint] = useState<RestorePoint | null>(null);

  // Move useLocalStorage here
  const { value: lastBackupGuid, setValue: setLastBackupGuid } =
    useLocalStorage<string | null>('lastBackupGuid', null);

  // Query for server streams
  const {
    data: streams = [],
    isLoading: streamsLoading,
    error: streamsError,
    refetch: refetchStreams,
  } = useQuery({
    queryKey: ['streams', sessionId],
    queryFn: async () => {
      const response = await apiService.getStreams(sessionId!);
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

  // Automatically fetch restore point info when lastBackupGuid changes
  const {
    data: lastRestorePointData,
    isLoading: lastRestorePointLoading,
    error: lastRestorePointError,
  } = useQuery({
    queryKey: ['restore-point-info', lastBackupGuid, sessionId],
    queryFn: async () => {
      if (!lastBackupGuid || !sessionId) return null;

      const response = await axios.get(
        `${process.env.BACK_API_URL}/restorePoint/${lastBackupGuid}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `X-Session-Id ${sessionId}`,
          },
        }
      );

      const { data } = response;

      const streamData = Object.entries(data)
        .filter(([key]) => key.startsWith('stream') && key.endsWith('_name'))
        .reduce<Record<string, string>>((acc, [key, value]) => {
          const streamId = key.match(/stream(\d+)_name/)?.[1];
          if (streamId) {
            acc[streamId] = value as string;
          }
          return acc;
        }, {});

      return {
        id: lastBackupGuid,
        firmware: data.firmware,
        hostname: data.hostname,
        ip: data.ip,
        date: data.date,
        streams: parseInt(data.streams, 10),
        unit: data.unit === '1',
        streamData,
      };
    },
    enabled: !!lastBackupGuid && !!sessionId,
  });

  // Update restorePoint state when lastRestorePointData changes
  useEffect(() => {
    if (lastRestorePointData) {
      setRestorePoint(lastRestorePointData);
    }
  }, [lastRestorePointData]);

  // Mutation for getting restore point info
  const getRestorePointInfoMutation = useMutation({
    mutationFn: async (pointId: string): Promise<RestorePoint> => {
      const response = await axios.get(
        `${process.env.BACK_API_URL}/restorePoint/${pointId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `X-Session-Id ${sessionId}`,
          },
        }
      );

      const { data } = response;

      const streamData = Object.entries(data)
        .filter(([key]) => key.startsWith('stream') && key.endsWith('_name'))
        .reduce<Record<string, string>>((acc, [key, value]) => {
          const streamId = key.match(/stream(\d+)_name/)?.[1];
          if (streamId) {
            acc[streamId] = value as string;
          }
          return acc;
        }, {});

      const parsedRestorePoint = {
        id: pointId,
        firmware: data.firmware,
        hostname: data.hostname,
        ip: data.ip,
        date: data.date,
        streams: parseInt(data.streams, 10),
        unit: data.unit === '1',
        streamData,
      };

      setRestorePoint(parsedRestorePoint);
      return parsedRestorePoint;
    },
  });

  // Mutation for uploading backup
  const uploadBackupMutation = useMutation({
    mutationFn: async (file: File): Promise<RestorePoint> => {
      if (!file.name.endsWith('.mvb')) {
        throw new Error('The file must be in .mvb format');
      }

      // Convert file to base64
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
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

      const uploadResponse = await axios.post(
        `${process.env.BACK_API_URL}/restorePoint`,
        {
          fileName: file.name,
          data: base64Data,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `X-Session-Id ${sessionId}`,
          },
        }
      );

      const restorePointId = uploadResponse.data.restorePoint;

      // Save to localStorage
      setLastBackupGuid(restorePointId);

      // Get restore point info
      const restorePointInfo =
        await getRestorePointInfoMutation.mutateAsync(restorePointId);

      return restorePointInfo;
    },
  });

  // Mutation for restore
  const restoreBackupMutation = useMutation({
    mutationFn: async (options: RestoreOptions): Promise<void> => {
      const body = {
        restorePoint: options.restorePointId,
        global: options.global,
        streams: options.streams,
      };

      await axios.post(`${process.env.BACK_API_URL}/restore`, body, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `X-Session-Id ${sessionId}`,
        },
      });
    },
  });

  // Mutation for reboot
  const rebootMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      await axios.put(
        `${process.env.BACK_API_URL}/reboot`,
        {},
        {
          headers: {
            Authorization: `X-Session-Id ${sessionId}`,
          },
        }
      );
    },
  });

  // Aggregate loading state
  const isLoading =
    streamsLoading ||
    lastRestorePointLoading ||
    uploadBackupMutation.isPending ||
    getRestorePointInfoMutation.isPending ||
    restoreBackupMutation.isPending ||
    rebootMutation.isPending;

  // Aggregate error state
  const error =
    streamsError ||
    lastRestorePointError ||
    uploadBackupMutation.error ||
    getRestorePointInfoMutation.error ||
    restoreBackupMutation.error ||
    rebootMutation.error;

  return {
    // Data
    streams,
    restorePoint,
    lastBackupGuid,

    // Loading and error states
    isLoading,
    error: (() => {
      if (!error) {
        return null;
      }
      if (error instanceof Error) {
        return error.message;
      }
      return String(error);
    })(),

    // Actions
    refetchStreams,
    getRestorePointInfo: getRestorePointInfoMutation.mutateAsync,
    uploadBackup: uploadBackupMutation.mutateAsync,
    restoreBackup: restoreBackupMutation.mutateAsync,
    reboot: rebootMutation.mutateAsync,

    // Storage management
    setLastBackupGuid,
  };
}
