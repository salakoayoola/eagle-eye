/**
 * CopyParty API client.
 * In production, nginx proxies /api/fs/* → CopyParty.
 * In dev, VITE_COPYPARTY_URL can point directly at the CopyParty instance.
 */

const BASE = import.meta.env.VITE_COPYPARTY_URL || "/api/fs";

export interface CopyPartyEntry {
  name: string;
  /** Relative path within the volume */
  href: string;
  /** "d" for directory, or MIME type */
  type: string;
  /** Size in bytes (0 for directories) */
  sz: number;
  /** Last modified timestamp (epoch seconds) */
  ts: number;
  /** Number of items (for directories) */
  num?: number;
}

export interface CopyPartyListing {
  /** Current directory path */
  here: string;
  /** Directory name */
  name: string;
  /** Array of entries */
  dirs: CopyPartyEntry[];
  files: CopyPartyEntry[];
}

/** Fetch a directory listing from CopyParty */
export async function listDirectory(path: string): Promise<CopyPartyListing> {
  const cleanPath = path.replace(/^\/+|\/+$/g, "");
  const res = await fetch(`${BASE}/${cleanPath}?j`);
  if (!res.ok) {
    throw new Error(`Failed to list directory: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();

  // CopyParty returns an array of [name, ts, size, href] or similar format.
  // The exact format depends on the CopyParty version.
  // We normalize it here.
  return normalizeListing(data, cleanPath);
}

function normalizeListing(data: any, path: string): CopyPartyListing {
  const dirs: CopyPartyEntry[] = [];
  const files: CopyPartyEntry[] = [];

  // CopyParty ?j response format: { "dirs": [...], "files": [...] }
  // Each entry is an array: [name, timestamp, size, ...extra]
  // Or it may return a different format — we handle both.

  if (data.dirs) {
    for (const d of data.dirs) {
      if (Array.isArray(d)) {
        dirs.push({
          name: d[0],
          href: `${path}/${d[0]}`,
          type: "d",
          sz: 0,
          ts: d[1] || 0,
          num: d[2] || 0,
        });
      } else {
        dirs.push({
          name: d.name || d.href,
          href: d.href ? `${path}/${d.href}` : `${path}/${d.name}`,
          type: "d",
          sz: 0,
          ts: d.ts || d.dt || 0,
          num: d.num || 0,
        });
      }
    }
  }

  if (data.files) {
    for (const f of data.files) {
      if (Array.isArray(f)) {
        files.push({
          name: f[0],
          href: `${path}/${f[0]}`,
          type: guessType(f[0]),
          sz: f[2] || 0,
          ts: f[1] || 0,
        });
      } else {
        files.push({
          name: f.name || f.href,
          href: f.href ? `${path}/${f.href}` : `${path}/${f.name}`,
          type: guessType(f.name || f.href || ""),
          sz: f.sz || f.size || 0,
          ts: f.ts || f.dt || 0,
        });
      }
    }
  }

  return {
    here: path,
    name: path.split("/").pop() || path,
    dirs,
    files,
  };
}

function guessType(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  const types: Record<string, string> = {
    jpg: "image", jpeg: "image", png: "image", gif: "image", webp: "image",
    svg: "image", bmp: "image", ico: "image", avif: "image",
    mp4: "video", mkv: "video", mov: "video", avi: "video", webm: "video",
    mp3: "audio", wav: "audio", flac: "audio", ogg: "audio", aac: "audio", m4a: "audio",
    pdf: "pdf",
    txt: "text", md: "text", json: "text", csv: "text", log: "text",
    js: "code", ts: "code", py: "code", html: "code", css: "code",
    zip: "archive", tar: "archive", gz: "archive", "7z": "archive", rar: "archive",
  };
  return types[ext] || "file";
}

/** Build a thumbnail URL for an image/video */
export function thumbnailUrl(path: string): string {
  const cleanPath = path.replace(/^\/+/, "");
  return `${BASE}/${cleanPath}?th`;
}

/** Build a direct download/streaming URL */
export function fileUrl(path: string): string {
  const cleanPath = path.replace(/^\/+/, "");
  return `${BASE}/${cleanPath}`;
}

/** Format bytes to human readable */
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
  file: globalThis.File,
  onProgress?: (pct: number) => void
): Promise<void> {
  const cleanPath = dirPath.replace(/^\/+|\/+$/g, "");
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${BASE}/${cleanPath}/`);

    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress((e.loaded / e.total) * 100);
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed: ${xhr.status}`));
    };
    xhr.onerror = () => reject(new Error("Upload failed"));

    const form = new FormData();
    form.append("file", file);
    xhr.send(form);
  });
}

/** Create a directory */
export async function createDirectory(
  parentPath: string,
  name: string
): Promise<void> {
  const cleanPath = parentPath.replace(/^\/+|\/+$/g, "");
  const res = await fetch(`${BASE}/${cleanPath}/?mkdir=${encodeURIComponent(name)}`, {
    method: "POST",
  });
  if (!res.ok) throw new Error(`Failed to create directory: ${res.statusText}`);
}

/** Delete a file or directory */
export async function deleteEntry(path: string): Promise<void> {
  const cleanPath = path.replace(/^\/+|\/+$/g, "");
  const res = await fetch(`${BASE}/${cleanPath}?delete`, {
    method: "POST",
  });
  if (!res.ok) throw new Error(`Failed to delete: ${res.statusText}`);
}

/** Rename a file or directory */
export async function renameEntry(
  path: string,
  newName: string
): Promise<void> {
  const cleanPath = path.replace(/^\/+|\/+$/g, "");
  const parentPath = cleanPath.split("/").slice(0, -1).join("/");
  const res = await fetch(
    `${BASE}/${cleanPath}?move=${encodeURIComponent(parentPath + "/" + newName)}`,
    { method: "POST" }
  );
  if (!res.ok) throw new Error(`Failed to rename: ${res.statusText}`);
}

/** Move a file or directory to a new parent */
export async function moveEntry(
  srcPath: string,
  destDir: string
): Promise<void> {
  const cleanSrc = srcPath.replace(/^\/+|\/+$/g, "");
  const cleanDest = destDir.replace(/^\/+|\/+$/g, "");
  const name = cleanSrc.split("/").pop();
  const res = await fetch(
    `${BASE}/${cleanSrc}?move=${encodeURIComponent(cleanDest + "/" + name)}`,
    { method: "POST" }
  );
  if (!res.ok) throw new Error(`Failed to move: ${res.statusText}`);
}

/** Create a text file with content */
export async function createTextFile(
  dirPath: string,
  name: string,
  content: string
): Promise<void> {
  const cleanPath = dirPath.replace(/^\/+|\/+$/g, "");
  const blob = new Blob([content], { type: "text/plain" });
  const file = new globalThis.File([blob], name);
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE}/${cleanPath}/`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error(`Failed to create file: ${res.statusText}`);
}

/** Format timestamp to relative or date string */
export function formatDate(ts: number): string {
  if (!ts) return "";
  const date = new Date(ts * 1000);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / 86400000);

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString();
}
