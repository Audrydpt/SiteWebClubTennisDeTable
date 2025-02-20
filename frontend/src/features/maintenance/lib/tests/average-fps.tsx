import { HealthStatus, HealthResult, Item } from '../utils/types';
import { apiService } from '../utils/api';
import sortStreamsByNumericId from '../utils/utils';

const isErrorLog = (logLine: string): boolean =>
  logLine.includes('Could not connect') ||
  logLine.includes('Failed to connect') ||
  logLine.includes('Connection refused');

const extractFps = (logLine: string): number => {
  const match = logLine.match(/Frames decoded: (\d+\.\d+)\/s/);
  return match ? parseFloat(match[1]) : 0;
};

const calculateAverageFps = (logLines: string[]): number | null => {
  const validLines = logLines.filter(
    (line) => !isErrorLog(line) && line.includes('Frames decoded')
  );
  if (validLines.length === 0) return null;

  const lastThreeLines = validLines.slice(-3);
  const fpsValues = lastThreeLines.map(extractFps);
  const sum = fpsValues.reduce((acc, val) => acc + val, 0);
  return sum / fpsValues.length;
};

const getStatusForFps = (fps: number): HealthStatus => {
  if (fps === 0 || (fps >= 0.9 && fps <= 1)) return HealthStatus.ERROR;
  if (fps <= 5) return HealthStatus.WARNING;
  return HealthStatus.OK;
};

export default async function checkAverageFps(
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
            name: 'FPS Check',
            status: HealthStatus.ERROR,
            message: response.error,
          },
        ],
      };
    }

    const streams = response.data || [];
    const fpsResults: Item[] = [];

    await Promise.all(
      streams.map(async (stream) => {
        const logResponse = await apiService.getSourceLog(stream.id, sessionId);

        if (logResponse.error) {
          if (
            logResponse.error.includes('404') ||
            logResponse.error.includes('Could not connect')
          ) {
            return;
          }
          fpsResults.push({
            id: stream.id,
            name: `Camera ${stream.id}`,
            status: HealthStatus.ERROR,
            message: 'Failed to retrieve FPS data',
          });
          return;
        }

        const logLines = logResponse.data?.trim().split('\n') || [];
        if (logLines.length === 0) return;

        if (logLines.some(isErrorLog)) {
          return;
        }

        const averageFps = calculateAverageFps(logLines);
        if (averageFps === null) return;

        const status = getStatusForFps(averageFps);
        if (status !== HealthStatus.OK) {
          fpsResults.push({
            id: stream.id,
            name: `Camera ${stream.id}`,
            status,
            message: `Average FPS: ${averageFps.toFixed(2)}/s`,
          });
        }
      })
    );

    const sortedResults = sortStreamsByNumericId(fpsResults);
    const worstStatus = sortedResults.reduce(
      (acc, curr) =>
        curr.status === HealthStatus.ERROR ? HealthStatus.ERROR : acc,
      HealthStatus.OK
    );

    return {
      status: worstStatus,
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
