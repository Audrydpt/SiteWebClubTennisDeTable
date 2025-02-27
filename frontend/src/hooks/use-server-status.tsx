import { useState, useEffect } from 'react';

export default function useServerStatus(sessionId: string) {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        const response = await fetch(`${process.env.BACK_API_URL}/streams`, {
          headers: {
            Authorization: `X-Session-Id ${sessionId}`,
          },
        });
        return response.ok;
      } catch {
        return false;
      }
    };

    const interval = setInterval(async () => {
      const status = await checkServerStatus();
      if (status) {
        setIsOnline(true);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [sessionId]);

  return { isOnline };
}
