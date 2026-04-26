import { useCallback } from "react";
import {
  X,
  Download,
  ExternalLink,
  File,
  FileText,
  FileCode,
  FileArchive,
  FileVideo,
  Image as ImageIcon,
  Music,
  Folder,
  Camera,
  Film,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  type CopyPartyEntry,
  fileUrl,
  getFileExtension,
  isPreviewable,
  isProprietaryCinemaVideo,
  supportsThumbnails,
  thumbnailUrl,
  formatBytes,
} from "@/lib/copyparty";

interface FileInfoSidebarProps {
  entry: CopyPartyEntry;
  onClose: () => void;
  onOpen: () => void;
}

const typeLabels: Record<string, string> = {
  image: "Image",
  "raw-image": "RAW Image",
  video: "Video",
  "raw-video": "RAW Video",
  audio: "Audio",
  text: "Text",
  code: "Source Code",
  pdf: "PDF Document",
  archive: "Archive",
  d: "Folder",
  file: "File",
};

const typeIcons: Record<string, React.ReactNode> = {
  image: <ImageIcon className="h-4 w-4" />,
  "raw-image": <Camera className="h-4 w-4" />,
  video: <FileVideo className="h-4 w-4" />,
  "raw-video": <Film className="h-4 w-4" />,
  audio: <Music className="h-4 w-4" />,
  text: <FileText className="h-4 w-4" />,
  code: <FileCode className="h-4 w-4" />,
  pdf: <FileText className="h-4 w-4" />,
  archive: <FileArchive className="h-4 w-4" />,
  d: <Folder className="h-4 w-4" />,
  file: <File className="h-4 w-4" />,
};

export function FileInfoSidebar({ entry, onClose, onOpen }: FileInfoSidebarProps) {
  const isDir = entry.type === "d";
  const ext = getFileExtension(entry.name);
  const hasPreview = isPreviewable(entry.type);
  const showThumbnail = supportsThumbnails(entry.type);
  const isProprietaryRawVideo =
    entry.type === "raw-video" && isProprietaryCinemaVideo(entry.name);
  const typeLabel = isProprietaryRawVideo
    ? "RAW Video (Proprietary Codec)"
    : (typeLabels[entry.type] || "File");

  const handleDownload = useCallback(() => {
    const a = document.createElement("a");
    a.href = fileUrl(entry.href);
    a.download = entry.name;
    a.click();
  }, [entry]);

  return (
    <div className="sticky top-0 flex h-full w-80 flex-col border-l bg-card animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3 bg-muted/20">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-sm bg-primary/10 text-primary">
            {typeIcons[entry.type] || typeIcons.file}
          </div>
          <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-foreground/80">Properties</h3>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-sm hover:bg-muted" onClick={onClose}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Preview */}
      <div className="flex aspect-square items-center justify-center bg-muted/10 overflow-hidden border-b relative">
        <div className="absolute top-2 left-2 z-20 pointer-events-none">
          <span className="font-mono text-[9px] font-bold uppercase bg-background/80 backdrop-blur-sm px-1.5 py-0.5 rounded-sm border border-border shadow-sm">
            {ext || (isDir ? 'dir' : 'file')}
          </span>
        </div>
        
        {showThumbnail ? (
          <div className="relative h-full w-full">
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground/30">
               {typeIcons[entry.type] || typeIcons.file}
               <span className="font-mono text-[8px] uppercase tracking-tighter">Loading data...</span>
            </div>
            <img
              src={thumbnailUrl(entry.href)}
              alt={entry.name}
              className="relative z-10 h-full w-full object-contain p-4"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-muted-foreground/40">
            <div className="p-6 rounded-sm bg-muted/20 border-2 border-dashed border-border/50">
               {typeIcons[entry.type] || typeIcons.file}
            </div>
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest">No preview</span>
          </div>
        )}
      </div>

      {/* File details */}
      <div className="flex-1 overflow-auto p-4 custom-scrollbar">
        <h4 className="mb-2 text-xs font-bold break-all tracking-tight leading-tight text-foreground/90 uppercase">{entry.name}</h4>
        <div className="inline-flex items-center px-1.5 py-0.5 rounded-sm bg-accent/10 border border-accent/20 text-accent font-mono text-[9px] font-bold uppercase mb-4">
          {typeLabel}
        </div>

        <div className="space-y-4 pt-2">
          {!isDir && (
            <InfoRow label="Storage size" value={formatBytes(entry.sz)} />
          )}
          {entry.ts > 0 && (
            <InfoRow
              label="Last modified"
              value={new Date(entry.ts * 1000).toLocaleString()}
            />
          )}
          <InfoRow label="System path" value={entry.href} mono />
        </div>
      </div>

      {/* Actions */}
      <div className="border-t p-3 bg-muted/10 grid grid-cols-2 gap-2">
        <Button size="sm" className="rounded-sm font-mono text-[10px] font-bold uppercase" onClick={onOpen}>
          {hasPreview ? "Open Preview" : isDir ? "Open folder" : "Open file"}
        </Button>
        <div className="flex gap-1.5">
          {!isDir && (
            <>
              <Button size="sm" variant="outline" className="flex-1 rounded-sm" onClick={handleDownload} title="Download">
                <Download className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 rounded-sm"
                onClick={() => window.open(fileUrl(entry.href), "_blank")}
                title="Open in external tab"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="group">
      <dt className="font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground/60 mb-1">{label}</dt>
      <dd className={`text-[11px] break-all text-foreground/80 ${mono ? "font-mono bg-muted/30 p-1.5 rounded-sm border border-border/50 text-[10px]" : "font-medium"}`}>
        {value}
      </dd>
    </div>
  );
}
