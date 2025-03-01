import { useMutation, useQuery } from '@tanstack/react-query';

import { useAuth } from '@/providers/auth-context';
import { apiService } from '../lib/utils/api';

export interface Stream {
  id: string;
  name: string;
}

// Fonction utilitaire pour convertir un Blob en base64
const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

export function useBackup() {
  const { sessionId } = useAuth();

  // Query pour récupérer la liste des streams disponibles
  const {
    data: streams = [],
    isLoading,
    error,
    refetch: refetchStreams,
  } = useQuery<Stream[]>({
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

  // Mutation pour générer le backup
  const backupMutation = useMutation<
    string, // retourne un backup (restorePoint) ID
    Error,
    { global: boolean; selectedStreams: string[] }
  >({
    mutationFn: async ({ global, selectedStreams }) => {
      // Appel vers l'API pour générer le backup
      const backupResponse = await fetch(`${process.env.BACK_API_URL}/backup`, {
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
      if (!backupResponse.ok) {
        throw new Error(
          `Failed to generate backup: ${backupResponse.statusText}`
        );
      }

      // Récupération du blob et détermination du nom de fichier
      const blob = await backupResponse.blob();
      const contentDisposition = backupResponse.headers.get(
        'Content-Disposition'
      );
      const fileName =
        contentDisposition?.split('filename=')[1]?.replace(/"/g, '') ||
        `backup_${new Date().toISOString()}.mvb`;

      // Conversion du blob en base64 pour l'upload du backup
      const base64Data = await blobToBase64(blob);

      // Post vers l'API pour enregistrer le backup (récupération du restorePoint ID)
      const restoreResponse = await fetch(
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
      if (!restoreResponse.ok) {
        throw new Error(
          `Failed to upload backup: ${restoreResponse.statusText}`
        );
      }
      const { restorePoint } = await restoreResponse.json();

      // Déclenche la sauvegarde du fichier backup sur le poste client
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      return restorePoint;
    },
  });

  return {
    streams,
    isLoading,
    error,
    refetchStreams,
    generateBackup: backupMutation.mutateAsync,
    backupStatus: backupMutation.status,
    backupError: backupMutation.error,
  };
}
