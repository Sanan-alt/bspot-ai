import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";

export function ThemeToggle() {
  const { mode, toggle } = useTheme();
  const isDark = mode === "dark";
  return (
    <button
      onClick={toggle}
      aria-label={isDark ? "Switch to day mode" : "Switch to night mode"}
      title={isDark ? "Switch to day" : "Switch to night"}
      className="h-9 w-9 grid place-items-center rounded-md hover:bg-accent border border-transparent hover:border-border"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
