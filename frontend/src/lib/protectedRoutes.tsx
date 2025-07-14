/* eslint-disable react/jsx-no-useless-fragment */
import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './authContext';

interface ProtectedRouteProps {
  children: ReactNode;
}

// Route protégée générique (pour tout utilisateur authentifié)
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/" />;
}

// Route protégée spécifique aux membres
export function MemberRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isAdmin } = useAuth();
  return isAuthenticated && !isAdmin() ? <>{children}</> : <Navigate to="/" />;
}

// Route protégée spécifique aux administrateurs
export function AdminRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isAdmin } = useAuth();
  return isAuthenticated && isAdmin() ? <>{children}</> : <Navigate to="/" />;
}
