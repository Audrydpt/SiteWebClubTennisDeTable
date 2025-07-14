/* eslint-disable */
// lib/authContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useMemo,
} from 'react';
import Cookies from 'js-cookie';
import axios from 'axios';

// Types pour les utilisateurs
export type UserRole = 'member' | 'admin';

interface User {
  id?: string;
  nom?: string;
  prenom?: string;
  email?: string;
  role: UserRole;
  classement?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loginMember: (email: string, password: string) => Promise<boolean>;
  loginAdmin: (username: string, password: string) => boolean;
  logout: () => void;
  isAdmin: () => boolean;
}

// Type pour les membres retournés par l'API
interface MembreAPI {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  password: string;
  classement?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const SESSION_DURATION = 60;
const API_URL = import.meta.env.VITE_API_URL;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);

  // Définir setupAuthCookie avant son utilisation
  const setupAuthCookie = (userData: User | null) => {
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + SESSION_DURATION);

    const authData = {
      authenticated: true,
      user: userData,
      expiry: expiry.toISOString(),
    };

    const authCookie = btoa(JSON.stringify(authData));
    Cookies.set('auth_session', authCookie, {
      expires: SESSION_DURATION / (60 * 24),
      sameSite: 'strict',
      secure: window.location.protocol === 'https:',
    });
  };

  useEffect(() => {
    const checkAuth = () => {
      const authCookie = Cookies.get('auth_session');
      if (authCookie) {
        try {
          const authData = JSON.parse(atob(authCookie));
          if (
            authData &&
            authData.expiry &&
            new Date(authData.expiry) > new Date()
          ) {
            setIsAuthenticated(true);
            setUser(authData.user || null);
            setupAuthCookie(authData.user);
            return;
          }
        } catch (error) {

        }
      }
      setIsAuthenticated(false);
      setUser(null);
      Cookies.remove('auth_session');
    };

    checkAuth();
    const interval = setInterval(checkAuth, 60000);
    return () => clearInterval(interval);
  }, []);

  const loginMember = async (
    email: string,
    password: string
  ): Promise<boolean> => {
    try {
      // Récupérer les membres depuis l'API
      const response = await axios.get(`${API_URL}/membres`);
      const membres: MembreAPI[] = response.data;

      // Vérifier si les identifiants correspondent
      const membre = membres.find(
        (m) => m.email === email && m.password === password
      );

      if (membre) {
        const userData: User = {
          id: membre.id,
          nom: membre.nom,
          prenom: membre.prenom,
          email: membre.email,
          role: 'member',
          classement: membre.classement,
        };

        setIsAuthenticated(true);
        setUser(userData);
        setupAuthCookie(userData);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Erreur lors de l'authentification membre:", error);
      return false;
    }
  };

  const loginAdmin = (username: string, password: string): boolean => {
    if (
      username === import.meta.env.VITE_USERNAME &&
      password === import.meta.env.VITE_PASSWORD
    ) {
      const adminData: User = {
        nom: 'Administrateur',
        role: 'admin',
      };

      setIsAuthenticated(true);
      setUser(adminData);
      setupAuthCookie(adminData);
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    Cookies.remove('auth_session');
  };

  const isAdmin = (): boolean => user?.role === 'admin';

  // Utilisation de useMemo pour éviter de recréer l'objet à chaque rendu
  const contextValue = useMemo(
    () => ({
      isAuthenticated,
      user,
      loginMember,
      loginAdmin,
      logout,
      isAdmin,
    }),
    [isAuthenticated, user]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
