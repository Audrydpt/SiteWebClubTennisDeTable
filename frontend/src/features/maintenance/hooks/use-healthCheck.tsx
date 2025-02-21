import { useState } from 'react';
import checkAIService from '../lib/tests/ai-service';
import checkCameraAnomaly from '../lib/tests/camera-anomaly';
import checkCameraActivity from '../lib/tests/camera-activity';
import checkImageInStreams from '../lib/tests/image-in-streams';
import checkAverageFps from '../lib/tests/average-fps';
import checkSecondaryServerHealth from '../lib/tests/secondary-port';
import {
  HealthStatus,
  HealthResult,
  HealthState,
  ServiceType,
} from '../lib/utils/types';

export default function useHealthCheck() {
  const [healthCheckState, setHealthCheckState] = useState<HealthState>({
    progress: 0,
    running: false,
    statuses: {},
  });

  const tests: Array<{
    name: ServiceType;
    fn: (sessionId: string) => Promise<HealthResult>;
  }> = [
    {
      name: ServiceType.AI_SERVICE,
      fn: checkAIService,
    },
    {
      name: ServiceType.CAMERA_ANOMALY,
      fn: checkCameraAnomaly,
    },
    {
      name: ServiceType.CAMERA_ACTIVITY,
      fn: checkCameraActivity,
    },
    {
      name: ServiceType.IMAGE_IN_STREAMS,
      fn: checkImageInStreams,
    },
    {
      name: ServiceType.AVERAGE_FPS,
      fn: checkAverageFps,
    },
    {
      name: ServiceType.SECONDARY,
      fn: checkSecondaryServerHealth,
    },
  ];

  async function startHealthCheck(sessionId: string) {
    if (healthCheckState.running) return;

    setHealthCheckState({ progress: 0, running: true, statuses: {} });

    const results = await Promise.all(
      tests.map(async (test, index) => {
        try {
          const timeoutPromise = new Promise<HealthResult>((_, reject) => {
            setTimeout(() => {
              reject(new Error('Test timed out after 10 seconds'));
            }, 10000);
          });

          const testPromise = test.fn(sessionId);
          const result = await Promise.race([testPromise, timeoutPromise]);

          const progress = ((index + 1) / tests.length) * 100;

          setHealthCheckState(
            (prev: HealthState): HealthState => ({
              ...prev,
              statuses: { ...prev.statuses, [test.name]: result },
              progress,
            })
          );

          return { name: test.name, result };
        } catch (error: unknown) {
          const errorResult: HealthResult = {
            status: HealthStatus.ERROR,
            details: [
              {
                id: 'error',
                name: test.name,
                status: HealthStatus.ERROR,
                message:
                  error instanceof Error ? error.message : 'Unknown error',
              },
            ],
          };

          const progress = ((index + 1) / tests.length) * 100;

          setHealthCheckState(
            (prev: HealthState): HealthState => ({
              ...prev,
              statuses: { ...prev.statuses, [test.name]: errorResult },
              progress,
            })
          );

          return { name: test.name, result: errorResult };
        }
      })
    );
    setHealthCheckState(
      (prev: HealthState): HealthState => ({
        ...prev,
        running: false,
        progress: 100,
        statuses: Object.fromEntries(
          results.map(({ name, result }) => [name, result])
        ),
      })
    );
  }

  return { ...healthCheckState, startHealthCheck };
}
