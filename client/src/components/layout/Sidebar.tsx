import { Folder, HardDrive, Usb } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useNavigate, useLocation } from "react-router";
import { useDrives } from "@/hooks/use-drives";

interface SidebarItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: drives } = useDrives();

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + "/");

  // Static locations
  const locations: SidebarItem[] = [
    {
      label: "RAID Storage",
      path: "/browse/raid",
      icon: <HardDrive className="h-4 w-4" />,
    },
  ];

  // Dynamic drive locations from companion API
  const driveLocations: SidebarItem[] = (drives || [])
    .filter((d) => d.mounted)
    .map((d) => ({
      label: d.label,
      path: `/browse/media/${d.label}`,
      icon: <Usb className="h-4 w-4" />,
    }));

  // Favorites from localStorage
  const favorites: SidebarItem[] = (() => {
    try {
      const stored = localStorage.getItem("eagle-eye-favorites");
      if (!stored) return [];
      return JSON.parse(stored).map((f: { label: string; path: string }) => ({
        ...f,
        icon: <Folder className="h-4 w-4" />,
      }));
    } catch {
      return [];
    }
  })();

  return (
    <aside className="hidden w-60 shrink-0 border-r bg-card md:block">
      <ScrollArea className="h-full p-3">
        {/* Favorites */}
        <div className="mb-4">
          <h3 className="mb-2 px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Favorites
          </h3>
          {favorites.length === 0 ? (
            <p className="px-2 text-xs text-muted-foreground">
              Right-click a folder to pin it
            </p>
          ) : (
            favorites.map((item) => (
              <SidebarButton
                key={item.path}
                item={item}
                active={isActive(item.path)}
                onClick={() => navigate(item.path)}
              />
            ))
          )}
        </div>

        <Separator className="my-2" />

        {/* Locations */}
        <div>
          <h3 className="mb-2 px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Locations
          </h3>
          {[...locations, ...driveLocations].map((item) => (
            <SidebarButton
              key={item.path}
              item={item}
              active={isActive(item.path)}
              onClick={() => navigate(item.path)}
            />
          ))}
        </div>
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
        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
        active
          ? "border-l-2 border-primary bg-primary/5 font-medium"
          : "hover:bg-accent/10"
      )}
    >
      {item.icon}
      <span className="truncate">{item.label}</span>
    </button>
  );
}
