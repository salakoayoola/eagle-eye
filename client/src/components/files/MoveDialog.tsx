import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Folder, ChevronRight, Loader2 } from "lucide-react";
import { listDirectory, type CopyPartyListing } from "@/lib/copyparty";
import { cn } from "@/lib/utils";

interface MoveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entryName: string;
  onSubmit: (destPath: string) => void;
}

export function MoveDialog({
  open,
  onOpenChange,
  entryName,
  onSubmit,
}: MoveDialogProps) {
  const [currentPath, setCurrentPath] = useState("raid");
  const [listing, setListing] = useState<CopyPartyListing | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  // Load directory listing when path changes
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setSelectedPath(null);
    listDirectory(currentPath)
      .then(setListing)
      .catch(() => setListing(null))
      .finally(() => setLoading(false));
  }, [currentPath, open]);

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      setCurrentPath("raid");
      setSelectedPath(null);
    }
  }, [open]);

  const pathParts = currentPath.split("/");

  const handleMove = () => {
    const dest = selectedPath || currentPath;
    onSubmit(dest);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Move "{entryName}"</DialogTitle>
        </DialogHeader>

        {/* Breadcrumb navigation */}
        <div className="flex items-center gap-1 text-sm text-muted-foreground overflow-x-auto">
          {pathParts.map((part, i) => (
            <span key={i} className="flex items-center gap-1 shrink-0">
              {i > 0 && <ChevronRight className="h-3 w-3" />}
              <button
                className="hover:text-foreground transition-colors"
                onClick={() =>
                  setCurrentPath(pathParts.slice(0, i + 1).join("/"))
                }
              >
                {part}
              </button>
            </span>
          ))}
        </div>

        {/* Folder list */}
        <div className="h-64 overflow-y-auto rounded-md border">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : listing?.dirs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              No subfolders
            </div>
          ) : (
            listing?.dirs.map((dir) => (
              <button
                key={dir.href}
                onDoubleClick={() => setCurrentPath(dir.href)}
                onClick={() =>
                  setSelectedPath(
                    selectedPath === dir.href ? null : dir.href
                  )
                }
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-sm text-left transition-colors",
                  "hover:bg-muted/50",
                  selectedPath === dir.href && "bg-primary/10 text-primary"
                )}
              >
                <Folder className="h-4 w-4 shrink-0 text-primary/60 fill-primary/10" />
                <span className="truncate">{dir.name}</span>
              </button>
            ))
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Select a folder or double-click to navigate into it. The item will be
          moved to {selectedPath ? `"${selectedPath.split("/").pop()}"` : "the current folder"}.
        </p>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button onClick={handleMove}>
            Move Here
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
