import { Moon, Sun, Monitor, Check } from "lucide-react";
import { useTheme, type ThemeMode } from "@/hooks/use-theme";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { mode, theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  const Icon = mode === "system" ? Monitor : isDark ? Sun : Moon;

  const options: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Theme: ${mode}. Change theme`}
        title="Change theme"
        className={`h-9 w-9 grid place-items-center rounded-md border border-border text-foreground hover:border-primary hover:text-neon transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${className}`}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only">Toggle theme menu</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuLabel className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground">
          Appearance
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map((o) => {
          const ItemIcon = o.icon;
          const selected = mode === o.value;
          return (
            <DropdownMenuItem
              key={o.value}
              onSelect={() => setTheme(o.value)}
              aria-checked={selected}
              role="menuitemradio"
              className="flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <ItemIcon className="h-4 w-4" aria-hidden="true" />
                {o.label}
              </span>
              {selected && <Check className="h-3.5 w-3.5 text-neon" aria-hidden="true" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
