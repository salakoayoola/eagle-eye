import type { CopyPartyEntry } from "@/lib/copyparty";
import { FileCard } from "./FileCard";
import { FolderCard } from "./FolderCard";

interface FileGridProps {
  dirs: CopyPartyEntry[];
  files: CopyPartyEntry[];
  onNavigate: (entry: CopyPartyEntry) => void;
  onSelect: (entry: CopyPartyEntry) => void;
  selectedPaths: Set<string>;
  onRename?: (entry: CopyPartyEntry) => void;
  onDelete?: (entry: CopyPartyEntry) => void;
  onMove?: (entry: CopyPartyEntry) => void;
  onInfo?: (entry: CopyPartyEntry) => void;
  onCopy?: (entry: CopyPartyEntry) => void;
  onCut?: (entry: CopyPartyEntry) => void;
}

export function FileGrid({
  dirs,
  files,
  onNavigate,
  onSelect,
  selectedPaths,
  onRename,
  onDelete,
  onMove,
  onInfo,
  onCopy,
  onCut,
}: FileGridProps) {
  if (dirs.length === 0 && files.length === 0) {
    return (
      <div className="flex items-center justify-center py-24 text-sm text-muted-foreground">
        This folder is empty
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {dirs.map((dir) => (
        <FolderCard
          key={dir.href}
          entry={dir}
          onClick={() => onNavigate(dir)}
          selected={selectedPaths.has(dir.href)}
          onRename={onRename ? () => onRename(dir) : undefined}
          onDelete={onDelete ? () => onDelete(dir) : undefined}
          onMove={onMove ? () => onMove(dir) : undefined}
          onInfo={onInfo ? () => onInfo(dir) : undefined}
          onCopy={onCopy ? () => onCopy(dir) : undefined}
          onCut={onCut ? () => onCut(dir) : undefined}
        />
      ))}
      {files.map((file) => (
        <FileCard
          key={file.href}
          entry={file}
          onClick={() => onSelect(file)}
          selected={selectedPaths.has(file.href)}
          onRename={onRename ? () => onRename(file) : undefined}
          onDelete={onDelete ? () => onDelete(file) : undefined}
          onMove={onMove ? () => onMove(file) : undefined}
          onInfo={onInfo ? () => onInfo(file) : undefined}
          onCopy={onCopy ? () => onCopy(file) : undefined}
          onCut={onCut ? () => onCut(file) : undefined}
        />
      ))}
    </div>
  );
}
