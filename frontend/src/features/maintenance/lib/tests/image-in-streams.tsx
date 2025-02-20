/* eslint-disable @typescript-eslint/no-unused-vars */
interface StreamItem {
  id: string;
  source: string;
  application: string;
  name?: string;
}

interface DetailedStreamItem {
  id: string;
  name: string;
  reason: string;
}

export default async function checkImageInStreams(
  username: string = 'administrator',
  password: string = 'ACIC'
): Promise<{
  status: 'ok' | 'error';
  details?: DetailedStreamItem[];
}> {
  try {
    const streamsResponse = await fetch(`${process.env.BACK_API_URL}/streams`, {
      headers: {
        Authorization: `Basic ${btoa(`${username}:${password}`)}`,
      },
    });

    if (!streamsResponse.ok) {
      throw new Error('Failed to fetch streams');
    }

    const streams: StreamItem[] = await streamsResponse.json();
    const streamsWithoutVideo: DetailedStreamItem[] = [];

    const checkSnapshot = async (stream: StreamItem) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const snapshotResponse = await fetch(
          `${process.env.BACK_API_URL}/snapshot/${stream.source}?width=32&height=32`,
          {
            headers: {
              Authorization: `Basic ${btoa(`${username}:${password}`)}`,
            },
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);

        if (snapshotResponse.status === 408) {
          return {
            id: stream.source,
            name: `Stream ${stream.source}`,
            reason: 'no snapshot available',
          };
        }

        if (snapshotResponse.headers.get('content-type') !== 'image/jpeg') {
          return {
            id: stream.source,
            name: `Stream ${stream.source}`,
            reason: 'invalid snapshot format',
          };
        }

        return null;
      } catch (error) {
        return {
          id: stream.source,
          name: `Stream ${stream.source}`,
          reason:
            error instanceof Error && error.name === 'AbortError'
              ? 'no snapshot available'
              : 'failed to check snapshot',
        };
      }
    };

    // Wait for all promises with individual timeouts
    const results = await Promise.all(
      streams.map((stream) => checkSnapshot(stream))
    );

    // Filter out null results and add to streamsWithoutVideo
    results.forEach((result) => {
      if (result) {
        streamsWithoutVideo.push(result);
      }
    });

    const sortedStreamsWithoutVideo = streamsWithoutVideo.sort((a, b) => {
      const idA = parseInt(a.id, 10);
      const idB = parseInt(b.id, 10);
      return Number.isNaN(idA) || Number.isNaN(idB) ? 0 : idA - idB;
    });

    return {
      status: sortedStreamsWithoutVideo.length > 0 ? 'error' : 'ok',
      details:
        sortedStreamsWithoutVideo.length > 0
          ? sortedStreamsWithoutVideo
          : undefined,
    };
  } catch (error) {
    return {
      status: 'error',
      details: [
        {
          id: 'error',
          name: 'System Error',
          reason: 'failed to check video feeds',
        },
      ],
    };
  }
}
