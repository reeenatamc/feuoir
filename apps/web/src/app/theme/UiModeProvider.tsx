import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  applyUiMode,
  oppositeUiMode,
  readStoredUiMode,
  storeUiMode,
  type UiMode,
} from './ui-mode';

interface UiModeContextValue {
  mode: UiMode;
  setMode: (mode: UiMode) => void;
  toggleMode: () => void;
}

const UiModeContext = createContext<UiModeContextValue | null>(null);

export function UiModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<UiMode>(readStoredUiMode);

  // El atributo va en <html>, no en un wrapper: asi tambien lo ven los portales
  // (dialogs, tooltips), que se montan fuera del arbol de la app.
  useEffect(() => {
    applyUiMode(mode);
  }, [mode]);

  const setMode = useCallback((next: UiMode) => {
    setModeState(next);
    storeUiMode(next);
  }, []);

  const toggleMode = useCallback(() => {
    setModeState((current) => {
      const next = oppositeUiMode(current);
      storeUiMode(next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ mode, setMode, toggleMode }), [mode, setMode, toggleMode]);

  return <UiModeContext.Provider value={value}>{children}</UiModeContext.Provider>;
}

export function useUiMode(): UiModeContextValue {
  const context = useContext(UiModeContext);
  if (!context) {
    throw new Error('useUiMode() requiere que el arbol este dentro de <UiModeProvider>.');
  }
  return context;
}
