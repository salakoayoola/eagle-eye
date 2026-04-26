import { Folder, Circle, CircleCheckBig } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CopyPartyEntry } from "@/lib/copyparty";
import { FileContextMenu } from "./FileContextMenu";
import type { MouseEvent } from "react";

interface FolderCardProps {
  entry: CopyPartyEntry;
  onClick: (event: MouseEvent<HTMLDivElement>) => void;
  onToggleSelect?: (event: MouseEvent<HTMLButtonElement>) => void;
  selected?: boolean;
  onRename?: () => void;
  onDelete?: () => void;
  onMove?: () => void;
  onInfo?: () => void;
  onCopy?: () => void;
  onCut?: () => void;
}

export function FolderCard({
  entry,
  onClick,
  onToggleSelect,
  selected,
  onRename,
  onDelete,
  onMove,
  onInfo,
  onCopy,
  onCut,
}: FolderCardProps) {
  const card = (
    <div
      onClick={onClick}
      className={cn(
        "group flex cursor-pointer flex-col overflow-hidden rounded-xl border bg-card text-left transition-all",
        "hover:border-primary/30 hover:shadow-md",
        selected && "ring-2 ring-primary border-primary/50"
      )}
    >
      {/* Folder preview area */}
      <div className="relative flex aspect-[4/3] items-center justify-center bg-muted/30">
        {onToggleSelect && (
          <button
            type="button"
            className={cn(
              "absolute right-2 top-2 z-30 rounded-full bg-background/85 p-0.5 text-muted-foreground shadow-sm transition-opacity",
              selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}
            onClick={(event) => {
              event.stopPropagation();
              onToggleSelect(event);
            }}
            aria-label={selected ? "Deselect folder" : "Select folder"}
          >
            {selected ? (
              <CircleCheckBig className="h-4 w-4 text-primary" />
            ) : (
              <Circle className="h-4 w-4" />
            )}
          </button>
        )}
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
        onCopy={onCopy}
        onCut={onCut}
      >
        {card}
      </FileContextMenu>
    );
  }

  return card;
}
