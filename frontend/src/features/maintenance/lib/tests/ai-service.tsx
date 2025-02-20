import { HealthStatus, HealthResult, Item } from '../utils/types';
import { apiService } from '../utils/api';

export default async function checkAIService(
  sessionId: string
): Promise<HealthResult> {
  try {
    const response = await apiService.checkAIHealth(sessionId);

    if (!response.ok) {
      const errorItem: Item = {
        id: 'error',
        name: 'AI Service',
        status: HealthStatus.ERROR,
        message: `AI Service returned status ${response.status}`,
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
            name: 'AI Service',
            status: HealthStatus.ERROR,
            message: data.message || 'AI Service is not responding',
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
          name: 'AI Service',
          status: HealthStatus.ERROR,
          message:
            error instanceof Error
              ? error.message
              : 'AI Service is unreachable',
        },
      ],
    };
  }
}
