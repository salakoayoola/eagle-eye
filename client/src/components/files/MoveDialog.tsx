import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Folder, ChevronRight, Loader2, FolderPlus, Plus, X } from "lucide-react";
import { listDirectory, createDirectory, type CopyPartyListing } from "@/lib/copyparty";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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

  // New folder state
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchListing = useCallback((path: string) => {
    setLoading(true);
    setSelectedPath(null);
    listDirectory(path)
      .then(setListing)
      .catch(() => setListing(null))
      .finally(() => setLoading(false));
  }, []);

  // Load directory listing when path changes
  useEffect(() => {
    if (!open) return;
    fetchListing(currentPath);
  }, [currentPath, open, fetchListing]);

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      setCurrentPath("raid");
      setSelectedPath(null);
      setIsCreatingFolder(false);
      setNewFolderName("");
    }
  }, [open]);

  const pathParts = (currentPath || "").split("/");

  const handleMove = () => {
    const dest = selectedPath || currentPath;
    onSubmit(dest);
    onOpenChange(false);
  };

  const handleCreateFolder = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newFolderName.trim()) return;

    setCreating(true);
    try {
      await createDirectory(currentPath, newFolderName.trim());
      toast.success(`Created folder "${newFolderName}"`);
      setNewFolderName("");
      setIsCreatingFolder(false);
      // Refresh listing
      fetchListing(currentPath);
    } catch (err) {
      toast.error("Failed to create folder");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-4">
        <DialogHeader>
          <DialogTitle className="font-mono text-xs font-bold uppercase tracking-widest">
            Move / Copy "{entryName}"
          </DialogTitle>
        </DialogHeader>

        {/* Breadcrumb navigation */}
        <div className="flex items-center gap-1 text-[10px] font-mono font-bold uppercase text-muted-foreground overflow-x-auto pb-1">
          {pathParts.map((part, i) => (
            <span key={i} className="flex items-center gap-1 shrink-0">
              {i > 0 && <ChevronRight className="h-3 w-3 opacity-40" />}
              <button
                className="hover:text-foreground transition-colors hover:bg-muted px-1 rounded-sm"
                onClick={() =>
                  setCurrentPath(pathParts.slice(0, i + 1).join("/"))
                }
              >
                {part}
              </button>
            </span>
          ))}
        </div>

        {/* Actions bar */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-bold uppercase text-muted-foreground/60">Target: {currentPath}</span>
          {!isCreatingFolder ? (
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1.5 rounded-sm font-mono text-[9px] font-bold uppercase border-dashed"
              onClick={() => setIsCreatingFolder(true)}
            >
              <FolderPlus className="h-3 w-3" />
              New Folder
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-sm"
              onClick={() => setIsCreatingFolder(false)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {/* New Folder Input */}
        {isCreatingFolder && (
          <form onSubmit={handleCreateFolder} className="flex gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
            <Input
              autoFocus
              placeholder="Folder name..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="h-8 rounded-sm font-mono text-xs"
              disabled={creating}
            />
            <Button 
              type="submit" 
              size="sm" 
              className="h-8 rounded-sm px-3"
              disabled={creating || !newFolderName.trim()}
            >
              {creating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            </Button>
          </form>
        )}

        {/* Folder list */}
        <div className="h-64 overflow-y-auto rounded-sm border bg-muted/5 divide-y divide-border/40">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/40" />
            </div>
          ) : listing?.dirs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-[10px] font-mono font-bold uppercase text-muted-foreground/40 tracking-widest">
              Directory Empty
            </div>
          ) : (
            listing?.dirs.map((dir) => (
              <button
                key={dir.href}
                onDoubleClick={() => {
                  setCurrentPath(dir.href);
                  setIsCreatingFolder(false);
                }}
                onClick={() =>
                  setSelectedPath(
                    selectedPath === dir.href ? null : dir.href
                  )
                }
                className={cn(
                  "flex w-full items-center gap-3 px-3 py-2.5 text-xs text-left transition-all duration-75",
                  "hover:bg-muted/50 border-l-2 border-l-transparent",
                  selectedPath === dir.href && "bg-accent/10 border-l-accent text-accent font-bold shadow-[inset_0_0_10px_rgba(249,115,22,0.05)]"
                )}
              >
                <Folder className={cn(
                  "h-3.5 w-3.5 shrink-0 transition-colors",
                  selectedPath === dir.href ? "text-accent fill-accent/10" : "text-primary/40 fill-primary/5"
                )} />
                <span className="truncate font-mono uppercase tracking-tight">{dir.name}</span>
              </button>
            ))
          )}
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[9px] font-mono font-bold uppercase text-muted-foreground/60 tracking-wider">Operation Target:</span>
          <p className="text-[11px] font-medium text-foreground/90 break-all leading-tight italic">
            {selectedPath ? `"${(selectedPath || "").split("/").pop()}"` : `Current Folder (${currentPath})`}
          </p>
        </div>

        <DialogFooter className="sm:justify-between gap-2 border-t pt-3">
          <p className="text-[9px] font-mono text-muted-foreground/50 uppercase max-w-[200px] leading-tight">
            Double-click to enter folders. Single click to select destination.
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-sm font-mono text-[10px] font-bold uppercase h-8 px-4"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              size="sm" 
              className="rounded-sm font-mono text-[10px] font-bold uppercase h-8 px-4"
              onClick={handleMove}
            >
              Execute Move
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
