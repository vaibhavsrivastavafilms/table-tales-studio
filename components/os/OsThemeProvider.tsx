"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type OsTheme = "dark" | "light";

type OsThemeContextValue = {
  theme: OsTheme;
  setTheme: (theme: OsTheme) => void;
  toggleTheme: () => void;
};

const STORAGE_KEY = "tts:os:theme";

const OsThemeContext = createContext<OsThemeContextValue | null>(null);

export function OsThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<OsTheme>("dark");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as OsTheme | null;
    if (stored === "light" || stored === "dark") {
      setThemeState(stored);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme, ready]);

  const setTheme = useCallback((next: OsTheme) => {
    setThemeState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((t) => (t === "dark" ? "light" : "dark"));
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme]
  );

  return (
    <OsThemeContext.Provider value={value}>
      <div className="os-root" data-theme={theme}>
        {children}
      </div>
    </OsThemeContext.Provider>
  );
}

export function useOsTheme(): OsThemeContextValue {
  const ctx = useContext(OsThemeContext);
  if (!ctx) {
    throw new Error("useOsTheme must be used within OsThemeProvider");
  }
  return ctx;
}
