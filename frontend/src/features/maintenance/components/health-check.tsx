import { useState } from 'react';
import { HeartPulse, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

function HealthCheck() {
  const [progress, setProgress] = useState(0);
  const [running, setRunning] = useState(false);

  const startHealthCheck = () => {
    if (running) return;
    setRunning(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setRunning(false);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
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
      </CardContent>
    </Card>
  );
}

export default HealthCheck;
