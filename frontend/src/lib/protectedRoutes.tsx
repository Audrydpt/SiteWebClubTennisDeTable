/* eslint-disable react/jsx-no-useless-fragment */
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/authContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated } = useAuth();

  return isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
}
