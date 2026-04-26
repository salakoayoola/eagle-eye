import {
  File,
  FileText,
  FileCode,
  FileArchive,
  FileVideo,
  Image as ImageIcon,
  Music,
  Play,
  Camera,
  Film,
  Circle,
  CircleCheckBig,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type CopyPartyEntry,
  getFileExtension,
  isProprietaryCinemaVideo,
  supportsThumbnails,
  thumbnailUrl,
  formatBytes,
  formatDate,
} from "@/lib/copyparty";
import { VideoPreview } from "@/components/media/VideoPreview";
import { FileContextMenu } from "./FileContextMenu";
import type { MouseEvent } from "react";

interface FileCardProps {
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
  onNewFolder?: () => void;
  selectedCount?: number;
}

const typeIcons: Record<string, React.ReactNode> = {
  image: <ImageIcon className="h-8 w-8 text-muted-foreground/40" />,
  "raw-image": <Camera className="h-8 w-8 text-muted-foreground/40" />,
  video: <FileVideo className="h-8 w-8 text-muted-foreground/40" />,
  "raw-video": <Film className="h-8 w-8 text-muted-foreground/40" />,
  audio: <Music className="h-8 w-8 text-muted-foreground/40" />,
  text: <FileText className="h-8 w-8 text-muted-foreground/40" />,
  code: <FileCode className="h-8 w-8 text-muted-foreground/40" />,
  pdf: <FileText className="h-8 w-8 text-muted-foreground/40" />,
  archive: <FileArchive className="h-8 w-8 text-muted-foreground/40" />,
  file: <File className="h-8 w-8 text-muted-foreground/40" />,
};

export function FileCard({
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
  onNewFolder,
  selectedCount,
}: FileCardProps) {
  const ext = getFileExtension(entry.name);
  const isProprietaryRawVideo =
    entry.type === "raw-video" && isProprietaryCinemaVideo(entry.name);

  const card = (
    <div
      data-card
      onClick={onClick}
      className={cn(
        "group flex cursor-pointer flex-col overflow-hidden rounded-sm border bg-card text-left transition-all duration-150",
        "hover:border-primary hover:shadow-[4px_4px_0px_0px_rgba(100,116,139,0.1)]",
        selected && "border-accent ring-1 ring-accent bg-accent/5"
      )}
    >
      {/* Thumbnail area */}
      <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-muted/20 border-b">
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
            aria-label={selected ? "Deselect file" : "Select file"}
          >
            {selected ? (
              <CircleCheckBig className="h-3.5 w-3.5 text-accent" />
            ) : (
              <Circle className="h-3.5 w-3.5" />
            )}
          </button>
        )}

        {entry.type === "video" ? (
          <>
            <VideoPreview
              href={entry.href}
              name={entry.name}
              className="h-full w-full object-cover"
            />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity group-hover:opacity-0 bg-black/5">
              <div className="rounded-full bg-black/40 p-1.5 backdrop-blur-sm">
                <Play className="h-4 w-4 fill-white text-white" />
              </div>
            </div>
            <div className="absolute bottom-1.5 right-1.5 rounded-sm bg-black/70 px-1 py-0.5 font-mono text-[9px] font-medium text-white tracking-tight">
              {formatBytes(entry.sz)}
            </div>
          </>
        ) : supportsThumbnails(entry.type) ? (
          <div className="relative h-full w-full">
            <div className="absolute inset-0 flex items-center justify-center bg-muted/10">
              {typeIcons[entry.type] || typeIcons.file}
            </div>
            <img
              src={thumbnailUrl(entry.href)}
              alt={entry.name}
              className="relative z-10 h-full w-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-300"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            {isProprietaryRawVideo && (
              <div className="absolute bottom-1.5 left-1.5 z-20 rounded-sm bg-accent px-1 py-0.5 text-[8px] font-bold uppercase tracking-wider text-accent-foreground">
                RAW R3D
              </div>
            )}
            {(entry.type === "raw-image" || entry.type === "raw-video") && ext && (
              <div className="absolute left-1.5 top-1.5 z-20 rounded-sm bg-primary/80 px-1 py-0.5 text-[9px] font-mono font-bold uppercase text-primary-foreground">
                {ext}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            {typeIcons[entry.type] || typeIcons.file}
            <span className="text-[10px] font-mono font-bold uppercase text-muted-foreground/60">{ext || 'file'}</span>
          </div>
        )}
      </div>

      {/* File info */}
      <div className="flex flex-col gap-0.5 p-2.5">
        <span className="truncate text-xs font-bold tracking-tight text-foreground/90">{entry.name}</span>
        <div className="flex items-center justify-between mt-0.5">
          <span className="font-mono text-[10px] font-medium text-muted-foreground/80 uppercase">
            {formatBytes(entry.sz)}
          </span>
          {entry.ts > 0 && (
            <span className="font-mono text-[9px] text-muted-foreground/60 tabular-nums">
              {formatDate(entry.ts)}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  if (onRename && onDelete && onMove) {
    return (
      <FileContextMenu
        entry={entry}
        onRename={onRename}
        onDelete={onDelete}
        onMove={onMove}
        onInfo={onInfo}
        onCopy={onCopy}
        onCut={onCut}
        onNewFolder={onNewFolder}
        selectedCount={selectedCount}
      >
        {card}
      </FileContextMenu>
    );
  }

  return card;
}
