import { apiService } from '../utils/api';
import { HealthResult, HealthStatus, Item } from '../utils/types';
import sortStreamsByNumericId from '../utils/utils';

async function checkSnapshot(
  stream: Item,
  sessionId: string
): Promise<Item | null> {
  // Timeout : si aucune réponse dans 5 secondes, on considère le snapshot comme indisponible
  const timeoutPromise = new Promise<Item | null>((resolve) => {
    setTimeout(() => {
      resolve({
        id: stream.id,
        name: `Stream ${stream.id}`,
        status: HealthStatus.ERROR,
        message: 'has no snapshot available',
      });
    }, 5000);
  });

  const snapshotPromise = async (): Promise<Item | null> => {
    const snapshotResponse = await apiService.getSnapshot(
      stream.source || '',
      sessionId
    );

    if (!snapshotResponse.ok || snapshotResponse.status === 408) {
      return {
        id: stream.id,
        name: `Stream ${stream.id}`,
        status: HealthStatus.ERROR,
        message: 'no snapshot available',
      };
    }

    const contentType = snapshotResponse.headers.get('content-type');
    if (!contentType || !contentType.includes('image/jpeg')) {
      return {
        id: stream.id,
        name: `Stream ${stream.id}`,
        status: HealthStatus.ERROR,
        message: 'invalid snapshot format',
      };
    }
    // Snapshot ok, donc aucun problème pour ce stream
    return null;
  };

  try {
    // On renvoie le résultat de snapshotPromise ou celui du timeout, selon la première réponse
    return await Promise.race([snapshotPromise(), timeoutPromise]);
  } catch {
    return {
      id: stream.id,
      name: `Stream ${stream.id}`,
      status: HealthStatus.ERROR,
      message: 'failed to check snapshot',
    };
  }
}

export default async function checkImageInStreams(
  sessionId: string
): Promise<HealthResult> {
  try {
    const response = await apiService.getStreams(sessionId);
    if (response.error) {
      return {
        status: HealthStatus.ERROR,
        details: [
          {
            id: 'error',
            name: 'Stream Error',
            status: HealthStatus.ERROR,
            message: response.error,
          },
        ],
      };
    }

    const streams = response.data || [];
    const results = await Promise.all(
      streams.map((stream) => checkSnapshot(stream, sessionId))
    );

    const invalidResults = results.filter(
      (result): result is Item => result !== null
    );
    const sortedResults = sortStreamsByNumericId(invalidResults);

    return {
      status: sortedResults.length > 0 ? HealthStatus.ERROR : HealthStatus.OK,
      details: sortedResults.length > 0 ? sortedResults : undefined,
    };
  } catch (error) {
    return {
      status: HealthStatus.ERROR,
      details: [
        {
          id: 'error',
          name: 'System Error',
          status: HealthStatus.ERROR,
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      ],
    };
  }
}
