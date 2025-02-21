// camera-anomaly.tsx
import { HealthStatus, HealthResult, Item } from '../utils/types';
import { apiService } from '../utils/api';
import sortStreamsByNumericId from '../utils/utils';

export default async function checkCameraAnomaly(
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
            name: 'Camera Anomaly',
            status: HealthStatus.ERROR,
            message: response.error,
          },
        ],
      };
    }

    const streams = response.data || [];
    const nullStreams = streams.filter(
      (stream) => stream.application === 'MvNullApplication'
    );
    const anomalyStreams: Item[] = nullStreams.map((stream) => ({
      id: stream.id,
      name: `Camera ${stream.id}`,
      status: HealthStatus.WARNING,
      reason: 'is not configured properly',
    }));

    const sortedAnomalyStreams = sortStreamsByNumericId(anomalyStreams);

    let status: HealthStatus;
    if (nullStreams.length === 0) {
      status = HealthStatus.OK;
    } else if (nullStreams.length < streams.length) {
      status = HealthStatus.WARNING;
    } else {
      status = HealthStatus.ERROR;
      sortedAnomalyStreams.unshift({
        id: 'all',
        name: 'All Cameras',
        status: HealthStatus.ERROR,
        reason: 'No cameras are configured',
      });
    }

    return {
      status,
      details:
        sortedAnomalyStreams.length > 0 ? sortedAnomalyStreams : undefined,
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
