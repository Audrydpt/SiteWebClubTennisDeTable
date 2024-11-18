import { useEffect } from 'react';

export default function HttpsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (
      process.env.NODE_ENV !== 'development' &&
      window.location.protocol === 'http:'
    ) {
      window.location.href = window.location.href.replace('http:', 'https:');
    }
  }, []);

  return children;
}
