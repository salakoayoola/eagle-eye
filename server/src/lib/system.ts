import { execFile } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import { promisify } from "node:util";

const exec = promisify(execFile);

const MEDIA_DIR = process.env.MEDIA_MOUNT_DIR || "/mnt/media";
const MOUNT_SCRIPT = process.env.MOUNT_SCRIPT || "/usr/local/bin/copyparty-mount";
const UNMOUNT_SCRIPT = process.env.UNMOUNT_SCRIPT || "/usr/local/bin/copyparty-unmount";

export interface Drive {
  label: string;
  device: string;
  mountpoint: string;
  fstype: string;
  size: string;
  used: string;
  available: string;
  mounted: boolean;
}

// Validate device/label input to prevent command injection
function validateDevice(device: string): string {
  const clean = device.replace(/[^a-zA-Z0-9_\-\/\.]/g, "");
  if (clean !== device || device.includes("..")) {
    throw new Error("Invalid device identifier");
  }
  return clean;
}

export async function listDrives(): Promise<Drive[]> {
  try {
    // Use lsblk to list removable block devices
    const { stdout } = await exec("lsblk", [
      "-J",
      "-o",
      "NAME,LABEL,FSTYPE,SIZE,MOUNTPOINT,TYPE,RM",
      "--bytes",
    ]);

    const data = JSON.parse(stdout);
    const drives: Drive[] = [];

    for (const dev of data.blockdevices || []) {
      // Only include removable devices (rm=true) with partitions
      const children = dev.children || [];
      for (const part of children) {
        if (part.type === "part" && part.fstype) {
          const mountpoint = part.mountpoint || "";
          const mounted = !!mountpoint;

          // Get usage info if mounted
          let used = "0";
          let available = "0";
          if (mounted) {
            try {
              const { stdout: dfOut } = await exec("df", [
                "-B1",
                "--output=used,avail",
                mountpoint,
              ]);
              const lines = dfOut.trim().split("\n");
              if (lines.length > 1) {
                const [u, a] = lines[1].trim().split(/\s+/);
                used = u;
                available = a;
              }
            } catch {
              // df may fail, that's ok
            }
          }

          drives.push({
            label: part.label || part.name,
            device: `/dev/${part.name}`,
            mountpoint,
            fstype: part.fstype,
            size: part.size || "0",
            used,
            available,
            mounted,
          });
        }
      }
    }

    // Also check for any directories already in the media mount dir
    try {
      const entries = await readdir(MEDIA_DIR);
      for (const entry of entries) {
        if (!drives.some((d) => d.label === entry)) {
          drives.push({
            label: entry,
            device: "",
            mountpoint: `${MEDIA_DIR}/${entry}`,
            fstype: "",
            size: "0",
            used: "0",
            available: "0",
            mounted: true,
          });
        }
      }
    } catch {
      // Media dir may not exist
    }

    return drives;
  } catch {
    return [];
  }
}

export async function mountDrive(
  device: string
): Promise<{ success: boolean; mountpoint: string }> {
  const clean = validateDevice(device);
  const { stdout } = await exec(MOUNT_SCRIPT, [clean]);
  return { success: true, mountpoint: stdout.trim() };
}

export async function ejectDrive(
  device: string
): Promise<{ success: boolean }> {
  const clean = validateDevice(device);
  await exec(UNMOUNT_SCRIPT, [clean]);
  return { success: true };
}
