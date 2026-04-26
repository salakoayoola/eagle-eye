import {
  Folder,
  File,
  FileText,
  FileCode,
  FileArchive,
  FileVideo,
  Image as ImageIcon,
  Music,
  Camera,
  Film,
  Circle,
  CircleCheckBig,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type CopyPartyEntry, formatBytes, formatDate } from "@/lib/copyparty";
import { FileContextMenu } from "./FileContextMenu";
import type { MouseEvent } from "react";

interface FileListProps {
  dirs: CopyPartyEntry[];
  files: CopyPartyEntry[];
  onEntryClick: (entry: CopyPartyEntry, event: MouseEvent) => void;
  onToggleSelect: (entry: CopyPartyEntry, event: MouseEvent) => void;
  selectedPaths: Set<string>;
  onRename?: (entry: CopyPartyEntry) => void;
  onDelete?: (entry: CopyPartyEntry) => void;
  onMove?: (entry: CopyPartyEntry) => void;
  onInfo?: (entry: CopyPartyEntry) => void;
  onCopy?: (entry: CopyPartyEntry) => void;
  onCut?: (entry: CopyPartyEntry) => void;
  onNewFolder?: () => void;
}

const typeIcons: Record<string, React.ReactNode> = {
  d: <Folder className="h-3.5 w-3.5 text-primary/70 fill-primary/10" />,
  image: <ImageIcon className="h-3.5 w-3.5 text-muted-foreground/70" />,
  "raw-image": <Camera className="h-3.5 w-3.5 text-muted-foreground/70" />,
  video: <FileVideo className="h-3.5 w-3.5 text-muted-foreground/70" />,
  "raw-video": <Film className="h-3.5 w-3.5 text-muted-foreground/70" />,
  audio: <Music className="h-3.5 w-3.5 text-muted-foreground/70" />,
  text: <FileText className="h-3.5 w-3.5 text-muted-foreground/70" />,
  code: <FileCode className="h-3.5 w-3.5 text-muted-foreground/70" />,
  archive: <FileArchive className="h-3.5 w-3.5 text-muted-foreground/70" />,
  file: <File className="h-3.5 w-3.5 text-muted-foreground/70" />,
};

export function FileList({
  dirs,
  files,
  onEntryClick,
  onToggleSelect,
  selectedPaths,
  onRename,
  onDelete,
  onMove,
  onInfo,
  onCopy,
  onCut,
  onNewFolder,
}: FileListProps) {
  const allEntries = [
    ...dirs.map((d) => ({ ...d, type: "d" as const })),
    ...files,
  ];

  const selectedCount = selectedPaths.size;

  return (
    <div className="rounded-sm border overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[40px_1fr_100px_140px] gap-4 border-b bg-muted/30 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
        <span />
        <span>Name</span>
        <span className="text-right">Size</span>
        <span className="text-right">Last Modified</span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-border/50">
        {allEntries.map((entry) => {
          const isDir = entry.type === "d";
          const selected = selectedPaths.has(entry.href);

          const row = (
            <div
              key={entry.href}
              onClick={(event) => onEntryClick(entry, event)}
              className={cn(
                "grid w-full cursor-pointer grid-cols-[40px_1fr_100px_140px] gap-4 px-4 py-2 text-left text-xs transition-all duration-75",
                "hover:bg-muted/50 hover:border-l-2 hover:border-l-primary",
                selected ? "bg-accent/10 border-l-2 border-l-accent" : "border-l-2 border-l-transparent"
              )}
            >
              <button
                type="button"
                className="flex h-5 w-5 items-center justify-center rounded-sm text-muted-foreground/60 hover:text-foreground transition-colors"
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleSelect(entry, event);
                }}
                aria-label={selected ? "Deselect item" : "Select item"}
              >
                {selected ? (
                  <CircleCheckBig className="h-3.5 w-3.5 text-accent" />
                ) : (
                  <Circle className="h-3.5 w-3.5" />
                )}
              </button>
              <span className="flex items-center gap-2.5 truncate font-medium text-foreground/90">
                {typeIcons[entry.type] || typeIcons.file}
                <span className="truncate">{entry.name}</span>
              </span>
              <span className="text-right font-mono text-[10px] tabular-nums text-muted-foreground/80">
                {isDir ? `${entry.num || 0} items` : formatBytes(entry.sz)}
              </span>
              <span className="text-right font-mono text-[10px] text-muted-foreground/60 tabular-nums">
                {formatDate(entry.ts)}
              </span>
            </div>
          );

          if (onRename && onDelete && onMove) {
            return (
              <FileContextMenu
                key={entry.href}
                entry={entry}
                onRename={() => onRename(entry)}
                onDelete={() => onDelete(entry)}
                onMove={() => onMove(entry)}
                onInfo={onInfo ? () => onInfo(entry) : undefined}
                onCopy={onCopy ? () => onCopy(entry) : undefined}
                onCut={onCut ? () => onCut(entry) : undefined}
                onNewFolder={onNewFolder}
                selectedCount={selectedCount}
              >
                {row}
              </FileContextMenu>
            );
          }

          return row;
        })}
      </div>

      {allEntries.length === 0 && (
        <div className="flex items-center justify-center py-16 text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">
          Directory is empty
        </div>
      )}
    </div>
  );
}
