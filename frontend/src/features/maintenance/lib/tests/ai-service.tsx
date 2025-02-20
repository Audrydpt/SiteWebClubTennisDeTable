import { HealthStatus, HealthResult, Item } from '../utils/types';

export default async function checkAIService(
  sessionId?: string
): Promise<HealthResult> {
  try {
    const response = await fetch(
      `${process.env.MAIN_API_URL}/health/aiServer/192.168.20.145`,
      {
        headers: {
          Authorization: `X-Session-Id ${sessionId}`,
        },
      }
    );

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
      const errorItem: Item = {
        id: 'error',
        name: 'AI Service',
        status: HealthStatus.ERROR,
        message: data.message || 'AI Service is not responding',
      };
      return {
        status: HealthStatus.ERROR,
        details: [errorItem],
      };
    }

    return { status: HealthStatus.OK };
  } catch (error) {
    const errorItem: Item = {
      id: 'error',
      name: 'AI Service',
      status: HealthStatus.ERROR,
      message:
        error instanceof Error ? error.message : 'AI Service is unreachable',
    };
    return {
      status: HealthStatus.ERROR,
      details: [errorItem],
    };
  }
}
