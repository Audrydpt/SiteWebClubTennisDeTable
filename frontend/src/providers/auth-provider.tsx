/* eslint-disable */
import { useQuery } from '@tanstack/react-query';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from 'react';

import {
  AuthError,
  getCurrentUser,
  getSessionId,
  loginUser,
  removeSessionId,
  setSessionId,
  UserPrivileges,
  UserType,
} from '@/lib/authenticate';
import { AuthContext } from './auth-context';

const AnonymousUser = {
  user: 'anonymous',
  privileges: UserPrivileges.Anonymous,
} as UserType;

const pingSession = async (sessionId: string) => {
  if (!sessionId) return undefined;

  try {
    const response = await fetch(`${process.env.BACK_API_URL}/authenticate`, {
      method: 'GET',
      headers: {
        Authorization: `X-Session-Id ${sessionId}`,
      },
    });

    if (!response.ok) {
      console.warn('Failed to ping session', response.status);
      if (response.status === 401) {
        removeSessionId();
        window.location.href = '/front-react/login';
        return undefined;
      }
    }
    return undefined;
  } catch (error) {
    console.error('Error pinging session:', error);
    return undefined;
  }
};

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sessionId, setLocalSessionId] = useState(getSessionId());
  const lastPingTime = useRef<number>(0);

  const {
    data: user = AnonymousUser,
    refetch,
    isLoading,
  } = useQuery({
    queryKey: ['currentUser', sessionId],
    queryFn: () =>
      sessionId ? getCurrentUser(sessionId) : Promise.resolve(AnonymousUser),
    retry: (_count, err) => !(err instanceof AuthError && err.status === 401),
  });

  // Handle mouse movement to ping the session
  useEffect(() => {
    if (!sessionId || user.privileges === UserPrivileges.Anonymous) {
      return;
    }

    const handleMouseMove = () => {
      const currentTime = Date.now();
      // Only ping if more than a minute has passed since the last ping
      if (currentTime - lastPingTime.current > 60000) {
        lastPingTime.current = currentTime;
        pingSession(sessionId)
          .then(updatedUser => {
            // Optionally update user information if it changed
            if (updatedUser && JSON.stringify(updatedUser) !== JSON.stringify(user)) {
              refetch();
            }
          });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [sessionId, user, refetch]);

  useEffect(() => {
    const cookieChangeListener = () => {
      const currentSessionId = getSessionId();
      if (currentSessionId !== sessionId) {
        setLocalSessionId(currentSessionId);

        if (sessionId && !currentSessionId) {
          window.location.href = '/front-react/login';
        }
      }
    };

    window.addEventListener('storage', (event) => {
      if (event.key === null || event.key.includes('session')) {
        cookieChangeListener();
      }
    });

    const interval = setInterval(cookieChangeListener, 10000);

    return () => {
      clearInterval(interval);
    };
  }, [sessionId]);

  const login = useCallback(
    async (username: string, password: string) => {
      const sid = await loginUser(username, password);
      setSessionId(sid);
      setLocalSessionId(sid);
      await refetch();
    },
    [refetch]
  );

  const logout = useCallback(() => {
    removeSessionId();
    setLocalSessionId('');
    window.location.href = '/front-react/login';
  }, []);

  const authValue = useMemo(
    () => ({
      user,
      isAuthenticated: user.privileges !== UserPrivileges.Anonymous,
      isLoading,
      login,
      logout,
      sessionId,
    }),
    [user, isLoading, login, logout, sessionId]
  );

  return (
    <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>
  );
}
