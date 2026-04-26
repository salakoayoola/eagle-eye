import { useState, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, File, Folder, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const BASE = import.meta.env.VITE_COPYPARTY_URL || "/api/fs";

interface SearchResult {
  name: string;
  href: string;
  isDir: boolean;
}

async function searchFiles(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];
  const res = await fetch(`${BASE}/?search=${encodeURIComponent(query)}`);
  if (!res.ok) return [];
  const data = await res.json();
  // CopyParty search returns results in varying formats
  // We normalize here
  if (Array.isArray(data)) {
    return data.map((item: any) => ({
      name: typeof item === "string" ? (item || "").split("/").pop()! : item.name || item.href,
      href: typeof item === "string" ? item : item.href || item.name,
      isDir: typeof item === "string" ? item.endsWith("/") : item.type === "d",
    }));
  }
  if (data.results) {
    return data.results.map((item: any) => ({
      name: item.name || item.href?.split("/").pop() || "",
      href: item.href || item.name || "",
      isDir: item.type === "d" || item.href?.endsWith("/"),
    }));
  }
  return [];
}

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const { data: results, isLoading } = useQuery({
    queryKey: ["search", query],
    queryFn: () => searchFiles(query),
    enabled: query.length >= 2,
  });

  const handleSelect = useCallback(
    (result: SearchResult) => {
      onOpenChange(false);
      setQuery("");
      const path = result.href.replace(/^\//, "");
      if (result.isDir) {
        navigate(`/browse/${path}`);
      } else {
        // Navigate to the parent directory
        const parent = (path || "").split("/").slice(0, -1).join("/");
        navigate(`/browse/${parent || "raid"}`);
      }
    },
    [navigate, onOpenChange]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Search files</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            placeholder="Search by filename..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="max-h-64 overflow-y-auto">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
          {results?.map((result) => (
            <button
              key={result.href}
              onClick={() => handleSelect(result)}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors"
            >
              {result.isDir ? (
                <Folder className="h-4 w-4 text-primary/70 fill-primary/10" />
              ) : (
                <File className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="truncate">{result.name}</span>
              <span className="ml-auto truncate text-xs text-muted-foreground max-w-[200px]">
                {result.href}
              </span>
            </button>
          ))}
          {query.length >= 2 && !isLoading && results?.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No results found
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
