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
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type CopyPartyEntry,
  thumbnailUrl,
  formatBytes,
  formatDate,
} from "@/lib/copyparty";
import { VideoPreview } from "@/components/media/VideoPreview";
import { FileContextMenu } from "./FileContextMenu";

interface FileCardProps {
  entry: CopyPartyEntry;
  onClick: () => void;
  selected?: boolean;
  onRename?: () => void;
  onDelete?: () => void;
  onMove?: () => void;
  onInfo?: () => void;
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
  selected,
  onRename,
  onDelete,
  onMove,
  onInfo,
}: FileCardProps) {
  const card = (
    <div
      data-card
      onClick={onClick}
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl border bg-card text-left transition-all cursor-pointer",
        "hover:shadow-md hover:border-primary/30",
        selected && "ring-2 ring-primary border-primary/50"
      )}
    >
      {/* Thumbnail area */}
      <div className="relative flex aspect-[4/3] items-center justify-center bg-muted/50 overflow-hidden">
        {entry.type === "video" ? (
          <>
            <VideoPreview
              href={entry.href}
              name={entry.name}
              className="h-full w-full"
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:opacity-0 transition-opacity">
              <div className="rounded-full bg-black/50 p-2">
                <Play className="h-5 w-5 text-white fill-white" />
              </div>
            </div>
            <div className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 font-mono text-xs text-white">
              {formatBytes(entry.sz)}
            </div>
          </>
        ) : entry.type === "image" ? (
          <img
            src={thumbnailUrl(entry.href)}
            alt={entry.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
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
      >
        {card}
      </FileContextMenu>
    );
  }

  return card;
}
