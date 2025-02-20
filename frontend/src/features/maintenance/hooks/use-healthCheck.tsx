import { useState } from 'react';
import checkAIService from '../components/health-tests/ai-service';
import checkCameraAnomaly from '../components/health-tests/camera-anomaly';
import checkCameraActivity from '../components/health-tests/camera-activity';
import checkImageInStreams from '../components/health-tests/image-in-streams.tsx';

type HealthStatus = 'ok' | 'warning' | 'error';

interface StreamItem {
  id: string;
  name: string;
  status: HealthStatus;
  message?: string;
  [key: string]: string | undefined;
}

type HealthDetails = StreamItem[];

interface HealthResult {
  status: HealthStatus;
  details?: HealthDetails | { message: string }[];
}

interface HealthState {
  progress: number;
  running: boolean;
  statuses: Record<
    string,
    {
      status: HealthStatus;
      details?: HealthDetails | { message: string }[];
    }
  >;
}

export default function useHealthCheck() {
  const [healthCheckState, setHealthCheckState] = useState<HealthState>({
    progress: 0,
    running: false,
    statuses: {},
  });

  const tests = [
    { name: 'ai-service', fn: checkAIService },
    { name: 'camera-anomaly', fn: checkCameraAnomaly },
    { name: 'camera-activity', fn: checkCameraActivity },
    { name: 'image-in-streams', fn: checkImageInStreams },
  ];

  async function startHealthCheck() {
    if (healthCheckState.running) {
      return;
    }

    setHealthCheckState({ progress: 0, running: true, statuses: {} });

    const results = await Promise.all(
      tests.map(async (test, index) => {
        try {
          const timeoutPromise = new Promise<HealthResult>((_, reject) => {
            setTimeout(() => {
              reject(new Error('Test timed out after 10 seconds'));
            }, 10000);
          });

          const testPromise = test.fn() as Promise<HealthResult>;
          const result = await Promise.race([testPromise, timeoutPromise]);

          const transformedResult: HealthResult = {
            status: result.status,
          };

          if (result.status === 'warning' && result.details?.length) {
            transformedResult.details = result.details;
          } else if (result.status === 'error') {
            transformedResult.details = result.details?.length
              ? result.details
              : [{ message: `Error in ${test.name}, no details.` }];
          }

          const progress = ((index + 1) / tests.length) * 100;

          setHealthCheckState((prev) => ({
            ...prev,
            statuses: {
              ...prev.statuses,
              [test.name]: transformedResult,
            },
            progress,
          }));

          return { name: test.name, result: transformedResult };
        } catch (error: unknown) {
          const errorResult: HealthResult = {
            status: 'error',
            details: [
              {
                message: `${test.name}: ${
                  error instanceof Error ? error.message : 'Unknown error'
                }`,
              },
            ],
          };

          setHealthCheckState((prev) => ({
            ...prev,
            statuses: {
              ...prev.statuses,
              [test.name]: errorResult,
            },
            progress: ((index + 1) / tests.length) * 100,
          }));

          return { name: test.name, result: errorResult };
        }
      })
    );

    setHealthCheckState((prev) => ({
      ...prev,
      running: false,
      statuses: Object.fromEntries(
        results.map(({ name, result }) => [name, result])
      ),
    }));
  }

  return { ...healthCheckState, startHealthCheck };
}
