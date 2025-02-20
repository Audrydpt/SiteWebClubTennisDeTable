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

export default async function checkCameraActivity(
  username: string = 'administrator',
  password: string = 'ACIC'
): Promise<{ status: 'ok' | 'error'; details?: DetailedStreamItem[] }> {
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

    if (streams.length === 0) {
      return {
        status: 'error',
        details: [
          {
            id: 'none',
            name: 'No Cameras',
            reason: 'No cameras found',
          },
        ],
      };
    }

    const outdatedStreams: DetailedStreamItem[] = [];

    await Promise.all(
      streams.map(async (stream) => {
        try {
          const controller = new AbortController();
          const { signal } = controller;

          const logResponse = await new Promise<Response>((resolve) => {
            fetch(`${process.env.BACK_API_URL}/sourceLog/${stream.source}`, {
              headers: {
                Authorization: `Basic ${btoa(`${username}:${password}`)}`,
              },
              signal,
            })
              .then(resolve)
              .catch(() => {
                resolve(new Response(null, { status: 404 }));
              });
          });

          if (logResponse.status === 404) {
            outdatedStreams.push({
              id: stream.id,
              name: `Camera ${stream.id}`,
              reason: 'is unreachable',
            });
            return;
          }

          if (!logResponse.ok) {
            outdatedStreams.push({
              id: stream.id,
              name: `Camera ${stream.id}`,
              reason: 'is OFF',
            });
            return;
          }

          const logText = await logResponse.text();
          const logLines = logText.trim().split('\n');

          if (logLines.length === 0) {
            outdatedStreams.push({
              id: stream.id,
              name: `Camera ${stream.id}`,
              reason: 'is inactive (no logs)',
            });
            return;
          }

          const lastLog = logLines[logLines.length - 1];
          const lastLogDate = new Date(lastLog.substring(0, 19));
          const now = new Date();
          const minutesDiff =
            (now.getTime() - lastLogDate.getTime()) / (1000 * 60);

          if (minutesDiff > 10) {
            outdatedStreams.push({
              id: stream.id,
              name: `Camera ${stream.id}`,
              reason: `is not responding (${minutesDiff.toFixed(0)} min)`,
            });
          }
        } catch (error) {
          outdatedStreams.push({
            id: stream.id,
            name: `Camera ${stream.id}`,
            reason: 'is unreachable',
          });
        }
      })
    );

    const sortedOutdatedStreams = outdatedStreams.sort((a, b) => {
      const idA = parseInt(a.id, 10);
      const idB = parseInt(b.id, 10);
      return Number.isNaN(idA) || Number.isNaN(idB) ? 0 : idA - idB;
    });

    return sortedOutdatedStreams.length > 0
      ? { status: 'error', details: sortedOutdatedStreams }
      : { status: 'ok' };
  } catch (error) {
    return {
      status: 'error',
      details: [
        {
          id: 'error',
          name: 'System Error',
          reason: 'Failed to check camera activity',
        },
      ],
    };
  }
}
