/**
 * CopyParty API client.
 * In production, nginx proxies /api/fs/* → CopyParty.
 * In dev, VITE_COPYPARTY_URL can point directly at the CopyParty instance.
 */

const BASE = import.meta.env.VITE_COPYPARTY_URL || "/api/fs";

const PROPRIETARY_CINEMA_VIDEO_EXTS = new Set(["r3d", "braw", "ari"]);

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
  const res = await fetch(`${BASE}/${cleanPath}?ls`);
  if (!res.ok) {
    throw new Error(`Failed to list directory: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  return normalizeListing(data, cleanPath);
}

function normalizeListing(data: any, path: string): CopyPartyListing {
  const dirs: CopyPartyEntry[] = [];
  const files: CopyPartyEntry[] = [];

  // CopyParty ?ls response: { dirs: [{href, sz, ts, ext, lead}, ...], files: [...] }
  // href for dirs includes trailing slash, e.g. "FolderName/"

  if (data.dirs) {
    for (const d of data.dirs) {
      const rawHref = d.href || "";
      const name = decodeURIComponent(rawHref.replace(/\/+$/, ""));
      dirs.push({
        name,
        href: `${path}/${name}`,
        type: "d",
        sz: d.sz || 0,
        ts: d.ts || 0,
      });
    }
  }

  if (data.files) {
    for (const f of data.files) {
      const rawHref = f.href || "";
      const name = decodeURIComponent(rawHref);
      files.push({
        name,
        href: `${path}/${name}`,
        type: guessType(name),
        sz: f.sz || 0,
        ts: f.ts || 0,
      });
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
  const ext = getFileExtension(name);
  const types: Record<string, string> = {
    // Web-previewable images
    jpg: "image", jpeg: "image", png: "image", gif: "image", webp: "image",
    svg: "image", bmp: "image", ico: "image", avif: "image", jfif: "image",
    // RAW image formats (camera)
    nef: "raw-image", cr2: "raw-image", cr3: "raw-image", arw: "raw-image",
    orf: "raw-image", rw2: "raw-image", dng: "raw-image", raf: "raw-image",
    pef: "raw-image", srw: "raw-image", x3f: "raw-image", iiq: "raw-image",
    tiff: "image", tif: "image",
    // PSD / design
    psd: "raw-image", ai: "raw-image", eps: "raw-image",
    // Web-playable video
    mp4: "video", webm: "video", ogg: "video", mov: "video",
    // Non-web video (needs transcoding)
    mkv: "raw-video", avi: "raw-video", wmv: "raw-video",
    flv: "raw-video", m4v: "raw-video", mpg: "raw-video", mpeg: "raw-video",
    "3gp": "raw-video", mts: "raw-video", m2ts: "raw-video",
    // Cinema / pro video
    r3d: "raw-video", braw: "raw-video", ari: "raw-video", mxf: "raw-video",
    prores: "raw-video",
    // Audio
    mp3: "audio", wav: "audio", flac: "audio", aac: "audio", m4a: "audio",
    wma: "audio", alac: "audio", aiff: "audio", ape: "audio", opus: "audio",
    // Documents
    pdf: "pdf",
    doc: "document", docx: "document", xls: "document", xlsx: "document",
    ppt: "document", pptx: "document", odt: "document", ods: "document",
    // Text
    txt: "text", md: "text", json: "text", csv: "text", log: "text",
    xml: "text", yaml: "text", yml: "text", toml: "text", ini: "text",
    cfg: "text", conf: "text", env: "text",
    // Code
    js: "code", jsx: "code", ts: "code", tsx: "code", py: "code",
    html: "code", css: "code", scss: "code", less: "code",
    go: "code", rs: "code", java: "code", kt: "code", swift: "code",
    c: "code", cpp: "code", h: "code", hpp: "code",
    rb: "code", php: "code", sh: "code", bash: "code", zsh: "code",
    sql: "code", r: "code", lua: "code", zig: "code",
    // Archives
    zip: "archive", tar: "archive", gz: "archive", "7z": "archive", rar: "archive",
    bz2: "archive", xz: "archive", zst: "archive", lz4: "archive",
    iso: "archive", dmg: "archive",
    // Subtitles
    srt: "text", vtt: "text", ass: "text", ssa: "text",
    // Fonts
    ttf: "file", otf: "file", woff: "file", woff2: "file",
  };
  return types[ext] || "file";
}

export function getFileExtension(name: string): string {
  return name.split(".").pop()?.toLowerCase() || "";
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

/** R3D / BRAW / ARI require proprietary SDKs; thumbnail decode may fail */
export function isProprietaryCinemaVideo(name: string): boolean {
  return PROPRIETARY_CINEMA_VIDEO_EXTS.has(getFileExtension(name));
}

/** Check if a file can be opened inline (text, code, etc.) */
export function isTextType(type: string): boolean {
  return type === "text" || type === "code";
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
  const res = await fetch(`${BASE}/${cleanPath}/`, {
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
  const res = await fetch(`${BASE}/${cleanPath}?delete`, {
    method: "POST",
  });
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
    `${BASE}/${cleanPath}?move=${encodeURIComponent(parentPath + "/" + newName)}`,
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
  const blob = new Blob([content], { type: "text/plain" });
  const file = new globalThis.File([blob], name);
  const form = new FormData();
  form.append("act", "bput");
  form.append("f", file);
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
