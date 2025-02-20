import { HealthStatus, HealthResult, Item } from '../utils/types';
import { apiService } from '../utils/api';
import sortStreamsByNumericId from '../utils/utils';

const checkSnapshot = async (
  stream: Item,
  sessionId: string
): Promise<Item | null> => {
  const timeoutPromise = new Promise<Item | null>((resolve) => {
    setTimeout(() => {
      resolve({
        id: stream.id,
        name: `Stream ${stream.id}`,
        status: HealthStatus.ERROR,
        reason: 'no snapshot available',
      });
    }, 5000);
  });

  try {
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
          reason: 'no snapshot available',
        };
      }

      const contentType = snapshotResponse.headers.get('content-type');
      if (!contentType || !contentType.includes('image/jpeg')) {
        return {
          id: stream.id,
          name: `Stream ${stream.id}`,
          status: HealthStatus.ERROR,
          reason: 'invalid snapshot format',
        };
      }

      return null;
    };

    return await Promise.race([snapshotPromise(), timeoutPromise]);
  } catch {
    return {
      id: stream.id,
      name: `Stream ${stream.id}`,
      status: HealthStatus.ERROR,
      reason: 'failed to check snapshot',
    };
  }
};

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

    const InvalidResults = results.filter(
      (result): result is Item => result !== null
    );
    const sortedStreamsWithoutVideo = sortStreamsByNumericId(InvalidResults);

    return {
      status:
        sortedStreamsWithoutVideo.length > 0
          ? HealthStatus.ERROR
          : HealthStatus.OK,
      details:
        sortedStreamsWithoutVideo.length > 0
          ? sortedStreamsWithoutVideo
          : undefined,
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
