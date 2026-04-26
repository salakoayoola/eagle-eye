import { Folder, HardDrive, Usb, CircleDashed } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useNavigate, useLocation } from "react-router";
import { useDrives, useMountDrive } from "@/hooks/use-drives";
import { formatDriveSize } from "@/lib/companion";
import { useFavorites } from "@/hooks/use-favorites";

interface SidebarItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: drives } = useDrives();
  const mountMutation = useMountDrive();
  const { favorites } = useFavorites();

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  // Static locations
  const locations: SidebarItem[] = [
    {
      label: "RAID STORAGE",
      path: "/browse/raid",
      icon: <HardDrive className="h-3.5 w-3.5" />,
    },
  ];

  // Mounted external drives
  const mountedDrives = (drives || []).filter((d) => d.mounted);
  const unmountedDrives = (drives || []).filter((d) => !d.mounted);

  const driveLocations: SidebarItem[] = mountedDrives.map((d) => {
    const folderName = d.mountpoint ? (d.mountpoint.split("/").filter(Boolean).pop() || d.label) : d.label;
    return {
      label: d.label.toUpperCase(),
      path: `/browse/media/${folderName}`,
      icon: <Usb className="h-3.5 w-3.5" />,
    };
  });

  const favoriteItems: SidebarItem[] = favorites.map((f) => ({
    ...f,
    label: f.label.toUpperCase(),
    icon: <Folder className="h-3.5 w-3.5" />,
  }));

  return (
    <aside className="hidden w-56 shrink-0 border-r bg-sidebar md:block">
      <ScrollArea className="h-full p-2">
        {/* Favorites */}
        <div className="mb-6">
          <h3 className="mb-2 px-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
            Favorites
          </h3>
          {favoriteItems.length === 0 ? (
            <p className="px-3 font-mono text-[9px] text-muted-foreground/40 uppercase">
              No favorites
            </p>
          ) : (
            <div className="space-y-0.5">
              {favoriteItems.map((item) => (
                <SidebarButton
                  key={item.path}
                  item={item}
                  active={isActive(item.path)}
                  onClick={() => navigate(item.path)}
                />
              ))}
            </div>
          )}
        </div>

        <Separator className="my-4 opacity-50" />

        {/* Locations */}
        <div className="mb-6">
          <h3 className="mb-2 px-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
            Locations
          </h3>
          <div className="space-y-0.5">
            {[...locations, ...driveLocations].map((item) => (
              <SidebarButton
                key={item.path}
                item={item}
                active={isActive(item.path)}
                onClick={() => navigate(item.path)}
              />
            ))}
          </div>
        </div>

        {/* Unmounted external drives */}
        {unmountedDrives.length > 0 && (
          <>
            <Separator className="my-4 opacity-50" />
            <div>
              <h3 className="mb-2 px-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
                Available Devices
              </h3>
              <div className="space-y-0.5">
                {unmountedDrives.map((drive) => (
                  <button
                    key={drive.device}
                    onClick={() => mountMutation.mutate(drive.device)}
                    disabled={mountMutation.isPending}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-sm px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-tight transition-all",
                      "hover:bg-muted text-muted-foreground/80 hover:text-foreground"
                    )}
                  >
                    <CircleDashed className="h-3.5 w-3.5 animate-pulse text-accent" />
                    <span className="truncate flex-1 text-left">
                      {drive.label}
                    </span>
                    <span className="text-[9px] opacity-60">
                      {formatDriveSize(drive.size)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </ScrollArea>
    </aside>
  );
}

function SidebarButton({
  item,
  active,
  onClick,
}: {
  item: SidebarItem;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-sm px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-tight transition-all duration-150",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground/70 hover:bg-muted hover:text-foreground"
      )}
    >
      <span className={cn("transition-colors", active ? "text-primary-foreground" : "text-muted-foreground/50")}>
        {item.icon}
      </span>
      <span className="truncate">{item.label}</span>
    </button>
  );
}
