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
}

export function DrivePill({ drive, onEject }: DrivePillProps) {
  const usedBytes = parseInt(drive.used, 10) || 0;
  const availBytes = parseInt(drive.available, 10) || 0;
  const totalBytes = usedBytes + availBytes;
  const usagePct = totalBytes > 0 ? (usedBytes / totalBytes) * 100 : 0;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs">
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              drive.mounted ? "bg-success" : "bg-muted-foreground"
            )}
          />
          <span className="font-medium">{drive.label}</span>
          {drive.mounted && totalBytes > 0 && (
            <span className="text-muted-foreground">
              {formatDriveSize(drive.used)} / {formatDriveSize(String(totalBytes))}
            </span>
          )}
          {drive.mounted && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEject();
              }}
              className="ml-0.5 rounded p-0.5 hover:bg-muted transition-colors"
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
          {drive.mounted && (
            <div className="text-muted-foreground">
              {usagePct.toFixed(0)}% used
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
