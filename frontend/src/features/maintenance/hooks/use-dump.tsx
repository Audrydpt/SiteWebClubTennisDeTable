import { useState } from 'react';
import { useAuth } from '@/providers/auth-context';

function useDump() {
  const [loading, setLoading] = useState(false);
  const sessionId = useAuth();

  const downloadDump = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.BACK_API_URL}/diagnosticDump`,
        {
          method: 'GET',
          headers: {
            Authorization: `X-Session-Id ${sessionId}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to download report');
      }

      const blob = await response.blob();

      if (blob.size === 0) {
        throw new Error('Empty file received');
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'diagdump.tgz';
      document.body.appendChild(a);

      setTimeout(() => {
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error('Error downloading report:', error);
    } finally {
      setLoading(false);
    }
  };

  return { downloadDump, loading };
}

export default useDump;
