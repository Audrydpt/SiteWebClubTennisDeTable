import { useEffect, useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import useServerStatus from '@/hooks/use-server-status';

export default function RebootStatus({
  onRebootComplete,
}: {
  onRebootComplete: () => void;
}) {
  const [timeoutCount, setTimeoutCount] = useState(30);
  const { isOnline, startPolling } = useServerStatus();

  const handleTimeout = useCallback(() => {
    if (timeoutCount <= 0) {
      onRebootComplete();
    }
  }, [timeoutCount, onRebootComplete]);

  useEffect(() => {
    const stopPolling = startPolling(onRebootComplete);
    const timer = setInterval(() => {
      setTimeoutCount((prev) => prev - 1);
    }, 1000);

    return () => {
      clearInterval(timer);
      stopPolling();
    };
  }, [onRebootComplete, startPolling]);

  useEffect(() => {
    handleTimeout();
  }, [handleTimeout]);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-lg font-medium">Rebooting server...</p>
          <p className="text-sm text-muted-foreground">
            {isOnline
              ? 'Server is back online!'
              : `Waiting for server to come back online (${timeoutCount}s)`}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
