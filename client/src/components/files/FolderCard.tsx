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
        "group flex cursor-pointer flex-col overflow-hidden rounded-sm border bg-card text-left transition-all duration-150",
        "hover:border-primary hover:shadow-[4px_4px_0px_0px_rgba(100,116,139,0.1)]",
        selected && "border-accent ring-1 ring-accent bg-accent/5"
      )}
    >
      {/* Folder preview area */}
      <div className="relative flex aspect-square items-center justify-center bg-muted/10 border-b">
        {onToggleSelect && (
          <button
            type="button"
            className={cn(
              "absolute right-1.5 top-1.5 z-30 rounded-sm bg-background/90 p-0.5 text-muted-foreground shadow-sm transition-opacity",
              selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}
            onClick={(event) => {
              event.stopPropagation();
              onToggleSelect(event);
            }}
            aria-label={selected ? "Deselect folder" : "Select folder"}
          >
            {selected ? (
              <CircleCheckBig className="h-3.5 w-3.5 text-accent" />
            ) : (
              <Circle className="h-3.5 w-3.5" />
            )}
          </button>
        )}
        <Folder className="h-10 w-10 text-primary/40 fill-primary/5 group-hover:text-primary/60 transition-colors" />
      </div>

      {/* Folder info */}
      <div className="flex flex-col gap-0.5 p-2.5">
        <span className="truncate text-xs font-bold tracking-tight text-foreground/90">{entry.name}</span>
        <span className="font-mono text-[9px] font-bold uppercase text-muted-foreground/60 tracking-wider">
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
