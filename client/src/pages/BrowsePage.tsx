import { useState, useCallback, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import {
  Toolbar,
  type ViewMode,
  type SortBy,
  type SortOrder,
} from "@/components/files/Toolbar";
import { FileGrid } from "@/components/files/FileGrid";
import { FileList } from "@/components/files/FileList";
import { UploadZone } from "@/components/files/UploadZone";
import { NewFolderDialog } from "@/components/files/NewFolderDialog";
import { NewFileDialog } from "@/components/files/NewFileDialog";
import { RenameDialog } from "@/components/files/RenameDialog";
import { DeleteDialog } from "@/components/files/DeleteDialog";
import { MoveDialog } from "@/components/files/MoveDialog";
import { FileInfoSidebar } from "@/components/files/FileInfoSidebar";
import { useFiles } from "@/hooks/use-files";
import { useClipboard } from "@/hooks/use-clipboard";
import {
  type CopyPartyEntry,
  createDirectory,
  createTextFile,
  deleteEntry,
  renameEntry,
  moveEntry,
  copyEntry,
  uploadFile,
} from "@/lib/copyparty";
import { ImageLightbox } from "@/components/media/ImageLightbox";
import { VideoPlayer } from "@/components/media/VideoPlayer";
import { Loader2 } from "lucide-react";

export function BrowsePage() {
  const { "*": splat } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const path = splat || "raid";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, error } = useFiles(path);
  const { clipboard, copy, cut, clear: clearClipboard } = useClipboard();

  const [viewMode, setViewMode] = useState<ViewMode>(
    () => (localStorage.getItem("eagle-eye-view") as ViewMode) || "grid"
  );
  const [sortBy, setSortBy] = useState<SortBy>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());

  // Dialog states
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFileOpen, setNewFileOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<CopyPartyEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CopyPartyEntry | null>(null);
  const [moveTarget, setMoveTarget] = useState<CopyPartyEntry | null>(null);

  // Media preview state
  const [mediaEntry, setMediaEntry] = useState<CopyPartyEntry | null>(null);

  // Info sidebar state
  const [infoEntry, setInfoEntry] = useState<CopyPartyEntry | null>(null);

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["files", path] });
  }, [queryClient, path]);

  const invalidatePath = useCallback(
    (p: string) => {
      queryClient.invalidateQueries({ queryKey: ["files", p] });
    },
    [queryClient]
  );

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem("eagle-eye-view", mode);
  }, []);

  const handleSortChange = useCallback(
    (by: SortBy) => {
      if (by === sortBy) {
        setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
      } else {
        setSortBy(by);
        setSortOrder("asc");
      }
    },
    [sortBy]
  );

  const handleNavigate = useCallback(
    (entry: CopyPartyEntry) => {
      setSelectedPaths(new Set());
      setInfoEntry(null);
      navigate(`/browse/${entry.href}`);
    },
    [navigate]
  );

  // Single click on file → open info sidebar
  const handleFileSelect = useCallback((entry: CopyPartyEntry) => {
    setInfoEntry(entry);
  }, []);

  // Open media preview or the file
  const handleFileOpen = useCallback(
    (entry: CopyPartyEntry) => {
      if (entry.type === "image" || entry.type === "video") {
        setMediaEntry(entry);
      } else if (entry.type === "d") {
        navigate(`/browse/${entry.href}`);
      } else {
        setInfoEntry(entry);
      }
    },
    [navigate]
  );

  // Clipboard operations
  const handleCopy = useCallback(
    (entry: CopyPartyEntry) => {
      copy([entry], path);
    },
    [copy, path]
  );

  const handleCut = useCallback(
    (entry: CopyPartyEntry) => {
      cut([entry], path);
    },
    [cut, path]
  );

  const handlePaste = useCallback(async () => {
    if (!clipboard) return;

    try {
      for (const entry of clipboard.entries) {
        if (clipboard.action === "copy") {
          await copyEntry(entry.href, path);
        } else {
          await moveEntry(entry.href, path);
        }
      }

      // Invalidate both source and destination
      invalidate();
      if (clipboard.sourcePath !== path) {
        invalidatePath(clipboard.sourcePath);
      }

      if (clipboard.action === "cut") {
        clearClipboard();
      }
    } catch (err) {
      console.error("Paste failed:", err);
    }
  }, [clipboard, path, invalidate, invalidatePath, clearClipboard]);

  // File operations
  const handleNewFolder = useCallback(
    async (name: string) => {
      await createDirectory(path, name);
      invalidate();
    },
    [path, invalidate]
  );

  const handleNewFile = useCallback(
    async (name: string, content: string) => {
      await createTextFile(path, name, content);
      invalidate();
    },
    [path, invalidate]
  );

  const handleRename = useCallback(
    async (newName: string) => {
      if (!renameTarget) return;
      await renameEntry(renameTarget.href, newName);
      setRenameTarget(null);
      if (infoEntry?.href === renameTarget.href) setInfoEntry(null);
      invalidate();
    },
    [renameTarget, invalidate, infoEntry]
  );

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    await deleteEntry(deleteTarget.href);
    if (infoEntry?.href === deleteTarget.href) setInfoEntry(null);
    setDeleteTarget(null);
    setSelectedPaths((prev) => {
      const next = new Set(prev);
      next.delete(deleteTarget.href);
      return next;
    });
    invalidate();
  }, [deleteTarget, invalidate, infoEntry]);

  const handleMove = useCallback(
    async (destPath: string) => {
      if (!moveTarget) return;
      await moveEntry(moveTarget.href, destPath);
      setMoveTarget(null);
      if (infoEntry?.href === moveTarget.href) setInfoEntry(null);
      invalidate();
      invalidatePath(destPath);
    },
    [moveTarget, invalidate, invalidatePath, infoEntry]
  );

  const handleUploadFiles = useCallback(
    async (files: FileList) => {
      const uploads = Array.from(files).map((file) => uploadFile(path, file));
      await Promise.allSettled(uploads);
      invalidate();
    },
    [path, invalidate]
  );

  // Sort entries
  const sortedDirs = useMemo(() => {
    if (!data) return [];
    return [...data.dirs].sort((a, b) => {
      const mul = sortOrder === "asc" ? 1 : -1;
      if (sortBy === "name") return mul * a.name.localeCompare(b.name);
      if (sortBy === "date") return mul * (a.ts - b.ts);
      return mul * a.name.localeCompare(b.name);
    });
  }, [data, sortBy, sortOrder]);

  const sortedFiles = useMemo(() => {
    if (!data) return [];
    return [...data.files].sort((a, b) => {
      const mul = sortOrder === "asc" ? 1 : -1;
      if (sortBy === "name") return mul * a.name.localeCompare(b.name);
      if (sortBy === "size") return mul * (a.sz - b.sz);
      if (sortBy === "date") return mul * (a.ts - b.ts);
      return 0;
    });
  }, [data, sortBy, sortOrder]);

  // Media navigation helpers (must be after sortedFiles)
  const mediaFiles = useMemo(
    () => sortedFiles.filter((f) => f.type === "image" || f.type === "video"),
    [sortedFiles]
  );
  const mediaIndex = mediaEntry
    ? mediaFiles.findIndex((f) => f.href === mediaEntry.href)
    : -1;

  return (
    <UploadZone onFiles={handleUploadFiles}>
      <div className="flex h-full">
        {/* Main content */}
        <div className="flex-1 min-w-0 p-4">
          {/* Breadcrumbs */}
          <div className="mb-4">
            <Breadcrumbs path={path} />
          </div>

          {/* Toolbar */}
          <div className="mb-4">
            <Toolbar
              viewMode={viewMode}
              onViewModeChange={handleViewModeChange}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortChange={handleSortChange}
              onNewFolder={() => setNewFolderOpen(true)}
              onNewFile={() => setNewFileOpen(true)}
              onUpload={() => fileInputRef.current?.click()}
              onPaste={handlePaste}
            />
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) handleUploadFiles(e.target.files);
              e.target.value = "";
            }}
          />

          {/* Content */}
          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-24 text-sm text-muted-foreground">
              <p>Failed to load files</p>
              <p className="text-xs mt-1">
                {error instanceof Error ? error.message : "Unknown error"}
              </p>
            </div>
          ) : viewMode === "grid" ? (
            <FileGrid
              dirs={sortedDirs}
              files={sortedFiles}
              onNavigate={handleNavigate}
              onSelect={handleFileSelect}
              selectedPaths={selectedPaths}
              onRename={setRenameTarget}
              onDelete={setDeleteTarget}
              onMove={setMoveTarget}
              onInfo={setInfoEntry}
              onCopy={handleCopy}
              onCut={handleCut}
            />
          ) : (
            <FileList
              dirs={sortedDirs}
              files={sortedFiles}
              onNavigate={handleNavigate}
              onSelect={handleFileSelect}
              selectedPaths={selectedPaths}
              onRename={setRenameTarget}
              onDelete={setDeleteTarget}
              onMove={setMoveTarget}
              onInfo={setInfoEntry}
              onCopy={handleCopy}
              onCut={handleCut}
            />
          )}
        </div>

        {/* Info Sidebar */}
        {infoEntry && (
          <FileInfoSidebar
            entry={infoEntry}
            onClose={() => setInfoEntry(null)}
            onOpen={() => handleFileOpen(infoEntry)}
          />
        )}
      </div>

      {/* Media Preview */}
      {mediaEntry?.type === "image" && (
        <ImageLightbox
          entry={mediaEntry}
          onClose={() => setMediaEntry(null)}
          hasPrev={mediaIndex > 0}
          hasNext={mediaIndex < mediaFiles.length - 1}
          onPrev={() => setMediaEntry(mediaFiles[mediaIndex - 1])}
          onNext={() => setMediaEntry(mediaFiles[mediaIndex + 1])}
        />
      )}
      {mediaEntry?.type === "video" && (
        <VideoPlayer
          entry={mediaEntry}
          onClose={() => setMediaEntry(null)}
        />
      )}

      {/* Dialogs */}
      <NewFolderDialog
        open={newFolderOpen}
        onOpenChange={setNewFolderOpen}
        onSubmit={handleNewFolder}
      />
      <NewFileDialog
        open={newFileOpen}
        onOpenChange={setNewFileOpen}
        onSubmit={handleNewFile}
      />
      {renameTarget && (
        <RenameDialog
          open={!!renameTarget}
          onOpenChange={(open) => !open && setRenameTarget(null)}
          currentName={renameTarget.name}
          onSubmit={handleRename}
        />
      )}
      {deleteTarget && (
        <DeleteDialog
          open={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          name={deleteTarget.name}
          onConfirm={handleDelete}
        />
      )}
      {moveTarget && (
        <MoveDialog
          open={!!moveTarget}
          onOpenChange={(open) => !open && setMoveTarget(null)}
          entryName={moveTarget.name}
          onSubmit={handleMove}
        />
      )}
    </UploadZone>
  );
}
