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
}

const typeIcons: Record<string, React.ReactNode> = {
  image: <ImageIcon className="h-10 w-10 text-muted-foreground/50" />,
  "raw-image": <Camera className="h-10 w-10 text-muted-foreground/50" />,
  video: <FileVideo className="h-10 w-10 text-muted-foreground/50" />,
  "raw-video": <Film className="h-10 w-10 text-muted-foreground/50" />,
  audio: <Music className="h-10 w-10 text-muted-foreground/50" />,
  text: <FileText className="h-10 w-10 text-muted-foreground/50" />,
  code: <FileCode className="h-10 w-10 text-muted-foreground/50" />,
  pdf: <FileText className="h-10 w-10 text-muted-foreground/50" />,
  archive: <FileArchive className="h-10 w-10 text-muted-foreground/50" />,
  file: <File className="h-10 w-10 text-muted-foreground/50" />,
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
}: FileCardProps) {
  const ext = getFileExtension(entry.name);
  const isProprietaryRawVideo =
    entry.type === "raw-video" && isProprietaryCinemaVideo(entry.name);

  const card = (
    <div
      data-card
      onClick={onClick}
      className={cn(
        "group flex cursor-pointer flex-col overflow-hidden rounded-xl border bg-card text-left transition-all",
        "hover:border-primary/30 hover:shadow-md",
        selected && "ring-2 ring-primary border-primary/50"
      )}
    >
      {/* Thumbnail area */}
      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-muted/50">
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
            aria-label={selected ? "Deselect file" : "Select file"}
          >
            {selected ? (
              <CircleCheckBig className="h-4 w-4 text-primary" />
            ) : (
              <Circle className="h-4 w-4" />
            )}
          </button>
        )}

        {entry.type === "video" ? (
          <>
            <VideoPreview
              href={entry.href}
              name={entry.name}
              className="h-full w-full"
            />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity group-hover:opacity-0">
              <div className="rounded-full bg-black/50 p-2">
                <Play className="h-5 w-5 fill-white text-white" />
              </div>
            </div>
            <div className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 font-mono text-xs text-white">
              {formatBytes(entry.sz)}
            </div>
          </>
        ) : supportsThumbnails(entry.type) ? (
          <div className="relative h-full w-full">
            <div className="absolute inset-0 flex items-center justify-center">
              {typeIcons[entry.type] || typeIcons.file}
            </div>
            <img
              src={thumbnailUrl(entry.href)}
              alt={entry.name}
              className="relative z-10 h-full w-full object-cover"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            {isProprietaryRawVideo && (
              <div className="absolute bottom-2 left-2 z-20 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                No R3D Decoder
              </div>
            )}
            {(entry.type === "raw-image" || entry.type === "raw-video") && ext && (
              <div className="absolute left-2 top-2 z-20 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-mono uppercase text-white">
                {ext}
              </div>
            )}
          </div>
        ) : (
          typeIcons[entry.type] || typeIcons.file
        )}
      </div>

      {/* File info */}
      <div className="flex flex-col gap-0.5 p-3">
        <span className="truncate text-sm font-medium">{entry.name}</span>
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-mono">{formatBytes(entry.sz)}</span>
          {entry.ts > 0 && (
            <>
              <span>&middot;</span>
              <span>{formatDate(entry.ts)}</span>
            </>
          )}
        </span>
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
      >
        {card}
      </FileContextMenu>
    );
  }

  return card;
}
