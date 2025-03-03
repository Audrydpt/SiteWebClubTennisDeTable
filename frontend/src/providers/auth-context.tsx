import { createContext, useContext } from 'react';

import { UserType } from '@/lib/authenticate';

type AuthContextType = {
  user: UserType;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSessionExpired: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  sessionId?: string;
  checkSession: () => Promise<boolean>;
};

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
