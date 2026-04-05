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
import { useDrives, useEjectDrive } from "@/hooks/use-drives";
import { DrivePill } from "@/components/drives/DrivePill";
import { EjectDialog } from "@/components/drives/EjectDialog";
import { Link } from "react-router";
import { MobileSidebar } from "./MobileSidebar";
import type { Drive } from "@/lib/companion";

export function TopBar() {
  const { theme, setTheme } = useTheme();
  const { data: drives } = useDrives();
  const ejectMutation = useEjectDrive();
  const [ejectTarget, setEjectTarget] = useState<Drive | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  const mountedDrives = drives?.filter((d) => d.mounted) || [];

  return (
    <header className="flex h-12 shrink-0 items-center border-b bg-card px-4 gap-2">
      {/* Mobile menu */}
      <MobileSidebar />

      {/* Logo */}
      <Link
        to="/"
        className="flex items-center gap-2 font-display text-lg font-bold tracking-tight"
      >
        <span className="text-primary">&#9670;</span>
        <span>Eagle Eye</span>
      </Link>

      {/* Center: Drive pills */}
      <div className="flex flex-1 items-center justify-center gap-2 overflow-x-auto px-4">
        {mountedDrives.map((drive) => (
          <DrivePill
            key={drive.device || drive.label}
            drive={drive}
            onEject={() => setEjectTarget(drive)}
          />
        ))}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSearchOpen(true)}>
          <Search className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              {theme === "light" ? (
                <Sun className="h-4 w-4" />
              ) : theme === "dark" ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Monitor className="h-4 w-4" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme("light")}>
              <Sun className="mr-2 h-4 w-4" /> Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              <Moon className="mr-2 h-4 w-4" /> Dark
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              <Monitor className="mr-2 h-4 w-4" /> System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
          <Link to="/settings">
            <Settings className="h-4 w-4" />
          </Link>
        </Button>
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
