/* eslint-disable no-unreachable */
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { useAuth } from '@/providers/auth-context';

interface Camera {
  id: string;
  name: string;
  hostName?: string;
  webServerUri?: string;
}

const BASE_URL = process.env.MAIN_API_URL || '';

export default function useSources(initialSelectedCameras: string[] = []) {
  const { sessionId = '' } = useAuth();
  const [selectedCameras, setSelectedCameras] = useState<string[]>(
    initialSelectedCameras
  );
  const [snapshotLoadingStates, setSnapshotLoadingStates] = useState<
    Record<string, boolean>
  >({});

  // Fetch all available cameras from the VMS
  const camerasQuery = useQuery({
    queryKey: ['vms-cameras', sessionId],
    queryFn: async () => {
      const response = await fetch(`${BASE_URL}/vms/cameras`, {
        headers: { Authorization: sessionId },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch cameras: ${response.statusText}`);
      }

      const data = await response.json();

      const cameras: Camera[] = Object.entries(data).map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ([id, details]: [string, any]) =>
          ({
            id,
            ...details,
          }) as Camera
      );

      return cameras;
    },
  });

  const cameras = camerasQuery.data || [];

  // Fetch snapshots for all cameras
  const snapshotsQuery = useQuery({
    queryKey: ['vms-snapshots', cameras],
    queryFn: async () => {
      if (!cameras || cameras.length === 0) return {};

      const snapshots: Record<string, string | null> = {};

      const initialLoadingStates = cameras.reduce(
        (acc, camera) => {
          acc[camera.id] = true;
          return acc;
        },
        {} as Record<string, boolean>
      );

      setSnapshotLoadingStates(initialLoadingStates);

      await Promise.all(
        cameras.map(async (camera) => {
          try {
            throw new Error('test');
            const response = await fetch(
              `${BASE_URL}/vms/cameras/${camera.id}/live`,
              { headers: { Authorization: sessionId } }
            );

            if (response.ok) {
              const blob = await response.blob();
              snapshots[camera.id] = URL.createObjectURL(blob);
            } else {
              snapshots[camera.id] = null;
            }
          } catch {
            snapshots[camera.id] = null;
          } finally {
            setSnapshotLoadingStates((current) => ({
              ...current,
              [camera.id]: false,
            }));
          }
        })
      );

      return snapshots;
    },
    enabled: cameras.length > 0 && !camerasQuery.isLoading,
    staleTime: Infinity,
  });

  // Clean up object URLs when component unmounts or when snapshots change
  useEffect(
    () => () => {
      if (snapshotsQuery.data) {
        Object.values(snapshotsQuery.data).forEach((url) => {
          if (url) URL.revokeObjectURL(url);
        });
      }
    },
    [snapshotsQuery.data]
  );

  return {
    cameras,
    isLoading: camerasQuery.isLoading,
    isError: camerasQuery.isError,
    error: camerasQuery.error,
    selectedCameras,
    setSelectedCameras,
    snapshots: snapshotsQuery.data || {},
    snapshotsLoading: snapshotsQuery.isLoading,
    snapshotLoadingStates,
    refetch: camerasQuery.refetch,
  };
}
