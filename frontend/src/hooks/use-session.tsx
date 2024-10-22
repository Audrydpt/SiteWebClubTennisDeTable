import { useEffect, useState } from 'react';

function getSessionIdFromCookie() {
  const cookies = document.cookie.split(';').reduce(
    (acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    },
    {} as Record<string, string>
  );
  const { SID } = cookies;

  return SID;
}

export default function useSession() {
  const [sessionId, setSessionId] = useState(getSessionIdFromCookie());

  useEffect(() => {
    const SID = getSessionIdFromCookie();

    if (SID) setSessionId(SID);
  }, []);

  return sessionId;
}
