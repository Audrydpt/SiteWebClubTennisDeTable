/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState } from 'react';
import { HeartPulse, Play, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

function HealthCheck() {
  const [progress, setProgress] = useState(0);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState<'pending' | 'ok' | 'error'>('pending');

  const startHealthCheck = async () => {
    if (running) return;
    setRunning(true);
    setProgress(0);
    setStatus('pending');

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 300);

    try {
      const response = await fetch(
        'https://192.168.20.145/front-api/health/aiServer'
      );
      const data = await response.json();
      setStatus(data.status);
    } catch (error) {
      setStatus('error');
    } finally {
      setRunning(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <HeartPulse className="mr-2" />
          System Health Check
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Button
          variant="outline"
          className="w-full"
          onClick={startHealthCheck}
          disabled={running}
        >
          <Play className="mr-2" />
          {running ? 'Running...' : 'Run Health Check'}
        </Button>
        {progress > 0 && <Progress value={progress} className="mt-4" />}
        {status !== 'pending' && (
          <div className="mt-4 flex items-center">
            {status === 'ok' ? (
              <>
                <CheckCircle className="text-green-500 mr-2" />
                <span className="text-green-500">AI Service is UP</span>
              </>
            ) : (
              <>
                <XCircle className="text-red-500 mr-2" />
                <span className="text-red-500">AI Service is DOWN</span>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default HealthCheck;
