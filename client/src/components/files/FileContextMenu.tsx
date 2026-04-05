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
  StarOff,
  ExternalLink,
  Copy,
  Scissors,
} from "lucide-react";
import { fileUrl, type CopyPartyEntry } from "@/lib/copyparty";
import { useFavorites } from "@/hooks/use-favorites";

interface FileContextMenuProps {
  entry: CopyPartyEntry;
  children: React.ReactNode;
  onRename: () => void;
  onDelete: () => void;
  onMove: () => void;
  onInfo?: () => void;
  onCopy?: () => void;
  onCut?: () => void;
}

export function FileContextMenu({
  entry,
  children,
  onRename,
  onDelete,
  onMove,
  onInfo,
  onCopy,
  onCut,
}: FileContextMenuProps) {
  const isDir = entry.type === "d";
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();
  const favPath = `/browse/${entry.href}`;
  const isFav = isDir && isFavorite(favPath);

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
        <ContextMenuSeparator />
        {onCopy && (
          <ContextMenuItem onClick={onCopy}>
            <Copy className="mr-2 h-4 w-4" />
            Copy
          </ContextMenuItem>
        )}
        {onCut && (
          <ContextMenuItem onClick={onCut}>
            <Scissors className="mr-2 h-4 w-4" />
            Cut
          </ContextMenuItem>
        )}
        <ContextMenuItem onClick={onMove}>
          <FolderInput className="mr-2 h-4 w-4" />
          Move to...
        </ContextMenuItem>
        <ContextMenuItem onClick={onRename}>
          <Pencil className="mr-2 h-4 w-4" />
          Rename
        </ContextMenuItem>
        {isDir && (
          <>
            <ContextMenuSeparator />
            {isFav ? (
              <ContextMenuItem onClick={() => removeFavorite(favPath)}>
                <StarOff className="mr-2 h-4 w-4" />
                Remove from Favorites
              </ContextMenuItem>
            ) : (
              <ContextMenuItem
                onClick={() => addFavorite(entry.name, favPath)}
              >
                <Star className="mr-2 h-4 w-4" />
                Add to Favorites
              </ContextMenuItem>
            )}
          </>
        )}
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onDelete} className="text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
