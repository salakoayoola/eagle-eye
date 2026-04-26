import { useCallback, useState, useRef } from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadZoneProps {
  onFiles: (files: File[] | FileList) => void;
  children: React.ReactNode;
  className?: string;
}

export function UploadZone({ onFiles, children, className }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
    if (e.dataTransfer.types.includes("Files")) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const traverseFileTree = async (item: FileSystemEntry, path = ""): Promise<File[]> => {
    return new Promise((resolve) => {
      if (item.isFile) {
        (item as FileSystemFileEntry).file((file) => {
          // Manually attach the relative path for CopyParty
          Object.defineProperty(file, 'webkitRelativePath', {
            value: path + file.name
          });
          resolve([file]);
        });
      } else if (item.isDirectory) {
        const dirReader = (item as FileSystemDirectoryEntry).createReader();
        dirReader.readEntries(async (entries) => {
          const files: File[] = [];
          for (const entry of entries) {
            const entryFiles = await traverseFileTree(entry, path + item.name + "/");
            files.push(...entryFiles);
          }
          resolve(files);
        });
      } else {
        resolve([]);
      }
    });
  };

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      dragCounter.current = 0;
      setIsDragging(false);

      const items = e.dataTransfer.items;
      if (items) {
        const files: File[] = [];
        const promises = [];
        for (let i = 0; i < items.length; i++) {
          const item = items[i].webkitGetAsEntry();
          if (item) {
            promises.push(traverseFileTree(item));
          }
        }
        const results = await Promise.all(promises);
        results.forEach(res => files.push(...res));
        if (files.length > 0) {
          onFiles(files);
        }
      } else if (e.dataTransfer.files.length > 0) {
        onFiles(e.dataTransfer.files);
      }
    },
    [onFiles]
  );

  return (
    <div
      className={cn("relative h-full w-full", className)}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {children}
      {isDragging && (
        <div className="absolute inset-0 z-50 flex items-center justify-center rounded-lg border-2 border-dashed border-primary bg-primary/5 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2 text-primary">
            <Upload className="h-10 w-10" />
            <span className="text-sm font-medium">Drop files or folders to upload</span>
          </div>
        </div>
      )}
    </div>
  );
}
