import { HealthStatus, HealthResult, Item } from '../utils/types';
import { apiService } from '../utils/api';

export default async function checkSecondaryServerHealth(
  sessionId: string
): Promise<HealthResult> {
  try {
    const response = await apiService.checkSecondarySeverHealth(sessionId);

    if (!response.ok) {
      const errorItem: Item = {
        id: 'error',
        name: 'External Processor',
        status: HealthStatus.ERROR,
        message: `External Processorreturned status ${response.status}`,
      };
      return {
        status: HealthStatus.ERROR,
        details: [errorItem],
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
