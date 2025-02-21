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
        name: 'Secondary Server',
        status: HealthStatus.ERROR,
        message: `Secondary Server returned status ${response.status}`,
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
            name: 'Secondary Server',
            status: HealthStatus.ERROR,
            message: data.message || 'Secondary Server is not responding',
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
          name: 'Secondary Server',
          status: HealthStatus.ERROR,
          message:
            error instanceof Error
              ? error.message
              : 'Secondary Server is unreachable',
        },
      ],
    };
  }
}
