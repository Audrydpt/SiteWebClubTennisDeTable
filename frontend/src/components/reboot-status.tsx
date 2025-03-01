import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import useServerStatus from '@/hooks/use-server-status';
import { useAuth } from '@/providers/auth-context';

interface RebootStatusProps {
  onRebootComplete: () => void;
}

export default function RebootStatus({ onRebootComplete }: RebootStatusProps) {
  const { sessionId } = useAuth();
  const [timeoutCount, setTimeoutCount] = useState(20);
  const { isOnline } = useServerStatus(sessionId ?? '');

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeoutCount((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (timeoutCount === 0 && !isOnline) {
      setTimeoutCount(20);
    }
  }, [timeoutCount, isOnline]);

  useEffect(() => {
    if (isOnline) {
      setTimeout(() => {
        onRebootComplete();
        window.location.reload();
      }, 2000);
    }
  }, [isOnline, onRebootComplete]);

  return (
    <Dialog open modal>
      <DialogContent className="max-w-md bg-muted text-foreground">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-lg font-medium">Rebooting server...</p>
          <p className="text-sm">
            {isOnline
              ? 'Server is back online! Closing soon...'
              : `Waiting for server to come back online (${timeoutCount}s)`}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
