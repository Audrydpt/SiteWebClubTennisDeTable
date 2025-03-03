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
  const [isSessionExpired, setIsSessionExpired] = useState(false);

  const checkSession = useCallback(async () => {
    try {
      const currentSessionId = getSessionId();
      if (!currentSessionId) {
        setIsSessionExpired(true);
        return false;
      }
      if (currentSessionId !== sessionId) {
        setLocalSessionId(currentSessionId);
      }
      const result = await getCurrentUser(currentSessionId).catch((error) => {
        if (error instanceof AuthError && error.status === 401) {
          setIsSessionExpired(true);
          return null;
        }
        throw error;
      });

      if (!result) {
        setIsSessionExpired(true);
        return false;
      }

      setIsSessionExpired(false);
      return true;
    } catch (error) {
      console.error('Session check failed:', error);
      setIsSessionExpired(true);
      return false;
    }
  }, [sessionId]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      checkSession();
    }, 30000);

    return () => clearInterval(intervalId);
  }, [checkSession]);

  useEffect(() => {
    const activityHandler = () => {
      if (isSessionExpired) {
        checkSession();
      }
    };

    window.addEventListener('click', activityHandler);
    window.addEventListener('keypress', activityHandler);
    window.addEventListener('mousemove', activityHandler);
    window.addEventListener('touchstart', activityHandler);

    return () => {
      window.removeEventListener('click', activityHandler);
      window.removeEventListener('keypress', activityHandler);
      window.removeEventListener('mousemove', activityHandler);
      window.removeEventListener('touchstart', activityHandler);
    };
  }, [isSessionExpired, checkSession]);

  const {
    data: user = AnonymousUser,
    refetch,
    isLoading,
  } = useQuery({
    queryKey: ['currentUser', sessionId, isSessionExpired],
    queryFn: () => {
      if (isSessionExpired || !sessionId) {
        return Promise.resolve(AnonymousUser);
      }
      return getCurrentUser(sessionId);
    },
    retry: (_count, err) => !(err instanceof AuthError && err.status === 401),
  });

  const login = useCallback(
    async (username: string, password: string) => {
      const sid = await loginUser(username, password);
      setSessionId(sid);
      setLocalSessionId(sid);
      setIsSessionExpired(false);
      await refetch();
    },
    [refetch]
  );

  const logout = useCallback(() => {
    removeSessionId();
    setIsSessionExpired(false);
    window.location.href = '/login';
  }, []);

  const authValue = useMemo(
    () => ({
      user,
      isAuthenticated: user.privileges !== UserPrivileges.Anonymous,
      isLoading,
      isSessionExpired,
      login,
      logout,
      sessionId,
      checkSession,
    }),
    [user, isLoading, isSessionExpired, login, logout, sessionId, checkSession]
  );

  return (
    <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>
  );
}
