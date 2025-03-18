/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

interface Camera {
  id: string;
  name: string;
}

const BASE_URL = process.env.MAIN_API_URL || '';
const DEFAULT_VMS_IP = '192.168.20.72'; // Default VMS IP

// Helper function to get auth header if needed
const getAuthHeader = (sessionId: string) => ({
  Authorization: sessionId ? `X-Session-Id ${sessionId}` : '',
});

export default function useSources(
  sessionId: string,
  vmsIp: string = DEFAULT_VMS_IP
) {
  const [selectedCameras, setSelectedCameras] = useState<string[]>([]);
  const [snapshotLoadingStates, setSnapshotLoadingStates] = useState<
    Record<string, boolean>
  >({});

  // Fetch all available cameras from the VMS
  const camerasQuery = useQuery({
    queryKey: ['vms-cameras', vmsIp, sessionId],
    queryFn: async () => {
      const response = await fetch(`${BASE_URL}/vms/${vmsIp}/cameras`, {
        headers: getAuthHeader(sessionId),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch cameras: ${response.statusText}`);
      }

      const data = await response.json();

      const cameras: Camera[] = Object.entries(data).map(([id, name]) => ({
        id,
        name: name as string,
      }));

      return cameras;
    },
  });

  const cameras = camerasQuery.data || [];

  // Fetch snapshots for all cameras
  const snapshotsQuery = useQuery({
    queryKey: ['vms-snapshots', vmsIp, cameras],
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
            const response = await fetch(
              `${BASE_URL}/vms/${vmsIp}/cameras/${camera.id}/live`,
              { headers: getAuthHeader(sessionId) }
            );

            if (response.ok) {
              const blob = await response.blob();
              snapshots[camera.id] = URL.createObjectURL(blob);
            } else {
              snapshots[camera.id] = null;
            }
          } catch (_error) {
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
