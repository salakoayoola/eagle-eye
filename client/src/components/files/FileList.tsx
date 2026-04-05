import {
  Folder,
  File,
  FileText,
  FileCode,
  FileArchive,
  FileVideo,
  Image as ImageIcon,
  Music,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type CopyPartyEntry, formatBytes, formatDate } from "@/lib/copyparty";

interface FileListProps {
  dirs: CopyPartyEntry[];
  files: CopyPartyEntry[];
  onNavigate: (entry: CopyPartyEntry) => void;
  onSelect: (entry: CopyPartyEntry) => void;
  selectedPaths: Set<string>;
}

const typeIcons: Record<string, React.ReactNode> = {
  d: <Folder className="h-4 w-4 text-primary/70 fill-primary/10" />,
  image: <ImageIcon className="h-4 w-4 text-muted-foreground" />,
  video: <FileVideo className="h-4 w-4 text-muted-foreground" />,
  audio: <Music className="h-4 w-4 text-muted-foreground" />,
  text: <FileText className="h-4 w-4 text-muted-foreground" />,
  code: <FileCode className="h-4 w-4 text-muted-foreground" />,
  archive: <FileArchive className="h-4 w-4 text-muted-foreground" />,
  file: <File className="h-4 w-4 text-muted-foreground" />,
};

export function FileList({
  dirs,
  files,
  onNavigate,
  onSelect,
  selectedPaths,
}: FileListProps) {
  const allEntries = [
    ...dirs.map((d) => ({ ...d, type: "d" as const })),
    ...files,
  ];

  return (
    <div className="rounded-lg border">
      {/* Header */}
      <div className="grid grid-cols-[1fr_100px_120px] gap-4 border-b px-4 py-2 text-xs font-medium text-muted-foreground">
        <span>Name</span>
        <span className="text-right">Size</span>
        <span className="text-right">Modified</span>
      </div>

      {/* Rows */}
      {allEntries.map((entry) => {
        const isDir = entry.type === "d";
        const selected = selectedPaths.has(entry.href);

        return (
          <button
            key={entry.href}
            onClick={() => (isDir ? onNavigate(entry) : onSelect(entry))}
            onDoubleClick={() => !isDir && onSelect(entry)}
            className={cn(
              "grid w-full grid-cols-[1fr_100px_120px] gap-4 px-4 py-2.5 text-left text-sm transition-colors",
              "hover:bg-muted/50",
              selected && "bg-primary/5"
            )}
          >
            <span className="flex items-center gap-2 truncate">
              {typeIcons[entry.type] || typeIcons.file}
              <span className="truncate">{entry.name}</span>
            </span>
            <span className="text-right font-mono text-xs text-muted-foreground tabular-nums">
              {isDir ? `${entry.num || 0} items` : formatBytes(entry.sz)}
            </span>
            <span className="text-right text-xs text-muted-foreground">
              {formatDate(entry.ts)}
            </span>
          </button>
        );
      })}

      {allEntries.length === 0 && (
        <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
          This folder is empty
        </div>
      )}
    </div>
  );
}
