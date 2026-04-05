import { useEffect, useCallback } from "react";
import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fileUrl, type CopyPartyEntry } from "@/lib/copyparty";

interface VideoPlayerProps {
  entry: CopyPartyEntry;
  onClose: () => void;
}

export function VideoPlayer({ entry, onClose }: VideoPlayerProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <a href={fileUrl(entry.href)} download={entry.name}>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
            <Download className="h-5 w-5" />
          </Button>
        </a>
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Video */}
      <video
        src={fileUrl(entry.href)}
        controls
        autoPlay
        className="max-h-[90vh] max-w-[90vw]"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Filename */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-4 py-1.5 text-sm text-white">
        {entry.name}
      </div>
    </div>
  );
}
