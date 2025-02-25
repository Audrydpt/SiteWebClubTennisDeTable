import { useState } from 'react';

export default function useServerStatus() {
  const [isOnline, setIsOnline] = useState(false);

  const checkServerStatus = async () => {
    try {
      const response = await fetch(`${process.env.BACK_API_URL}/streams`);
      return response.ok;
    } catch {
      return false;
    }
  };

  const startPolling = (callback: () => void) => {
    const checkStatus = async () => {
      const status = await checkServerStatus();
      if (status) {
        setIsOnline(true);
        callback();
      }
    };

    const interval = setInterval(checkStatus, 2000);
    return () => clearInterval(interval);
  };

  return { isOnline, startPolling };
}
