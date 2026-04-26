import { Hono } from "hono";
import { readdir, stat, mkdir, rm, rename, writeFile } from "node:fs/promises";
import { join, resolve, basename, dirname } from "node:path";
import { createReadStream } from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { stream } from "hono/streaming";
import { getMimeType } from "hono/utils/mime";
import mime from "mime";

const exec = promisify(execFile);
export const fs = new Hono();

const ROOT_PATHS: Record<string, string> = {
  raid: "/raid",
  media: "/media",
};

/**
 * Resolve a virtual path (e.g. "raid/Projects") to a real host path ("/raid/Projects")
 */
function resolvePath(path: string): string {
  const parts = path.split("/").filter(Boolean);
  if (parts.length === 0) return "/";

  const root = ROOT_PATHS[parts[0]];
  if (!root) throw new Error("Invalid root path");

  const resolved = resolve(root, ...parts.slice(1));
  
  // Security check: ensure the resolved path is still under one of our roots
  if (!resolved.startsWith("/raid") && !resolved.startsWith("/media")) {
    throw new Error("Access denied: path out of bounds");
  }
  
  return resolved;
}

// List directory
fs.get("/ls/*", async (c) => {
  const virtualPath = c.req.param("0") || "";
  try {
    const realPath = resolvePath(virtualPath);
    const entries = await readdir(realPath, { withFileTypes: true });
    
    const dirs = [];
    const files = [];

    for (const entry of entries) {
      const fullPath = join(realPath, entry.name);
      try {
        const s = await stat(fullPath);
        const item = {
          name: entry.name,
          href: join(virtualPath, entry.name),
          sz: s.size,
          ts: Math.floor(s.mtimeMs / 1000),
          type: entry.isDirectory() ? "d" : "f",
        };

        if (entry.isDirectory()) {
          dirs.push(item);
        } else {
          files.push(item);
        }
      } catch {
        // Skip inaccessible files
      }
    }

    return c.json({ dirs, files });
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : "Failed to list directory" }, 500);
  }
});

// Download/Stream file
fs.get("/raw/*", async (c) => {
  const virtualPath = c.req.param("0") || "";
  try {
    const realPath = resolvePath(virtualPath);
    const s = await stat(realPath);
    if (!s.isFile()) return c.text("Not a file", 400);

    const mimeType = mime.getType(realPath) || "application/octet-stream";
    
    c.header("Content-Type", mimeType);
    c.header("Content-Length", s.size.toString());
    c.header("Content-Disposition", `inline; filename="${basename(realPath)}"`);

    return stream(c, async (stream) => {
      const readStream = createReadStream(realPath);
      for await (const chunk of readStream) {
        await stream.write(chunk);
      }
    });
  } catch (err) {
    return c.text(err instanceof Error ? err.message : "File not found", 404);
  }
});

// Upload file
fs.post("/upload/*", async (c) => {
  const virtualDir = c.req.param("0") || "";
  try {
    const body = await c.req.parseBody();
    const file = body["f"] as File;
    const relativePath = body["path"] as string; // Optional path within upload target

    if (!file) return c.text("No file uploaded", 400);

    const targetDir = resolvePath(virtualDir);
    const finalDest = relativePath 
      ? resolve(targetDir, relativePath)
      : join(targetDir, file.name);

    // Security check for finalDest
    if (!finalDest.startsWith("/raid") && !finalDest.startsWith("/media")) {
      throw new Error("Access denied");
    }

    await mkdir(dirname(finalDest), { recursive: true });
    const arrayBuffer = await file.arrayBuffer();
    await writeFile(finalDest, Buffer.from(arrayBuffer));

    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : "Upload failed" }, 500);
  }
});

// Create directory
fs.post("/mkdir/*", async (c) => {
  const virtualParent = c.req.param("0") || "";
  try {
    const body = await c.req.parseBody();
    const name = body["name"] as string;
    if (!name) return c.text("Name required", 400);

    const realParent = resolvePath(virtualParent);
    const newDir = join(realParent, name);
    
    await mkdir(newDir, { recursive: true });
    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : "Failed to create directory" }, 500);
  }
});

// Delete
fs.post("/delete/*", async (c) => {
  const virtualPath = c.req.param("0") || "";
  try {
    const realPath = resolvePath(virtualPath);
    await rm(realPath, { recursive: true, force: true });
    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : "Delete failed" }, 500);
  }
});

// Move / Rename
fs.post("/move/*", async (c) => {
  const virtualSrc = c.req.param("0") || "";
  try {
    const body = await c.req.parseBody();
    const virtualDest = body["dest"] as string;
    if (!virtualDest) return c.text("Destination required", 400);

    const realSrc = resolvePath(virtualSrc);
    const realDest = resolvePath(virtualDest);

    await mkdir(dirname(realDest), { recursive: true });
    await rename(realSrc, realDest);
    
    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : "Move failed" }, 500);
  }
});

// Copy
fs.post("/copy/*", async (c) => {
  const virtualSrc = c.req.param("0") || "";
  try {
    const body = await c.req.parseBody();
    const virtualDest = body["dest"] as string;
    if (!virtualDest) return c.text("Destination required", 400);

    const realSrc = resolvePath(virtualSrc);
    const realDest = resolvePath(virtualDest);

    await mkdir(dirname(realDest), { recursive: true });
    
    // Use native cp for recursive and efficient copy
    await exec("cp", ["-r", realSrc, realDest]);
    
    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : "Copy failed" }, 500);
  }
});
