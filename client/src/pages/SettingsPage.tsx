import { useState, useCallback } from "react";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sun,
  Moon,
  Monitor,
  Usb,
  Trash2,
  LayoutGrid,
  List,
  Github,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDrives, useEjectDrive } from "@/hooks/use-drives";
import { formatDriveSize } from "@/lib/companion";

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { data: drives } = useDrives();
  const ejectMutation = useEjectDrive();
  const mountedDrives = (drives || []).filter((d) => d.mounted);

  // Default view preference
  const [defaultView, setDefaultView] = useState<"grid" | "list">(
    () => (localStorage.getItem("eagle-eye-view") as "grid" | "list") || "grid"
  );

  const handleDefaultViewChange = useCallback((view: "grid" | "list") => {
    setDefaultView(view);
    localStorage.setItem("eagle-eye-view", view);
  }, []);

  // Favorites management
  const [favorites, setFavorites] = useState<{ label: string; path: string }[]>(
    () => {
      try {
        const stored = localStorage.getItem("eagle-eye-favorites");
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    }
  );

  const removeFavorite = useCallback(
    (path: string) => {
      const updated = favorites.filter((f) => f.path !== path);
      setFavorites(updated);
      localStorage.setItem("eagle-eye-favorites", JSON.stringify(updated));
    },
    [favorites]
  );

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="font-display text-xl font-bold mb-6">Settings</h1>

      {/* Appearance */}
      <section className="mb-8">
        <h2 className="text-lg font-medium mb-1">Appearance</h2>
        <p className="text-sm text-muted-foreground mb-3">
          Choose your preferred theme.
        </p>
        <div className="flex gap-2">
          {(["light", "dark", "system"] as const).map((t) => (
            <Button
              key={t}
              variant={theme === t ? "default" : "outline"}
              size="sm"
              onClick={() => setTheme(t)}
              className={cn(
                theme === t && "bg-primary text-primary-foreground"
              )}
            >
              {t === "light" && <Sun className="mr-2 h-4 w-4" />}
              {t === "dark" && <Moon className="mr-2 h-4 w-4" />}
              {t === "system" && <Monitor className="mr-2 h-4 w-4" />}
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Button>
          ))}
        </div>
      </section>

      <Separator className="my-6" />

      {/* Default View */}
      <section className="mb-8">
        <h2 className="text-lg font-medium mb-1">Default View</h2>
        <p className="text-sm text-muted-foreground mb-3">
          Choose how files are displayed by default.
        </p>
        <div className="flex gap-2">
          <Button
            variant={defaultView === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => handleDefaultViewChange("grid")}
          >
            <LayoutGrid className="mr-2 h-4 w-4" />
            Grid
          </Button>
          <Button
            variant={defaultView === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => handleDefaultViewChange("list")}
          >
            <List className="mr-2 h-4 w-4" />
            List
          </Button>
        </div>
      </section>

      <Separator className="my-6" />

      {/* Favorites */}
      <section className="mb-8">
        <h2 className="text-lg font-medium mb-1">Favorites</h2>
        <p className="text-sm text-muted-foreground mb-3">
          Pinned folders that appear in the sidebar. Right-click any folder to
          add it.
        </p>
        {favorites.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            No favorites pinned yet.
          </p>
        ) : (
          <div className="space-y-1">
            {favorites.map((fav) => (
              <div
                key={fav.path}
                className="flex items-center justify-between rounded-md border px-3 py-2"
              >
                <span className="text-sm">{fav.label}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => removeFavorite(fav.path)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      <Separator className="my-6" />

      {/* Storage */}
      <section className="mb-8">
        <h2 className="text-lg font-medium mb-1">Storage</h2>
        <p className="text-sm text-muted-foreground mb-3">
          Connected and mounted drives.
        </p>
        {mountedDrives.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            No external drives mounted.
          </p>
        ) : (
          <div className="space-y-2">
            {mountedDrives.map((drive) => {
              const used = parseInt(drive.used, 10) || 0;
              const total = parseInt(drive.size, 10) || 1;
              const pct = Math.round((used / total) * 100);
              return (
                <div
                  key={drive.device}
                  className="flex items-center gap-3 rounded-md border px-3 py-2"
                >
                  <Usb className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate">
                        {drive.label}
                      </span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {formatDriveSize(drive.used)} /{" "}
                        {formatDriveSize(drive.size)}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs shrink-0"
                    onClick={() => ejectMutation.mutate(drive.device)}
                    disabled={ejectMutation.isPending}
                  >
                    Eject
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <Separator className="my-6" />

      {/* About */}
      <section>
        <h2 className="text-lg font-medium mb-1">About</h2>
        <p className="text-sm text-muted-foreground mb-2">
          Eagle Eye — open-source file manager for your NAS.
        </p>
        <p className="text-xs text-muted-foreground">
          Built with React, CopyParty, and Hono. Self-hostable via Docker.
        </p>
        <a
          href="https://github.com/salakoayoola/eagle-eye"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
        >
          <Github className="h-3.5 w-3.5" />
          View on GitHub
        </a>
      </section>
    </div>
  );
}
