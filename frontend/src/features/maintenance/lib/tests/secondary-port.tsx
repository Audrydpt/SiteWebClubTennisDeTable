import { apiService } from '../utils/api';
import { HealthResult, HealthStatus } from '../utils/types';

export default async function checkSecondaryServerHealth(
  sessionId: string
): Promise<HealthResult> {
  try {
    const response = await apiService.checkSecondarySeverHealth(sessionId);

    if (!response.ok) {
      return {
        status: HealthStatus.ERROR,
        details: [
          {
            id: 'error',
            name: 'External Processor',
            status: HealthStatus.ERROR,
            message: `External Processor returned status ${response.status}`,
          },
        ],
      };
    }

    const data = await response.json();

    if (data.status === 'error') {
      return {
        status: HealthStatus.ERROR,
        details: [
          {
            id: 'error',
            name: 'External Processor',
            status: HealthStatus.ERROR,
            message: data.message || 'External Processor is not responding',
          },
        ],
      };
    }

    return { status: HealthStatus.OK };
  } catch (error) {
    return {
      status: HealthStatus.ERROR,
      details: [
        {
          id: 'error',
          name: 'External Processor',
          status: HealthStatus.ERROR,
          message:
            error instanceof Error
              ? error.message
              : 'External Processor is unreachable',
        },
      ],
    };
  }
}
