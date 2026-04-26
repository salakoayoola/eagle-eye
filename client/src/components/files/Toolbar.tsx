import {
  LayoutGrid,
  List,
  ArrowUpDown,
  Plus,
  Upload,
  ClipboardPaste,
  X,
  FileUp,
  FolderUp,
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
  onUploadFiles: () => void;
  onUploadFolder: () => void;
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
  onUploadFiles,
  onUploadFolder,
  onPaste,
}: ToolbarProps) {
  const { clipboard, clear: clearClipboard } = useClipboard();

  return (
    <div className="flex items-center gap-2">
      {/* View toggle */}
      <div className="flex rounded-sm border bg-background p-0.5 shadow-sm">
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-7 w-7 rounded-sm",
            viewMode === "grid" && "bg-primary text-primary-foreground shadow-sm"
          )}
          onClick={() => onViewModeChange("grid")}
        >
          <LayoutGrid className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-7 w-7 rounded-sm",
            viewMode === "list" && "bg-primary text-primary-foreground shadow-sm"
          )}
          onClick={() => onViewModeChange("list")}
        >
          <List className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Sort */}
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button variant="outline" size="sm" className="h-8 gap-2 rounded-sm border-dashed font-mono text-[10px] font-bold uppercase tracking-wider">
            <ArrowUpDown className="h-3 w-3" />
            {sortBy}
            <span className="text-muted-foreground/50">{sortOrder === "asc" ? "↑" : "↓"}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="rounded-sm font-mono text-[10px] font-bold uppercase">
          <DropdownMenuItem onClick={() => onSortChange("name")}>Name</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSortChange("size")}>Size</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSortChange("date")}>Date</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Clipboard Actions */}
      {clipboard && (
        <div className="flex items-center gap-1 animate-in fade-in slide-in-from-left-2">
          {onPaste && (
            <Button
              variant="default"
              size="sm"
              className="h-8 gap-2 rounded-sm bg-accent text-accent-foreground hover:bg-accent/90 font-mono text-[10px] font-bold uppercase tracking-wider"
              onClick={onPaste}
            >
              <ClipboardPaste className="h-3.5 w-3.5" />
              Paste ({clipboard.entries.length})
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-sm hover:bg-destructive/10 hover:text-destructive transition-colors"
            onClick={clearClipboard}
            title="Clear clipboard"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      <div className="flex-1" />

      {/* New */}
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button size="sm" className="h-8 gap-2 rounded-sm font-mono text-[10px] font-bold uppercase tracking-wider">
            <Plus className="h-3.5 w-3.5" />
            New
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="rounded-sm font-mono text-[10px] font-bold uppercase">
          <DropdownMenuItem onClick={onNewFolder}>New Folder</DropdownMenuItem>
          <DropdownMenuItem onClick={onNewFile}>New Text File</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Upload */}
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 gap-2 rounded-sm border-2 font-mono text-[10px] font-bold uppercase tracking-wider hover:bg-muted"
          >
            <Upload className="h-3.5 w-3.5" />
            Upload
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="rounded-sm font-mono text-[10px] font-bold uppercase">
          <DropdownMenuItem onClick={onUploadFiles} className="gap-2">
            <FileUp className="h-3.5 w-3.5" />
            Files
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onUploadFolder} className="gap-2">
            <FolderUp className="h-3.5 w-3.5" />
            Folder
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
