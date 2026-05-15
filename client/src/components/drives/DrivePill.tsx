import { CircleArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Drive } from "@/lib/companion";
import { formatDriveSize } from "@/lib/companion";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DrivePillProps {
  drive: Drive;
  onEject: () => void;
  onMount: () => void;
}

export function DrivePill({ drive, onEject, onMount }: DrivePillProps) {
  const usedBytes = parseInt(drive.used, 10) || 0;
  const availBytes = parseInt(drive.available, 10) || 0;
  const totalBytes = usedBytes + availBytes;
  const usagePct = totalBytes > 0 ? (usedBytes / totalBytes) * 100 : 0;
  const clampedUsagePct = Math.max(0, Math.min(100, usagePct));
  const usageFillClass =
    clampedUsagePct >= 90
      ? "bg-destructive/25"
      : clampedUsagePct >= 75
        ? "bg-warning/25"
        : "bg-primary/20";

  return (
    <Tooltip>
      <TooltipTrigger>
        <div
          className={cn(
            "relative overflow-hidden flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs",
            drive.mounted ? "bg-card" : "bg-muted/50 border-dashed"
          )}
        >
          {drive.mounted && totalBytes > 0 && (
            <>
              <div
                className={cn(
                  "pointer-events-none absolute inset-y-0 left-0 transition-[width] duration-700 ease-out",
                  usageFillClass
                )}
                style={{ width: `${clampedUsagePct}%` }}
              />
              <div className="pointer-events-none absolute inset-0 opacity-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
            </>
          )}

          <span
            className={cn(
              "relative z-10 h-2 w-2 rounded-full",
              drive.mounted
                ? "bg-success animate-[pulse_2s_ease-in-out_1]"
                : "bg-warning"
            )}
          />
          <span className="relative z-10 font-medium">{drive.label}</span>
          {drive.mounted && totalBytes > 0 && (
            <span className="relative z-10 text-muted-foreground">
              {formatDriveSize(drive.used)} /{" "}
              {formatDriveSize(String(totalBytes))} ({clampedUsagePct.toFixed(0)}%)
            </span>
          )}
          {!drive.mounted && (
            <>
              <span className="relative z-10 text-muted-foreground">
                {formatDriveSize(drive.size)} &middot; {drive.fstype}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMount();
                }}
                disabled={!drive.device}
                className="relative z-10 ml-0.5 rounded bg-primary/10 px-1.5 py-0.5 text-primary font-medium hover:bg-primary/20 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                Mount
              </button>
            </>
          )}
          {drive.mounted && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEject();
              }}
              className="relative z-10 ml-0.5 rounded p-0.5 hover:bg-muted transition-colors"
            >
              <CircleArrowUp className="h-3 w-3 text-muted-foreground" />
            </button>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <div className="text-xs">
          <div>{drive.label}</div>
          <div className="text-muted-foreground">{drive.device}</div>
          {drive.mounted ? (
            <div className="text-muted-foreground">
              {usagePct.toFixed(0)}% used
            </div>
          ) : (
            <div className="text-muted-foreground">
              Not mounted &middot; Click Mount to access
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
