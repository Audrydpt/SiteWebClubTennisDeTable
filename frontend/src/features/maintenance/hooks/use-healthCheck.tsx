import { useState } from 'react';

import checkAIService from '../lib/tests/ai-service';
import checkAverageFps from '../lib/tests/average-fps';
import checkCameraActivity from '../lib/tests/camera-activity';
import checkCameraAnomaly from '../lib/tests/camera-anomaly';
import checkImageInStreams from '../lib/tests/image-in-streams';
import checkSecondaryServerHealth from '../lib/tests/secondary-port';
import {
  HealthResult,
  HealthState,
  HealthStatus,
  ServiceType,
} from '../lib/utils/types';

const tests: Array<{
  name: ServiceType;
  fn: (sessionId: string) => Promise<HealthResult>;
}> = [
  { name: ServiceType.AI_SERVICE, fn: checkAIService },
  { name: ServiceType.CAMERA_ANOMALY, fn: checkCameraAnomaly },
  { name: ServiceType.CAMERA_ACTIVITY, fn: checkCameraActivity },
  { name: ServiceType.IMAGE_IN_STREAMS, fn: checkImageInStreams },
  { name: ServiceType.AVERAGE_FPS, fn: checkAverageFps },
  { name: ServiceType.SECONDARY, fn: checkSecondaryServerHealth },
];

async function executeTest(
  test: { name: ServiceType; fn: (sessionId: string) => Promise<HealthResult> },
  sessionId: string
): Promise<HealthResult> {
  try {
    const timeoutPromise = new Promise<HealthResult>((_, reject) =>
      // eslint-disable-next-line no-promise-executor-return
      setTimeout(() => {
        reject(new Error('Test timed out after 10 seconds'));
      }, 10000)
    );
    const result = await Promise.race([test.fn(sessionId), timeoutPromise]);
    return result;
  } catch (error) {
    return {
      status: HealthStatus.ERROR,
      details: [
        {
          id: 'error',
          name: test.name,
          status: HealthStatus.ERROR,
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      ],
    };
  }
}

export default function useHealthCheck() {
  const [healthCheckState, setHealthCheckState] = useState<HealthState>({
    progress: 0,
    running: false,
    statuses: {},
  });

  async function startHealthCheck(sessionId: string) {
    if (healthCheckState.running) return;

    setHealthCheckState({ progress: 0, running: true, statuses: {} });
    const totalTests = tests.length;
    let completed = 0;

    // Exécute chaque test en parallèle et met à jour la progressbar dès qu'un test se termine
    const promises = tests.map((test) =>
      executeTest(test, sessionId).then((result) => {
        completed += 1;
        setHealthCheckState((prev) => ({
          ...prev,
          progress: Math.round((completed / totalTests) * 100),
          statuses: { ...prev.statuses, [test.name]: result },
        }));
        return { name: test.name, result };
      })
    );

    const results = await Promise.all(promises);

    // Mise à jour finale de l'état lorsque tous les tests sont terminés
    setHealthCheckState((prev) => ({
      ...prev,
      running: false,
      progress: 100,
      statuses: Object.fromEntries(
        results.map(({ name, result }) => [name, result])
      ),
    }));
  }

  return { ...healthCheckState, startHealthCheck };
}
