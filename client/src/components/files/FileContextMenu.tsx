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
} from "lucide-react";
import { fileUrl, type CopyPartyEntry } from "@/lib/copyparty";

interface FileContextMenuProps {
  entry: CopyPartyEntry;
  children: React.ReactNode;
  onRename: () => void;
  onDelete: () => void;
  onMove: () => void;
}

export function FileContextMenu({
  entry,
  children,
  onRename,
  onDelete,
  onMove,
}: FileContextMenuProps) {
  const isDir = entry.type === "d";

  return (
    <ContextMenu>
      <ContextMenuTrigger>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-48">
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
