import { useState, useCallback } from 'react';

const STORAGE_KEY = 'feuoir_admin';
const SESSION_MS = 8 * 60 * 60 * 1000; // 8 hours

function checkStored(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const { ts } = JSON.parse(raw) as { ts: number };
    return Date.now() - ts < SESSION_MS;
  } catch {
    return false;
  }
}

export function useAdminAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(checkStored);

  const login = useCallback((password: string): boolean => {
    const expected = import.meta.env.VITE_ADMIN_PASSWORD as string | undefined;
    if (!expected || password !== expected) return false;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ts: Date.now() }));
    setIsAuthenticated(true);
    return true;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setIsAuthenticated(false);
  }, []);

  return { isAuthenticated, login, logout };
}
