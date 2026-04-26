import { useState } from "react";
import { Search, Settings, Sun, Moon, Monitor } from "lucide-react";
import { SearchDialog } from "./SearchDialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/hooks/use-theme";
import { useDrives, useEjectDrive, useMountDrive } from "@/hooks/use-drives";
import { DrivePill } from "@/components/drives/DrivePill";
import { EjectDialog } from "@/components/drives/EjectDialog";
import { Link } from "react-router";
import { MobileSidebar } from "./MobileSidebar";
import type { Drive } from "@/lib/companion";

export function TopBar() {
  const { theme, setTheme } = useTheme();
  const { data: drives } = useDrives();
  const ejectMutation = useEjectDrive();
  const mountMutation = useMountDrive();
  const [ejectTarget, setEjectTarget] = useState<Drive | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  // Show all detected external drives — mounted first, then unmounted
  const allDrives = drives || [];
  const sortedDrives = [
    ...allDrives.filter((d) => d.mounted),
    ...allDrives.filter((d) => !d.mounted),
  ];

  return (
    <header className="flex h-11 shrink-0 items-center border-b bg-card px-4 gap-2">
      {/* Mobile menu */}
      <MobileSidebar />

      {/* Logo */}
      <Link
        to="/"
        className="flex items-center gap-2 font-mono text-sm font-black tracking-tighter"
      >
        <div className="flex h-5 w-5 items-center justify-center bg-primary text-primary-foreground rounded-sm rotate-45">
          <span className="-rotate-45 text-[10px]">EE</span>
        </div>
        <span className="uppercase tracking-[0.1em]">Eagle Eye</span>
      </Link>

      {/* Center: Drive pills — mounted and unmounted */}
      <div className="flex flex-1 items-center justify-center gap-2 overflow-x-auto px-4 scrollbar-none">
        {sortedDrives.map((drive) => (
          <DrivePill
            key={drive.device || drive.label}
            drive={drive}
            onEject={() => setEjectTarget(drive)}
            onMount={() => mountMutation.mutate(drive.device)}
          />
        ))}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-sm hover:bg-muted"
          onClick={() => setSearchOpen(true)}
        >
          <Search className="h-3.5 w-3.5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-sm hover:bg-muted">
              {theme === "light" ? (
                <Sun className="h-3.5 w-3.5" />
              ) : theme === "dark" ? (
                <Moon className="h-3.5 w-3.5" />
              ) : (
                <Monitor className="h-3.5 w-3.5" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-sm font-mono text-[10px] font-bold uppercase">
            <DropdownMenuItem onClick={() => setTheme("light")}>
              <Sun className="mr-2 h-3.5 w-3.5" /> Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              <Moon className="mr-2 h-3.5 w-3.5" /> Dark
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              <Monitor className="mr-2 h-3.5 w-3.5" /> System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Link to="/settings">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-sm hover:bg-muted">
            <Settings className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>

      {/* Search */}
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />

      {/* Eject confirmation */}
      {ejectTarget && (
        <EjectDialog
          open={!!ejectTarget}
          onOpenChange={(open) => !open && setEjectTarget(null)}
          label={ejectTarget.label}
          isLoading={ejectMutation.isPending}
          onConfirm={() => {
            ejectMutation.mutate(ejectTarget.device || ejectTarget.label, {
              onSuccess: () => setEjectTarget(null),
            });
          }}
        />
      )}
    </header>
  );
}
