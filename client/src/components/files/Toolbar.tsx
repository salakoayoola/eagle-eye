import {
  LayoutGrid,
  List,
  ArrowUpDown,
  Plus,
  Upload,
  ClipboardPaste,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useClipboard } from "@/hooks/use-clipboard";

export type ViewMode = "grid" | "list";
export type SortBy = "name" | "size" | "date";
export type SortOrder = "asc" | "desc";

interface ToolbarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  sortBy: SortBy;
  sortOrder: SortOrder;
  onSortChange: (by: SortBy) => void;
  onNewFolder: () => void;
  onNewFile: () => void;
  onUpload: () => void;
  onPaste?: () => void;
}

export function Toolbar({
  viewMode,
  onViewModeChange,
  sortBy,
  sortOrder,
  onSortChange,
  onNewFolder,
  onNewFile,
  onUpload,
  onPaste,
}: ToolbarProps) {
  const { clipboard } = useClipboard();

  return (
    <div className="flex items-center gap-2">
      {/* View toggle */}
      <div className="flex rounded-md border">
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8 rounded-r-none",
            viewMode === "grid" && "bg-muted"
          )}
          onClick={() => onViewModeChange("grid")}
        >
          <LayoutGrid className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8 rounded-l-none",
            viewMode === "list" && "bg-muted"
          )}
          onClick={() => onViewModeChange("list")}
        >
          <List className="h-4 w-4" />
        </Button>
      </div>

      {/* Sort */}
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button variant="outline" size="sm" className="h-8 gap-1.5">
            <ArrowUpDown className="h-3.5 w-3.5" />
            <span className="capitalize">{sortBy}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => onSortChange("name")}>
            Name {sortBy === "name" && (sortOrder === "asc" ? "↑" : "↓")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSortChange("size")}>
            Size {sortBy === "size" && (sortOrder === "asc" ? "↑" : "↓")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSortChange("date")}>
            Date {sortBy === "date" && (sortOrder === "asc" ? "↑" : "↓")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Paste (visible when clipboard has items) */}
      {clipboard && onPaste && (
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5"
          onClick={onPaste}
        >
          <ClipboardPaste className="h-3.5 w-3.5" />
          Paste{" "}
          {clipboard.entries.length > 1
            ? `(${clipboard.entries.length})`
            : `"${clipboard.entries[0].name}"`}
        </Button>
      )}

      <div className="flex-1" />

      {/* New */}
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button size="sm" className="h-8 gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            New
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onNewFolder}>New Folder</DropdownMenuItem>
          <DropdownMenuItem onClick={onNewFile}>
            New Text File
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Upload */}
      <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={onUpload}>
        <Upload className="h-3.5 w-3.5" />
        Upload
      </Button>
    </div>
  );
}
