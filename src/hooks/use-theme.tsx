import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type ThemeMode = "light" | "dark";
export type ResolvedTheme = "light" | "dark";

type ThemeContextValue = {
  mode: ThemeMode;
  theme: ResolvedTheme;
  toggle: () => void;
  setTheme: (t: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = "bspot.theme";

function apply(mode: ThemeMode) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("dark", mode === "dark");
  root.classList.toggle("light", mode === "light");
  root.style.colorScheme = mode;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Default = light. Reading storage in useEffect avoids SSR hydration mismatch.
  const [mode, setModeState] = useState<ThemeMode>("light");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
      if (stored === "dark" || stored === "light") setModeState(stored);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { apply(mode); }, [mode]);

  const setTheme = (t: ThemeMode) => {
    setModeState(t);
    try { localStorage.setItem(STORAGE_KEY, t); } catch { /* ignore */ }
  };
  const toggle = () => setTheme(mode === "dark" ? "light" : "dark");

  return (
    <ThemeContext.Provider value={{ mode, theme: mode, toggle, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) return { mode: "light" as const, theme: "light" as const, toggle: () => {}, setTheme: () => {} };
  return ctx;
}
