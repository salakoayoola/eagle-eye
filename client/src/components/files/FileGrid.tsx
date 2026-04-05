import type { CopyPartyEntry } from "@/lib/copyparty";
import { FileCard } from "./FileCard";
import { FolderCard } from "./FolderCard";

interface FileGridProps {
  dirs: CopyPartyEntry[];
  files: CopyPartyEntry[];
  onNavigate: (entry: CopyPartyEntry) => void;
  onSelect: (entry: CopyPartyEntry) => void;
  selectedPaths: Set<string>;
}

export function FileGrid({
  dirs,
  files,
  onNavigate,
  onSelect,
  selectedPaths,
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
        />
      ))}
      {files.map((file) => (
        <FileCard
          key={file.href}
          entry={file}
          onClick={() => onSelect(file)}
          selected={selectedPaths.has(file.href)}
        />
      ))}
    </div>
  );
}
