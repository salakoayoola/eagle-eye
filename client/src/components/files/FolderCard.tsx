import { Folder } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CopyPartyEntry } from "@/lib/copyparty";

interface FolderCardProps {
  entry: CopyPartyEntry;
  onClick: () => void;
  selected?: boolean;
}

export function FolderCard({ entry, onClick, selected }: FolderCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl border bg-card text-left transition-all",
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
    </button>
  );
}
