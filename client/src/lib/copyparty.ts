/**
 * Eagle Eye API client.
 * In production, nginx proxies /api/fs/* → Node.js server.
 */

const BASE = "/api/fs";

export interface CopyPartyEntry {
  name: string;
  href: string;
  sz: number;
  ts: number;
  type: string;
  num?: number;
}

export interface CopyPartyListing {
  dirs: CopyPartyEntry[];
  files: CopyPartyEntry[];
}

/** Guess if a file is an image, video, etc based on extension */
export function guessType(name: string): string {
  if (!name) return "file";
  const ext = name.split(".").pop()?.toLowerCase() || "";

  const types: Record<string, string> = {
    // Images
    jpg: "image", jpeg: "image", png: "image", gif: "image",
    webp: "image", svg: "image", bmp: "image", ico: "image",
    // RAW Images
    nef: "raw-image", cr2: "raw-image", arw: "raw-image", dng: "raw-image",
    orf: "raw-image", raf: "raw-image", rw2: "raw-image", pef: "raw-image",
    srw: "raw-image", x3f: "raw-image", iiq: "raw-image",
    // Video
    mp4: "video", webm: "video", ogg: "video", mov: "video",
    // RAW / Cinema Video
    r3d: "raw-video", braw: "raw-video", ari: "raw-video", mxf: "raw-video",
    prores: "raw-video", mkv: "raw-video", avi: "raw-video", wmv: "raw-video",
    // Audio
    mp3: "audio", wav: "audio", flac: "audio", aac: "audio", m4a: "audio",
    // Text / Code
    txt: "text", md: "text", json: "code", js: "code", ts: "code",
    tsx: "code", html: "code", css: "code", py: "code", sh: "code",
    // Docs
    pdf: "pdf", doc: "file", docx: "file", xls: "file", xlsx: "file",
    // Archive
    zip: "archive", tar: "archive", gz: "archive", rar: "archive", "7z": "archive",
  };

  return types[ext] || "file";
}

export function getFileExtension(name: string): string {
  if (!name) return "";
  return name.split(".").pop()?.toLowerCase() || "";
}

/** Some formats like R3D are folders in reality but treated as one file in cinema workflows */
export function isProprietaryCinemaVideo(name: string): boolean {
  const ext = getFileExtension(name);
  return ext === "r3d";
}

/** Check if a file type can be previewed in Eagle Eye */
export function isPreviewable(type: string): boolean {
  return (
    type === "image" ||
    type === "video" ||
    type === "raw-image" ||
    type === "raw-video" ||
    type === "pdf"
  );
}

/** Check if a file type can attempt thumbnail generation */
export function supportsThumbnails(type: string): boolean {
  return (
    type === "image" ||
    type === "video" ||
    type === "raw-image" ||
    type === "raw-video"
  );
}

/** Get raw file URL */
export function fileUrl(href: string): string {
  return `${BASE}/raw/${href}`;
}

/** Get thumbnail URL (Using raw for now as we removed CopyParty) */
export function thumbnailUrl(href: string): string {
  return `${BASE}/raw/${href}`;
}

/** List directory contents */
export async function listDirectory(path: string): Promise<CopyPartyListing> {
  const cleanPath = path.replace(/^\/+|\/+$/g, "");
  const res = await fetch(`${BASE}/ls/${cleanPath}`);
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `Failed to list directory: ${res.statusText}`);
  }

  const data = await res.json();

  return {
    dirs: (data.dirs || []).map((d: any) => ({
      ...d,
      type: "d",
    })),
    files: (data.files || []).map((f: any) => ({
      ...f,
      type: guessType(f.name),
    })),
  };
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(i > 0 ? 1 : 0)} ${sizes[i]}`;
}

/** Upload a file to the given directory */
export async function uploadFile(
  dirPath: string,
  file: File,
  onProgress?: (pct: number) => void
): Promise<void> {
  const cleanDirPath = dirPath.replace(/^\/+|\/+$/g, "");
  
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${BASE}/upload/${cleanDirPath}`);

    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress((e.loaded / e.total) * 100);
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));

    const form = new FormData();
    form.append("f", file);
    if (file.webkitRelativePath) {
      form.append("path", file.webkitRelativePath);
    }
    xhr.send(form);
  });
}

/** Create a directory */
export async function createDirectory(
  parentPath: string,
  name: string
): Promise<void> {
  const cleanParent = parentPath.replace(/^\/+|\/+$/g, "");
  const form = new FormData();
  form.append("name", name);
  const res = await fetch(`${BASE}/mkdir/${cleanParent}`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error(`Failed to create directory: ${res.statusText}`);
}

/** Delete a file or directory */
export async function deleteEntry(
  path: string,
): Promise<void> {
  const cleanPath = path.replace(/^\/+|\/+$/g, "");
  const res = await fetch(`${BASE}/delete/${cleanPath}`, { method: "POST" });
  if (!res.ok) throw new Error(`Failed to delete: ${res.statusText}`);
}

/** Rename a file or directory */
export async function renameEntry(
  path: string,
  newName: string,
): Promise<void> {
  const cleanPath = path.replace(/^\/+|\/+$/g, "");
  const parts = cleanPath.split("/");
  parts[parts.length - 1] = newName;
  const destPath = parts.join("/");

  const form = new FormData();
  form.append("dest", destPath);
  const res = await fetch(`${BASE}/move/${cleanPath}`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error(`Failed to rename: ${res.statusText}`);
}

/** Move a file or directory to a new parent */
export async function moveEntry(
  srcPath: string,
  destDir: string,
): Promise<void> {
  const cleanSrc = srcPath.replace(/^\/+|\/+$/g, "");
  const cleanDestDir = destDir.replace(/^\/+|\/+$/g, "");
  const name = srcPath.split("/").pop() || "";
  const finalDest = cleanDestDir ? `${cleanDestDir}/${name}` : name;

  const form = new FormData();
  form.append("dest", finalDest);
  const res = await fetch(`${BASE}/move/${cleanSrc}`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error(`Failed to move: ${res.statusText}`);
}

/** Copy a file or directory to a new parent */
export async function copyEntry(
  srcPath: string,
  destDir: string,
): Promise<void> {
  const cleanSrc = srcPath.replace(/^\/+|\/+$/g, "");
  const cleanDestDir = destDir.replace(/^\/+|\/+$/g, "");
  const name = srcPath.split("/").pop() || "";
  const finalDest = cleanDestDir ? `${cleanDestDir}/${name}` : name;

  const form = new FormData();
  form.append("dest", finalDest);
  const res = await fetch(`${BASE}/copy/${cleanSrc}`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error(`Failed to copy: ${res.statusText}`);
}

/** Create a text file with content */
export async function createTextFile(
  dirPath: string,
  name: string,
  content: string
): Promise<void> {
  const cleanPath = dirPath.replace(/^\/+|\/+$/g, "");
  const form = new FormData();
  form.append("f", new File([content], name, { type: "text/plain" }));
  const res = await fetch(`${BASE}/upload/${cleanPath}`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error(`Failed to create text file: ${res.statusText}`);
}

export function formatDate(ts: number): string {
  if (ts === 0) return "-";
  const date = new Date(ts * 1000);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / 86400000);

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString();
}
