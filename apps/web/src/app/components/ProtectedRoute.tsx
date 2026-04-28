import { Navigate } from 'react-router';
import type { ReactNode } from 'react';

export function ProtectedRoute({
  isAuthenticated,
  authLoading,
  children,
}: {
  isAuthenticated: boolean;
  authLoading: boolean;
  children: ReactNode;
}) {
  // Don't flash the login page while Supabase checks the existing session
  if (authLoading) return <div className="min-h-screen bg-white" />;
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}
