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
import { Separator } from "@/components/ui/separator";
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
  image: <ImageIcon className="h-6 w-6" />,
  "raw-image": <Camera className="h-6 w-6" />,
  video: <FileVideo className="h-6 w-6" />,
  "raw-video": <Film className="h-6 w-6" />,
  audio: <Music className="h-6 w-6" />,
  text: <FileText className="h-6 w-6" />,
  code: <FileCode className="h-6 w-6" />,
  pdf: <FileText className="h-6 w-6" />,
  archive: <FileArchive className="h-6 w-6" />,
  d: <Folder className="h-6 w-6" />,
  file: <File className="h-6 w-6" />,
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
    <div className="sticky top-0 flex h-full w-80 flex-col border-l bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-sm font-semibold">Info</h3>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Preview */}
      <div className="flex aspect-square items-center justify-center bg-muted/30 overflow-hidden">
        {showThumbnail ? (
          <div className="relative h-full w-full">
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              {typeIcons[entry.type] || typeIcons.file}
              {isProprietaryRawVideo && (
                <span className="rounded bg-muted px-2 py-0.5 text-[11px] font-medium">
                  R3D/BRAW/ARI need proprietary decoder
                </span>
              )}
            </div>
            <img
              src={thumbnailUrl(entry.href)}
              alt={entry.name}
              className="relative z-10 h-full w-full object-contain"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            {typeIcons[entry.type] || typeIcons.file}
            {ext && (
              <span className="rounded bg-muted px-2 py-0.5 text-xs font-mono font-medium">
                .{ext}
              </span>
            )}
          </div>
        )}
      </div>

      {/* File details */}
      <div className="flex-1 overflow-auto p-4">
        <h4 className="mb-1 text-sm font-semibold break-all">{entry.name}</h4>
        <p className="mb-4 text-xs text-muted-foreground">
          {typeLabel}
          {ext && ` (.${ext})`}
        </p>

        <Separator className="my-3" />

        <div className="space-y-3">
          {!isDir && (
            <InfoRow label="Size" value={formatBytes(entry.sz)} />
          )}
          {entry.ts > 0 && (
            <InfoRow
              label="Modified"
              value={new Date(entry.ts * 1000).toLocaleString()}
            />
          )}
          <InfoRow label="Path" value={entry.href} mono />
        </div>
      </div>

      {/* Actions */}
      <div className="border-t p-3 flex gap-2">
        <Button size="sm" className="flex-1" onClick={onOpen}>
          {hasPreview ? "Preview" : isDir ? "Open" : "Open"}
        </Button>
        {!isDir && (
          <>
            <Button size="sm" variant="outline" onClick={handleDownload}>
              <Download className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(fileUrl(entry.href), "_blank")}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </>
        )}
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
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className={`mt-0.5 text-sm break-all ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </dd>
    </div>
  );
}
