import { useState, useRef, useCallback, useEffect } from "react";
import { fileUrl, thumbnailUrl } from "@/lib/copyparty";

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

  const handleMouseEnter = useCallback(() => {
    timerRef.current = setTimeout(() => {
      setIsPlaying(true);
    }, HOVER_DELAY);
  }, []);

  const handleMouseLeave = useCallback(() => {
    clearTimeout(timerRef.current);
    setIsPlaying(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, []);

  useEffect(() => {
    if (isPlaying && videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay may be blocked
        setIsPlaying(false);
      });
    }
  }, [isPlaying]);

  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  return (
    <div
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
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
        <img
          src={thumbnailUrl(href)}
          alt={name}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      )}
    </div>
  );
}
