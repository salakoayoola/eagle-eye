import { Folder } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CopyPartyEntry } from "@/lib/copyparty";
import { FileContextMenu } from "./FileContextMenu";

interface FolderCardProps {
  entry: CopyPartyEntry;
  onClick: () => void;
  selected?: boolean;
  onRename?: () => void;
  onDelete?: () => void;
  onMove?: () => void;
  onInfo?: () => void;
}

export function FolderCard({
  entry,
  onClick,
  selected,
  onRename,
  onDelete,
  onMove,
  onInfo,
}: FolderCardProps) {
  const card = (
    <div
      onClick={onClick}
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl border bg-card text-left transition-all cursor-pointer",
        "hover:shadow-md hover:border-primary/30",
        selected && "ring-2 ring-primary border-primary/50"
      )}
    >
      {/* Folder preview area */}
      <div className="relative flex aspect-[4/3] items-center justify-center bg-muted/30">
        <Folder className="h-12 w-12 text-primary/60 fill-primary/10" />
      </div>

      {/* Folder info */}
      <div className="flex flex-col gap-0.5 p-3">
        <span className="truncate text-sm font-medium">{entry.name}</span>
        <span className="text-xs text-muted-foreground">
          {entry.num !== undefined ? `${entry.num} items` : "Folder"}
        </span>
      </div>
    </div>
  );

  if (onRename && onDelete && onMove) {
    return (
      <FileContextMenu
        entry={{ ...entry, type: "d" }}
        onRename={onRename}
        onDelete={onDelete}
        onMove={onMove}
        onInfo={onInfo}
      >
        {card}
      </FileContextMenu>
    );
  }

  return card;
}
