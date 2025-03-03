/* eslint-disable */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Camera } from '../lib/types';

// Define our base API URL from environment
const BASE_URL = process.env.BACK_API_URL;

// Helper function to get auth header
const getAuthHeader = (sessionId: string) => ({
  Authorization: `X-Session-Id ${sessionId}`,
});

// Extend the Camera type with the source property we need
interface StreamCamera extends Camera {
  source: string;
}

export default function useSources(sessionId: string) {
  const [selectedCameras, setSelectedCameras] = useState<string[]>([]);

  // Fetch all available streams
  const streamsQuery = useQuery({
    queryKey: ['streams', sessionId],
    queryFn: async () => {
      const response = await fetch(`${BASE_URL}/streams`, {
        headers: getAuthHeader(sessionId),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch streams: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    },
  });

  // Transform streams data into cameras format
  const cameras: StreamCamera[] = streamsQuery.data
    ? streamsQuery.data.map((stream: Record<string, unknown>) => ({
      id: stream.id,
      name: stream.name || `Stream ${stream.id}`,
      source: stream.source || stream.id,
      status: stream.status || 'unknown',
    }))
    : [];

  // Fetch snapshots for all cameras
  const snapshotsQuery = useQuery({
    queryKey: ['snapshots', cameras],
    queryFn: async () => {
      if (!cameras || cameras.length === 0) return {};

      const snapshots: Record<string, string | null> = {};

      await Promise.all(
        cameras.map(async (camera) => {
          try {
            const response = await fetch(
              `${BASE_URL}/snapshot/${camera.source}?width=200&height=150`,
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
          }
        })
      );

      return snapshots;
    },
    enabled: cameras.length > 0 && !streamsQuery.isLoading,
  });

  return {
    cameras,
    isLoading: streamsQuery.isLoading,
    isError: streamsQuery.isError,
    error: streamsQuery.error,
    selectedCameras,
    setSelectedCameras,
    snapshots: snapshotsQuery.data || {},
    snapshotsLoading: snapshotsQuery.isLoading,
    refetch: streamsQuery.refetch,
  };
}
