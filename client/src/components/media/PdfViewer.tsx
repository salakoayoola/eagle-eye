import { X, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fileUrl, type CopyPartyEntry } from "@/lib/copyparty";

interface PdfViewerProps {
  entry: CopyPartyEntry;
  onClose: () => void;
}

export function PdfViewer({ entry, onClose }: PdfViewerProps) {
  const url = fileUrl(entry.href);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-background animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex h-12 items-center justify-between border-b px-4 bg-muted/20">
        <div className="flex items-center gap-3">
          <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-foreground/80 truncate max-w-[300px]">
            {entry.name}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => window.open(url, "_blank")}
            title="Open in new tab"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
          <a href={url} download={entry.name}>
            <Button variant="ghost" size="icon" className="h-8 w-8" title="Download">
              <Download className="h-4 w-4" />
            </Button>
          </a>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 bg-muted/10">
        <iframe
          src={url}
          className="h-full w-full border-none"
          title={entry.name}
        />
      </div>
    </div>
  );
}
