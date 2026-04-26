/**
 * CopyParty API client.
 * In production, nginx proxies /api/fs/* → CopyParty.
 * In dev, VITE_COPYPARTY_URL can point directly at the CopyParty instance.
 */

const BASE = import.meta.env.VITE_COPYPARTY_URL || "/api/fs";

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
    type === "raw-video"
  );
}

/** Check if a file type can attempt thumbnail generation via CopyParty */
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
  return `${BASE}/${href}`;
}

/** Get thumbnail URL */
export function thumbnailUrl(href: string): string {
  return `${BASE}/${href}?th`;
}

/** List directory contents */
export async function listDirectory(path: string): Promise<CopyPartyListing> {
  const cleanPath = path.replace(/^\/+|\/+$/g, "");
  const res = await fetch(`${BASE}/${cleanPath}?ls`);
  if (!res.ok) throw new Error(`Failed to list directory: ${res.statusText}`);

  const data = await res.json();

  return {
    dirs: (data.dirs || []).map((d: any) => ({
      name: d.n,
      href: cleanPath ? `${cleanPath}/${d.n}` : d.n,
      sz: d.s,
      ts: d.t,
      num: d.c,
      type: "d",
    })),
    files: (data.files || []).map((f: any) => ({
      name: f.n,
      href: cleanPath ? `${cleanPath}/${f.n}` : f.n,
      sz: f.s,
      ts: f.t,
      type: guessType(f.n),
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
  
  // Handle folder structure if webkitRelativePath is present
  let destPath = cleanDirPath;
  if (file.webkitRelativePath) {
    const parts = file.webkitRelativePath.split("/");
    if (parts.length > 1) {
      const subPath = parts.slice(0, -1).map(encodeURIComponent).join("/");
      destPath = destPath ? `${destPath}/${subPath}` : subPath;
    }
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${BASE}/${destPath}/`);

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
    form.append("act", "bput");
    form.append("f", file);
    xhr.send(form);
  });
}

interface EntryPathOptions {
  directory?: boolean;
}

function normalizeEntryPath(path: string, options?: EntryPathOptions): string {
  const clean = path.replace(/^\/+|\/+$/g, "");
  if (!options?.directory) return clean;
  return clean ? `${clean}/` : clean;
}

function getEntryName(path: string): string {
  return path.replace(/^\/+|\/+$/g, "").split("/").pop() || "";
}

/** Create a directory */
export async function createDirectory(
  parentPath: string,
  name: string
): Promise<void> {
  const cleanPath = parentPath.replace(/^\/+|\/+$/g, "");
  const form = new FormData();
  form.append("act", "mkdir");
  form.append("name", name);
  const url = cleanPath ? `${BASE}/${cleanPath}/` : `${BASE}/`;
  const res = await fetch(url, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error(`Failed to create directory: ${res.statusText}`);
}

/** Delete a file or directory */
export async function deleteEntry(
  path: string,
  options?: EntryPathOptions
): Promise<void> {
  const cleanPath = normalizeEntryPath(path, options);
  const res = await fetch(`${BASE}/${cleanPath}?delete`, { method: "POST" });
  if (!res.ok) throw new Error(`Failed to delete: ${res.statusText}`);
}

/** Rename a file or directory */
export async function renameEntry(
  path: string,
  newName: string,
  options?: EntryPathOptions
): Promise<void> {
  const cleanPath = normalizeEntryPath(path, options);
  const parentPath = cleanPath.replace(/\/+$/, "").split("/").slice(0, -1).join("/");
  const res = await fetch(
    `${BASE}/${cleanPath}?move=${encodeURIComponent(
      parentPath ? parentPath + "/" + newName : newName
    )}`,
    { method: "POST" }
  );
  if (!res.ok) throw new Error(`Failed to rename: ${res.statusText}`);
}

/** Move a file or directory to a new parent */
export async function moveEntry(
  srcPath: string,
  destDir: string,
  options?: EntryPathOptions
): Promise<void> {
  const cleanSrc = normalizeEntryPath(srcPath, options);
  const cleanDest = destDir.replace(/^\/+|\/+$/g, "");
  const name = getEntryName(srcPath);
  const res = await fetch(
    `${BASE}/${cleanSrc}?move=${encodeURIComponent(cleanDest + "/" + name)}`,
    { method: "POST" }
  );
  if (!res.ok) throw new Error(`Failed to move: ${res.statusText}`);
}

/** Copy a file or directory to a new parent */
export async function copyEntry(
  srcPath: string,
  destDir: string,
  options?: EntryPathOptions
): Promise<void> {
  const cleanSrc = normalizeEntryPath(srcPath, options);
  const cleanDest = destDir.replace(/^\/+|\/+$/g, "");
  const name = getEntryName(srcPath);
  const res = await fetch(
    `${BASE}/${cleanSrc}?copy=${encodeURIComponent(cleanDest + "/" + name)}`,
    { method: "POST" }
  );
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
  form.append("act", "bput");
  form.append("f", new File([content], name, { type: "text/plain" }));
  const res = await fetch(`${BASE}/${cleanPath}/`, {
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
