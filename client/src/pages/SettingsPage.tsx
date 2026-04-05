import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

export function SettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="font-display text-xl font-bold mb-6">Settings</h1>

      <section className="mb-8">
        <h2 className="text-lg font-medium mb-3">Appearance</h2>
        <div className="flex gap-2">
          {(["light", "dark", "system"] as const).map((t) => (
            <Button
              key={t}
              variant={theme === t ? "default" : "outline"}
              size="sm"
              onClick={() => setTheme(t)}
              className={cn(theme === t && "bg-primary text-primary-foreground")}
            >
              {t === "light" && <Sun className="mr-2 h-4 w-4" />}
              {t === "dark" && <Moon className="mr-2 h-4 w-4" />}
              {t === "system" && <Monitor className="mr-2 h-4 w-4" />}
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium mb-3">About</h2>
        <p className="text-sm text-muted-foreground">
          Eagle Eye — open-source file manager for your NAS.
        </p>
      </section>
    </div>
  );
}
