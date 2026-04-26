import { Hono } from "hono";
import { readdir, stat, mkdir, rm, rename, writeFile } from "node:fs/promises";
import { join, resolve, basename, dirname } from "node:path";
import { createReadStream, existsSync } from "node:fs";
import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";
import { stream } from "hono/streaming";
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
  if (parts.length === 0) {
    throw new Error("Virtual root cannot be resolved to a physical path");
  }

  const rootKey = parts[0];
  const rootPhysicalPath = ROOT_PATHS[rootKey];
  
  if (!rootPhysicalPath) {
    throw new Error(`Invalid root: ${rootKey}`);
  }

  const resolved = resolve(rootPhysicalPath, ...parts.slice(1));
  
  if (!resolved.startsWith(rootPhysicalPath)) {
    throw new Error("Access denied: path out of bounds");
  }
  
  return resolved;
}

// List directory
fs.get("/ls/:path{.+$}", async (c) => {
  const virtualPath = c.req.param("path") || "";
  const parts = virtualPath.split("/").filter(Boolean);

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

// Explicit handle for empty path (virtual root)
fs.get("/ls", async (c) => {
  const dirs = Object.keys(ROOT_PATHS).map(key => ({
    name: key,
    href: key,
    sz: 0,
    ts: 0,
    type: "d",
  }));
  return c.json({ dirs, files: [] });
});

// Download/Stream file
fs.get("/raw/:path{.+$}", async (c) => {
  const virtualPath = c.req.param("path") || "";
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

// Thumbnail generation (RAW and Video)
fs.get("/thumbnail/:path{.+$}", async (c) => {
  const virtualPath = c.req.param("path") || "";
  try {
    const realPath = resolvePath(virtualPath);
    const ext = basename(realPath).split(".").pop()?.toLowerCase();
    
    const isRaw = ["nef", "cr2", "arw", "dng", "orf", "raf", "rw2", "pef", "srw", "x3f", "iiq"].includes(ext || "");
    const isVideo = ["mp4", "webm", "ogg", "mov", "mkv", "avi", "wmv", "r3d", "braw", "mxf"].includes(ext || "");

    if (isRaw) {
      // Use exiftool to extract preview image
      return stream(c, async (stream) => {
        const proc = spawn("exiftool", ["-b", "-PreviewImage", realPath]);
        
        for await (const chunk of proc.stdout) {
          await stream.write(chunk);
        }
        
        // Fallback to JpgFromRaw if PreviewImage is not available
        if (proc.exitCode !== 0) {
           const proc2 = spawn("exiftool", ["-b", "-JpgFromRaw", realPath]);
           for await (const chunk of proc2.stdout) {
             await stream.write(chunk);
           }
        }
      });
    }

    if (isVideo) {
      // Use ffmpeg to generate a thumbnail from the first second
      return stream(c, async (stream) => {
        const proc = spawn("ffmpeg", [
          "-ss", "1",
          "-i", realPath,
          "-vframes", "1",
          "-f", "image2",
          "-c:v", "mjpeg",
          "pipe:1"
        ]);
        
        for await (const chunk of proc.stdout) {
          await stream.write(chunk);
        }
      });
    }

    // Default: return raw for normal images
    return c.redirect(`/api/fs/raw/${virtualPath}`);
    
  } catch (err) {
    return c.text("Thumbnail generation failed", 500);
  }
});

// Upload file
fs.post("/upload/:path{.+$}", async (c) => {
  const virtualDir = c.req.param("path") || "";
  try {
    const body = await c.req.parseBody();
    const file = body["f"] as File;
    const relativePath = body["path"] as string;

    if (!file) return c.text("No file uploaded", 400);

    const targetDir = resolvePath(virtualDir);
    const finalDest = relativePath 
      ? resolve(targetDir, relativePath)
      : join(targetDir, file.name);

    const rootKey = virtualDir.split("/").filter(Boolean)[0];
    if (!finalDest.startsWith(ROOT_PATHS[rootKey])) {
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
fs.post("/mkdir/:path{.+$}", async (c) => {
  const virtualParent = c.req.param("path") || "";
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
fs.post("/delete/:path{.+$}", async (c) => {
  const virtualPath = c.req.param("path") || "";
  try {
    const realPath = resolvePath(virtualPath);
    await rm(realPath, { recursive: true, force: true });
    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : "Delete failed" }, 500);
  }
});

// Move / Rename
fs.post("/move/:path{.+$}", async (c) => {
  const virtualSrc = c.req.param("path") || "";
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
fs.post("/copy/:path{.+$}", async (c) => {
  const virtualSrc = c.req.param("path") || "";
  try {
    const body = await c.req.parseBody();
    const virtualDest = body["dest"] as string;
    if (!virtualDest) return c.text("Destination required", 400);

    const realSrc = resolvePath(virtualSrc);
    const realDest = resolvePath(virtualDest);

    await mkdir(dirname(realDest), { recursive: true });
    await exec("cp", ["-r", realSrc, realDest]);
    
    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : "Copy failed" }, 500);
  }
});
