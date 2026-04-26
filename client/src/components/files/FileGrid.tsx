import type { CopyPartyEntry } from "@/lib/copyparty";
import type { MouseEvent } from "react";
import { FileCard } from "./FileCard";
import { FolderCard } from "./FolderCard";

interface FileGridProps {
  dirs: CopyPartyEntry[];
  files: CopyPartyEntry[];
  onEntryClick: (entry: CopyPartyEntry, event: MouseEvent) => void;
  onToggleSelect: (entry: CopyPartyEntry, event: MouseEvent) => void;
  selectedPaths: Set<string>;
  onRename?: (entry: CopyPartyEntry) => void;
  onDelete?: (entry: CopyPartyEntry) => void;
  onMove?: (entry: CopyPartyEntry) => void;
  onInfo?: (entry: CopyPartyEntry) => void;
  onCopy?: (entry: CopyPartyEntry) => void;
  onCut?: (entry: CopyPartyEntry) => void;
  onNewFolder?: () => void;
}

export function FileGrid({
  dirs,
  files,
  onEntryClick,
  onToggleSelect,
  selectedPaths,
  onRename,
  onDelete,
  onMove,
  onInfo,
  onCopy,
  onCut,
  onNewFolder,
}: FileGridProps) {
  if (dirs.length === 0 && files.length === 0) {
    return (
      <div className="flex items-center justify-center py-24 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
        Directory is empty
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 pb-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {dirs.map((dir) => (
        <FolderCard
          key={dir.href}
          entry={dir}
          onClick={(event) => onEntryClick(dir, event)}
          onToggleSelect={(event) => onToggleSelect(dir, event)}
          selected={selectedPaths.has(dir.href)}
          onRename={onRename ? () => onRename(dir) : undefined}
          onDelete={onDelete ? () => onDelete(dir) : undefined}
          onMove={onMove ? () => onMove(dir) : undefined}
          onInfo={onInfo ? () => onInfo(dir) : undefined}
          onCopy={onCopy ? () => onCopy(dir) : undefined}
          onCut={onCut ? () => onCut(dir) : undefined}
          onNewFolder={onNewFolder}
        />
      ))}
      {files.map((file) => (
        <FileCard
          key={file.href}
          entry={file}
          onClick={(event) => onEntryClick(file, event)}
          onToggleSelect={(event) => onToggleSelect(file, event)}
          selected={selectedPaths.has(file.href)}
          onRename={onRename ? () => onRename(file) : undefined}
          onDelete={onDelete ? () => onDelete(file) : undefined}
          onMove={onMove ? () => onMove(file) : undefined}
          onInfo={onInfo ? () => onInfo(file) : undefined}
          onCopy={onCopy ? () => onCopy(file) : undefined}
          onCut={onCut ? () => onCut(file) : undefined}
          onNewFolder={onNewFolder}
        />
      ))}
    </div>
  );
}
