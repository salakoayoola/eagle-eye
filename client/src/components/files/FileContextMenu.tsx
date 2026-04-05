import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Download,
  Pencil,
  Trash2,
  FolderInput,
  Info,
  Star,
  ExternalLink,
} from "lucide-react";
import { fileUrl, type CopyPartyEntry } from "@/lib/copyparty";

interface FileContextMenuProps {
  entry: CopyPartyEntry;
  children: React.ReactNode;
  onRename: () => void;
  onDelete: () => void;
  onMove: () => void;
  onInfo?: () => void;
}

export function FileContextMenu({
  entry,
  children,
  onRename,
  onDelete,
  onMove,
  onInfo,
}: FileContextMenuProps) {
  const isDir = entry.type === "d";

  const handleAddFavorite = () => {
    try {
      const stored = localStorage.getItem("eagle-eye-favorites");
      const favorites = stored ? JSON.parse(stored) : [];
      const path = `/browse/${entry.href}`;
      if (!favorites.some((f: { path: string }) => f.path === path)) {
        favorites.push({ label: entry.name, path });
        localStorage.setItem("eagle-eye-favorites", JSON.stringify(favorites));
      }
    } catch {
      // ignore
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-52">
        {onInfo && (
          <ContextMenuItem onClick={onInfo}>
            <Info className="mr-2 h-4 w-4" />
            Get Info
          </ContextMenuItem>
        )}
        {!isDir && (
          <ContextMenuItem
            onClick={() => {
              const a = document.createElement("a");
              a.href = fileUrl(entry.href);
              a.download = entry.name;
              a.click();
            }}
          >
            <Download className="mr-2 h-4 w-4" />
            Download
          </ContextMenuItem>
        )}
        {!isDir && (
          <ContextMenuItem
            onClick={() => window.open(fileUrl(entry.href), "_blank")}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Open in New Tab
          </ContextMenuItem>
        )}
        {isDir && (
          <ContextMenuItem onClick={handleAddFavorite}>
            <Star className="mr-2 h-4 w-4" />
            Add to Favorites
          </ContextMenuItem>
        )}
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onRename}>
          <Pencil className="mr-2 h-4 w-4" />
          Rename
        </ContextMenuItem>
        <ContextMenuItem onClick={onMove}>
          <FolderInput className="mr-2 h-4 w-4" />
          Move
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onDelete} className="text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
