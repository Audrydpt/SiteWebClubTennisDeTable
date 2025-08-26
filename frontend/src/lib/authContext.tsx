/* eslint-disable */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from 'react';
import supabase from './supabaseClient';

// Type pour l'utilisateur membre
type Member = {
  id: string;
  supabase_uid: string;
  nom: string;
  prenom: string;
  role: string;
  classement: string;
  telephone: string;
  email?: string;
};

// Type pour l'admin
type Admin = {
  id: string;
  username: string;
  role: 'admin';
};

type User = Member | Admin | null;

interface AuthContextProps {
  isAuthenticated: boolean;
  user: User;
  loginMember: (email: string, password: string) => Promise<boolean>;
  loginAdmin: (username: string, password: string) => boolean;
  logout: () => void;
  isAdmin: () => boolean;
  getMemberId: () => string | null;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User>(null);

  // Authentification admin simple via .env
  const loginAdmin = (username: string, password: string): boolean => {
    const adminUsername = import.meta.env.VITE_USERNAME;
    const adminPassword = import.meta.env.VITE_PASSWORD;

    if (username === adminUsername && password === adminPassword) {
      setUser({ id: '0', username, role: 'admin' });
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  // Connexion membre via Supabase + récupération json-server
  const loginMember = async (
    email: string,
    password: string
  ): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.session || !data.user) {
        console.error('Erreur Supabase :', error?.message);
        return false;
      }

      const supabase_uid = data.user.id;

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/membres?supabase_uid=${supabase_uid}`
      );
      const membres = await res.json();

      if (membres.length === 0) {
        console.warn('Aucun membre trouvé dans json-server');
        return false;
      }

      const membre = membres[0];

      setUser({
        ...membre,
        email: data.user.email,
      });
      setIsAuthenticated(true);
      return true;
    } catch (err) {
      console.error('Erreur login membre :', err);
      return false;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAuthenticated(false);
  };

  const isAdmin = () =>
    user !== null && 'role' in user && user.role === 'admin';

  const getMemberId = () => {
    if (user && 'id' in user && user.role !== 'admin') {
      return user.id;
    }
    return null;
  };

  // Session persistée + écoute des changements
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data?.session;

      if (session?.user) {
        const supabase_uid = session.user.id;

        try {
          const res = await fetch(
            `${import.meta.env.VITE_API_URL}/membres?supabase_uid=${supabase_uid}`
          );
          const membres = await res.json();

          if (membres.length > 0) {
            const membre = membres[0];
            setUser({
              ...membre,
              email: session.user.email,
            });
            setIsAuthenticated(true);
          }
        } catch (err) {
          console.error(
            'Erreur lors du chargement de la session persistée :',
            err
          );
        }
      }
    };

    checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsAuthenticated(false);
        } else if (event === 'SIGNED_IN' && session?.user) {
          const supabase_uid = session.user.id;

          try {
            const res = await fetch(
              `${import.meta.env.VITE_API_URL}/membres?supabase_uid=${supabase_uid}`
            );
            const membres = await res.json();

            if (membres.length > 0) {
              const membre = membres[0];
              setUser({
                ...membre,
                email: session.user.email,
              });
              setIsAuthenticated(true);
            }
          } catch (err) {
            console.error('Erreur onAuthStateChange :', err);
          }
        }
      }
    );

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  // Durée d'inactivité avant déconnexion (en ms)
  const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes

  useEffect(() => {
    let inactivityTimer: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      if (isAuthenticated) {
        inactivityTimer = setTimeout(() => {
          logout();
        }, INACTIVITY_TIMEOUT);
      }
    };

    // Événements à écouter pour détecter l'activité
    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart'];

    if (isAuthenticated) {
      events.forEach(event =>
        window.addEventListener(event, resetTimer)
      );
      resetTimer();
    }

    return () => {
      clearTimeout(inactivityTimer);
      events.forEach(event =>
        window.removeEventListener(event, resetTimer)
      );
    };
    // On relance l'effet à chaque changement d'authentification
  }, [isAuthenticated]);

  const contextValue = useMemo(
    () => ({
      isAuthenticated,
      user,
      loginMember,
      loginAdmin,
      logout,
      isAdmin,
      getMemberId,
    }),
    [isAuthenticated, user]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
