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

export default async function checkCameraAnomaly(
  username: string = 'administrator',
  password: string = 'ACIC'
): Promise<{
  status: 'ok' | 'warning' | 'error';
  details?: DetailedStreamItem[];
}> {
  try {
    const response = await fetch(`${process.env.BACK_API_URL}/streams`, {
      headers: {
        Authorization: `Basic ${btoa(`${username}:${password}`)}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch streams');
    }

    const streams: StreamItem[] = await response.json();
    const nullStreams = streams.filter(
      (stream) => stream.application === 'MvNullApplication'
    );
    const anomalyStreams: DetailedStreamItem[] = nullStreams
      .map((stream) => ({
        id: stream.id,
        name: `Camera ${stream.id}`,
        reason: 'is not configured properly',
      }))
      .sort((a, b) => {
        const idA = parseInt(a.id, 10);
        const idB = parseInt(b.id, 10);
        return Number.isNaN(idA) || Number.isNaN(idB) ? 0 : idA - idB;
      });

    let status: 'ok' | 'warning' | 'error';
    if (nullStreams.length === 0) {
      status = 'ok';
    } else if (nullStreams.length < streams.length) {
      status = 'warning';
    } else {
      status = 'error';
      anomalyStreams.unshift({
        id: 'all',
        name: 'All Cameras',
        reason: 'No cameras are configured',
      });
    }

    return {
      status,
      details: anomalyStreams.length > 0 ? anomalyStreams : undefined,
    };
  } catch (error) {
    return {
      status: 'error',
      details: [
        {
          id: 'error',
          name: 'System Error',
          reason: 'Failed to check camera configuration',
        },
      ],
    };
  }
}
