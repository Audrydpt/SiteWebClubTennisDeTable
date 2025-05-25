/* eslint-disable no-unreachable */
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

interface Camera {
  id: string;
  name: string;
  hostName?: string;
  webServerUri?: string;
}

const BASE_URL = process.env.MAIN_API_URL || '';

export default function useSources(initialSelectedCameras: string[] = []) {
  const [selectedCameras, setSelectedCameras] = useState<string[]>(
    initialSelectedCameras
  );

  // Fetch all available cameras from the VMS
  const camerasQuery = useQuery({
    queryKey: ['vms-cameras'],
    queryFn: async () => {
      const response = await fetch(`${BASE_URL}/vms/cameras`);

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

  return {
    cameras,
    isLoading: camerasQuery.isLoading,
    isError: camerasQuery.isError,
    error: camerasQuery.error,
    selectedCameras,
    setSelectedCameras,
  };
}
