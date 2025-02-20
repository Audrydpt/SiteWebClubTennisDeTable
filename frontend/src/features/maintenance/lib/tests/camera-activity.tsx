/* eslint-disable @typescript-eslint/no-unused-vars */
// camera-activity.tsx
import { HealthStatus, HealthResult, Item } from '../utils/types';
import { apiService } from '../utils/api';
import sortStreamsByNumericId from '../utils/utils';

export default async function checkCameraActivity(
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
            name: 'Camera Activity',
            status: HealthStatus.ERROR,
            message: response.error,
          },
        ],
      };
    }

    const streams = response.data || [];

    if (streams.length === 0) {
      return {
        status: HealthStatus.ERROR,
        details: [
          {
            id: 'none',
            name: 'No Cameras',
            status: HealthStatus.ERROR,
            message: 'No cameras found',
          },
        ],
      };
    }

    const outdatedStreams: Item[] = [];

    await Promise.all(
      streams.map(async (stream) => {
        try {
          const logResponse = await apiService.getSourceLog(
            stream.id,
            sessionId
          );

          if (logResponse.error) {
            outdatedStreams.push({
              id: stream.id,
              name: `Camera ${stream.id}`,
              status: HealthStatus.ERROR,
              message: logResponse.error.includes('404')
                ? 'was not found'
                : 'is unreachable',
            });
            return;
          }

          const logLines = logResponse.data?.trim().split('\n') || [];

          if (logLines.length === 0) {
            outdatedStreams.push({
              id: stream.id,
              name: `Camera ${stream.id}`,
              status: HealthStatus.ERROR,
              message: 'is inactive (no logs)',
            });
            return;
          }

          const lastLog = logLines[logLines.length - 1];
          if (lastLog.includes('Could not connect')) {
            outdatedStreams.push({
              id: stream.id,
              name: `Camera ${stream.id}`,
              status: HealthStatus.ERROR,
              message: 'is not configured',
            });
            return;
          }

          const lastLogDate = new Date(lastLog.substring(0, 19));
          const now = new Date();
          const minutesDiff =
            (now.getTime() - lastLogDate.getTime()) / (1000 * 60);

          if (minutesDiff > 10) {
            outdatedStreams.push({
              id: stream.id,
              name: `Camera ${stream.id}`,
              status: HealthStatus.ERROR,
              message: `is not responding (${minutesDiff.toFixed(0)} min)`,
            });
          }
        } catch (error) {
          outdatedStreams.push({
            id: stream.id,
            name: `Camera ${stream.id}`,
            status: HealthStatus.ERROR,
            message: 'is unreachable',
          });
        }
      })
    );

    const sortedOutdatedStreams = sortStreamsByNumericId(outdatedStreams);
    return sortedOutdatedStreams.length > 0
      ? { status: HealthStatus.ERROR, details: sortedOutdatedStreams }
      : { status: HealthStatus.OK };
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
