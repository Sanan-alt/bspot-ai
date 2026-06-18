import { createContext, useContext, useEffect, type ReactNode } from "react";

export type ThemeMode = "light";
export type ResolvedTheme = "light";

type ThemeContextValue = {
  mode: ThemeMode;
  theme: ResolvedTheme;
  toggle: () => void;
  setTheme: (t: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyLight() {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.add("light");
  root.classList.remove("dark");
  root.style.colorScheme = "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => { applyLight(); }, []);
  const noop = () => {};
  const value: ThemeContextValue = { mode: "light", theme: "light", toggle: noop, setTheme: noop };
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) return { mode: "light" as const, theme: "light" as const, toggle: () => {}, setTheme: () => {} };
  return ctx;
}
