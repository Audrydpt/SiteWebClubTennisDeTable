import { useQuery } from '@tanstack/react-query';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

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

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sessionId, setLocalSessionId] = useState(getSessionId());

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
