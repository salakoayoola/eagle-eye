import { useState, useRef, useCallback, useEffect } from "react";
import { fileUrl, thumbnailUrl } from "@/lib/copyparty";
import { FileVideo } from "lucide-react";

interface VideoPreviewProps {
  href: string;
  name: string;
  className?: string;
}

const HOVER_DELAY = 500;

export function VideoPreview({ href, name, className }: VideoPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  const startPreview = useCallback(() => {
    timerRef.current = setTimeout(() => {
      setIsPlaying(true);
    }, HOVER_DELAY);
  }, []);

  const stopPreview = useCallback(() => {
    clearTimeout(timerRef.current);
    setIsPlaying(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, []);

  // Listen on the closest card ancestor for mouse enter/leave
  // to handle hover even when the mouse is over sibling elements
  useEffect(() => {
    const card = containerRef.current?.closest("[data-card]");
    if (!card) return;

    const enter = () => startPreview();
    const leave = () => stopPreview();

    card.addEventListener("mouseenter", enter);
    card.addEventListener("mouseleave", leave);
    return () => {
      card.removeEventListener("mouseenter", enter);
      card.removeEventListener("mouseleave", leave);
      clearTimeout(timerRef.current);
    };
  }, [startPreview, stopPreview]);

  useEffect(() => {
    if (isPlaying && videoRef.current) {
      videoRef.current.play().catch(() => {
        setIsPlaying(false);
      });
    }
  }, [isPlaying]);

  return (
    <div ref={containerRef} className={className}>
      {isPlaying ? (
        <video
          ref={videoRef}
          src={fileUrl(href)}
          muted
          loop
          playsInline
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="relative h-full w-full">
          <div className="absolute inset-0 flex items-center justify-center bg-muted/40">
            <FileVideo className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <img
            src={thumbnailUrl(href)}
            alt={name}
            className="relative z-10 h-full w-full object-cover"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </div>
      )}
    </div>
  );
}
