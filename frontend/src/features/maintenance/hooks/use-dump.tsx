import { useState } from 'react';

import { useAuth } from '@/providers/auth-context';

function useDump() {
  const [loading, setLoading] = useState(false);
  const { user, sessionId } = useAuth();

  const downloadDump = async () => {
    setLoading(true);

    try {
      const response = await fetch(
        `${process.env.BACK_API_URL}/diagnosticDump`,
        {
          method: 'GET',
          headers: {
            Authorization: sessionId
              ? `X-Session-Id ${sessionId}`
              : `Basic ${btoa(`${user.user}:<password>`)}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to download report (Status: ${response.status})`
        );
      }

      const blob = await response.blob();
      if (blob.size === 0) {
        throw new Error('Empty file received');
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'diagdump.tar.gz';
      document.body.appendChild(a);

      setTimeout(() => {
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);
    } finally {
      setLoading(false);
    }
  };

  return { downloadDump, loading };
}

export default useDump;
