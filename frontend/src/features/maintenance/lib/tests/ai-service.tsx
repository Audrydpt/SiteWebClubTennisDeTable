import { apiService } from '../utils/api';
import { HealthResult, HealthStatus, Item } from '../utils/types';

function createErrorResult(message: string): HealthResult {
  const errorItem: Item = {
    id: 'error',
    name: 'AI Service',
    status: HealthStatus.ERROR,
    message,
  };
  return {
    status: HealthStatus.ERROR,
    details: [errorItem],
  };
}

export default async function checkAIService(
  sessionId: string
): Promise<HealthResult> {
  try {
    const response = await apiService.checkAIHealth(sessionId);
    if (!response.ok) {
      return createErrorResult(`AI Service returned status ${response.status}`);
    }

    const data = await response.json();
    if (data.status === 'error') {
      return createErrorResult(data.message || 'AI Service is not responding');
    }

    return { status: HealthStatus.OK };
  } catch (error) {
    return createErrorResult(
      error instanceof Error ? error.message : 'AI Service is unreachable'
    );
  }
}
